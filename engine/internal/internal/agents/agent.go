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

// Package agents defines the Agent interface, Role enum, and core data types
// shared by AgentManager, the pipeline executor, and role implementations.
package agents

import (
	"context"
	"errors"
	"time"
)

// ErrKillSwitch is returned by the pipeline when the safety guard is active.
var ErrKillSwitch = errors.New("agents: pipeline aborted — kill-switch is active")

// Role identifies which model family and prompt style an agent uses.
type Role int

const (
	// RoleResearcher uses the Gemma model (port 4001) for planning / web-like research.
	RoleResearcher Role = iota
	// RoleCoder uses Qwen2.5-Coder (port 4003) for code generation.
	RoleCoder
	// RoleAnalyzer uses DeepSeek R1 (port 4002) for chain-of-thought reasoning.
	RoleAnalyzer
	// RoleAuditor uses Qwen2.5-Coder (port 4003) with a security-audit system prompt.
	// Distinct from RoleCoder so both can be registered in the same agent map without collision.
	RoleAuditor
)

// String returns a human-readable label for the role.
func (r Role) String() string {
	switch r {
	case RoleResearcher:
		return "researcher"
	case RoleCoder:
		return "coder"
	case RoleAnalyzer:
		return "analyzer"
	case RoleAuditor:
		return "auditor"
	default:
		return "unknown"
	}
}

// ParseRole converts a string to a Role, returning an error for unknown values.
func ParseRole(s string) (Role, error) {
	switch s {
	case "researcher":
		return RoleResearcher, nil
	case "coder":
		return RoleCoder, nil
	case "analyzer":
		return RoleAnalyzer, nil
	case "auditor":
		return RoleAuditor, nil
	default:
		return 0, errors.New("agents: unknown role: " + s)
	}
}

// Step represents one planned action within an agent session.
type Step struct {
	ID          string    `json:"id"`
	SessionID   string    `json:"session_id"`
	Description string    `json:"description"`
	ToolName    string    `json:"tool_name,omitempty"` // empty = LLM-only step
	ToolArgs    string    `json:"tool_args,omitempty"`
	Status      string    `json:"status"` // "pending","running","done","failed"
	CreatedAt   time.Time `json:"created_at"`
}

// Observation is the result of executing a Step (tool call or LLM turn).
type Observation struct {
	StepID    string    `json:"step_id"`
	Content   string    `json:"content"`
	TokensIn  int       `json:"tokens_in"`
	TokensOut int       `json:"tokens_out"`
	CreatedAt time.Time `json:"created_at"`
}

// Decision is returned by Agent.Reflect() to control the pipeline loop.
type Decision struct {
	Continue  bool   // false = terminate loop
	NextGoal  string // optional refined goal for next iteration
	RequestedTool string // optional: name of tool to invoke next
}

// Agent is the interface implemented by all role-specific handlers.
// Each method is called at a specific stage of the 4-step pipeline.
type Agent interface {
	// Role returns the role this agent implements.
	Role() Role

	// Plan takes a user goal and returns a sequence of Steps to execute.
	Plan(ctx context.Context, sessionID, goal string) ([]Step, error)

	// Execute runs a single Step and returns an Observation.
	Execute(ctx context.Context, step Step) (Observation, error)

	// Reflect evaluates an Observation and decides whether to continue.
	Reflect(ctx context.Context, obs Observation) (Decision, error)
}
