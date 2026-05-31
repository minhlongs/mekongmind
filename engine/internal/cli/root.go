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

// Package cli implements the cobra command tree for the mekong binary.
package cli

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/mekongmind/engine/internal/config"
	"github.com/mekongmind/engine/internal/health"
	"github.com/mekongmind/engine/internal/llm"
	"github.com/mekongmind/engine/internal/router"
)

// AppContext carries all initialised subsystems to CLI commands.
// Defined in cli package to prevent import cycles with bootstrap.
type AppContext struct {
	Config  *config.Config
	Router  *router.SmartRouter
	LLM     *llm.Client
	Health  *health.Checker
	// Version is the build-time version string injected via ldflags (bootstrap.Version).
	// Stored here to avoid a circular import: bootstrap→cli→bootstrap.
	Version string
}

// BuildRoot assembles the cobra root command with all subcommands wired.
func BuildRoot(ctx context.Context, ac *AppContext) *cobra.Command {
	root := &cobra.Command{
		Use:   "mekong",
		Short: "Mekong IDE — local-first agentic IDE on Apple Silicon",
		Long: `Mekong IDE routes prompts to local MLX models via a heuristic Smart Router.

Models:
  gemma    — Gemma 4 26B   (port 4001) — general queries, routing
  deepseek — DeepSeek R1   (port 4002) — reasoning, analysis
  qwen     — Qwen2.5-Coder (port 4003) — code generation, audit`,
		SilenceUsage:  true,
		SilenceErrors: true,
	}

	// Wire the version so `mekong --version` exits 0 and prints the tag.
	root.Version = ac.Version
	root.SetVersionTemplate("mekong-ide {{.Version}}\n")

	root.AddCommand(
		newChatCmd(ctx, ac),
		newHealthCmd(ctx, ac),
		newAgentCmd(ac),
		newCashclawCmd(ac),
		safetyCmd,
		newVersionCmd(ac.Version),
	)

	return root
}

// newVersionCmd returns the `mekong version` subcommand for structured output.
func newVersionCmd(version string) *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print version, repo URL, and license",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("mekong-ide %s\n", version)
			fmt.Printf("repo:    https://github.com/mekongmind/engine-core\n")
			fmt.Printf("license: Apache-2.0\n")
		},
	}
}
