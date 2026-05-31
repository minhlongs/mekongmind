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

package cli

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"github.com/mekongmind/engine/internal/llm"
	"github.com/mekongmind/engine/internal/router"
)

// newChatCmd builds the `mekong chat` subcommand.
func newChatCmd(ctx context.Context, ac *AppContext) *cobra.Command {
	var forceModel string

	cmd := &cobra.Command{
		Use:   "chat <prompt>",
		Short: "Send a prompt to the Smart Router and print the response",
		Long: `Route a prompt through the heuristic Smart Router to the best local MLX model.

The router picks:
  qwen     — when code markers are detected (backticks, keywords like "implement")
  deepseek — when reasoning keywords are detected ("why", "explain", "analyze")
  gemma    — default for general queries`,
		Example: `  mekong chat "write a Go HTTP server"
  mekong chat --force-model=deepseek "explain why channels are better than mutexes"
  mekong chat --force-model=gemma "hello"`,
		Args: cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runChat(ctx, ac, strings.Join(args, " "), forceModel)
		},
	}

	cmd.Flags().StringVar(&forceModel, "force-model", "",
		"Override Smart Router: gemma|deepseek|qwen")

	return cmd
}

// runChat executes: route prompt → call LLM → print response.
func runChat(ctx context.Context, ac *AppContext, prompt, forceModel string) error {
	r := ac.Router

	if forceModel != "" {
		name, ok := router.ParseModelName(forceModel)
		if !ok {
			return fmt.Errorf("unknown model %q — valid options: gemma, deepseek, qwen", forceModel)
		}
		r = r.WithForceModel(name)
	}

	result := r.Route(prompt)
	// Print routing decision to stderr so stdout stays clean for piping.
	fmt.Fprintf(os.Stderr, "[mekong] routing to %s (port %d) — %s\n",
		result.Endpoint.Name, result.Endpoint.Port, result.Reason)

	messages := []llm.Message{
		{Role: "user", Content: prompt},
	}

	resp, err := ac.LLM.ChatCompletion(ctx, result.Endpoint.Port, messages)
	if err != nil {
		return fmt.Errorf("chat: LLM error: %w", err)
	}

	content := llm.FirstContent(resp)
	if content == "" {
		return fmt.Errorf("chat: empty response from %s", result.Endpoint.Name)
	}

	fmt.Println(content)
	return nil
}
