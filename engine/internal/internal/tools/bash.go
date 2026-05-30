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

// Package tools — bash.go: whitelisted shell command executor.
// Only a fixed set of read-only / safe commands are permitted.
// All output is optionally compressed via RTK proxy before returning.
package tools

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/mekongmind/engine/internal/agents"
)

// DefaultBashTimeout is the maximum duration for a shell command.
const DefaultBashTimeout = 30 * time.Second

// allowedCommands is the whitelist of permitted base commands.
// Only the first token of the command string is checked.
var allowedCommands = map[string]bool{
	"ls":   true,
	"cat":  true,
	"grep": true,
	"git":  true,
	"go":   true,
	"find": true,
	"pwd":  true,
	"head": true,
	"tail": true,
	"wc":   true,
}

// ErrForbiddenCommand is returned when a command is not on the whitelist.
var ErrForbiddenCommand = errors.New("bash: command not in whitelist")

// BashTool executes whitelisted shell commands.
// Output is passed through the RTK proxy when available.
type BashTool struct {
	rtkProxy *RTKProxy
}

// NewBashTool creates a BashTool. rtkProxy may be nil (RTK unavailable).
func NewBashTool(rtkProxy *RTKProxy) *BashTool {
	return &BashTool{rtkProxy: rtkProxy}
}

// Execute runs the shell command in args and returns an Observation.
// stepID is used to correlate the observation with its parent step.
func (b *BashTool) Execute(ctx context.Context, stepID, args string) (agents.Observation, error) {
	baseCmd, err := extractBaseCommand(args)
	if err != nil {
		return agents.Observation{}, err
	}
	if !allowedCommands[baseCmd] {
		return agents.Observation{}, fmt.Errorf("%w: %q", ErrForbiddenCommand, baseCmd)
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, DefaultBashTimeout)
	defer cancel()

	// Split args into command + arguments.
	parts := strings.Fields(args)
	//nolint:gosec // args validated against whitelist above
	cmd := exec.CommandContext(timeoutCtx, parts[0], parts[1:]...)

	var out bytes.Buffer
	var errBuf bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &errBuf

	if runErr := cmd.Run(); runErr != nil {
		combined := out.String()
		if errBuf.Len() > 0 {
			combined += "\nstderr: " + errBuf.String()
		}
		return agents.Observation{
			StepID:    stepID,
			Content:   fmt.Sprintf("command failed: %v\n%s", runErr, combined),
			CreatedAt: time.Now().UTC(),
		}, nil // Return as observation, not fatal error
	}

	output := out.String()

	// Pass through RTK proxy if available.
	if b.rtkProxy != nil {
		compressed, rtkErr := b.rtkProxy.Compress(ctx, output)
		if rtkErr == nil {
			output = compressed
		}
		// RTK failure is non-fatal — use raw output.
	}

	return agents.Observation{
		StepID:    generateObsID(stepID),
		Content:   output,
		CreatedAt: time.Now().UTC(),
	}, nil
}

// Handler returns a tools.Handler closure suitable for registry.Register.
func (b *BashTool) Handler() Handler {
	return func(ctx context.Context, args string) (agents.Observation, error) {
		return b.Execute(ctx, uuid.New().String(), args)
	}
}

// extractBaseCommand returns the first token of the command string.
func extractBaseCommand(args string) (string, error) {
	trimmed := strings.TrimSpace(args)
	if trimmed == "" {
		return "", errors.New("bash: empty command")
	}
	fields := strings.Fields(trimmed)
	return fields[0], nil
}

// generateObsID creates a deterministic-looking observation ID from a step ID.
func generateObsID(stepID string) string {
	if stepID == "" {
		return uuid.New().String()
	}
	return "obs-" + stepID
}
