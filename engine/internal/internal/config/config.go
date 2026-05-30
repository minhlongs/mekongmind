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

// Package config loads and validates Mekong IDE configuration.
// Reads from ~/.mekong/config.yaml, with env var overrides.
package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// Config holds all runtime configuration for the mekong CLI.
type Config struct {
	// LLMHost is the hostname where MLX servers run (default: 127.0.0.1).
	LLMHost string `mapstructure:"llm_host"`

	// RouterPort is the port for Gemma 4 (architect/router), default 4001.
	RouterPort int `mapstructure:"router_port"`

	// ReasoningPort is the port for DeepSeek R1, default 4002.
	ReasoningPort int `mapstructure:"reasoning_port"`

	// AuditPort is the port for Qwen Coder (audit), default 4003.
	AuditPort int `mapstructure:"audit_port"`

	// MaxContextTokens caps prompt size before sending to LLM, default 8192.
	MaxContextTokens int `mapstructure:"max_context_tokens"`

	// LogLevel controls slog verbosity (debug|info|warn|error).
	LogLevel string `mapstructure:"log_level"`

	// KronosPort is the port for the Kronos FastAPI prediction service (default 5001).
	KronosPort int `mapstructure:"kronos_port"`

	// MT5BridgePort is reserved for a future MT5 bridge (default 5002, deferred).
	MT5BridgePort int `mapstructure:"mt5_bridge_port"`
}

// DefaultConfig returns a Config with sensible defaults matching engine-farm/config.env.
func DefaultConfig() *Config {
	return &Config{
		LLMHost:          "127.0.0.1",
		RouterPort:       4001,
		ReasoningPort:    4002,
		AuditPort:        4003,
		MaxContextTokens: 8192,
		LogLevel:         "info",
		KronosPort:       5001,
		MT5BridgePort:    5002,
	}
}

// Load reads config from ~/.mekong/config.yaml and applies env var overrides.
// Missing config file is not an error — defaults are used.
// Env var precedence: LLM_HOST, ROUTER_PORT, REASONING_PORT, AUDIT_PORT, MAX_CONTEXT_TOKENS.
func Load() (*Config, error) {
	v := viper.New()

	// Set defaults
	cfg := DefaultConfig()
	v.SetDefault("llm_host", cfg.LLMHost)
	v.SetDefault("router_port", cfg.RouterPort)
	v.SetDefault("reasoning_port", cfg.ReasoningPort)
	v.SetDefault("audit_port", cfg.AuditPort)
	v.SetDefault("max_context_tokens", cfg.MaxContextTokens)
	v.SetDefault("log_level", cfg.LogLevel)
	v.SetDefault("kronos_port", cfg.KronosPort)
	v.SetDefault("mt5_bridge_port", cfg.MT5BridgePort)

	// Config file location
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("cannot determine home dir: %w", err)
	}
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(filepath.Join(home, ".mekong"))

	// Read config file — ignore if absent
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	// Env var overrides (exact names from spec)
	v.MustBindEnv("llm_host", "LLM_HOST")
	v.MustBindEnv("router_port", "ROUTER_PORT")
	v.MustBindEnv("reasoning_port", "REASONING_PORT")
	v.MustBindEnv("audit_port", "AUDIT_PORT")
	v.MustBindEnv("max_context_tokens", "MAX_CONTEXT_TOKENS")
	v.MustBindEnv("kronos_port", "KRONOS_PORT")
	v.MustBindEnv("mt5_bridge_port", "MT5_BRIDGE_PORT")

	var result Config
	if err := v.Unmarshal(&result); err != nil {
		return nil, fmt.Errorf("error unmarshalling config: %w", err)
	}

	if err := result.validate(); err != nil {
		return nil, err
	}

	return &result, nil
}

// validate checks that port values are within valid TCP range.
func (c *Config) validate() error {
	for name, port := range map[string]int{
		"router_port":    c.RouterPort,
		"reasoning_port": c.ReasoningPort,
		"audit_port":     c.AuditPort,
		"kronos_port":    c.KronosPort,
		"mt5_bridge_port": c.MT5BridgePort,
	} {
		if port < 1 || port > 65535 {
			return fmt.Errorf("config: %s must be 1-65535, got %d", name, port)
		}
	}
	if c.MaxContextTokens < 256 {
		return fmt.Errorf("config: max_context_tokens must be >= 256, got %d", c.MaxContextTokens)
	}
	return nil
}
