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

// Package cli — safety.go: `mekong safety` subcommand tree.
//
// Subcommands:
//   mekong safety status  — print kill-switch state and path info
//   mekong safety reset   — reset kill-switch to OK (requires --confirm)
package cli

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/mekongmind/engine/internal/ffi"
)

// mekongDir returns ~/.mekong path without creating it.
func mekongDir() string {
	home := os.Getenv("HOME")
	if home == "" {
		home = "~"
	}
	return filepath.Join(home, ".mekong")
}

// safetyCmd is the parent command for `mekong safety`.
var safetyCmd = &cobra.Command{
	Use:   "safety",
	Short: "Inspect and manage the Mekong kill-switch",
	Long: `Inspect and manage the Mekong safety kill-switch.

The kill-switch halts all agent trading operations when drawdown thresholds
are breached or a manual halt is triggered. Use 'status' to inspect current
state and 'reset' to restore operations after reviewing logs.`,
}

// newSafetyStatusCmd returns `mekong safety status`.
func newSafetyStatusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show current kill-switch state and file paths",
		RunE:  runSafetyStatus,
	}
}

// newSafetyResetCmd returns `mekong safety reset`.
func newSafetyResetCmd() *cobra.Command {
	var confirm bool
	cmd := &cobra.Command{
		Use:   "reset",
		Short: "Reset kill-switch to OK and remove lock file",
		Long: `Reset the Mekong kill-switch back to OK state.

This removes ~/.mekong/kill.lock and allows agent operations to resume.
You MUST pass --confirm to acknowledge that you have reviewed safety.log.`,
		RunE: func(cmd *cobra.Command, _ []string) error {
			return runSafetyReset(cmd, confirm)
		},
	}
	cmd.Flags().BoolVar(&confirm, "confirm", false, "Confirm you have reviewed safety.log and want to reset")
	return cmd
}

// runSafetyStatus loads Guard and prints state + paths.
func runSafetyStatus(_ *cobra.Command, _ []string) error {
	g, err := ffi.NewGuard()
	if err != nil {
		return fmt.Errorf("safety status: failed to load safety guard: %w", err)
	}
	defer g.Close()

	dir := mekongDir()
	lockPath := filepath.Join(dir, "kill.lock")
	logPath := filepath.Join(dir, "safety.log")

	stateStr := g.StateString()

	fmt.Printf("State:       %s\n", stateStr)
	fmt.Printf("kill.lock:   %s\n", lockPath)
	fmt.Printf("safety.log:  %s\n", logPath)

	// If KILLED, show last line of safety.log for context.
	if g.State() == 2 {
		fmt.Println()
		fmt.Println("--- Last safety.log entry ---")
		lastLine, readErr := lastLogLine(logPath)
		if readErr != nil {
			fmt.Printf("(could not read safety.log: %v)\n", readErr)
		} else if lastLine != "" {
			fmt.Println(lastLine)
		} else {
			fmt.Println("(safety.log is empty)")
		}
		fmt.Println()
		fmt.Println("Run `mekong safety reset --confirm` to restore operations after reviewing logs.")
	}

	return nil
}

// runSafetyReset resets the kill-switch after confirmation.
func runSafetyReset(_ *cobra.Command, confirm bool) error {
	if !confirm {
		return fmt.Errorf("safety reset: requires --confirm flag\n\nPlease review ~/.mekong/safety.log before resetting.\nThen run: mekong safety reset --confirm")
	}

	g, err := ffi.NewGuard()
	if err != nil {
		return fmt.Errorf("safety reset: failed to load safety guard: %w", err)
	}
	defer g.Close()

	if err := g.Reset(); err != nil {
		return fmt.Errorf("safety reset: %w", err)
	}

	lockPath := filepath.Join(mekongDir(), "kill.lock")
	fmt.Println("Kill-switch reset to OK. Lock file removed.")
	fmt.Printf("Removed: %s\n", lockPath)
	fmt.Println("Agent operations may now resume.")

	return nil
}

// lastLogLine reads the last non-empty line of a file efficiently.
func lastLogLine(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	var last string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if line != "" {
			last = line
		}
	}
	return last, scanner.Err()
}

func init() {
	safetyCmd.AddCommand(newSafetyStatusCmd())
	safetyCmd.AddCommand(newSafetyResetCmd())
}
