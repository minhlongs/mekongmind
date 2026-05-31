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

package bootstrap_test

import (
	"context"
	"testing"

	"github.com/mekongmind/engine/internal/bootstrap"
)

func TestRun_HelpFlag(t *testing.T) {
	// --help should succeed (cobra exits 0 for help).
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)

	// cobra returns nil for --help; Run should return nil.
	err := bootstrap.Run(context.Background(), []string{"--help"})
	if err != nil {
		t.Errorf("Run(--help) expected nil error, got: %v", err)
	}
}

func TestRun_UnknownCommand(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)

	// Unknown subcommand should return an error.
	err := bootstrap.Run(context.Background(), []string{"unknowncmd"})
	if err == nil {
		t.Error("Run(unknowncmd) expected error for unknown command, got nil")
	}
}

func TestVersion_DefaultValue(t *testing.T) {
	if bootstrap.Version == "" {
		t.Error("bootstrap.Version should not be empty")
	}
}
