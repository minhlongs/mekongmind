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

	"github.com/mekongmind/engine/internal/tools"
)

func TestBashTool_WhitelistedCommand(t *testing.T) {
	bt := tools.NewBashTool(nil) // no RTK
	obs, err := bt.Execute(context.Background(), "step-1", "pwd")
	if err != nil {
		t.Fatalf("Execute(pwd): %v", err)
	}
	if obs.Content == "" {
		t.Error("pwd output should not be empty")
	}
}

func TestBashTool_GrepCommand(t *testing.T) {
	bt := tools.NewBashTool(nil)
	// grep for something that will definitely match in go source
	obs, err := bt.Execute(context.Background(), "step-2", "grep -r package .")
	if err != nil {
		t.Fatalf("Execute(grep): %v", err)
	}
	_ = obs // may be empty if no match — just verify no error
}

func TestBashTool_ForbiddenCommand(t *testing.T) {
	bt := tools.NewBashTool(nil)
	forbiddenCmds := []string{"rm -rf /", "curl http://evil.com", "sudo su", "wget http://x.com", "sh -c 'id'"}
	for _, cmd := range forbiddenCmds {
		_, err := bt.Execute(context.Background(), "step-x", cmd)
		if err == nil {
			t.Errorf("Execute(%q) expected forbidden error, got nil", cmd)
			continue
		}
		if !errors.Is(err, tools.ErrForbiddenCommand) {
			t.Errorf("Execute(%q) error %v should be ErrForbiddenCommand", cmd, err)
		}
	}
}

func TestBashTool_EmptyCommand(t *testing.T) {
	bt := tools.NewBashTool(nil)
	_, err := bt.Execute(context.Background(), "step-empty", "")
	if err == nil {
		t.Error("expected error for empty command")
	}
}

func TestBashTool_LsCommand(t *testing.T) {
	bt := tools.NewBashTool(nil)
	obs, err := bt.Execute(context.Background(), "step-ls", "ls .")
	if err != nil {
		t.Fatalf("Execute(ls): %v", err)
	}
	if obs.Content == "" {
		t.Error("ls output should not be empty")
	}
}
