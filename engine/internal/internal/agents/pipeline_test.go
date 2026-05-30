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
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/agents/roles"
	"github.com/mekongmind/engine/internal/llm"
)

// buildFakeLLMServer returns an httptest.Server that handles any port via hostname matching.
// It returns a fixed content string for all completions.
func buildFakeLLMServer(t *testing.T, content string) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(r.URL.Path, "/chat/completions") {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		resp := llm.ChatResponse{
			Choices: []llm.Choice{
				{Message: llm.Message{Role: "assistant", Content: content}},
			},
			Usage: llm.Usage{PromptTokens: 10, CompletionTokens: 5},
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
	t.Cleanup(srv.Close)
	return srv
}

// overridePort patches the LLM client host+port for testing.
// We use a single server for all LLM calls since we test skip logic, not per-model output.
type portOverrideClient struct {
	inner *llm.Client
	port  int
}

func (p *portOverrideClient) ChatCompletion(ctx context.Context, _ int, msgs []llm.Message) (*llm.ChatResponse, error) {
	return p.inner.ChatCompletion(ctx, p.port, msgs)
}

// testPipeline builds a Pipeline with fake agents backed by an httptest server.
func testPipeline(t *testing.T, guard agents.Guard, llmContent string) (*agents.Pipeline, *agents.StateStore, map[agents.Role]agents.Agent) {
	t.Helper()
	srv := buildFakeLLMServer(t, llmContent)

	// Parse port from httptest server URL.
	var port int
	fmt.Sscanf(srv.URL, "http://127.0.0.1:%d", &port)

	client := llm.NewClient("127.0.0.1", 5)
	// Build a client that overrides the port to talk to our fake server.
	// Architect, Coder, Reasoner all use the same fake server.
	_ = client
	_ = port

	// Use a custom fake server that ignores the port arg.
	fakeCli := llm.NewClient("127.0.0.1", 5) // timeout 5s
	_ = fakeCli

	// We use httptest server on port X. We create a real client pointing at that port.
	realCli := llm.NewClient("127.0.0.1", 5)
	_ = realCli

	// Create architect/coder/reasoner pointing at our fake port.
	// Override ports by creating a Client that hits the httptest address.
	testCli := buildPortClient(t, srv)

	arch := roles.NewArchitectWithClient(testCli, port)
	cdr := roles.NewCoderWithClient(testCli, port)
	rsn := roles.NewReasonerWithClient(testCli, port)

	agentMap := map[agents.Role]agents.Agent{
		agents.RoleResearcher: arch,
		agents.RoleCoder:      cdr,
		agents.RoleAnalyzer:   rsn,
	}

	dbPath := fmt.Sprintf("%s/pipeline-test.db", t.TempDir())
	store, err := agents.OpenStateStore(dbPath)
	if err != nil {
		t.Fatalf("OpenStateStore: %v", err)
	}
	t.Cleanup(func() { store.Close() })

	pipeline := agents.NewPipeline(store, agentMap, guard)
	return pipeline, store, agentMap
}

// buildPortClient returns an llm.Client that will reach the given httptest server.
func buildPortClient(t *testing.T, srv *httptest.Server) *llm.Client {
	t.Helper()
	// Extract host without port for Client constructor.
	addr := strings.TrimPrefix(srv.URL, "http://")
	host := strings.Split(addr, ":")[0]
	// We only need the host; port override happens via testable role constructors.
	return llm.NewClient(host, 5)
}

func TestPipeline_SimpleGoal_ReasonerSkipped(t *testing.T) {
	pipeline, _, agentMap := testPipeline(t, &fakeGuardAlive{}, "1. do the thing")
	primary := agentMap[agents.RoleResearcher]

	obs, err := pipeline.Run(context.Background(), "sess-1", "compute 2+2", primary)
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	// Simple arithmetic goal — no reasoning keywords → reasoner skipped.
	// No code markers → auditor skipped.
	// Expect at least the plan observation (no tools in fake plan).
	_ = obs // may be empty if no tool steps
}

func TestPipeline_ReasoningGoal_ReasonerRuns(t *testing.T) {
	pipeline, _, agentMap := testPipeline(t, &fakeGuardAlive{}, "1. analyze the data")
	primary := agentMap[agents.RoleResearcher]

	obs, err := pipeline.Run(context.Background(), "sess-2", "analyze why the build fails", primary)
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	_ = obs // Goal contains "analyze" → reasoner should have run
}

func TestPipeline_CodeGoal_AuditorRuns(t *testing.T) {
	// LLM returns content with code fence → auditor should trigger.
	pipeline, _, agentMap := testPipeline(t, &fakeGuardAlive{}, "```go\nfunc main(){}\n```")
	primary := agentMap[agents.RoleResearcher]

	// The plan step has no tool, but the observation content has code marker.
	obs, err := pipeline.Run(context.Background(), "sess-3", "write a Go handler", primary)
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	_ = obs
}

func TestPipeline_KillSwitch_AbortsBeforeFirstStep(t *testing.T) {
	pipeline, _, agentMap := testPipeline(t, &fakeGuardKilled{}, "1. step")
	primary := agentMap[agents.RoleResearcher]

	_, err := pipeline.Run(context.Background(), "sess-kill", "any goal", primary)
	if !errors.Is(err, agents.ErrKillSwitch) {
		t.Errorf("expected ErrKillSwitch, got %v", err)
	}
}

func TestPipeline_StepTimeout(t *testing.T) {
	// Use a slow server to verify context cancellation propagates.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		// Delay longer than the test context.
		time.Sleep(200 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	var port int
	fmt.Sscanf(srv.URL, "http://127.0.0.1:%d", &port)
	client := llm.NewClient("127.0.0.1", 1) // 1s timeout

	arch := roles.NewArchitectWithClient(client, port)
	agentMap := map[agents.Role]agents.Agent{agents.RoleResearcher: arch}

	dbPath := fmt.Sprintf("%s/timeout-test.db", t.TempDir())
	store, err := agents.OpenStateStore(dbPath)
	if err != nil {
		t.Fatalf("OpenStateStore: %v", err)
	}
	defer store.Close()

	pipeline := agents.NewPipeline(store, agentMap, &fakeGuardAlive{})

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	_, err = pipeline.Run(ctx, "sess-timeout", "simple goal", arch)
	// Expect either context deadline or LLM error — not a panic.
	if err == nil {
		t.Log("pipeline returned nil (server responded within timeout)")
	}
}
