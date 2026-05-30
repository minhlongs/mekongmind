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

// Package llm provides an OpenAI-compatible HTTP client for local MLX endpoints.
// Ported from orchestrator/src/llm_client.rs — stdlib net/http, no external deps.
package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	// MaxPromptBytes caps input to prevent runaway requests (32 KB).
	MaxPromptBytes = 32 * 1024

	// DefaultTimeoutSecs is the default HTTP round-trip timeout.
	DefaultTimeoutSecs = 180

	// MaxTokens is the default max_tokens sent to the LLM.
	MaxTokens = 2048
)

// Message represents a single turn in the conversation (OpenAI format).
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest is the payload sent to /v1/chat/completions.
type ChatRequest struct {
	Messages  []Message `json:"messages"`
	MaxTokens int       `json:"max_tokens"`
	Stream    bool      `json:"stream,omitempty"`
}

// Choice holds one completion candidate.
type Choice struct {
	Index   int     `json:"index"`
	Message Message `json:"message"`
	// FinishReason is "stop", "length", etc.
	FinishReason string `json:"finish_reason"`
}

// Usage holds token consumption counters returned by the endpoint.
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// ChatResponse is the response from /v1/chat/completions.
type ChatResponse struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Choices []Choice `json:"choices"`
	Usage   Usage    `json:"usage"`
}

// Client is a thin OpenAI-compatible HTTP client for local MLX endpoints.
// Thread-safe; reuse across goroutines.
type Client struct {
	http    *http.Client
	host    string
	timeout time.Duration
}

// NewClient creates a Client targeting the given host (e.g. "127.0.0.1").
// timeout applies per request; pass 0 to use DefaultTimeoutSecs.
func NewClient(host string, timeoutSecs int) *Client {
	if timeoutSecs <= 0 {
		timeoutSecs = DefaultTimeoutSecs
	}
	return &Client{
		http:    &http.Client{Timeout: time.Duration(timeoutSecs) * time.Second},
		host:    host,
		timeout: time.Duration(timeoutSecs) * time.Second,
	}
}

// ChatCompletion sends messages to the endpoint at port and returns the response.
// ctx is respected for cancellation. Input is capped at MaxPromptBytes.
func (c *Client) ChatCompletion(ctx context.Context, port int, messages []Message) (*ChatResponse, error) {
	url := fmt.Sprintf("http://%s:%d/v1/chat/completions", c.host, port)

	req := ChatRequest{
		Messages:  messages,
		MaxTokens: MaxTokens,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("llm: marshal request: %w", err)
	}

	// Enforce input size cap (security constraint from spec).
	if len(body) > MaxPromptBytes {
		return nil, fmt.Errorf("llm: request exceeds %d byte limit (%d bytes)", MaxPromptBytes, len(body))
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("llm: build request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("llm: POST %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return nil, fmt.Errorf("llm: endpoint %s returned %d: %s", url, resp.StatusCode, raw)
	}

	var result ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("llm: decode response: %w", err)
	}

	return &result, nil
}

// IsHealthy returns true if the endpoint at port responds to GET /v1/models with 2xx.
// Uses a short 2s timeout regardless of c.timeout.
func (c *Client) IsHealthy(ctx context.Context, port int) bool {
	url := fmt.Sprintf("http://%s:%d/v1/models", c.host, port)
	ctx2, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx2, http.MethodGet, url, nil)
	if err != nil {
		return false
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return false
	}
	resp.Body.Close()
	return resp.StatusCode >= 200 && resp.StatusCode < 300
}

// FirstContent extracts the text of the first choice from a ChatResponse.
// Returns empty string if response has no choices.
func FirstContent(r *ChatResponse) string {
	if r == nil || len(r.Choices) == 0 {
		return ""
	}
	return r.Choices[0].Message.Content
}
