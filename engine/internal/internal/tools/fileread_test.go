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
	"os"
	"path/filepath"
	"testing"

	"github.com/mekongmind/engine/internal/tools"
)

func TestFileReadTool_AllowedPath(t *testing.T) {
	tmpDir := t.TempDir()
	file := filepath.Join(tmpDir, "test.txt")
	if err := os.WriteFile(file, []byte("hello mekong"), 0600); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})
	obs, err := frt.Read(context.Background(), "step-1", file)
	if err != nil {
		t.Fatalf("Read allowed path: %v", err)
	}
	if obs.Content != "hello mekong" {
		t.Errorf("Content = %q, want %q", obs.Content, "hello mekong")
	}
}

func TestFileReadTool_ForbiddenAbsolutePath(t *testing.T) {
	tmpDir := t.TempDir()
	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})

	// /etc/passwd is outside the allowed root
	_, err := frt.Read(context.Background(), "step-2", "/etc/passwd")
	if err == nil {
		t.Fatal("expected error for forbidden path")
	}
	if !errors.Is(err, tools.ErrPathForbidden) {
		t.Errorf("error %v should be ErrPathForbidden", err)
	}
}

func TestFileReadTool_TraversalRejected(t *testing.T) {
	tmpDir := t.TempDir()
	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})

	_, err := frt.Read(context.Background(), "step-3", tmpDir+"/../../etc/passwd")
	if err == nil {
		t.Fatal("expected error for path traversal")
	}
	if !errors.Is(err, tools.ErrPathForbidden) {
		t.Errorf("error %v should be ErrPathForbidden", err)
	}
}

func TestFileReadTool_MissingFile(t *testing.T) {
	tmpDir := t.TempDir()
	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})

	_, err := frt.Read(context.Background(), "step-4", filepath.Join(tmpDir, "nonexistent.txt"))
	if err == nil {
		t.Fatal("expected error for missing file")
	}
}

// TestFileReadTool_SymlinkOutsideCWD verifies that a symlink inside the allowed
// root that points to a file outside the root is rejected (symlink-traversal).
func TestFileReadTool_SymlinkOutsideCWD(t *testing.T) {
	tmpDir := t.TempDir()
	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})

	// Create a symlink inside tmpDir pointing to /etc/passwd (outside root).
	// Skip on systems where /etc/passwd does not exist (e.g. some CI containers).
	target := "/etc/passwd"
	if _, err := os.Stat(target); err != nil {
		t.Skipf("skipping: %s not found: %v", target, err)
	}
	link := filepath.Join(tmpDir, "evil.txt")
	if err := os.Symlink(target, link); err != nil {
		t.Fatalf("Symlink: %v", err)
	}

	_, err := frt.Read(context.Background(), "step-sym-out", link)
	if err == nil {
		t.Fatal("expected ErrPathForbidden for symlink pointing outside root")
	}
	if !errors.Is(err, tools.ErrPathForbidden) {
		t.Errorf("error %v should be ErrPathForbidden", err)
	}
}

// TestFileReadTool_SymlinkInsideCWD verifies that a symlink pointing to a real
// file inside the allowed root is resolved and read successfully.
func TestFileReadTool_SymlinkInsideCWD(t *testing.T) {
	tmpDir := t.TempDir()
	realFile := filepath.Join(tmpDir, "real.txt")
	if err := os.WriteFile(realFile, []byte("real content"), 0600); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	link := filepath.Join(tmpDir, "link.txt")
	if err := os.Symlink(realFile, link); err != nil {
		t.Fatalf("Symlink: %v", err)
	}

	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})
	obs, err := frt.Read(context.Background(), "step-sym-in", link)
	if err != nil {
		t.Fatalf("expected success for symlink inside root: %v", err)
	}
	if obs.Content != "real content" {
		t.Errorf("Content = %q, want %q", obs.Content, "real content")
	}
}

// TestFileReadTool_NonExistentFile verifies that reading a non-existent file
// returns an error (EvalSymlinks also fails on missing paths).
func TestFileReadTool_NonExistentFile(t *testing.T) {
	tmpDir := t.TempDir()
	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})

	_, err := frt.Read(context.Background(), "step-noexist", filepath.Join(tmpDir, "ghost.txt"))
	if err == nil {
		t.Fatal("expected error for non-existent file")
	}
}

// TestFileReadTool_BrokenSymlink verifies that a broken symlink (dangling)
// inside the allowed root is rejected — EvalSymlinks fails on dangling symlinks.
func TestFileReadTool_BrokenSymlink(t *testing.T) {
	tmpDir := t.TempDir()
	// Create a symlink to a path that does not exist.
	link := filepath.Join(tmpDir, "broken.txt")
	if err := os.Symlink(filepath.Join(tmpDir, "nonexistent_target.txt"), link); err != nil {
		t.Fatalf("Symlink: %v", err)
	}

	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})
	_, err := frt.Read(context.Background(), "step-broken-sym", link)
	if err == nil {
		t.Fatal("expected error for broken symlink")
	}
	if !errors.Is(err, tools.ErrPathForbidden) {
		t.Errorf("error %v should be ErrPathForbidden", err)
	}
}

func TestFileReadTool_HandlerIntegration(t *testing.T) {
	tmpDir := t.TempDir()
	file := filepath.Join(tmpDir, "handler-test.txt")
	if err := os.WriteFile(file, []byte("handler content"), 0600); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	frt := tools.NewFileReadToolWithRoots([]string{tmpDir})
	h := frt.Handler()
	obs, err := h(context.Background(), file)
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if obs.Content != "handler content" {
		t.Errorf("Content = %q, want handler content", obs.Content)
	}
}
