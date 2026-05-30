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

// Package agents — pipeline.go: orchestration core (struct, Run, killCheck).
// Step methods live in pipeline_steps.go; dispatch helpers in pipeline_dispatch.go.
// Steps: Architect.Plan → (optional) Tools → Reasoner.Think → Auditor.Review.
// Kill-switch pre-flight before every step.
package agents

import (
	"context"
	"fmt"
	"log"
	"time"
)

// stepTimeout is the maximum duration allowed for each pipeline step.
const stepTimeout = 60 * time.Second

// reasoningKeywords trigger the Reasoner step when found in the goal.
var reasoningKeywords = []string{
	"why", "analyze", "explain", "reason", "think", "compare", "evaluate",
	"understand", "investigate", "diagnose",
}

// Pipeline executes the 4-step agent flow for a given session.
type Pipeline struct {
	store  *StateStore
	agents map[Role]Agent
	guard  Guard // may be nil
}

// NewPipeline constructs a Pipeline. guard may be nil.
func NewPipeline(store *StateStore, agents map[Role]Agent, guard Guard) *Pipeline {
	if guard == nil {
		log.Println("pipeline: warning — no kill-switch guard provided, running without safety check")
	}
	return &Pipeline{store: store, agents: agents, guard: guard}
}

// Run executes the 4-step pipeline for the given sessionID and goal.
// Returns all observations produced. Skips steps when heuristics allow.
// Kill-switch is checked before every step; ErrKillSwitch is returned immediately.
func (p *Pipeline) Run(ctx context.Context, sessionID, goal string, primary Agent) ([]Observation, error) {
	var observations []Observation

	// --- Step 1: Architect (always runs) ---
	if err := p.killCheck(); err != nil {
		return nil, err
	}
	steps, err := p.runPlan(ctx, sessionID, goal, primary)
	if err != nil {
		return nil, fmt.Errorf("pipeline: plan step: %w", err)
	}

	// --- Step 2: Tool execution (if any step requests a tool) ---
	if err := p.killCheck(); err != nil {
		return nil, err
	}
	toolObs, err := p.runTools(ctx, steps)
	if err != nil {
		// Non-fatal — log and continue.
		log.Printf("pipeline: tools step error (continuing): %v", err)
	}
	observations = append(observations, toolObs...)

	// --- Step 3: Reasoner (skip unless goal contains reasoning keywords) ---
	if err := p.killCheck(); err != nil {
		return nil, err
	}
	if p.needsReasoning(goal, steps) {
		reasoner, ok := p.agents[RoleAnalyzer]
		if ok {
			obs, err := p.runReflect(ctx, sessionID, goal, reasoner, toolObs)
			if err != nil {
				log.Printf("pipeline: reasoner step error (continuing): %v", err)
			} else {
				observations = append(observations, obs)
			}
		} else {
			log.Println("pipeline: reasoner requested but RoleAnalyzer not registered — skipping")
		}
	} else {
		log.Println("pipeline: reasoner skipped (no reasoning keywords in goal)")
	}

	// --- Step 4: Auditor (skip if no code was generated) ---
	if err := p.killCheck(); err != nil {
		return nil, err
	}
	if p.hasCodeGeneration(steps, observations) {
		auditor, ok := p.agents[RoleAuditor]
		if ok {
			obs, err := p.runAudit(ctx, sessionID, goal, auditor, observations)
			if err != nil {
				log.Printf("pipeline: auditor step error (continuing): %v", err)
			} else {
				observations = append(observations, obs)
			}
		} else {
			log.Println("pipeline: auditor requested but RoleAuditor not registered — skipping")
		}
	} else {
		log.Println("pipeline: auditor skipped (no code generation detected)")
	}

	return observations, nil
}

// killCheck returns ErrKillSwitch if the guard is non-nil and reports killed.
func (p *Pipeline) killCheck() error {
	if p.guard != nil && p.guard.IsKilled() {
		return ErrKillSwitch
	}
	return nil
}
