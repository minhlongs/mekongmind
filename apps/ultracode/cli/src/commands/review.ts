import { Command } from "commander";
import chalk from "chalk";
import { apiFetch } from "../utils/api.js";

interface ReviewRow {
  id: string;
  repo: string;
  status: string;
  findings_count: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export function reviewCommand(): Command {
  const cmd = new Command("review");
  cmd.description("Run and inspect code reviews");

  cmd
    .command("run <owner/repo>")
    .description("Trigger a code review for a repo")
    .option("--pr <number>", "Pull request number", undefined)
    .action(async (fullName: string, opts: { pr?: string }) => {
      const [owner, repo] = fullName.split("/");
      if (!owner || !repo) {
        console.log(chalk.red("Usage: ultracode review run <owner/repo>"));
        process.exitCode = 1;
        return;
      }
      const body: Record<string, unknown> = {};
      if (opts.pr) body.pull_number = Number(opts.pr);

      const result = await apiFetch<{ jobId: string; status: string }>(
        `/api/repos/${owner}/${repo}/review/trigger`,
        { method: "POST", body: JSON.stringify(body) },
      );
      if (!result.ok || !result.data) {
        console.log(chalk.red(`Failed to trigger review: ${result.error}`));
        process.exitCode = 1;
        return;
      }
      console.log(chalk.green("Review triggered."));
      console.log(chalk.gray(`  jobId: ${result.data.jobId}`));
      console.log(`  Watch: ultracode review status ${result.data.jobId}`);
      if (result.data.status) console.log(`  Status: ${result.data.status}`);
    });

  cmd
    .command("status <reviewId>")
    .description("Get review status + findings summary")
    .action(async (reviewId: string) => {
      const result = await apiFetch<ReviewRow>(`/api/reviews/${reviewId}`);
      if (!result.ok || !result.data) {
        console.log(chalk.red(`Not found: ${result.error}`));
        process.exitCode = 1;
        return;
      }
      const r = result.data;
      console.log(chalk.bold(`Review: ${r.id.slice(0, 8)}`));
      console.log(`  Repo:    ${chalk.cyan(r.repo)}`);
      console.log(`  Status:  ${chalk.cyan(r.status)}`);
      console.log(`  Findings: ${r.findings_count ?? 0}`);
      if (r.started_at) console.log(`  Started:  ${r.started_at}`);
      if (r.completed_at) console.log(`  Completed: ${r.completed_at}`);
    });

  return cmd;
}
