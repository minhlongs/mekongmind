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
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/mekongmind/engine/internal/agents"
)

func openTestStore(t *testing.T) *agents.StateStore {
	t.Helper()
	path := t.TempDir() + "/test.db"
	store, err := agents.OpenStateStore(path)
	if err != nil {
		t.Fatalf("OpenStateStore: %v", err)
	}
	t.Cleanup(func() { store.Close() })
	return store
}

func TestStateStore_SessionCRUD(t *testing.T) {
	store := openTestStore(t)

	rec := agents.SessionRecord{
		ID:        "session-1",
		AgentRole: "coder",
		Goal:      "test CRUD",
		Status:    "running",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	if err := store.PutSession(rec); err != nil {
		t.Fatalf("PutSession: %v", err)
	}

	got, err := store.GetSession("session-1")
	if err != nil {
		t.Fatalf("GetSession: %v", err)
	}
	if got.Goal != "test CRUD" {
		t.Errorf("Goal = %q, want %q", got.Goal, "test CRUD")
	}
}

func TestStateStore_MissingKey(t *testing.T) {
	store := openTestStore(t)
	_, err := store.GetSession("nonexistent")
	if err == nil {
		t.Error("expected error for missing key, got nil")
	}
}

func TestStateStore_ListInProgress(t *testing.T) {
	store := openTestStore(t)

	sessions := []agents.SessionRecord{
		{ID: "s1", AgentRole: "coder", Goal: "a", Status: "running", CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()},
		{ID: "s2", AgentRole: "coder", Goal: "b", Status: "done", CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()},
		{ID: "s3", AgentRole: "coder", Goal: "c", Status: "running", CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()},
	}
	for _, s := range sessions {
		if err := store.PutSession(s); err != nil {
			t.Fatalf("PutSession: %v", err)
		}
	}

	inProgress, err := store.ListInProgressSessions()
	if err != nil {
		t.Fatalf("ListInProgressSessions: %v", err)
	}
	if len(inProgress) != 2 {
		t.Errorf("got %d in-progress sessions, want 2", len(inProgress))
	}
}

func TestStateStore_StepCRUD(t *testing.T) {
	store := openTestStore(t)

	step := agents.Step{
		ID:          "step-1",
		SessionID:   "session-1",
		Description: "do something",
		Status:      "pending",
		CreatedAt:   time.Now().UTC(),
	}
	if err := store.PutStep(step); err != nil {
		t.Fatalf("PutStep: %v", err)
	}
	got, err := store.GetStep("step-1")
	if err != nil {
		t.Fatalf("GetStep: %v", err)
	}
	if got.Description != "do something" {
		t.Errorf("Description = %q, want %q", got.Description, "do something")
	}
}

func TestStateStore_ObservationCRUD(t *testing.T) {
	store := openTestStore(t)

	obs := agents.Observation{
		StepID:    "step-abc",
		Content:   "result text",
		TokensIn:  10,
		TokensOut: 20,
		CreatedAt: time.Now().UTC(),
	}
	if err := store.PutObservation(obs); err != nil {
		t.Fatalf("PutObservation: %v", err)
	}
	got, err := store.GetObservation("step-abc")
	if err != nil {
		t.Fatalf("GetObservation: %v", err)
	}
	if got.Content != "result text" {
		t.Errorf("Content = %q, want %q", got.Content, "result text")
	}
}

func TestStateStore_ConcurrentWrite(t *testing.T) {
	store := openTestStore(t)
	const n = 20
	var wg sync.WaitGroup
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func(i int) {
			defer wg.Done()
			rec := agents.SessionRecord{
				ID:        fmt.Sprintf("concurrent-%d", i),
				AgentRole: "researcher",
				Goal:      fmt.Sprintf("goal %d", i),
				Status:    "running",
				CreatedAt: time.Now().UTC(),
				UpdatedAt: time.Now().UTC(),
			}
			if err := store.PutSession(rec); err != nil {
				t.Errorf("concurrent PutSession[%d]: %v", i, err)
			}
		}(i)
	}
	wg.Wait()

	in, err := store.ListInProgressSessions()
	if err != nil {
		t.Fatalf("ListInProgressSessions: %v", err)
	}
	if len(in) != n {
		t.Errorf("got %d sessions, want %d", len(in), n)
	}
}
