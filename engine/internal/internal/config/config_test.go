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

package config_test

import (
	"os"
	"testing"

	"github.com/mekongmind/engine/internal/config"
)

func TestDefaultConfig(t *testing.T) {
	cfg := config.DefaultConfig()

	if cfg.LLMHost != "127.0.0.1" {
		t.Errorf("expected LLMHost=127.0.0.1, got %s", cfg.LLMHost)
	}
	if cfg.RouterPort != 4001 {
		t.Errorf("expected RouterPort=4001, got %d", cfg.RouterPort)
	}
	if cfg.ReasoningPort != 4002 {
		t.Errorf("expected ReasoningPort=4002, got %d", cfg.ReasoningPort)
	}
	if cfg.AuditPort != 4003 {
		t.Errorf("expected AuditPort=4003, got %d", cfg.AuditPort)
	}
	if cfg.MaxContextTokens != 8192 {
		t.Errorf("expected MaxContextTokens=8192, got %d", cfg.MaxContextTokens)
	}
}

func TestLoadDefaults(t *testing.T) {
	// Point HOME to a temp dir with no config file — should use defaults.
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Load() unexpected error: %v", err)
	}

	if cfg.RouterPort != 4001 {
		t.Errorf("expected default RouterPort=4001, got %d", cfg.RouterPort)
	}
}

func TestLoadEnvOverride(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)
	t.Setenv("ROUTER_PORT", "5001")
	t.Setenv("LLM_HOST", "192.168.1.10")
	defer os.Unsetenv("ROUTER_PORT")
	defer os.Unsetenv("LLM_HOST")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Load() unexpected error: %v", err)
	}

	if cfg.RouterPort != 5001 {
		t.Errorf("expected RouterPort=5001 from env, got %d", cfg.RouterPort)
	}
	if cfg.LLMHost != "192.168.1.10" {
		t.Errorf("expected LLMHost=192.168.1.10 from env, got %s", cfg.LLMHost)
	}
}

func TestValidateInvalidPort(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)
	t.Setenv("ROUTER_PORT", "99999")
	defer os.Unsetenv("ROUTER_PORT")

	_, err := config.Load()
	if err == nil {
		t.Error("expected error for invalid port 99999, got nil")
	}
}
