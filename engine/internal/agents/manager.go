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

// Package agents — manager.go: AgentManager orchestrates session lifecycle,
// maps roles to Agent implementations, and delegates execution to Pipeline.
package agents

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

// Guard is a minimal interface that pipeline uses to check kill-switch status.
// The real implementation lives in internal/ffi but we accept an interface so
// tests can inject a stub without cgo.
type Guard interface {
	IsKilled() bool
}

// AgentManager is the top-level lifecycle manager.
// It owns the StateStore and the registry of Agent implementations.
type AgentManager struct {
	store    *StateStore
	agents   map[Role]Agent // role → implementation
	pipeline *Pipeline
}

// NewAgentManager opens (or creates) the BoltDB state store and wires the
// provided agent implementations. If dbPath is empty, defaults to ~/.mekong/agents.db.
// guard may be nil — pipeline will log a warning and proceed without kill-switch checks.
func NewAgentManager(dbPath string, guard Guard, agentList []Agent) (*AgentManager, error) {
	if dbPath == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("manager: resolve home dir: %w", err)
		}
		dbPath = filepath.Join(home, ".mekong", "agents.db")
	}

	store, err := OpenStateStore(dbPath)
	if err != nil {
		return nil, fmt.Errorf("manager: open state store: %w", err)
	}

	agents := make(map[Role]Agent, len(agentList))
	for _, a := range agentList {
		agents[a.Role()] = a
	}

	m := &AgentManager{
		store:  store,
		agents: agents,
	}
	m.pipeline = NewPipeline(store, agents, guard)
	return m, nil
}

// Start checks BoltDB for in-progress sessions and logs resume opportunities.
// Callers may inspect the returned sessions and call ResumeSession or StartSession.
// Returns sessions that were interrupted (status == "running").
func (m *AgentManager) Start(ctx context.Context) ([]SessionRecord, error) {
	sessions, err := m.store.ListInProgressSessions()
	if err != nil {
		return nil, fmt.Errorf("manager: list in-progress: %w", err)
	}
	if len(sessions) > 0 {
		log.Printf("manager: %d in-progress session(s) found — call ResumeSession to continue", len(sessions))
	}
	return sessions, nil
}

// Stop closes the state store. Safe to call multiple times.
func (m *AgentManager) Stop() error {
	if m.store != nil {
		return m.store.Close()
	}
	return nil
}

// StartSession creates a new SessionRecord and runs the 4-step pipeline for the goal.
// Blocks until the pipeline completes or ctx is cancelled.
func (m *AgentManager) StartSession(ctx context.Context, role Role, goal string) (SessionRecord, error) {
	agent, ok := m.agents[role]
	if !ok {
		return SessionRecord{}, fmt.Errorf("manager: no agent registered for role %s", role)
	}

	rec := SessionRecord{
		ID:        uuid.New().String(),
		AgentRole: role.String(),
		Goal:      goal,
		Status:    "running",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	if err := m.store.PutSession(rec); err != nil {
		return rec, fmt.Errorf("manager: persist session: %w", err)
	}

	log.Printf("manager: session %s started (role=%s)", rec.ID, role)
	obs, err := m.pipeline.Run(ctx, rec.ID, goal, agent)

	// Update terminal status regardless of error.
	rec.UpdatedAt = time.Now().UTC()
	if err != nil {
		rec.Status = "failed"
		log.Printf("manager: session %s failed: %v", rec.ID, err)
	} else {
		rec.Status = "done"
		log.Printf("manager: session %s done — %d observation(s)", rec.ID, len(obs))
	}

	if putErr := m.store.PutSession(rec); putErr != nil {
		log.Printf("manager: warning: failed to persist final session status: %v", putErr)
	}
	return rec, err
}

// ResumeSession re-runs the pipeline for an existing "running" session,
// starting from steps that are still "pending" or "failed".
func (m *AgentManager) ResumeSession(ctx context.Context, sessionID string) (SessionRecord, error) {
	rec, err := m.store.GetSession(sessionID)
	if err != nil {
		return rec, fmt.Errorf("manager: get session: %w", err)
	}

	role, err := ParseRole(rec.AgentRole)
	if err != nil {
		return rec, fmt.Errorf("manager: parse role: %w", err)
	}

	agent, ok := m.agents[role]
	if !ok {
		return rec, fmt.Errorf("manager: no agent for role %s", role)
	}

	log.Printf("manager: resuming session %s (goal=%q)", sessionID, rec.Goal)
	_, pipeErr := m.pipeline.Run(ctx, rec.ID, rec.Goal, agent)

	rec.UpdatedAt = time.Now().UTC()
	if pipeErr != nil {
		rec.Status = "failed"
	} else {
		rec.Status = "done"
	}
	_ = m.store.PutSession(rec)
	return rec, pipeErr
}
