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

// Package roles — coder.go: Qwen2.5-Coder (port 4003) agent.
// Used for both code generation (Step 2 tool) and as the Auditor (Step 4).
package roles

import (
	"context"
	"fmt"
	"time"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/llm"
)

// CoderPort is the MLX engine port for Qwen2.5-Coder.
const CoderPort = 4003

// Coder handles code generation and security audit using Qwen2.5-Coder.
// Implements agents.Agent for both the RoleCoder and auditor pipeline roles.
type Coder struct {
	client *llm.Client
	port   int
}

// NewCoder creates a Coder with the given LLM client (uses CoderPort).
func NewCoder(client *llm.Client) *Coder {
	return &Coder{client: client, port: CoderPort}
}

// NewCoderWithClient creates a Coder with explicit port override (for tests).
func NewCoderWithClient(client *llm.Client, port int) *Coder {
	return &Coder{client: client, port: port}
}

// Role satisfies agents.Agent.
func (c *Coder) Role() agents.Role { return agents.RoleCoder }

// Plan decomposes a coding goal into steps — delegates to a simple prompt.
func (c *Coder) Plan(ctx context.Context, sessionID, goal string) ([]agents.Step, error) {
	messages := []llm.Message{
		{
			Role:    "system",
			Content: "You are a senior software engineer. List the concrete coding steps to accomplish the goal.",
		},
		{Role: "user", Content: goal},
	}
	resp, err := c.client.ChatCompletion(ctx, c.port, messages)
	if err != nil {
		return nil, fmt.Errorf("coder: plan: %w", err)
	}
	return parseStepsFromLLM(sessionID, llm.FirstContent(resp)), nil
}

// Execute generates code or performs an audit for the given step.
// When step.Description starts with "Security audit", it uses the audit system prompt.
func (c *Coder) Execute(ctx context.Context, step agents.Step) (agents.Observation, error) {
	systemMsg := "You are a senior software engineer. Write clean, idiomatic code."
	if len(step.Description) > 15 && step.Description[:15] == "Security audit " {
		systemMsg = `You are a security auditor. Review the provided code for:
- Injection vulnerabilities (SQL, shell, path traversal)
- Secret / credential exposure
- Unsafe deserialization
- Missing input validation
Reply with a concise report of findings and recommended fixes.`
	}

	content := step.Description
	if step.ToolArgs != "" {
		content = step.ToolArgs
	}

	messages := []llm.Message{
		{Role: "system", Content: systemMsg},
		{Role: "user", Content: content},
	}
	resp, err := c.client.ChatCompletion(ctx, c.port, messages)
	if err != nil {
		return agents.Observation{}, fmt.Errorf("coder: execute: %w", err)
	}
	return agents.Observation{
		StepID:    step.ID,
		Content:   llm.FirstContent(resp),
		TokensIn:  resp.Usage.PromptTokens,
		TokensOut: resp.Usage.CompletionTokens,
		CreatedAt: time.Now().UTC(),
	}, nil
}

// Reflect decides whether more code review cycles are needed.
func (c *Coder) Reflect(_ context.Context, obs agents.Observation) (agents.Decision, error) {
	return agents.Decision{Continue: false, NextGoal: obs.Content}, nil
}
