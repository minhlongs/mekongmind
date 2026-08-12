import { Command } from "commander";
import chalk from "chalk";
import { setSessionToken, clearSessionToken, loadConfig, configPath } from "../utils/config.js";
import { apiFetch } from "../utils/api.js";

export function authCommand(): Command {
  const cmd = new Command("auth");
  cmd.description("Manage authentication");

  cmd
    .command("login")
    .description("Log in via GitHub OAuth (opens browser)")
    .action(async () => {
      const config = loadConfig();
      const loginUrl = `${config.apiUrl}/api/auth/github`;
      console.log(chalk.cyan("Open this URL in your browser to log in:"));
      console.log(chalk.cyan(loginUrl));
      console.log(chalk.gray("\nAfter login, copy the JWT token and store it:"));
      console.log(chalk.yellow(`  ultracode auth token <your-jwt-token>`));
      console.log(chalk.gray(`Config stored at: ${configPath()}`));
    });

  cmd
    .command("token <jwt>")
    .description("Store a JWT session token manually")
    .action((jwt: string) => {
      const updated = setSessionToken(jwt);
      console.log(chalk.green("Token stored."));
      console.log(chalk.gray(`API URL: ${updated.apiUrl}`));
    });

  cmd
    .command("logout")
    .description("Clear stored session token")
    .action(() => {
      clearSessionToken();
      console.log(chalk.green("Logged out. Session token removed."));
    });

  cmd
    .command("whoami")
    .description("Show current logged-in user")
    .action(async () => {
      const result = await apiFetch<{ sub: string; login: string; name?: string | null }>("/api/auth/me");
      if (!result.ok || !result.data) {
        console.log(chalk.red("Not logged in or session expired."));
        process.exitCode = 1;
        return;
      }
      const u = result.data;
      console.log(chalk.green(`Logged in as: ${u.login}`));
      console.log(chalk.gray(`id: ${u.sub}${u.name ? ` | name: ${u.name}` : ""}`));
    });

  return cmd;
}
