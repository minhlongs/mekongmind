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

// Package agents — pipeline_steps.go: per-step execution methods (plan, tools, reflect, audit).
package agents

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
)

// runPlan calls primary.Plan, persists steps to BoltDB.
func (p *Pipeline) runPlan(ctx context.Context, sessionID, goal string, primary Agent) ([]Step, error) {
	stepCtx, cancel := context.WithTimeout(ctx, stepTimeout)
	defer cancel()

	steps, err := primary.Plan(stepCtx, sessionID, goal)
	if err != nil {
		return nil, err
	}
	for i := range steps {
		if steps[i].ID == "" {
			steps[i].ID = uuid.New().String()
		}
		steps[i].SessionID = sessionID
		steps[i].CreatedAt = time.Now().UTC()
		if steps[i].Status == "" {
			steps[i].Status = "pending"
		}
		_ = p.store.PutStep(steps[i])
	}
	return steps, nil
}

// runTools executes any step that has a tool name via the appropriate agent.
func (p *Pipeline) runTools(ctx context.Context, steps []Step) ([]Observation, error) {
	var obs []Observation
	for _, step := range steps {
		if step.ToolName == "" {
			continue
		}
		// Kill-check before each tool execution — a manual kill halts mid-pipeline.
		if err := p.killCheck(); err != nil {
			return obs, err
		}
		stepCtx, cancel := context.WithTimeout(ctx, stepTimeout)
		// Deterministic agent selection: map ToolName → Role for known tools,
		// then fall back to the fixed canonical role order so dispatch is
		// reproducible across runs (no map-iteration non-determinism).
		var o Observation
		var err error
		dispatched := false
		if role, ok := toolNameToRole(step.ToolName); ok {
			if ag, agOK := p.agents[role]; agOK {
				o, err = ag.Execute(stepCtx, step)
				dispatched = true
			}
		}
		if !dispatched {
			// Fall back to first available agent in canonical role order.
			for _, ag := range p.orderedAgents() {
				o, err = ag.Execute(stepCtx, step)
				dispatched = true
				break
			}
		}
		if !dispatched {
			cancel()
			log.Printf("pipeline: no agent available for step %q (tool %q) — skipping", step.ID, step.ToolName)
			continue
		}
		cancel()
		if err != nil {
			log.Printf("pipeline: tool %q failed: %v", step.ToolName, err)
			continue
		}
		_ = p.store.PutObservation(o)
		obs = append(obs, o)
	}
	return obs, nil
}

// runReflect calls reasoner.Execute on the latest observation summary.
func (p *Pipeline) runReflect(ctx context.Context, sessionID, goal string, reasoner Agent, prior []Observation) (Observation, error) {
	stepCtx, cancel := context.WithTimeout(ctx, stepTimeout)
	defer cancel()

	// Build a synthetic step representing the reasoning request.
	synthetic := Step{
		ID:          uuid.New().String(),
		SessionID:   sessionID,
		Description: "Reasoning over goal: " + goal,
		Status:      "running",
		CreatedAt:   time.Now().UTC(),
	}

	// Inject prior content into the step args for the reasoner.
	var sb strings.Builder
	for _, ob := range prior {
		sb.WriteString(ob.Content)
		sb.WriteByte('\n')
	}
	synthetic.ToolArgs = sb.String()

	obs, err := reasoner.Execute(stepCtx, synthetic)
	if err != nil {
		return obs, err
	}
	_ = p.store.PutObservation(obs)
	return obs, nil
}

// runAudit calls auditor.Execute with code from observations.
func (p *Pipeline) runAudit(ctx context.Context, sessionID, _ string, auditor Agent, prior []Observation) (Observation, error) {
	stepCtx, cancel := context.WithTimeout(ctx, stepTimeout)
	defer cancel()

	synthetic := Step{
		ID:          uuid.New().String(),
		SessionID:   sessionID,
		Description: "Security audit of generated code",
		Status:      "running",
		CreatedAt:   time.Now().UTC(),
	}

	var sb strings.Builder
	for _, ob := range prior {
		sb.WriteString(ob.Content)
		sb.WriteByte('\n')
	}
	synthetic.ToolArgs = sb.String()

	obs, err := auditor.Execute(stepCtx, synthetic)
	if err != nil {
		return obs, err
	}
	_ = p.store.PutObservation(obs)
	return obs, nil
}

// needsReasoning returns true when the goal or step descriptions contain reasoning keywords,
// or when a step explicitly requests the reasoner via ToolName.
func (p *Pipeline) needsReasoning(goal string, steps []Step) bool {
	lower := strings.ToLower(goal)
	for _, kw := range reasoningKeywords {
		if strings.Contains(lower, kw) {
			return true
		}
	}
	for _, s := range steps {
		if s.ToolName == "reasoner" {
			return true
		}
	}
	return false
}
