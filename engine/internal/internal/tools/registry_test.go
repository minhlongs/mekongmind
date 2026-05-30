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

package tools_test

import (
	"context"
	"errors"
	"testing"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/tools"
)

func TestRegistry_RegisterAndExecute(t *testing.T) {
	reg := tools.NewRegistry()

	reg.Register("echo", func(_ context.Context, args string) (agents.Observation, error) {
		return agents.Observation{Content: args}, nil
	})

	obs, err := reg.Execute(context.Background(), "echo", "hello")
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if obs.Content != "hello" {
		t.Errorf("Content = %q, want hello", obs.Content)
	}
}

func TestRegistry_Has(t *testing.T) {
	reg := tools.NewRegistry()
	reg.Register("mytool", func(_ context.Context, _ string) (agents.Observation, error) {
		return agents.Observation{}, nil
	})
	if !reg.Has("mytool") {
		t.Error("Has(mytool) = false, want true")
	}
	if reg.Has("unknown") {
		t.Error("Has(unknown) = true, want false")
	}
}

func TestRegistry_MissingTool(t *testing.T) {
	reg := tools.NewRegistry()
	_, err := reg.Execute(context.Background(), "nope", "")
	if err == nil {
		t.Fatal("expected error for missing tool")
	}
	if !errors.Is(err, tools.ErrToolNotFound) {
		t.Errorf("error %v should wrap ErrToolNotFound", err)
	}
}

func TestRegistry_DuplicatePanics(t *testing.T) {
	reg := tools.NewRegistry()
	reg.Register("dup", func(_ context.Context, _ string) (agents.Observation, error) {
		return agents.Observation{}, nil
	})
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic on duplicate registration")
		}
	}()
	reg.Register("dup", func(_ context.Context, _ string) (agents.Observation, error) {
		return agents.Observation{}, nil
	})
}
