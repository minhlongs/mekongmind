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

// Package tools provides the tool registry and built-in tool implementations
// for the Mekong IDE agent pipeline.
package tools

import (
	"context"
	"fmt"
	"sync"

	"github.com/mekongmind/engine/internal/agents"
)

// Handler is a function that a tool exposes to the pipeline.
// ctx must be respected for timeout/cancellation.
// args is the raw argument string from the Step.ToolArgs field.
type Handler func(ctx context.Context, args string) (agents.Observation, error)

// Registry maps tool names to their Handler implementations.
// Thread-safe for concurrent reads after initial registration.
type Registry struct {
	mu       sync.RWMutex
	handlers map[string]Handler
}

// NewRegistry creates an empty Registry.
func NewRegistry() *Registry {
	return &Registry{handlers: make(map[string]Handler)}
}

// Register adds a named tool to the registry.
// Panics if name is empty or already registered (programming error).
func (r *Registry) Register(name string, h Handler) {
	if name == "" {
		panic("tools: Register called with empty name")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.handlers[name]; exists {
		panic(fmt.Sprintf("tools: tool %q already registered", name))
	}
	r.handlers[name] = h
}

// Execute looks up a tool by name and calls it with the provided arguments.
// Returns ErrToolNotFound if the name is not registered.
func (r *Registry) Execute(ctx context.Context, name, args string) (agents.Observation, error) {
	r.mu.RLock()
	h, ok := r.handlers[name]
	r.mu.RUnlock()
	if !ok {
		return agents.Observation{}, fmt.Errorf("tools: %w: %q", ErrToolNotFound, name)
	}
	return h(ctx, args)
}

// Has returns true if the named tool is registered.
func (r *Registry) Has(name string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.handlers[name]
	return ok
}

// ErrToolNotFound is returned when a tool name is not in the registry.
var ErrToolNotFound = fmt.Errorf("tool not found")
