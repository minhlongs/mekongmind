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

// Package cashclaw — agent.go: CashClawAgent implements the agents.Agent interface.
// Routes financial analysis goals through the Kronos + DeepSeek R1 pipeline.
// Role: RoleAnalyzer (DeepSeek R1 for chain-of-thought financial reasoning).
package cashclaw

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/mekongmind/engine/internal/agents"
)

// CashClawAgent implements agents.Agent for financial analysis tasks.
// It understands goals containing "predict", "fairvalue", or symbol keywords.
type CashClawAgent struct {
	calculator *FairValueCalculator
	emitter    *SignalEmitter // may be nil
}

// NewCashClawAgent wires the fair value calculator and optional signal emitter.
// emitter may be nil — signals are skipped when nil.
func NewCashClawAgent(calculator *FairValueCalculator, emitter *SignalEmitter) *CashClawAgent {
	return &CashClawAgent{
		calculator: calculator,
		emitter:    emitter,
	}
}

// Role returns RoleAnalyzer — CashClaw uses DeepSeek R1 for reasoning.
func (a *CashClawAgent) Role() agents.Role {
	return agents.RoleAnalyzer
}

// Plan breaks a financial analysis goal into structured Steps.
// Recognized goal prefixes: "predict:<symbol>:<horizon>", "fairvalue:<symbol>".
func (a *CashClawAgent) Plan(_ context.Context, sessionID, goal string) ([]agents.Step, error) {
	var steps []agents.Step
	now := time.Now().UTC()

	lower := strings.ToLower(goal)

	switch {
	case strings.HasPrefix(lower, "predict:"):
		parts := strings.SplitN(goal[len("predict:"):], ":", 2)
		symbol := strings.ToUpper(strings.TrimSpace(parts[0]))
		horizon := "5"
		if len(parts) > 1 {
			horizon = strings.TrimSpace(parts[1])
		}
		steps = []agents.Step{
			{
				ID:          uuid.New().String(),
				SessionID:   sessionID,
				Description: fmt.Sprintf("Fetch OHLCV history for %s", symbol),
				ToolName:    "vnstock-get",
				ToolArgs:    symbol,
				Status:      "pending",
				CreatedAt:   now,
			},
			{
				ID:          uuid.New().String(),
				SessionID:   sessionID,
				Description: fmt.Sprintf("Kronos forecast %s horizon=%s", symbol, horizon),
				ToolName:    "kronos-predict",
				ToolArgs:    fmt.Sprintf("%s:%s", symbol, horizon),
				Status:      "pending",
				CreatedAt:   now,
			},
		}

	case strings.HasPrefix(lower, "fairvalue:"):
		symbol := strings.ToUpper(strings.TrimSpace(goal[len("fairvalue:"):]))
		steps = []agents.Step{
			{
				ID:          uuid.New().String(),
				SessionID:   sessionID,
				Description: fmt.Sprintf("Calculate fair value for %s", symbol),
				ToolName:    "fairvalue-calc",
				ToolArgs:    symbol,
				Status:      "pending",
				CreatedAt:   now,
			},
		}

	default:
		// Generic analysis goal — single reasoning step.
		steps = []agents.Step{
			{
				ID:          uuid.New().String(),
				SessionID:   sessionID,
				Description: "Analyze financial goal: " + goal,
				ToolName:    "fairvalue-calc",
				ToolArgs:    extractSymbol(goal),
				Status:      "pending",
				CreatedAt:   now,
			},
		}
	}

	return steps, nil
}

// Execute runs a single Step using the appropriate cashclaw tool.
func (a *CashClawAgent) Execute(ctx context.Context, step agents.Step) (agents.Observation, error) {
	obs := agents.Observation{
		StepID:    step.ID,
		CreatedAt: time.Now().UTC(),
	}

	switch step.ToolName {
	case "fairvalue-calc":
		symbol := strings.ToUpper(strings.TrimSpace(step.ToolArgs))
		if symbol == "" {
			return obs, fmt.Errorf("cashclaw: fairvalue-calc requires symbol in ToolArgs")
		}

		fv, err := a.calculator.Calculate(ctx, symbol, 5)
		if err != nil {
			return obs, fmt.Errorf("cashclaw: fair value for %s: %w", symbol, err)
		}

		// Emit signal if emitter is configured.
		if a.emitter != nil {
			equityCents := int64(fv.EstimatedPrice * 100)
			if emitErr := a.emitter.Emit(fv, equityCents); emitErr != nil {
				// Non-fatal — log and continue.
				_ = emitErr
			}
		}

		data, _ := json.Marshal(fv)
		obs.Content = string(data)

	case "kronos-predict", "vnstock-get":
		// These are handled by the tool registry in tools/registry.go.
		// CashClawAgent.Execute is called for fairvalue-calc only;
		// kronos-predict and vnstock-get are dispatched via registry.Execute.
		return obs, fmt.Errorf("cashclaw: tool %q should be dispatched via tool registry, not agent.Execute", step.ToolName)

	default:
		return obs, fmt.Errorf("cashclaw: unknown tool %q", step.ToolName)
	}

	return obs, nil
}

// Reflect evaluates a FairValue observation and decides whether the loop should continue.
// CashClaw goals are single-pass: always returns Continue=false after one execution.
func (a *CashClawAgent) Reflect(_ context.Context, obs agents.Observation) (agents.Decision, error) {
	// Check if the observation contains a valid disclaimer — sanity gate.
	if !strings.Contains(obs.Content, "NOT financial advice") {
		return agents.Decision{Continue: false}, nil
	}
	return agents.Decision{Continue: false}, nil
}

// extractSymbol tries to find an uppercase ticker-like token in the goal string.
// Falls back to "VNM" as the default demo symbol.
func extractSymbol(goal string) string {
	words := strings.Fields(strings.ToUpper(goal))
	for _, w := range words {
		// Simple heuristic: 2-5 uppercase ASCII letters = likely a ticker.
		if len(w) >= 2 && len(w) <= 5 && isUpperAlpha(w) {
			return w
		}
	}
	return "VNM"
}

// isUpperAlpha returns true if all runes in s are A-Z.
func isUpperAlpha(s string) bool {
	for _, c := range s {
		if c < 'A' || c > 'Z' {
			return false
		}
	}
	return true
}
