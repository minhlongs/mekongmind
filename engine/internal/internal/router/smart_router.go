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

package router

import (
	"regexp"
	"strings"
)

// codeMarkerRe detects prompts that are about code:
//   - backtick fences (```), inline code (`x`), common language keywords,
//   - explicit "write a function / implement / fix bug / refactor" instructions.
var codeMarkerRe = regexp.MustCompile(
	"(?i)" + // case-insensitive
		"(```|`[^`]+`" +
		"|\\bfunc\\b|\\bdef\\b|\\bclass\\b|\\bimport\\b|\\bpackage\\b|\\bvar\\b|\\bconst\\b|\\blet\\b" +
		"|write (a |the )?(function|code|script|program|class|method|test)" +
		"|implement|refactor|debug|fix (the |a |this )?bug|compile error" +
		"|syntax error|type error|runtime error" +
		")",
)

// reasoningKeywordRe detects prompts requiring deep analysis:
//   - "why", "explain", "analyze", "compare", "pros and cons", "trade.?off", etc.
var reasoningKeywordRe = regexp.MustCompile(
	"(?i)(\\bwhy\\b|\\bexplain\\b|\\banalyze\\b|\\banalyse\\b" +
		"|\\bcompare\\b|\\bcontrast\\b|\\bevaluate\\b|\\breview\\b" +
		"|\\bpros and cons\\b|trade.?offs?|\\barchitecture\\b" +
		"|\\bdesign\\b.*\\bsystem\\b|\\bhow does\\b|\\bwhat is the difference\\b" +
		"|\\bdiagnose\\b|\\breasoning\\b|\\bdecision\\b)",
)

// SmartRouter classifies prompts to the most appropriate MLX endpoint
// using pure regex heuristics — no LLM call needed.
//
// Routing priority (highest wins):
//  1. forceModel override (--force-model flag)
//  2. Code markers → Qwen Coder
//  3. Reasoning keywords → DeepSeek R1
//  4. Default → Gemma 4 (architect)
type SmartRouter struct {
	registry   *Registry
	forceModel ModelName // empty = no override
}

// NewSmartRouter creates a SmartRouter backed by the given endpoint registry.
func NewSmartRouter(registry *Registry) *SmartRouter {
	return &SmartRouter{registry: registry}
}

// WithForceModel returns a copy of the router with the given model forced.
// Pass empty string to clear the override.
func (r *SmartRouter) WithForceModel(model ModelName) *SmartRouter {
	return &SmartRouter{
		registry:   r.registry,
		forceModel: model,
	}
}

// RouteResult is returned by Route to expose the decision rationale.
type RouteResult struct {
	Endpoint Endpoint
	Reason   string
}

// Route selects the best endpoint for the given prompt.
// It never returns an error — falls back to Gemma on unknown model names.
func (r *SmartRouter) Route(prompt string) RouteResult {
	// Priority 1: --force-model override.
	if r.forceModel != "" {
		if ep, ok := r.registry.ByName(r.forceModel); ok {
			return RouteResult{Endpoint: ep, Reason: "force-model=" + string(r.forceModel)}
		}
		// Unknown model name — fall through to heuristic.
	}

	normalized := strings.TrimSpace(prompt)

	// Priority 2: code markers → Qwen Coder.
	if codeMarkerRe.MatchString(normalized) {
		return RouteResult{
			Endpoint: r.registry.Qwen,
			Reason:   "code-marker detected",
		}
	}

	// Priority 3: reasoning keywords → DeepSeek R1.
	if reasoningKeywordRe.MatchString(normalized) {
		return RouteResult{
			Endpoint: r.registry.DeepSeek,
			Reason:   "reasoning-keyword detected",
		}
	}

	// Priority 4: default → Gemma 4 (architect/general).
	return RouteResult{
		Endpoint: r.registry.Gemma,
		Reason:   "default (general query)",
	}
}

// ParseModelName converts a CLI string like "gemma", "deepseek", "qwen"
// to a ModelName. Returns ("", false) if unrecognized.
func ParseModelName(s string) (ModelName, bool) {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "gemma":
		return ModelGemma, true
	case "deepseek":
		return ModelDeepSeek, true
	case "qwen":
		return ModelQwen, true
	default:
		return "", false
	}
}
