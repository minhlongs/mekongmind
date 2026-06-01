import type { Command } from 'commander';
import type { MekongEngine } from '../../core/engine.js';
import { success, error as showError, info } from '../ui/output.js';
import { withSpinner } from '../ui/spinner.js';

export function registerCookAutoCommand(program: Command, engine: MekongEngine): void {
  program
    .command('cook-auto <task...>')
    .description('Auto-cook a task using multi-model routing (Qwen thinking + Soren coding)')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (taskParts: string[], opts: { verbose?: boolean }) => {
      const task = taskParts.join(' ');
      try {
        info(`Cooking: ${task}`);
        const result = await withSpinner('Running auto-cook...', () => engine.run(task));
        success('Task completed');
        if (opts.verbose) console.log(result);
      } catch (err) {
        showError(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
      }
    });
}
