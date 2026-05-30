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

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/cashclaw"
	"github.com/mekongmind/engine/internal/cashclaw/datasources"
	"github.com/mekongmind/engine/internal/llm"
)

// buildTestCalculator wires fake servers for a test FairValueCalculator.
func buildTestCalculator(t *testing.T) (*cashclaw.FairValueCalculator, func()) {
	t.Helper()

	// Fake vnstock server.
	ohlcv := make([]datasources.OHLCVRecord, 30)
	for i := range ohlcv {
		ohlcv[i] = datasources.OHLCVRecord{Date: fmt.Sprintf("2026-01-%02d", i+1), Close: 90.0 + float64(i)*0.1}
	}
	vsSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		inner, _ := json.Marshal(map[string]any{"ohlcv": ohlcv})
		resp := map[string]any{
			"jsonrpc": "2.0", "id": 1,
			"result": map[string]any{"content": []map[string]string{{"text": string(inner)}}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))

	// Fake Kronos server.
	krResp := &cashclaw.PredictResponse{
		Symbol: "VNM", Horizon: 5,
		Forecast: []cashclaw.ForecastRecord{{Period: 1, Close: 91.0}},
	}
	krSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/health" {
			w.WriteHeader(200)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(krResp)
	}))

	// Fake LLM server.
	llmContent := `Fair analysis. {"estimated_price": 91.5, "confidence": 0.68}`
	llmSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		resp := llm.ChatResponse{
			Choices: []llm.Choice{{Message: llm.Message{Content: llmContent}}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))

	var llmPort int
	fmt.Sscanf(llmSrv.URL, "http://127.0.0.1:%d", &llmPort)

	vs := datasources.NewVnstockClient(vsSrv.URL, nil)
	kr := cashclaw.NewKronosPredictor(krSrv.URL, nil)
	lc := llm.NewClient("127.0.0.1", 5)
	calc := cashclaw.NewFairValueCalculator(vs, kr, lc, llmPort)

	cleanup := func() {
		vsSrv.Close()
		krSrv.Close()
		llmSrv.Close()
	}
	return calc, cleanup
}

func TestCashClawAgent_Role(t *testing.T) {
	agent := cashclaw.NewCashClawAgent(nil, nil)
	if agent.Role() != agents.RoleAnalyzer {
		t.Errorf("Role() = %v, want RoleAnalyzer", agent.Role())
	}
}

func TestCashClawAgent_Plan_PredictGoal(t *testing.T) {
	agent := cashclaw.NewCashClawAgent(nil, nil)
	steps, err := agent.Plan(context.Background(), "ses-001", "predict:VNM:5")
	if err != nil {
		t.Fatalf("Plan error: %v", err)
	}
	if len(steps) < 1 {
		t.Fatal("expected at least 1 step for predict goal")
	}
	// First step should fetch OHLCV.
	if steps[0].ToolName != "vnstock-get" {
		t.Errorf("step[0].ToolName = %q, want vnstock-get", steps[0].ToolName)
	}
}

func TestCashClawAgent_Plan_FairvalueGoal(t *testing.T) {
	agent := cashclaw.NewCashClawAgent(nil, nil)
	steps, err := agent.Plan(context.Background(), "ses-002", "fairvalue:FPT")
	if err != nil {
		t.Fatalf("Plan error: %v", err)
	}
	if len(steps) == 0 {
		t.Fatal("expected steps for fairvalue goal")
	}
	if steps[0].ToolName != "fairvalue-calc" {
		t.Errorf("step[0].ToolName = %q, want fairvalue-calc", steps[0].ToolName)
	}
	if steps[0].ToolArgs != "FPT" {
		t.Errorf("step[0].ToolArgs = %q, want FPT", steps[0].ToolArgs)
	}
}

func TestCashClawAgent_Execute_FairvalueCalc(t *testing.T) {
	calc, cleanup := buildTestCalculator(t)
	defer cleanup()

	agent := cashclaw.NewCashClawAgent(calc, nil)
	step := agents.Step{
		ID:       "step-001",
		ToolName: "fairvalue-calc",
		ToolArgs: "VNM",
	}

	obs, err := agent.Execute(context.Background(), step)
	if err != nil {
		t.Fatalf("Execute error: %v", err)
	}
	if !strings.Contains(obs.Content, "NOT financial advice") {
		t.Errorf("disclaimer missing from output: %s", obs.Content[:200])
	}
}

func TestCashClawAgent_Execute_MissingSymbol(t *testing.T) {
	agent := cashclaw.NewCashClawAgent(nil, nil)
	step := agents.Step{ID: "step-002", ToolName: "fairvalue-calc", ToolArgs: ""}
	_, err := agent.Execute(context.Background(), step)
	if err == nil {
		t.Fatal("expected error for empty ToolArgs")
	}
}

func TestCashClawAgent_Reflect_StopsLoop(t *testing.T) {
	agent := cashclaw.NewCashClawAgent(nil, nil)
	obs := agents.Observation{Content: `{"disclaimer":"NOT financial advice. Educational/research use only."}`}
	dec, err := agent.Reflect(context.Background(), obs)
	if err != nil {
		t.Fatal(err)
	}
	if dec.Continue {
		t.Error("Reflect should return Continue=false for single-pass cashclaw")
	}
}
