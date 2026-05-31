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

// safety_test.go — unit tests for the `mekong safety` CLI command tree.
//
// These tests exercise CLI wiring only (cobra command structure).
// They do NOT invoke the FFI Guard (no dylib required here).

package cli

import (
	"testing"
)

// TestSafetyCmdStructure verifies that safetyCmd has status and reset subcommands.
func TestSafetyCmdStructure(t *testing.T) {
	cmds := safetyCmd.Commands()
	found := make(map[string]bool)
	for _, c := range cmds {
		found[c.Name()] = true
	}

	for _, want := range []string{"status", "reset"} {
		if !found[want] {
			t.Errorf("safetyCmd missing subcommand %q; registered: %v", want, cmds)
		}
	}
}

// TestSafetyResetRequiresConfirm verifies reset refuses without --confirm.
// Uses cobra's RunE directly with no args (confirm=false default).
func TestSafetyResetRequiresConfirm(t *testing.T) {
	err := runSafetyReset(nil, false /* confirm=false */)
	if err == nil {
		t.Error("runSafetyReset(confirm=false) should return an error, got nil")
	}
}

// TestMekongDirReturnsHomeDotMekong verifies mekongDir resolves correctly.
func TestMekongDirReturnsHomeDotMekong(t *testing.T) {
	dir := mekongDir()
	if dir == "" {
		t.Fatal("mekongDir() returned empty string")
	}
	// Must end with .mekong
	if len(dir) < 7 || dir[len(dir)-7:] != ".mekong" {
		t.Errorf("mekongDir() = %q; want path ending in .mekong", dir)
	}
}
