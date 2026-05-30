// Copyright 2026 Mekong IDE Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Package cashclaw — fairvalue_parser.go: prompt construction and LLM output parsing
// for the fair value pipeline.
//
// IMPORTANT: Output is NOT financial advice. Educational/research use only.
package cashclaw

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/mekongmind/engine/internal/cashclaw/datasources"
)

// reasonerSystemPrompt guides DeepSeek R1 to produce structured fair value analysis.
// Explicitly prohibits BUY/SELL/HOLD recommendations per legal constraints.
const reasonerSystemPrompt = `You are a quantitative research assistant analyzing stock price data.
Your task: estimate a fair value price based on historical OHLCV and model forecast data.

STRICT RULES:
- Do NOT recommend BUY, SELL, or HOLD. Output price estimate only.
- Do NOT predict exact future prices as certainties — use confidence ranges.
- Always acknowledge model limitations and market uncertainty.
- Output must include a JSON block at the end:
  {"estimated_price": <float>, "confidence": <float 0.0-1.0>}

You analyze: recent price trend, forecast trajectory, volatility, and market context.`

// buildReasoningPrompt creates the user-facing prompt for DeepSeek R1.
func buildReasoningPrompt(symbol string, ohlcv []datasources.OHLCVRecord, pred *PredictResponse) string {
	// OHLCV summary: last 5 bars + basic stats.
	last := ohlcv
	if len(last) > 5 {
		last = last[len(last)-5:]
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("## Fair Value Analysis: %s\n\n", symbol))
	sb.WriteString("### Recent Price History (last 5 bars)\n")
	for _, r := range last {
		sb.WriteString(fmt.Sprintf("- %s: O=%.2f H=%.2f L=%.2f C=%.2f V=%.0f\n",
			r.Date, r.Open, r.High, r.Low, r.Close, r.Volume))
	}

	sb.WriteString(fmt.Sprintf("\n### Kronos Model Forecast (%d periods ahead)\n", pred.Horizon))
	for _, fc := range pred.Forecast {
		sb.WriteString(fmt.Sprintf("- Period %d: O=%.2f H=%.2f L=%.2f C=%.2f\n",
			fc.Period, fc.Open, fc.High, fc.Low, fc.Close))
	}

	// Sentiment placeholder — will be replaced with real data in a future phase.
	sb.WriteString("\n### Market Sentiment\n")
	sb.WriteString("- Sentiment: neutral (placeholder — real-time sentiment not yet integrated)\n")
	sb.WriteString("\nEstimate the fair value price and confidence. End with JSON: {\"estimated_price\": X, \"confidence\": Y}\n")

	return sb.String()
}

// parseReasonerOutput extracts estimated_price and confidence from the LLM response.
// Falls back to the last Kronos close price with 0.3 confidence if parsing fails.
func parseReasonerOutput(text string, pred *PredictResponse) (price, confidence float64) {
	// Find the last JSON block containing estimated_price.
	start := strings.LastIndex(text, "{")
	end := strings.LastIndex(text, "}")
	if start >= 0 && end > start {
		fragment := text[start : end+1]
		var parsed map[string]json.RawMessage
		if err := json.Unmarshal([]byte(fragment), &parsed); err == nil {
			if rawP, ok := parsed["estimated_price"]; ok {
				var p float64
				if err := json.Unmarshal(rawP, &p); err == nil {
					price = p
				}
			}
			if rawC, ok := parsed["confidence"]; ok {
				// Confidence may be a float or "0.7" string.
				var c float64
				if err := json.Unmarshal(rawC, &c); err == nil {
					confidence = c
				} else {
					var cs string
					if err2 := json.Unmarshal(rawC, &cs); err2 == nil {
						c, _ = strconv.ParseFloat(cs, 64)
						confidence = c
					}
				}
			}
		}
	}

	// Clamp confidence to [0, 1].
	if confidence < 0 {
		confidence = 0
	}
	if confidence > 1 {
		confidence = 1
	}

	// Fallback: use last forecast close if price not parsed.
	if price == 0 && len(pred.Forecast) > 0 {
		price = pred.Forecast[len(pred.Forecast)-1].Close
		confidence = 0.3
	}

	return price, confidence
}
