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

// Package tools — cashclaw_tools.go: registers CashClaw financial tools.
// Adds "kronos-predict", "vnstock-get", and "fairvalue-calc" handlers to a Registry.
// Extends RegisterBuiltins — call this after registering bash/fileread/rtk tools.
package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/cashclaw"
	"github.com/mekongmind/engine/internal/cashclaw/datasources"
	"github.com/mekongmind/engine/internal/llm"
)

// CashClawToolConfig holds the service endpoints needed by CashClaw tools.
type CashClawToolConfig struct {
	KronosURL  string // e.g. "http://127.0.0.1:5001"
	VnstockURL string // e.g. "http://127.0.0.1:5010"
	LLMHost    string // e.g. "127.0.0.1"
	LLMPort    int    // DeepSeek R1 port, e.g. 4002
}

// RegisterCashClawTools adds the three CashClaw tools to the given registry.
// Tools registered: "kronos-predict", "vnstock-get", "fairvalue-calc".
func RegisterCashClawTools(reg *Registry, cfg CashClawToolConfig) {
	vs := datasources.NewVnstockClient(cfg.VnstockURL, nil)
	kr := cashclaw.NewKronosPredictor(cfg.KronosURL, nil)
	lc := llm.NewClient(cfg.LLMHost, 30)
	calc := cashclaw.NewFairValueCalculator(vs, kr, lc, cfg.LLMPort)

	reg.Register("vnstock-get", makeVnstockGetHandler(vs))
	reg.Register("kronos-predict", makeKronosPredictHandler(vs, kr))
	reg.Register("fairvalue-calc", makeFairvalueCalcHandler(calc))
}

// makeVnstockGetHandler returns a Handler that fetches OHLCV for a symbol.
// args format: "<SYMBOL>" or "<SYMBOL>:<days>"
func makeVnstockGetHandler(vs *datasources.VnstockClient) Handler {
	return func(ctx context.Context, args string) (agents.Observation, error) {
		obs := agents.Observation{CreatedAt: time.Now().UTC()}

		symbol, days := parseSymbolDays(args, 90)
		records, err := vs.GetOHLCV(ctx, symbol, days)
		if err != nil {
			return obs, fmt.Errorf("vnstock-get: %w", err)
		}

		data, _ := json.Marshal(map[string]any{"symbol": symbol, "count": len(records), "ohlcv": records})
		obs.Content = string(data)
		return obs, nil
	}
}

// makeKronosPredictHandler returns a Handler that calls Kronos for OHLCV forecast.
// args format: "<SYMBOL>:<horizon>" e.g. "VNM:5"
func makeKronosPredictHandler(vs *datasources.VnstockClient, kr *cashclaw.KronosPredictor) Handler {
	return func(ctx context.Context, args string) (agents.Observation, error) {
		obs := agents.Observation{CreatedAt: time.Now().UTC()}

		symbol, horizon := parseSymbolDays(args, 5)
		ohlcv, err := vs.GetOHLCV(ctx, symbol, 90)
		if err != nil {
			return obs, fmt.Errorf("kronos-predict: fetch OHLCV: %w", err)
		}

		pred, err := kr.Predict(ctx, symbol, ohlcv, horizon)
		if err != nil {
			return obs, fmt.Errorf("kronos-predict: %w", err)
		}

		data, _ := json.Marshal(pred)
		obs.Content = string(data)
		return obs, nil
	}
}

// makeFairvalueCalcHandler returns a Handler that runs the full fair value pipeline.
// args: "<SYMBOL>"
func makeFairvalueCalcHandler(calc *cashclaw.FairValueCalculator) Handler {
	return func(ctx context.Context, args string) (agents.Observation, error) {
		obs := agents.Observation{CreatedAt: time.Now().UTC()}

		symbol := strings.ToUpper(strings.TrimSpace(args))
		if symbol == "" {
			return obs, fmt.Errorf("fairvalue-calc: symbol required")
		}

		fv, err := calc.Calculate(ctx, symbol, 5)
		if err != nil {
			return obs, fmt.Errorf("fairvalue-calc: %w", err)
		}

		data, _ := json.Marshal(fv)
		obs.Content = string(data)
		return obs, nil
	}
}

// parseSymbolDays parses "SYMBOL" or "SYMBOL:N" from tool args.
// Returns (symbol, n) with the provided default if N is absent or invalid.
func parseSymbolDays(args string, defaultN int) (string, int) {
	parts := strings.SplitN(strings.TrimSpace(args), ":", 2)
	symbol := strings.ToUpper(strings.TrimSpace(parts[0]))
	n := defaultN
	if len(parts) == 2 {
		var parsed int
		if _, err := fmt.Sscanf(parts[1], "%d", &parsed); err == nil && parsed > 0 {
			n = parsed
		}
	}
	return symbol, n
}
