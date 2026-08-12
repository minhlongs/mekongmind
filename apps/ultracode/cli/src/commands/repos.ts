import { Command } from "commander";
import chalk from "chalk";
import { apiFetch } from "../utils/api.js";

interface RepoRow {
  id: string;
  full_name: string;
}

export function reposCommand(): Command {
  const cmd = new Command("repos");
  cmd.description("Manage registered repositories");

  cmd
    .command("list")
    .description("List repos registered to your account")
    .action(async () => {
      const result = await apiFetch<RepoRow[]>("/api/repos/register");
      if (!result.ok || !result.data) {
        console.log(chalk.red(`Failed: ${result.error}`));
        process.exitCode = 1;
        return;
      }
      if (result.data.length === 0) {
        console.log(chalk.yellow("No repos registered."));
        return;
      }
      for (const r of result.data) {
        console.log(`  ${chalk.cyan(r.full_name)}  ${chalk.gray(`id=${r.id.slice(0, 8)}`)}`);
      }
      console.log(chalk.gray(`\nTotal: ${result.data.length} repo(s)`));
    });

  cmd
    .command("add <owner/repo>")
    .description("Register a GitHub repo (e.g. octocat/hello-world)")
    .action(async (fullName: string) => {
      const [owner, repo] = fullName.split("/");
      if (!owner || !repo) {
        console.log(chalk.red("Usage: ultracode repos add <owner/repo>"));
        process.exitCode = 1;
        return;
      }
      const result = await apiFetch<RepoRow>("/api/repos/register", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, owner, repo }),
      });
      if (!result.ok || !result.data) {
        console.log(chalk.red(`Failed to add: ${result.error}`));
        process.exitCode = 1;
        return;
      }
      console.log(chalk.green(`Added: ${result.data.full_name}`));
    });

  return cmd;
}
