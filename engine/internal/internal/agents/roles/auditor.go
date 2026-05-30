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

// Package roles — auditor.go: Step 4 security-review agent.
// Delegates to Qwen2.5-Coder (port 4003) with a security-audit system prompt.
// Skipped by the pipeline when no code was generated in prior steps.
package roles

import (
	"context"
	"fmt"
	"time"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/llm"
)

// auditorSystemPrompt is the system message used for security audits.
const auditorSystemPrompt = `You are a security auditor reviewing generated code.
Check for:
1. Shell injection in exec calls
2. Path traversal in file operations
3. Hardcoded credentials or API keys
4. Missing input validation
5. Insecure deserialization
6. Race conditions

Output a numbered list of findings. If none, respond: "No security issues found."`

// Auditor performs a security review of code produced during earlier pipeline steps.
// Uses Qwen2.5-Coder (CoderPort) for its code comprehension capability.
type Auditor struct {
	client *llm.Client
	port   int
}

// NewAuditor creates an Auditor with the given LLM client (uses CoderPort).
func NewAuditor(client *llm.Client) *Auditor {
	return &Auditor{client: client, port: CoderPort}
}

// Role returns RoleAuditor — distinct from RoleCoder so both can be registered
// in the same agent map. Auditor shares the Qwen2.5-Coder endpoint (port 4003)
// but runs a security-audit system prompt, not a code-generation prompt.
func (a *Auditor) Role() agents.Role { return agents.RoleAuditor }

// Plan is a no-op for Auditor — it only runs a single review step.
func (a *Auditor) Plan(_ context.Context, sessionID, goal string) ([]agents.Step, error) {
	return []agents.Step{
		{
			SessionID:   sessionID,
			Description: "Security audit of: " + goal,
			Status:      "pending",
			CreatedAt:   time.Now().UTC(),
		},
	}, nil
}

// Execute runs the security audit over step.ToolArgs (prior observations joined).
func (a *Auditor) Execute(ctx context.Context, step agents.Step) (agents.Observation, error) {
	content := step.ToolArgs
	if content == "" {
		content = step.Description
	}
	messages := []llm.Message{
		{Role: "system", Content: auditorSystemPrompt},
		{Role: "user", Content: content},
	}
	resp, err := a.client.ChatCompletion(ctx, a.port, messages)
	if err != nil {
		return agents.Observation{}, fmt.Errorf("auditor: execute: %w", err)
	}
	return agents.Observation{
		StepID:    step.ID,
		Content:   llm.FirstContent(resp),
		TokensIn:  resp.Usage.PromptTokens,
		TokensOut: resp.Usage.CompletionTokens,
		CreatedAt: time.Now().UTC(),
	}, nil
}

// Reflect always terminates — audit is terminal step.
func (a *Auditor) Reflect(_ context.Context, obs agents.Observation) (agents.Decision, error) {
	return agents.Decision{Continue: false, NextGoal: obs.Content}, nil
}
