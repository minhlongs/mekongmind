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

package cashclaw_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/mekongmind/engine/internal/cashclaw"
	"github.com/mekongmind/engine/internal/cashclaw/datasources"
	"github.com/mekongmind/engine/internal/llm"
)

// fakeVnstockForFairvalue creates an httptest server for vnstock.
func fakeVnstockForFairvalue(t *testing.T) *httptest.Server {
	t.Helper()
	ohlcv := make([]datasources.OHLCVRecord, 30)
	for i := range ohlcv {
		ohlcv[i] = datasources.OHLCVRecord{
			Date: fmt.Sprintf("2026-01-%02d", i+1), Open: 90, High: 91, Low: 89, Close: 90.5, Volume: 500000,
		}
	}
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		inner, _ := json.Marshal(map[string]any{"ohlcv": ohlcv})
		resp := map[string]any{
			"jsonrpc": "2.0", "id": 1,
			"result": map[string]any{"content": []map[string]string{{"text": string(inner)}}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
}

// fakeLLMServer creates an httptest server that returns a canned LLM response.
func fakeLLMServer(t *testing.T, content string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(r.URL.Path, "/chat/completions") {
			http.NotFound(w, r)
			return
		}
		resp := llm.ChatResponse{
			Choices: []llm.Choice{{Message: llm.Message{Role: "assistant", Content: content}}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
}

func TestFairValueCalculator_ContainsDisclaimer(t *testing.T) {
	vsSrv := fakeVnstockForFairvalue(t)
	defer vsSrv.Close()

	kronosResp := &cashclaw.PredictResponse{
		Symbol: "VNM", Horizon: 5,
		Forecast: []cashclaw.ForecastRecord{{Period: 1, Close: 91.0}},
	}
	krSrv := fakeKronosServer(t, kronosResp)
	defer krSrv.Close()

	llmContent := `Analysis of VNM stock data. Based on Kronos forecast the price looks stable.
{"estimated_price": 91.5, "confidence": 0.72}`
	llmSrv := fakeLLMServer(t, llmContent)
	defer llmSrv.Close()

	// Extract port from llmSrv.URL.
	var llmPort int
	fmt.Sscanf(llmSrv.URL, "http://127.0.0.1:%d", &llmPort)

	vs := datasources.NewVnstockClient(vsSrv.URL, nil)
	kr := cashclaw.NewKronosPredictor(krSrv.URL, nil)
	lc := llm.NewClient("127.0.0.1", 5)
	calc := cashclaw.NewFairValueCalculator(vs, kr, lc, llmPort)

	fv, err := calc.Calculate(context.Background(), "VNM", 5)
	if err != nil {
		t.Fatalf("Calculate error: %v", err)
	}

	if fv.Disclaimer != cashclaw.FairValueDisclaimer {
		t.Errorf("Disclaimer missing or incorrect: %q", fv.Disclaimer)
	}
	if !strings.Contains(fv.Disclaimer, "NOT financial advice") {
		t.Errorf("Disclaimer must contain 'NOT financial advice', got: %q", fv.Disclaimer)
	}
}

func TestFairValueCalculator_NoBuySellHold(t *testing.T) {
	vsSrv := fakeVnstockForFairvalue(t)
	defer vsSrv.Close()

	kronosResp := &cashclaw.PredictResponse{
		Symbol: "VNM", Horizon: 5,
		Forecast: []cashclaw.ForecastRecord{{Period: 1, Close: 91.0}},
	}
	krSrv := fakeKronosServer(t, kronosResp)
	defer krSrv.Close()

	// Adversarial LLM response that includes BUY — should NOT appear in FairValue fields.
	llmContent := `I recommend BUY at 91. SELL at 95. HOLD if uncertain.
{"estimated_price": 91.0, "confidence": 0.5}`
	llmSrv := fakeLLMServer(t, llmContent)
	defer llmSrv.Close()

	var llmPort int
	fmt.Sscanf(llmSrv.URL, "http://127.0.0.1:%d", &llmPort)

	vs := datasources.NewVnstockClient(vsSrv.URL, nil)
	kr := cashclaw.NewKronosPredictor(krSrv.URL, nil)
	lc := llm.NewClient("127.0.0.1", 5)
	calc := cashclaw.NewFairValueCalculator(vs, kr, lc, llmPort)

	fv, err := calc.Calculate(context.Background(), "VNM", 5)
	if err != nil {
		t.Fatalf("Calculate error: %v", err)
	}

	// FairValue struct fields (not reasoning_text) must not contain directional advice.
	// ReasoningText comes from LLM verbatim; the structural fields must be clean.
	combined := fmt.Sprintf("symbol=%s price=%.2f confidence=%.2f",
		fv.Symbol, fv.EstimatedPrice, fv.Confidence)
	for _, bad := range []string{"BUY", "SELL", "HOLD"} {
		if strings.Contains(strings.ToUpper(combined), bad) {
			t.Errorf("structural field contains %q: %s", bad, combined)
		}
	}
}

func TestFairValueCalculator_ConfidenceClamped(t *testing.T) {
	vsSrv := fakeVnstockForFairvalue(t)
	defer vsSrv.Close()

	kronosResp := &cashclaw.PredictResponse{
		Symbol: "VNM", Horizon: 5,
		Forecast: []cashclaw.ForecastRecord{{Period: 1, Close: 90.0}},
	}
	krSrv := fakeKronosServer(t, kronosResp)
	defer krSrv.Close()

	// LLM returns confidence > 1 — should be clamped.
	llmContent := `{"estimated_price": 90.5, "confidence": 1.5}`
	llmSrv := fakeLLMServer(t, llmContent)
	defer llmSrv.Close()

	var llmPort int
	fmt.Sscanf(llmSrv.URL, "http://127.0.0.1:%d", &llmPort)

	vs := datasources.NewVnstockClient(vsSrv.URL, nil)
	kr := cashclaw.NewKronosPredictor(krSrv.URL, nil)
	lc := llm.NewClient("127.0.0.1", 5)
	calc := cashclaw.NewFairValueCalculator(vs, kr, lc, llmPort)

	fv, _ := calc.Calculate(context.Background(), "VNM", 5)
	if fv.Confidence > 1.0 {
		t.Errorf("confidence not clamped: got %.2f", fv.Confidence)
	}
}
