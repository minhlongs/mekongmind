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

// Package agents — pipeline_dispatch.go: agent ordering and tool-name routing helpers.
package agents

import "strings"

// orderedAgents returns registered agents in a fixed, deterministic Role order:
// Researcher → Coder → Analyzer → Auditor.
// Agents not present in the map are omitted. This prevents non-deterministic
// map iteration from causing flaky dispatch across pipeline runs.
func (p *Pipeline) orderedAgents() []Agent {
	order := []Role{RoleResearcher, RoleCoder, RoleAnalyzer, RoleAuditor}
	out := make([]Agent, 0, len(order))
	for _, role := range order {
		if ag, ok := p.agents[role]; ok {
			out = append(out, ag)
		}
	}
	return out
}

// toolNameToRole maps well-known tool names to the Role best suited to execute them.
// Returns (role, true) on match; (0, false) when the tool name is unknown.
// This provides deterministic routing for steps produced by the planner.
func toolNameToRole(toolName string) (Role, bool) {
	switch toolName {
	case "coder", "kronos-predict", "fairvalue-calc", "vnstock-get":
		return RoleCoder, true
	case "reasoner":
		return RoleAnalyzer, true
	case "auditor", "security-scan":
		return RoleAuditor, true
	case "researcher", "web-search":
		return RoleResearcher, true
	default:
		return 0, false
	}
}

// hasCodeGeneration returns true when any step or observation suggests code was produced.
func (p *Pipeline) hasCodeGeneration(steps []Step, obs []Observation) bool {
	codeMarkers := []string{"```", "func ", "def ", "class ", "import ", "package "}
	for _, s := range steps {
		if s.ToolName == "coder" {
			return true
		}
	}
	for _, o := range obs {
		lower := strings.ToLower(o.Content)
		for _, m := range codeMarkers {
			if strings.Contains(lower, m) {
				return true
			}
		}
	}
	return false
}
