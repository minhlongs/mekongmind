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

// Package tools — rtk_proxy.go: RTK subprocess wrapper for token compression.
// RTK (Rust CLI) compresses shell/tool output before it enters the LLM context.
// Falls back to a noop pass-through if the binary is not found in PATH.
package tools

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"sync"
)

// ErrRTKNotFound is returned when the rtk binary is not in PATH.
var ErrRTKNotFound = errors.New("rtk: binary not found in PATH")

// RTKProxy wraps the rtk CLI binary for token compression.
// It detects binary availability once at construction time.
// All methods are safe for concurrent use.
type RTKProxy struct {
	binaryPath string // empty when unavailable
	once       sync.Once
	warnLogged bool
}

// NewRTKProxy detects the rtk binary and returns an RTKProxy.
// If rtk is not found, the proxy operates in noop mode — callers receive
// the original text unchanged and no error is returned from Compress.
// A one-time warning is logged when noop mode activates.
func NewRTKProxy() *RTKProxy {
	p := &RTKProxy{}
	p.once.Do(func() {
		path, err := exec.LookPath("rtk")
		if err != nil {
			// Binary not found — noop mode.
			log.Println("rtk_proxy: warning — rtk binary not found in PATH, token compression disabled")
			p.warnLogged = true
			return
		}
		p.binaryPath = path
		log.Printf("rtk_proxy: using rtk at %s", path)
	})
	return p
}

// IsAvailable returns true if the rtk binary was found.
func (p *RTKProxy) IsAvailable() bool {
	return p.binaryPath != ""
}

// Compress passes text through the rtk compress subcommand and returns the
// compressed output. If rtk is unavailable, returns text unchanged (noop).
// ctx is used for subprocess timeout.
func (p *RTKProxy) Compress(ctx context.Context, text string) (string, error) {
	if !p.IsAvailable() {
		// Noop — warning already logged at construction time.
		return text, nil
	}

	cmd := exec.CommandContext(ctx, p.binaryPath, "compress") //nolint:gosec
	cmd.Stdin = strings.NewReader(text)

	var out bytes.Buffer
	var errBuf bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &errBuf

	if err := cmd.Run(); err != nil {
		return text, fmt.Errorf("rtk: compress failed: %w (stderr: %s)", err, errBuf.String())
	}

	compressed := out.String()
	// Log compression ratio for observability.
	if len(text) > 0 {
		ratio := float64(len(compressed)) / float64(len(text))
		log.Printf("rtk_proxy: compressed %d → %d bytes (ratio %.2f)", len(text), len(compressed), ratio)
	}
	return compressed, nil
}
