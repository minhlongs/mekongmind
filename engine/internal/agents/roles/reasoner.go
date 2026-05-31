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

// Package roles — reasoner.go: DeepSeek R1 (port 4002) chain-of-thought agent.
// Step 3 of the pipeline — skipped for simple non-analytical goals.
package roles

import (
	"context"
	"fmt"
	"time"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/llm"
)

// ReasonerPort is the MLX engine port for DeepSeek R1.
const ReasonerPort = 4002

// Reasoner performs chain-of-thought analysis using DeepSeek R1.
// Implements agents.Agent — used as the Step 3 Reasoner in the pipeline.
type Reasoner struct {
	client *llm.Client
	port   int
}

// NewReasoner creates a Reasoner with the given LLM client (uses ReasonerPort).
func NewReasoner(client *llm.Client) *Reasoner {
	return &Reasoner{client: client, port: ReasonerPort}
}

// NewReasonerWithClient creates a Reasoner with explicit port override (for tests).
func NewReasonerWithClient(client *llm.Client, port int) *Reasoner {
	return &Reasoner{client: client, port: port}
}

// Role satisfies agents.Agent.
func (r *Reasoner) Role() agents.Role { return agents.RoleAnalyzer }

// Plan generates an analytical decomposition using CoT prompting.
func (r *Reasoner) Plan(ctx context.Context, sessionID, goal string) ([]agents.Step, error) {
	messages := []llm.Message{
		{
			Role: "system",
			Content: `You are an analytical reasoner. Break down the problem step by step,
showing your chain of thought. List each reasoning step on a new numbered line.`,
		},
		{Role: "user", Content: goal},
	}
	resp, err := r.client.ChatCompletion(ctx, r.port, messages)
	if err != nil {
		return nil, fmt.Errorf("reasoner: plan: %w", err)
	}
	return parseStepsFromLLM(sessionID, llm.FirstContent(resp)), nil
}

// Execute performs deep reasoning over the step's content (often prior observations).
func (r *Reasoner) Execute(ctx context.Context, step agents.Step) (agents.Observation, error) {
	content := step.Description
	if step.ToolArgs != "" {
		content = "Context:\n" + step.ToolArgs + "\n\nQuestion: " + step.Description
	}

	messages := []llm.Message{
		{
			Role: "system",
			Content: `You are an expert analyst using chain-of-thought reasoning.
Think step by step before providing your conclusion. Show your reasoning explicitly.`,
		},
		{Role: "user", Content: content},
	}
	resp, err := r.client.ChatCompletion(ctx, r.port, messages)
	if err != nil {
		return agents.Observation{}, fmt.Errorf("reasoner: execute: %w", err)
	}
	return agents.Observation{
		StepID:    step.ID,
		Content:   llm.FirstContent(resp),
		TokensIn:  resp.Usage.PromptTokens,
		TokensOut: resp.Usage.CompletionTokens,
		CreatedAt: time.Now().UTC(),
	}, nil
}

// Reflect evaluates whether reasoning is complete.
func (r *Reasoner) Reflect(_ context.Context, obs agents.Observation) (agents.Decision, error) {
	return agents.Decision{Continue: false, NextGoal: obs.Content}, nil
}
