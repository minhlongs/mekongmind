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

// Package bootstrap wires all Mekong IDE subsystems together and exposes Run()
// as the single entry point called by main.go.
package bootstrap

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/mekongmind/engine/internal/cli"
	"github.com/mekongmind/engine/internal/config"
	"github.com/mekongmind/engine/internal/health"
	"github.com/mekongmind/engine/internal/llm"
	"github.com/mekongmind/engine/internal/router"
)

// Version is set at build time via -ldflags; defaults to "dev".
var Version = "dev"

// Run is the single entry point: loads config, wires subsystems, executes cobra.
// args are CLI arguments (typically os.Args[1:]).
func Run(ctx context.Context, args []string) error {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "mekong: config error: %v\n", err)
		return err
	}

	logger := initLogger(cfg.LogLevel)
	logger.Info("mekong starting", "version", Version, "llm_host", cfg.LLMHost)

	reg := router.NewRegistry(cfg.RouterPort, cfg.ReasoningPort, cfg.AuditPort)
	smartRouter := router.NewSmartRouter(reg)
	llmClient := llm.NewClient(cfg.LLMHost, 0) // 0 → DefaultTimeoutSecs
	healthChecker := health.NewChecker(reg)

	ac := &cli.AppContext{
		Config:  cfg,
		Router:  smartRouter,
		LLM:     llmClient,
		Health:  healthChecker,
		Version: Version,
	}

	rootCmd := cli.BuildRoot(ctx, ac)
	rootCmd.SetArgs(args)
	return rootCmd.Execute()
}

// initLogger creates a JSON slog.Logger at the requested level.
// Unknown levels fall back to info.
func initLogger(level string) *slog.Logger {
	var lvl slog.Level
	switch level {
	case "debug":
		lvl = slog.LevelDebug
	case "warn":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		lvl = slog.LevelInfo
	}
	h := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: lvl})
	return slog.New(h)
}
