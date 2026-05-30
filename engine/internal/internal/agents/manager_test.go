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

package agents_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/llm"
)

// fakeGuardKilled is an injected guard that always reports killed.
type fakeGuardKilled struct{}

func (f *fakeGuardKilled) IsKilled() bool { return true }

// fakeGuardAlive reports alive.
type fakeGuardAlive struct{}

func (f *fakeGuardAlive) IsKilled() bool { return false }

// fakeLLMServer returns a minimal OpenAI-compatible HTTP response.
func fakeLLMServer(t *testing.T, body string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := llm.ChatResponse{
			Choices: []llm.Choice{
				{Message: llm.Message{Role: "assistant", Content: body}},
			},
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
}

// fakeAgent is a minimal Agent implementation for manager tests.
type fakeAgent struct {
	role agents.Role
}

func (f *fakeAgent) Role() agents.Role { return f.role }

func (f *fakeAgent) Plan(_ context.Context, sessionID, goal string) ([]agents.Step, error) {
	return []agents.Step{
		{
			ID:          "fake-step-1",
			SessionID:   sessionID,
			Description: "fake step for: " + goal,
			Status:      "pending",
			CreatedAt:   time.Now().UTC(),
		},
	}, nil
}

func (f *fakeAgent) Execute(_ context.Context, step agents.Step) (agents.Observation, error) {
	return agents.Observation{
		StepID:    step.ID,
		Content:   "fake result",
		CreatedAt: time.Now().UTC(),
	}, nil
}

func (f *fakeAgent) Reflect(_ context.Context, obs agents.Observation) (agents.Decision, error) {
	return agents.Decision{Continue: false, NextGoal: obs.Content}, nil
}

func buildTestManager(t *testing.T, guard agents.Guard) *agents.AgentManager {
	t.Helper()
	dbPath := fmt.Sprintf("%s/test-manager.db", t.TempDir())
	agentList := []agents.Agent{
		&fakeAgent{role: agents.RoleResearcher},
		&fakeAgent{role: agents.RoleCoder},
		&fakeAgent{role: agents.RoleAnalyzer},
	}
	mgr, err := agents.NewAgentManager(dbPath, guard, agentList)
	if err != nil {
		t.Fatalf("NewAgentManager: %v", err)
	}
	t.Cleanup(func() { mgr.Stop() })
	return mgr
}

func TestAgentManager_StartStop(t *testing.T) {
	mgr := buildTestManager(t, &fakeGuardAlive{})
	sessions, err := mgr.Start(context.Background())
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	if len(sessions) != 0 {
		t.Errorf("fresh DB should have 0 in-progress sessions, got %d", len(sessions))
	}
}

func TestAgentManager_StartSession(t *testing.T) {
	mgr := buildTestManager(t, &fakeGuardAlive{})
	ctx := context.Background()

	rec, err := mgr.StartSession(ctx, agents.RoleResearcher, "compute 2+2")
	if err != nil {
		t.Fatalf("StartSession: %v", err)
	}
	if rec.Status != "done" {
		t.Errorf("status = %q, want done", rec.Status)
	}
	if rec.ID == "" {
		t.Error("session ID must not be empty")
	}
}

func TestAgentManager_ResumeAfterCrash(t *testing.T) {
	dbPath := fmt.Sprintf("%s/resume-test.db", t.TempDir())

	// Simulate a crash: manually write a "running" session to BoltDB.
	store, err := agents.OpenStateStore(dbPath)
	if err != nil {
		t.Fatalf("OpenStateStore: %v", err)
	}
	runningSession := agents.SessionRecord{
		ID:        "crashed-session",
		AgentRole: "researcher",
		Goal:      "interrupted goal",
		Status:    "running",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	if err := store.PutSession(runningSession); err != nil {
		t.Fatalf("PutSession: %v", err)
	}
	store.Close()

	// Now open manager — Start() should find the crashed session.
	agentList := []agents.Agent{
		&fakeAgent{role: agents.RoleResearcher},
		&fakeAgent{role: agents.RoleCoder},
		&fakeAgent{role: agents.RoleAnalyzer},
	}
	mgr, err := agents.NewAgentManager(dbPath, &fakeGuardAlive{}, agentList)
	if err != nil {
		t.Fatalf("NewAgentManager: %v", err)
	}
	defer mgr.Stop()

	sessions, err := mgr.Start(context.Background())
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	if len(sessions) != 1 {
		t.Fatalf("expected 1 in-progress session, got %d", len(sessions))
	}
	if sessions[0].ID != "crashed-session" {
		t.Errorf("session ID = %q, want crashed-session", sessions[0].ID)
	}

	// Resume the session.
	rec, err := mgr.ResumeSession(context.Background(), "crashed-session")
	if err != nil {
		t.Fatalf("ResumeSession: %v", err)
	}
	if rec.Status != "done" {
		t.Errorf("resumed status = %q, want done", rec.Status)
	}
}

func TestAgentManager_KillSwitchAborts(t *testing.T) {
	mgr := buildTestManager(t, &fakeGuardKilled{})
	_, err := mgr.StartSession(context.Background(), agents.RoleResearcher, "some goal")
	if err == nil {
		t.Fatal("expected ErrKillSwitch, got nil")
	}
	if !strings.Contains(err.Error(), "kill-switch") {
		t.Errorf("error %q should mention kill-switch", err.Error())
	}
}
