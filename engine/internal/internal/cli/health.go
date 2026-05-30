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

	"github.com/spf13/cobra"

	"github.com/mekongmind/engine/internal/health"
)

// newHealthCmd builds the `mekong health` subcommand.
func newHealthCmd(ctx context.Context, ac *AppContext) *cobra.Command {
	return &cobra.Command{
		Use:   "health",
		Short: "Probe all three MLX endpoints and report up/down status",
		Long: `Sends a GET /v1/models request to each MLX server in parallel (2s timeout).
Exits 0 if all endpoints are up, 1 if any are down.`,
		Example: `  mekong health`,
		Args:    cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runHealth(ctx, ac)
		},
	}
}

// runHealth probes all endpoints, prints a status table, exits 1 if any are down.
func runHealth(ctx context.Context, ac *AppContext) error {
	statuses := ac.Health.CheckAll(ctx)

	fmt.Println("MLX Endpoint Health")
	fmt.Println("-------------------")

	allUp := true
	for _, s := range statuses {
		status := statusIcon(s.Up)
		latency := ""
		if s.Up {
			latency = fmt.Sprintf(" (%dms)", s.Latency.Milliseconds())
		} else {
			latency = fmt.Sprintf(" — %s", s.Error)
		}
		fmt.Printf("  %s  %-12s port %d%s\n",
			status, s.Endpoint.Name, s.Endpoint.Port, latency)
		if !s.Up {
			allUp = false
		}
	}

	fmt.Println()
	if allUp {
		fmt.Println("All endpoints UP")
		return nil
	}
	return fmt.Errorf("one or more endpoints are DOWN")
}

// statusIcon returns a short text indicator for terminal output.
func statusIcon(up bool) string {
	if up {
		return "UP  "
	}
	return "DOWN"
}

// formatHealthReport produces a one-line summary for use in other commands.
func formatHealthReport(statuses []health.EndpointStatus) string {
	up, down := 0, 0
	for _, s := range statuses {
		if s.Up {
			up++
		} else {
			down++
		}
	}
	return fmt.Sprintf("%d/%d endpoints up", up, up+down)
}
