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

// Package cli — cashclaw.go: `mekong cashclaw` subcommand tree.
// Provides `predict` and `fairvalue` subcommands for financial analysis.
// Outputs include mandatory legal disclaimer. No BUY/SELL/HOLD recommendations.
package cli

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"

	"github.com/spf13/cobra"

	"github.com/mekongmind/engine/internal/cashclaw"
	"github.com/mekongmind/engine/internal/cashclaw/datasources"
	"github.com/mekongmind/engine/internal/llm"
)

// newCashclawCmd builds the `mekong cashclaw` command with subcommands.
func newCashclawCmd(ac *AppContext) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "cashclaw",
		Short: "CashClaw financial analysis — Kronos forecast + DeepSeek R1 reasoning",
		Long: `CashClaw provides educational price forecasting and fair value estimation.

DISCLAIMER: Output is NOT financial advice. Educational/research use only.
Always consult a licensed financial advisor before making investment decisions.`,
	}

	cmd.AddCommand(
		newPredictCmd(ac),
		newFairvalueCmd(ac),
	)

	return cmd
}

// newPredictCmd builds `mekong cashclaw predict --symbol VNM --horizon 5`.
func newPredictCmd(ac *AppContext) *cobra.Command {
	var symbol string
	var horizon int

	cmd := &cobra.Command{
		Use:   "predict",
		Short: "Forecast future OHLCV bars using Kronos time-series model",
		Example: "  mekong cashclaw predict --symbol VNM --horizon 5",
		RunE: func(cmd *cobra.Command, _ []string) error {
			ctx := cmd.Context()

			kronosURL := fmt.Sprintf("http://%s:%d", ac.Config.LLMHost, ac.Config.KronosPort)
			vnstockURL := fmt.Sprintf("http://127.0.0.1:5010") // vnstock-mcp HTTP proxy

			vs := datasources.NewVnstockClient(vnstockURL, nil)
			kr := cashclaw.NewKronosPredictor(kronosURL, nil)

			ohlcv, err := vs.GetOHLCV(ctx, symbol, 90)
			if err != nil {
				return fmt.Errorf("predict: fetch OHLCV: %w", err)
			}

			pred, err := kr.Predict(ctx, symbol, ohlcv, horizon)
			if err != nil {
				return fmt.Errorf("predict: Kronos forecast: %w", err)
			}

			// Print disclaimer first.
			fmt.Fprintln(os.Stderr, "[DISCLAIMER] "+cashclaw.FairValueDisclaimer)
			fmt.Println()

			// Output forecast as JSON.
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(pred)
		},
	}

	cmd.Flags().StringVar(&symbol, "symbol", "VNM", "Stock ticker symbol (e.g. VNM, FPT, VCB)")
	cmd.Flags().IntVar(&horizon, "horizon", 5, "Number of future periods to forecast (1-30)")
	_ = cmd.MarkFlagRequired("symbol")

	return cmd
}

// newFairvalueCmd builds `mekong cashclaw fairvalue --symbol VNM`.
func newFairvalueCmd(ac *AppContext) *cobra.Command {
	var symbol string
	var horizon int
	var jsonOut bool

	cmd := &cobra.Command{
		Use:   "fairvalue",
		Short: "Estimate fair value price using Kronos + DeepSeek R1 reasoning",
		Example: "  mekong cashclaw fairvalue --symbol VNM",
		RunE: func(cmd *cobra.Command, _ []string) error {
			ctx := cmd.Context()

			kronosURL := fmt.Sprintf("http://%s:%d", ac.Config.LLMHost, ac.Config.KronosPort)
			vnstockURL := fmt.Sprintf("http://127.0.0.1:5010")

			vs := datasources.NewVnstockClient(vnstockURL, nil)
			kr := cashclaw.NewKronosPredictor(kronosURL, nil)
			lc := llm.NewClient(ac.Config.LLMHost, 30)

			calc := cashclaw.NewFairValueCalculator(vs, kr, lc, ac.Config.ReasoningPort)
			fv, err := calc.Calculate(ctx, symbol, horizon)
			if err != nil {
				return fmt.Errorf("fairvalue: %w", err)
			}

			if jsonOut {
				enc := json.NewEncoder(os.Stdout)
				enc.SetIndent("", "  ")
				return enc.Encode(fv)
			}

			// Human-readable output.
			fmt.Println("=== CashClaw Fair Value Report ===")
			fmt.Printf("Symbol:          %s\n", fv.Symbol)
			fmt.Printf("Estimated Price: %.2f\n", fv.EstimatedPrice)
			fmt.Printf("Confidence:      %.0f%%\n", fv.Confidence*100)
			fmt.Println()
			fmt.Println("--- Reasoning ---")
			fmt.Println(fv.ReasoningText)
			fmt.Println()
			fmt.Println("--- Forecast (Kronos) ---")
			for _, fc := range fv.Forecast {
				fmt.Printf("  Period +%s: O=%.2f H=%.2f L=%.2f C=%.2f\n",
					strconv.Itoa(fc.Period),
					fc.Open, fc.High, fc.Low, fc.Close)
			}
			fmt.Println()
			fmt.Printf("[DISCLAIMER] %s\n", fv.Disclaimer)

			return nil
		},
	}

	cmd.Flags().StringVar(&symbol, "symbol", "VNM", "Stock ticker symbol")
	cmd.Flags().IntVar(&horizon, "horizon", 5, "Forecast horizon in periods")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "Output as JSON")
	_ = cmd.MarkFlagRequired("symbol")

	return cmd
}
