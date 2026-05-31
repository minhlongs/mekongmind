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
	"testing"

	"github.com/mekongmind/engine/internal/agents"
)

func TestRoleString(t *testing.T) {
	cases := []struct {
		role agents.Role
		want string
	}{
		{agents.RoleResearcher, "researcher"},
		{agents.RoleCoder, "coder"},
		{agents.RoleAnalyzer, "analyzer"},
		{agents.Role(99), "unknown"},
	}
	for _, tc := range cases {
		if got := tc.role.String(); got != tc.want {
			t.Errorf("Role(%d).String() = %q, want %q", int(tc.role), got, tc.want)
		}
	}
}

func TestParseRole(t *testing.T) {
	for _, name := range []string{"researcher", "coder", "analyzer"} {
		r, err := agents.ParseRole(name)
		if err != nil {
			t.Errorf("ParseRole(%q) unexpected error: %v", name, err)
		}
		if r.String() != name {
			t.Errorf("ParseRole(%q).String() = %q, want %q", name, r.String(), name)
		}
	}
	if _, err := agents.ParseRole("unknown-role"); err == nil {
		t.Error("ParseRole(unknown) expected error, got nil")
	}
}

func TestErrKillSwitchSentinel(t *testing.T) {
	// Ensure the error can be used in errors.Is comparisons.
	if agents.ErrKillSwitch == nil {
		t.Fatal("ErrKillSwitch must not be nil")
	}
	if agents.ErrKillSwitch.Error() == "" {
		t.Fatal("ErrKillSwitch message must not be empty")
	}
}

func TestStepDefaults(t *testing.T) {
	s := agents.Step{ID: "s1", Status: "pending"}
	if s.ToolName != "" {
		t.Errorf("default ToolName should be empty, got %q", s.ToolName)
	}
}

func TestObservationFields(t *testing.T) {
	obs := agents.Observation{StepID: "step-1", Content: "hello", TokensIn: 5, TokensOut: 3}
	if obs.StepID != "step-1" {
		t.Errorf("StepID = %q, want step-1", obs.StepID)
	}
	if obs.TokensIn != 5 {
		t.Errorf("TokensIn = %d, want 5", obs.TokensIn)
	}
}
