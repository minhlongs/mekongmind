import ora, { type Ora } from 'ora';

// ─── NASA Spinner Frames ──────────────────────────────────────
const NASA_FRAMES = [
  '🚀', // rocket launch
  '◜',   // orbit left
  '⊙',   // sun / power
  '◝',   // orbit right
  '◎',   // target
  '◞',   // scan up
  '✦',   // star burst
  '◟',   // scan down
];

export function createSpinner(text: string): Ora {
  return ora({
    text,
    spinner: { interval: 80, frames: NASA_FRAMES },
    color: 'cyan',
  });
}

export async function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();
  try {
    const result = await fn();
    spinner.succeed(`✓ Mission complete`);
    return result;
   } catch (error) {
    spinner.fail(`✕ Mission failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
   }
}
