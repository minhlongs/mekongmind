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

package router_test

import (
	"testing"

	"github.com/mekongmind/engine/internal/router"
)

func newTestRouter() *router.SmartRouter {
	reg := router.NewRegistry(4001, 4002, 4003)
	return router.NewSmartRouter(reg)
}

func TestRoute_CodeMarker_Backtick(t *testing.T) {
	r := newTestRouter()
	result := r.Route("Please ```python\nprint('hello')``` fix this")
	if result.Endpoint.Name != router.ModelQwen {
		t.Errorf("expected Qwen for backtick code, got %s (reason: %s)", result.Endpoint.Name, result.Reason)
	}
}

func TestRoute_CodeMarker_WriteFunction(t *testing.T) {
	r := newTestRouter()
	result := r.Route("Write a function that reverses a string in Go")
	if result.Endpoint.Name != router.ModelQwen {
		t.Errorf("expected Qwen for 'write a function', got %s", result.Endpoint.Name)
	}
}

func TestRoute_CodeMarker_Implement(t *testing.T) {
	r := newTestRouter()
	result := r.Route("implement a binary search tree in TypeScript")
	if result.Endpoint.Name != router.ModelQwen {
		t.Errorf("expected Qwen for 'implement', got %s", result.Endpoint.Name)
	}
}

func TestRoute_ReasoningKeyword_Why(t *testing.T) {
	r := newTestRouter()
	result := r.Route("why is Go faster than Python for concurrent tasks?")
	if result.Endpoint.Name != router.ModelDeepSeek {
		t.Errorf("expected DeepSeek for 'why', got %s (reason: %s)", result.Endpoint.Name, result.Reason)
	}
}

func TestRoute_ReasoningKeyword_Explain(t *testing.T) {
	r := newTestRouter()
	result := r.Route("explain how garbage collection works")
	if result.Endpoint.Name != router.ModelDeepSeek {
		t.Errorf("expected DeepSeek for 'explain', got %s", result.Endpoint.Name)
	}
}

func TestRoute_ReasoningKeyword_Analyze(t *testing.T) {
	r := newTestRouter()
	result := r.Route("analyze the trade-offs between REST and gRPC")
	if result.Endpoint.Name != router.ModelDeepSeek {
		t.Errorf("expected DeepSeek for 'analyze', got %s", result.Endpoint.Name)
	}
}

func TestRoute_Default_Gemma(t *testing.T) {
	r := newTestRouter()
	result := r.Route("hello, how are you today?")
	if result.Endpoint.Name != router.ModelGemma {
		t.Errorf("expected Gemma for general query, got %s (reason: %s)", result.Endpoint.Name, result.Reason)
	}
}

func TestRoute_ForceModel_Gemma(t *testing.T) {
	r := newTestRouter().WithForceModel(router.ModelGemma)
	// Even a code prompt should go to Gemma when forced.
	result := r.Route("write a function")
	if result.Endpoint.Name != router.ModelGemma {
		t.Errorf("expected Gemma (forced), got %s", result.Endpoint.Name)
	}
}

func TestRoute_ForceModel_DeepSeek(t *testing.T) {
	r := newTestRouter().WithForceModel(router.ModelDeepSeek)
	result := r.Route("hello world")
	if result.Endpoint.Name != router.ModelDeepSeek {
		t.Errorf("expected DeepSeek (forced), got %s", result.Endpoint.Name)
	}
}

func TestRoute_ForceModel_Qwen(t *testing.T) {
	r := newTestRouter().WithForceModel(router.ModelQwen)
	result := r.Route("explain why")
	if result.Endpoint.Name != router.ModelQwen {
		t.Errorf("expected Qwen (forced), got %s", result.Endpoint.Name)
	}
}

func TestRoute_ForceModel_UnknownFallsThrough(t *testing.T) {
	r := newTestRouter().WithForceModel("nonexistent")
	// Should fall through to heuristic (general → Gemma).
	result := r.Route("hello")
	if result.Endpoint.Name != router.ModelGemma {
		t.Errorf("expected Gemma fallback for unknown force-model, got %s", result.Endpoint.Name)
	}
}

func TestParseModelName(t *testing.T) {
	cases := []struct {
		input   string
		want    router.ModelName
		wantOK  bool
	}{
		{"gemma", router.ModelGemma, true},
		{"GEMMA", router.ModelGemma, true},
		{"deepseek", router.ModelDeepSeek, true},
		{"qwen", router.ModelQwen, true},
		{"unknown", "", false},
		{"", "", false},
	}
	for _, tc := range cases {
		got, ok := router.ParseModelName(tc.input)
		if ok != tc.wantOK || got != tc.want {
			t.Errorf("ParseModelName(%q) = (%q, %v), want (%q, %v)", tc.input, got, ok, tc.want, tc.wantOK)
		}
	}
}

func TestRegistry_ByName(t *testing.T) {
	reg := router.NewRegistry(4001, 4002, 4003)
	ep, ok := reg.ByName(router.ModelDeepSeek)
	if !ok {
		t.Fatal("expected to find DeepSeek in registry")
	}
	if ep.Port != 4002 {
		t.Errorf("expected port 4002, got %d", ep.Port)
	}

	_, ok = reg.ByName("nope")
	if ok {
		t.Error("expected ByName to return false for unknown model")
	}
}
