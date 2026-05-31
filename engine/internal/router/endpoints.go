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

// Package router contains the Smart Router heuristic classifier
// and the MLX endpoint registry for Mekong IDE.
package router

// ModelName identifies one of the three local MLX models.
type ModelName string

const (
	// ModelGemma is Gemma 4 running on port 4001 (architect/router role).
	ModelGemma ModelName = "gemma"

	// ModelDeepSeek is DeepSeek R1 on port 4002 (reasoning/complex logic).
	ModelDeepSeek ModelName = "deepseek"

	// ModelQwen is Qwen2.5-Coder on port 4003 (code audit/generation).
	ModelQwen ModelName = "qwen"
)

// Endpoint describes a single MLX model server.
type Endpoint struct {
	Name ModelName
	Port int
	// Description explains the model's role in the pipeline.
	Description string
}

// Registry holds the three canonical MLX endpoints.
// Ports match engine-farm/config.env defaults.
type Registry struct {
	Gemma     Endpoint
	DeepSeek  Endpoint
	Qwen      Endpoint
}

// NewRegistry builds a Registry from config port values.
func NewRegistry(routerPort, reasoningPort, auditPort int) *Registry {
	return &Registry{
		Gemma: Endpoint{
			Name:        ModelGemma,
			Port:        routerPort,
			Description: "Gemma 4 — architect, routing, planning",
		},
		DeepSeek: Endpoint{
			Name:        ModelDeepSeek,
			Port:        reasoningPort,
			Description: "DeepSeek R1 — reasoning, complex logic, chain-of-thought",
		},
		Qwen: Endpoint{
			Name:        ModelQwen,
			Port:        auditPort,
			Description: "Qwen2.5-Coder — code generation, audit, review",
		},
	}
}

// All returns all endpoints as a slice (useful for iteration).
func (r *Registry) All() []Endpoint {
	return []Endpoint{r.Gemma, r.DeepSeek, r.Qwen}
}

// ByName looks up an endpoint by model name. Returns (Endpoint, true) if found.
func (r *Registry) ByName(name ModelName) (Endpoint, bool) {
	for _, ep := range r.All() {
		if ep.Name == name {
			return ep, true
		}
	}
	return Endpoint{}, false
}
