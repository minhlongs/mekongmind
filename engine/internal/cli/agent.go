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

// Package cli — agent.go: real `mekong agent` subcommand.
// Replaces the Phase 1 stub. Wires AgentManager with all role implementations.
package cli

import (
	"fmt"
	"log"
	"os"

	"github.com/spf13/cobra"

	"github.com/mekongmind/engine/internal/agents"
	"github.com/mekongmind/engine/internal/agents/roles"
	"github.com/mekongmind/engine/internal/tools"
)

// newAgentCmd returns the real `mekong agent` command tree.
func newAgentCmd(ac *AppContext) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "agent",
		Short: "Run a multi-step agent session using the 4-step pipeline",
		Long: `The agent command starts a stateful reasoning session.

Pipeline: Architect (Gemma :4001) → Tools → Reasoner (DeepSeek :4002) → Auditor (Qwen :4003)

Roles:
  researcher  — uses Gemma 4 for planning and research tasks
  coder       — uses Qwen2.5-Coder for code generation
  analyzer    — uses DeepSeek R1 for chain-of-thought reasoning`,
	}

	cmd.AddCommand(
		newAgentRunCmd(ac),
		newAgentListCmd(ac),
		newAgentResumeCmd(ac),
	)
	return cmd
}

func newAgentRunCmd(ac *AppContext) *cobra.Command {
	var goal string
	var roleFlag string
	var dbPath string

	cmd := &cobra.Command{
		Use:   "run",
		Short: "Start a new agent session",
		Example: `  mekong agent run --goal "compute 2+2" --role researcher
  mekong agent run --goal "write a Go HTTP handler" --role coder`,
		RunE: func(cmd *cobra.Command, _ []string) error {
			if goal == "" {
				return fmt.Errorf("--goal is required")
			}

			role, err := agents.ParseRole(roleFlag)
			if err != nil {
				return err
			}

			mgr, err := buildManager(ac, dbPath)
			if err != nil {
				return err
			}
			defer mgr.Stop()

			ctx := cmd.Context()
			rec, err := mgr.StartSession(ctx, role, goal)
			if err != nil {
				return fmt.Errorf("agent run: %w", err)
			}
			fmt.Fprintf(os.Stdout, "Session %s completed (status=%s)\n", rec.ID, rec.Status)
			return nil
		},
	}

	cmd.Flags().StringVar(&goal, "goal", "", "Goal for the agent session (required)")
	cmd.Flags().StringVar(&roleFlag, "role", "researcher", "Agent role: researcher|coder|analyzer")
	cmd.Flags().StringVar(&dbPath, "db", "", "Path to BoltDB state file (default ~/.mekong/agents.db)")
	_ = cmd.MarkFlagRequired("goal")
	return cmd
}

func newAgentListCmd(ac *AppContext) *cobra.Command {
	var dbPath string

	cmd := &cobra.Command{
		Use:   "list",
		Short: "List in-progress sessions that can be resumed",
		RunE: func(cmd *cobra.Command, _ []string) error {
			mgr, err := buildManager(ac, dbPath)
			if err != nil {
				return err
			}
			defer mgr.Stop()

			sessions, err := mgr.Start(cmd.Context())
			if err != nil {
				return err
			}
			if len(sessions) == 0 {
				fmt.Println("No in-progress sessions.")
				return nil
			}
			for _, s := range sessions {
				fmt.Printf("  %s  role=%-12s  goal=%q\n", s.ID, s.AgentRole, s.Goal)
			}
			return nil
		},
	}
	cmd.Flags().StringVar(&dbPath, "db", "", "Path to BoltDB state file (default ~/.mekong/agents.db)")
	return cmd
}

func newAgentResumeCmd(ac *AppContext) *cobra.Command {
	var dbPath string

	cmd := &cobra.Command{
		Use:   "resume <session-id>",
		Short: "Resume an interrupted agent session",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			mgr, err := buildManager(ac, dbPath)
			if err != nil {
				return err
			}
			defer mgr.Stop()

			rec, err := mgr.ResumeSession(cmd.Context(), args[0])
			if err != nil {
				return fmt.Errorf("agent resume: %w", err)
			}
			fmt.Fprintf(os.Stdout, "Session %s completed (status=%s)\n", rec.ID, rec.Status)
			return nil
		},
	}
	cmd.Flags().StringVar(&dbPath, "db", "", "Path to BoltDB state file (default ~/.mekong/agents.db)")
	return cmd
}

// buildManager constructs an AgentManager wired with all role implementations.
// guard is nil (kill-switch requires dylib — tolerated gracefully per spec).
func buildManager(ac *AppContext, dbPath string) (*agents.AgentManager, error) {
	rtkProxy := tools.NewRTKProxy()

	bashTool := tools.NewBashTool(rtkProxy)
	fileReadTool, err := tools.NewFileReadTool()
	if err != nil {
		log.Printf("agent: fileread tool init warning: %v", err)
		fileReadTool = tools.NewFileReadToolWithRoots([]string{"."})
	}

	reg := tools.NewRegistry()
	reg.Register("bash", bashTool.Handler())
	reg.Register("fileread", fileReadTool.Handler())
	_ = reg // registry available for future tool-dispatching agents

	agentList := []agents.Agent{
		roles.NewArchitect(ac.LLM),
		roles.NewCoder(ac.LLM),
		roles.NewReasoner(ac.LLM),
	}

	// guard is nil — dylib not required at CLI layer. Pipeline logs warning.
	return agents.NewAgentManager(dbPath, nil, agentList)
}
