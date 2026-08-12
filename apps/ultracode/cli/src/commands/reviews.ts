import { Command } from "commander";
import chalk from "chalk";
import { apiFetch } from "../utils/api.js";

interface ReviewsListRow {
  id: string;
  repo: string;
  status: string;
  findingsCount: number;
  startedAt: string | null;
}

export function reviewsCommand(): Command {
  const cmd = new Command("reviews");
  cmd.description("List recent reviews");

  cmd
    .command("list")
    .description("List recent reviews for your account")
    .option("--repo <owner/repo>", "Filter by repo")
    .option("--status <status>", "Filter by status: pending|in_progress|completed|failed")
    .option("--json", "Output raw JSON (CI-friendly)")
    .option("--limit <n>", "Max results", "20")
    .action(async (opts: { repo?: string; status?: string; json?: boolean; limit?: string }) => {
      const params = new URLSearchParams();
      if (opts.repo) params.set("repo", opts.repo);
      if (opts.status) params.set("status", opts.status);
      const qs = params.toString();

      const result = await apiFetch<{ reviews: ReviewsListRow[] }>(`/api/reviews${qs ? `?${qs}` : ""}`);
      if (!result.ok || !result.data) {
        console.log(chalk.red(`Failed: ${result.error}`));
        process.exitCode = 1;
        return;
      }

      const rows = result.data.reviews ?? [];
      const limit = Math.min(Number(opts.limit ?? 20), 100);
      const sliced = rows.slice(0, limit);

      if (opts.json) {
        console.log(JSON.stringify(sliced, null, 2));
        return;
      }

      if (sliced.length === 0) {
        console.log(chalk.yellow("No reviews found."));
        return;
      }

      console.log(chalk.bold(`${"ID".padEnd(10)} ${"Repo".padEnd(30)} ${"Status".padEnd(14)} Findings`));
      console.log(chalk.gray("─".repeat(70)));
      for (const r of sliced) {
        const id = r.id.slice(0, 8);
        const repo = r.repo.padEnd(30).slice(0, 30);
        const status = r.status.padEnd(14).slice(0, 14);
        const color =
          r.status === "completed" ? chalk.green :
          r.status === "failed" ? chalk.red :
          r.status === "in_progress" ? chalk.cyan : chalk.gray;
        console.log(`${id.padEnd(10)} ${repo} ${color(status)} ${r.findingsCount}`);
      }
      console.log(chalk.gray(`\nShowing ${sliced.length} of ${rows.length} total`));
    });

  return cmd;
}
