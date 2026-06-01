import chalk from 'chalk';

// ─── NASA Mission Control Theme ────────────────────────────────
const C = {
  dark:      (t: string) => chalk.bgHex('#0B132E').hex(t),
  primary:   (t: string) => chalk.hex('#FF6B35').bold(),
  secondary: (t: string) => chalk.hex('#4A90D9'),
  success:   (t: string) => chalk.hex('#00E676').bold(),
  error:     (t: string) => chalk.hex('#FF1744').bold(),
  warn:      (t: string) => chalk.hex('#FFD600').bold(),
  info:      (t: string) => chalk.hex('#00BFFF'),
  muted:     (t: string) => chalk.hex('#8892B0'),
  border:    (t: string) => chalk.hex('#1E3A5F'),
};

const B = {
  left:   '┃', right: '┃',
  topL:   '╭', topR:   '╮',
  botL:   '╰', botR:   '╯',
  hLine: '─', vLine: '│',
};

// ─── Panel System ──────────────────────────────────────────────

export function panel(title?: string, lines?: string[]): void {
  if (!lines || lines.length === 0) return;
  
  const maxW = Math.max(...lines.map(l => l.length), (title?.length ?? 0) + 4);
  const w = Math.min(maxW, process.stdout.columns - 4) || 78;

  console.log(C.border(`${B.topL}${'─'.repeat(w)}${B.topR}`));
  
  if (title) {
    const titleStr = ` ${chalk.bold(C.primary(title))} `;
    const fill = ' '.repeat(Math.max(0, w - titleStr.length));
    console.log(C.border(`${titleStr}${fill.slice(0, fill.length)}${C.muted('│')}`));
  }

  for (const line of lines) {
    const padded = line + ' '.repeat(Math.max(0, w - line.length));
    console.log(C.border(`${B.vLine} ${padded.slice(0, w)} ${C.muted(B.vLine)}`));
  }

  console.log(C.border(`${B.botL}${'─'.repeat(w)}${B.botR}`));
}

// ─── Mission Header ────────────────────────────────────────────

export function missionHeader(title: string, subtitle?: string): void {
  console.log('');
  const line = '═'.repeat(60);
  console.log(C.primary(line));
  console.log(`   ${C.primary('◆')}  ${chalk.bold(title.toUpperCase())}`);
  if (subtitle) {
    console.log(`   ${C.secondary('◇')}  ${subtitle}`);
  }
  console.log(`${line}\n`);
}

// ─── Status Badges ─────────────────────────────────────────────

export function statusBadge(status: string, color: 'success' | 'error' | 'warn' | 'info' | 'primary'): void {
  const colors = { success: C.success, error: C.error, warn: C.warn, info: C.info, primary: C.primary };
  console.log(` [${colors[color](status)}]`);
}

// ─── Progress Bar ──────────────────────────────────────────────

export function progressBar(current: number, total: number, label?: string): void {
  const pct = Math.min(100, Math.round((current / total) * 100));
  const filled = Math.round((pct / 100) * 30);
  const empty = 30 - filled;

  let bar = '';
  for (let i = 0; i < filled; i++) bar += '█';
  for (let i = 0; i < empty; i++) bar += '░';

  const colorFn = pct >= 80 ? C.success : pct >= 50 ? C.info : C.warn;
  
  if (label) {
    console.log(`\n${C.muted(label)} ${colorFn(bar)} ${pct}%`);
  } else {
    console.log(`${colorFn(bar)} ${chalk.dim(`${pct}%`)}`);
  }
}

// ─── Metric Row ────────────────────────────────────────────────

export function metricRow(icon: string, key: string, value: string): void {
  console.log(`   ${icon}   ${C.muted(key + ':')}   ${value}`);
}

// ─── Divider ───────────────────────────────────────────────────

export function divider(): void {
  console.log(`${C.border('─'.repeat(60))}\n`);
}

// ─── Backward-Compatible Helpers (Enhanced) ─────────────────────

export function heading(text: string): void {
  missionHeader(text);
}

export function success(text: string): void {
  console.log(`    ${C.success('●')} ${text}`);
}

export function error(text: string): void {
  console.error(`    ${C.error('✕')} ${text}`);
}

export function warn(text: string): void {
  console.log(`    ${C.warn('▲')} ${chalk.yellow(text)}`);
}

export function info(text: string): void {
  console.log(`    ${C.info('◉')} ${text}`);
}

// ─── Quick Utility: Multi-line Panel ───────────────────────────

export function kvPanel(title: string, data: Record<string, string>): void {
  const lines = Object.entries(data).map(
    ([k, v]) => `    ${C.muted(k + ':')}    ${v}`
  );
  panel(title, lines);
}

// ─── Backward Compatibility Aliases ──────────────────────────────

/** Alias for metricRow — kept for backward compatibility */
export function keyValue(key: string, value: string): void {
  console.log(`      ${C.muted(key + ':')} ${value}`);
}

// ═══════════════════════════════════════════════════════════════
// NEW NASA-THemed Components (v2)
// ═══════════════════════════════════════════════════════════════

/** Section wrapper — title + bordered body */
export function section(title: string, lines: string[]): void {
  console.log('');
  panel(title, lines);
}

/** Table with headers and rows — auto-aligned columns */
export function tablePanel(headers: string[], rows: string[][], opts?: { headerColor?: 'primary' | 'success' | 'info' }): void {
  if (rows.length === 0) return;
  
  const colWidths = headers.map((h, i) => 
    Math.max(h.length, ...rows.map(r => r[i]?.length ?? 0)) + 2
  );

  function formatRow(row: string[]): string {
    let line = '┃ ';
    row.forEach((cell, i) => {
      const padded = cell.padEnd(colWidths[i]);
      line += padded;
      if (i < colWidths.slice(0, -1).reduce((a, b) => a + b, 0)) line += '  ';
    });
    line += ' ┃';
    return line;
  }

  const maxW = formatRow(headers).length;
  const borderLine = '╭' + '─'.repeat(maxW - 2) + '╮';
  const botLine = '╰' + '─'.repeat(maxW - 2) + '╯';

  console.log('');
  console.log(C.border(borderLine));
  
  // Header row
  const headerColor = opts?.headerColor === 'success' ? C.success : 
                      opts?.headerColor === 'info' ? C.info : C.primary;
  console.log(C.border(`╭${formatRow(headers).slice(2, -2)}╮`));
  
  // Separator
  const sepLine = '├' + '─'.repeat(maxW - 2) + '┤';
  console.log(C.border(sepLine));

  // Data rows
  for (const row of rows) {
    console.log(C.border(`│${formatRow(row).slice(2, -2)}│`));
  }
  
  console.log(C.border(botLine));
}

/** Single metric card — label on top, big value below */
export function card(label: string, value: string, opts?: { color?: 'primary' | 'success' | 'info' | 'warn' | 'error' }): void {
  const w = Math.max(label.length + 2, value.length + 2);
  const colorFn = opts?.color ? (C as any)[opts.color] : C.primary;

  console.log(`    ${C.border('┌' + '─'.repeat(w) + '┐')}`);
  console.log(`    ${C.border('│' + label.padEnd(w - 2) + '│')}`);
  console.log(`    ${C.border('├' + '─'.repeat(w) + '┤')}`);
  console.log(`    ${C.border('│' + colorFn(value).padEnd(w - 2) + '│')}`);
  console.log(`    ${C.border('└' + '─'.repeat(w) + '┘')}\n`);
}

/** Grid of cards side by side */
export function grid(cards: { label: string; value: string; opts?: { color?: string } }[]): void {
  if (cards.length === 0) return;
  
  // Simple horizontal layout for up to 4 cards
  const maxW = Math.max(...cards.map(c => Math.max(c.label.length, c.value.length)), 10) + 2;
  
  console.log('');
  console.log(C.border('╭' + '─'.repeat(maxW * cards.length + (cards.length - 1) * 4 + 2) + '╮'));
  
  // Title row
  let titleRow = '┃';
  for (const c of cards) {
    titleRow += ` ${c.label.padEnd(maxW)} │`;
  }
  console.log(C.border(titleRow));
  
  // Separator
  const sepLine = '├' + '─'.repeat(maxW * cards.length + (cards.length - 1) * 4 + 2 - 2) + '┤';
  console.log(C.border(sepLine));
  
  // Value row
  let valueRow = '┃';
  for (const c of cards) {
    const colorFn = c.opts?.color ? (C as any)[c.opts.color] : C.primary;
    valueRow += ` ${colorFn(c.value).padEnd(maxW)} │`;
  }
  console.log(C.border(valueRow));
  
  console.log(C.border('╰' + '─'.repeat(maxW * cards.length + (cards.length - 1) * 4 + 2 - 2) + '╯'));
}

/** Clean horizontal rule */
export function hRule(): void {
  console.log(`\n${C.muted('─'.repeat(80))}\n`);
}

/** Status line with badge — e.g. "Engine running [HEALTHY]" */
export function statusLine(text: string, badge: string, color: 'success' | 'error' | 'warn' | 'info'): void {
  const colors = { success: C.success, error: C.error, warn: C.warn, info: C.info };
  console.log(`    ${chalk.dim('›')} ${text} [${colors[color](badge)}]`);
}

/** Alert box — highlighted warning/error/success panel */
export function alertBox(type: 'success' | 'error' | 'warn' | 'info', title: string, lines?: string[]): void {
  const colors = { success: C.success, error: C.error, warn: C.warn, info: C.info };
  const colorFn = colors[type];
  
  if (lines && lines.length > 0) {
    panel(`${colorFn(title)}`, lines);
  } else {
    console.log(`\n${C.border('╭' + '─'.repeat(58) + '╮')}`);
    console.log(C.border(`│ ${colorFn(title)}                        ${' '.repeat(Math.max(0, 56 - title.length))} │`));
    console.log(C.border('├' + '─'.repeat(58) + '┤'));
    console.log(C.border('│' + ' '.repeat(60) + '│'));
    console.log(C.border('╰' + '─'.repeat(58) + '╯'));
  }
}
