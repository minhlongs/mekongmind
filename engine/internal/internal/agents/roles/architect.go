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

// Package roles contains concrete Agent implementations for each pipeline role.
// Architect uses Gemma 4 (port 4001) for high-level planning and step decomposition.
package roles

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/llm"
)

// ArchitectPort is the MLX engine port for Gemma 4.
const ArchitectPort = 4001

// Architect plans a sequence of steps to achieve a goal using Gemma 4.
// It implements agents.Agent and serves as Step 1 of the 4-step pipeline.
type Architect struct {
	client *llm.Client
	port   int
}

// NewArchitect creates an Architect with the given LLM client (uses ArchitectPort).
func NewArchitect(client *llm.Client) *Architect {
	return &Architect{client: client, port: ArchitectPort}
}

// NewArchitectWithClient creates an Architect with explicit port override (for tests).
func NewArchitectWithClient(client *llm.Client, port int) *Architect {
	return &Architect{client: client, port: port}
}

// Role satisfies agents.Agent.
func (a *Architect) Role() agents.Role { return agents.RoleResearcher }

// Plan calls Gemma 4 to decompose the goal into steps.
// Returns at least one step even if the LLM returns a simple answer.
func (a *Architect) Plan(ctx context.Context, sessionID, goal string) ([]agents.Step, error) {
	messages := []llm.Message{
		{
			Role: "system",
			Content: `You are an architect agent. Given a user goal, output a numbered list of
concrete steps to accomplish it. Each step should be on its own line starting
with a number and period (e.g. "1. Step description"). If a step requires a
shell command, prefix it with TOOL:bash. If it requires reading a file, prefix
with TOOL:fileread. Keep steps concise and actionable.`,
		},
		{Role: "user", Content: goal},
	}

	resp, err := a.client.ChatCompletion(ctx, a.port, messages)
	if err != nil {
		return nil, fmt.Errorf("architect: LLM call: %w", err)
	}

	content := llm.FirstContent(resp)
	steps := parseStepsFromLLM(sessionID, content)
	return steps, nil
}

// Execute runs a single LLM step (no tool invocation for Architect).
func (a *Architect) Execute(ctx context.Context, step agents.Step) (agents.Observation, error) {
	messages := []llm.Message{
		{Role: "user", Content: step.Description},
	}
	resp, err := a.client.ChatCompletion(ctx, a.port, messages)
	if err != nil {
		return agents.Observation{}, fmt.Errorf("architect: execute: %w", err)
	}
	return agents.Observation{
		StepID:    step.ID,
		Content:   llm.FirstContent(resp),
		TokensIn:  resp.Usage.PromptTokens,
		TokensOut: resp.Usage.CompletionTokens,
		CreatedAt: time.Now().UTC(),
	}, nil
}

// Reflect decides whether to continue after an observation.
func (a *Architect) Reflect(_ context.Context, obs agents.Observation) (agents.Decision, error) {
	return agents.Decision{Continue: false, NextGoal: obs.Content}, nil
}

// parseStepsFromLLM parses numbered lines from LLM output into Step records.
func parseStepsFromLLM(sessionID, content string) []agents.Step {
	var steps []agents.Step
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Match lines starting with a digit and a period.
		idx := strings.Index(line, ".")
		if idx < 1 {
			continue
		}
		desc := strings.TrimSpace(line[idx+1:])
		if desc == "" {
			continue
		}

		step := agents.Step{
			ID:          uuid.New().String(),
			SessionID:   sessionID,
			Description: desc,
			Status:      "pending",
			CreatedAt:   time.Now().UTC(),
		}

		// Detect tool prefix.
		if strings.HasPrefix(desc, "TOOL:bash") {
			step.ToolName = "bash"
			step.ToolArgs = strings.TrimSpace(strings.TrimPrefix(desc, "TOOL:bash"))
		} else if strings.HasPrefix(desc, "TOOL:fileread") {
			step.ToolName = "fileread"
			step.ToolArgs = strings.TrimSpace(strings.TrimPrefix(desc, "TOOL:fileread"))
		}

		steps = append(steps, step)
	}

	// Guarantee at least one step.
	if len(steps) == 0 {
		steps = append(steps, agents.Step{
			ID:          uuid.New().String(),
			SessionID:   sessionID,
			Description: content,
			Status:      "pending",
			CreatedAt:   time.Now().UTC(),
		})
	}
	return steps
}
