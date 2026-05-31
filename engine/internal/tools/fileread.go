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

// Package tools — fileread.go: path-restricted file reader.
// Allowed roots: current working directory and ~/.mekong/.
// Rejects any absolute path outside those roots and any path with ".." traversal.
package tools

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/mekongmind/engine/internal/agents"
)

// maxFileBytes is the maximum file size read into memory (1 MB).
const maxFileBytes = 1 * 1024 * 1024

// ErrPathForbidden is returned when the path is outside allowed roots.
var ErrPathForbidden = errors.New("fileread: path outside allowed roots")

// FileReadTool reads files restricted to safe directories.
type FileReadTool struct {
	// allowedRoots contains the absolute canonical paths of permitted roots.
	allowedRoots []string
}

// canonicalRoot resolves a root path to its absolute, symlink-resolved form.
// Returns empty string on error (caller should skip).
func canonicalRoot(root string) string {
	abs, err := filepath.Abs(root)
	if err != nil {
		return ""
	}
	resolved, err := filepath.EvalSymlinks(abs)
	if err != nil {
		// Root may not exist yet (e.g. ~/.mekong before first run); fall back to Abs.
		return abs
	}
	return resolved
}

// NewFileReadTool creates a FileReadTool with the standard allowed roots:
// the current working directory and ~/.mekong/.
func NewFileReadTool() (*FileReadTool, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("fileread: getwd: %w", err)
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("fileread: user home: %w", err)
	}
	mekongDir := filepath.Join(home, ".mekong")
	return &FileReadTool{
		allowedRoots: []string{canonicalRoot(cwd), canonicalRoot(mekongDir)},
	}, nil
}

// NewFileReadToolWithRoots creates a FileReadTool with explicit allowed roots (for tests).
func NewFileReadToolWithRoots(roots []string) *FileReadTool {
	canonical := make([]string, 0, len(roots))
	for _, r := range roots {
		if c := canonicalRoot(r); c != "" {
			canonical = append(canonical, c)
		}
	}
	return &FileReadTool{allowedRoots: canonical}
}

// Read reads the file at path and returns its content as an Observation.
// Returns ErrPathForbidden if path resolves outside allowed roots.
func (f *FileReadTool) Read(ctx context.Context, stepID, path string) (agents.Observation, error) {
	_ = ctx // reserved for future async / streaming

	clean, err := f.validatePath(path)
	if err != nil {
		return agents.Observation{}, err
	}

	info, err := os.Stat(clean)
	if err != nil {
		return agents.Observation{}, fmt.Errorf("fileread: stat %s: %w", clean, err)
	}
	if info.Size() > maxFileBytes {
		return agents.Observation{}, fmt.Errorf("fileread: file too large (%d bytes, max %d)", info.Size(), maxFileBytes)
	}

	data, err := os.ReadFile(clean)
	if err != nil {
		return agents.Observation{}, fmt.Errorf("fileread: read %s: %w", clean, err)
	}

	return agents.Observation{
		StepID:    stepID,
		Content:   string(data),
		CreatedAt: time.Now().UTC(),
	}, nil
}

// Handler returns a tools.Handler closure suitable for registry.Register.
// args is treated as the file path.
func (f *FileReadTool) Handler() Handler {
	return func(ctx context.Context, args string) (agents.Observation, error) {
		return f.Read(ctx, uuid.New().String(), strings.TrimSpace(args))
	}
}

// validatePath resolves path to an absolute canonical path and checks it
// is inside one of the allowed roots.
func (f *FileReadTool) validatePath(path string) (string, error) {
	// Reject relative "up" traversal before resolution.
	if strings.Contains(path, "..") {
		return "", fmt.Errorf("%w: path contains '..'", ErrPathForbidden)
	}

	// Expand ~ shorthand.
	if strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("fileread: expand home: %w", err)
		}
		path = filepath.Join(home, path[2:])
	}

	abs, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("fileread: abs path: %w", err)
	}

	// Resolve symlinks so an in-root symlink pointing outside the root is caught.
	// EvalSymlinks also fails on non-existent paths, which we treat as forbidden.
	resolved, err := filepath.EvalSymlinks(abs)
	if err != nil {
		return "", fmt.Errorf("%w: symlink resolution failed for %s: %v", ErrPathForbidden, abs, err)
	}

	for _, root := range f.allowedRoots {
		// Ensure root ends with separator for prefix matching.
		rootWithSep := root
		if !strings.HasSuffix(root, string(filepath.Separator)) {
			rootWithSep = root + string(filepath.Separator)
		}
		if resolved == root || strings.HasPrefix(resolved, rootWithSep) {
			return resolved, nil
		}
	}

	return "", fmt.Errorf("%w: %s", ErrPathForbidden, resolved)
}
