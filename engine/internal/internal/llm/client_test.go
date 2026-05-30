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

package llm_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/mekongmind/engine/internal/llm"
)

// fakeMLX spins up a test HTTP server that simulates an MLX endpoint.
func fakeMLX(t *testing.T, statusCode int, body interface{}) (*httptest.Server, int) {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/models" {
			w.WriteHeader(statusCode)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(body)
	}))
	t.Cleanup(srv.Close)

	// Extract port from URL (format: http://127.0.0.1:PORT)
	parts := strings.Split(srv.URL, ":")
	port, _ := strconv.Atoi(parts[len(parts)-1])
	return srv, port
}

func TestChatCompletion_HappyPath(t *testing.T) {
	want := &llm.ChatResponse{
		ID:     "test-1",
		Object: "chat.completion",
		Choices: []llm.Choice{
			{Index: 0, Message: llm.Message{Role: "assistant", Content: "Hello, world!"}, FinishReason: "stop"},
		},
	}

	_, port := fakeMLX(t, http.StatusOK, want)
	client := llm.NewClient("127.0.0.1", 5)

	msgs := []llm.Message{{Role: "user", Content: "say hello"}}
	resp, err := client.ChatCompletion(context.Background(), port, msgs)
	if err != nil {
		t.Fatalf("ChatCompletion() error: %v", err)
	}

	if llm.FirstContent(resp) != "Hello, world!" {
		t.Errorf("expected 'Hello, world!', got %q", llm.FirstContent(resp))
	}
}

func TestChatCompletion_ServerError(t *testing.T) {
	_, port := fakeMLX(t, http.StatusInternalServerError, map[string]string{"error": "oops"})
	client := llm.NewClient("127.0.0.1", 5)

	msgs := []llm.Message{{Role: "user", Content: "test"}}
	_, err := client.ChatCompletion(context.Background(), port, msgs)
	if err == nil {
		t.Error("expected error for 500 response, got nil")
	}
}

func TestChatCompletion_InputTooLarge(t *testing.T) {
	_, port := fakeMLX(t, http.StatusOK, &llm.ChatResponse{})
	client := llm.NewClient("127.0.0.1", 5)

	// Build a message that exceeds MaxPromptBytes.
	huge := strings.Repeat("x", llm.MaxPromptBytes+1)
	msgs := []llm.Message{{Role: "user", Content: huge}}
	_, err := client.ChatCompletion(context.Background(), port, msgs)
	if err == nil {
		t.Error("expected error for oversized input, got nil")
	}
}

func TestIsHealthy_Up(t *testing.T) {
	_, port := fakeMLX(t, http.StatusOK, nil)
	client := llm.NewClient("127.0.0.1", 5)

	if !client.IsHealthy(context.Background(), port) {
		t.Error("expected IsHealthy=true for 200 response")
	}
}

func TestIsHealthy_Down(t *testing.T) {
	// Port with no server — connection refused.
	client := llm.NewClient("127.0.0.1", 2)
	if client.IsHealthy(context.Background(), 19999) {
		t.Error("expected IsHealthy=false for closed port")
	}
}

func TestFirstContent_Empty(t *testing.T) {
	if llm.FirstContent(nil) != "" {
		t.Error("expected empty string for nil response")
	}
	if llm.FirstContent(&llm.ChatResponse{}) != "" {
		t.Error("expected empty string for response with no choices")
	}
}
