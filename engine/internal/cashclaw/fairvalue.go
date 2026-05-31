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

// Package cashclaw — fairvalue.go: public API for fair value estimation.
// Prompt helpers and output parsing live in fairvalue_parser.go.
//
// Algorithm:
//  1. Fetch 90-day OHLCV from vnstock
//  2. Send to Kronos → 5-day forecast
//  3. Build reasoning prompt (OHLCV summary + forecast + sentiment placeholder)
//  4. Send to DeepSeek R1 → structured reasoning text
//  5. Extract price estimate + confidence from reasoning
//  6. Attach mandatory legal disclaimer
//
// IMPORTANT: Output is NOT financial advice. Educational/research use only.
package cashclaw

import (
	"context"
	"fmt"

	"github.com/mekongmind/engine/internal/cashclaw/datasources"
	"github.com/mekongmind/engine/internal/llm"
)

// FairValueDisclaimer is the mandatory legal disclaimer attached to every output.
// MUST appear in CLI output and JSON responses. Non-negotiable.
const FairValueDisclaimer = "NOT financial advice. Educational/research use only. " +
	"Past performance does not predict future results. " +
	"Always consult a licensed financial advisor before making investment decisions."

// FairValue holds the result of the fair value estimation pipeline.
type FairValue struct {
	Symbol         string           `json:"symbol"`
	EstimatedPrice float64          `json:"estimated_price"`
	Confidence     float64          `json:"confidence"` // 0.0–1.0
	ReasoningText  string           `json:"reasoning_text"`
	Forecast       []ForecastRecord `json:"forecast"`
	Disclaimer     string           `json:"disclaimer"` // always FairValueDisclaimer
}

// FairValueCalculator chains vnstock → Kronos → DeepSeek R1 to estimate fair value.
type FairValueCalculator struct {
	vnstock   *datasources.VnstockClient
	kronos    *KronosPredictor
	llmClient *llm.Client
	llmPort   int // DeepSeek R1 port (default 4002)
}

// NewFairValueCalculator wires the three data pipeline stages.
func NewFairValueCalculator(vs *datasources.VnstockClient, kr *KronosPredictor, lc *llm.Client, llmPort int) *FairValueCalculator {
	return &FairValueCalculator{
		vnstock:   vs,
		kronos:    kr,
		llmClient: lc,
		llmPort:   llmPort,
	}
}

// Calculate runs the full fair value pipeline for the given symbol.
// horizon controls how many future periods Kronos forecasts (default 5).
func (f *FairValueCalculator) Calculate(ctx context.Context, symbol string, horizon int) (*FairValue, error) {
	if horizon <= 0 {
		horizon = 5
	}

	// Step 1: Fetch 90-day OHLCV history.
	ohlcv, err := f.vnstock.GetOHLCV(ctx, symbol, 90)
	if err != nil {
		return nil, fmt.Errorf("fairvalue: fetch OHLCV for %s: %w", symbol, err)
	}
	if len(ohlcv) == 0 {
		return nil, fmt.Errorf("fairvalue: no OHLCV data returned for %s", symbol)
	}

	// Step 2: Kronos forecast.
	pred, err := f.kronos.Predict(ctx, symbol, ohlcv, horizon)
	if err != nil {
		return nil, fmt.Errorf("fairvalue: Kronos predict for %s: %w", symbol, err)
	}

	// Step 3: Build reasoning prompt.
	prompt := buildReasoningPrompt(symbol, ohlcv, pred)

	// Step 4: DeepSeek R1 reasoning.
	msgs := []llm.Message{
		{Role: "system", Content: reasonerSystemPrompt},
		{Role: "user", Content: prompt},
	}
	llmResp, err := f.llmClient.ChatCompletion(ctx, f.llmPort, msgs)
	if err != nil {
		return nil, fmt.Errorf("fairvalue: DeepSeek reasoning for %s: %w", symbol, err)
	}

	reasoningText := llm.FirstContent(llmResp)

	// Step 5: Extract price + confidence from reasoning JSON block.
	price, confidence := parseReasonerOutput(reasoningText, pred)

	return &FairValue{
		Symbol:         symbol,
		EstimatedPrice: price,
		Confidence:     confidence,
		ReasoningText:  reasoningText,
		Forecast:       pred.Forecast,
		Disclaimer:     FairValueDisclaimer,
	}, nil
}
