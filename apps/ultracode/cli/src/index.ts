#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { authCommand } from "./commands/auth.js";
import { reposCommand } from "./commands/repos.js";
import { reviewCommand } from "./commands/review.js";
import { reviewsCommand } from "./commands/reviews.js";

const program = new Command();

program
  .name("ultracode")
  .description("CLI for Ultracode — AI code review platform")
  .version("0.1.0")
  .addCommand(authCommand())
  .addCommand(reposCommand())
  .addCommand(reviewCommand())
  .addCommand(reviewsCommand());

// Show help when no subcommand given
if (process.argv.length <= 2) {
  program.outputHelp();
  console.log(chalk.gray("\nRun 'ultracode <command> --help' for command-specific help."));
  process.exit(0);
}

program.parse(process.argv);
