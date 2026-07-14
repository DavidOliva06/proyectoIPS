#!/usr/bin/env node
/**
 * Baseline-aware typecheck.
 *
 * The codebase carries pre-existing type errors. Gating CI on a clean `tsc`
 * would mean a red pipeline from day one, and the usual outcome of that is the
 * check gets deleted. Gating on nothing means new type errors land freely.
 *
 * So: errors already recorded in typecheck-baseline.json are tolerated, and any
 * error that is *not* in it fails the build. Debt is frozen, not forgiven —
 * fixing entries and re-running with --update shrinks the baseline, and it can
 * only ever shrink, because a grown one has to be committed deliberately.
 *
 *   node scripts/typecheck.js            check against the baseline
 *   node scripts/typecheck.js --update   rewrite the baseline from current state
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASELINE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'typecheck-baseline.json',
);
const ERROR_LINE = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

function runTsc() {
  try {
    execFileSync('npx', ['tsc', '--noEmit'], { encoding: 'utf8', stdio: 'pipe', shell: true });
    return '';
  } catch (e) {
    // tsc exits non-zero when it reports errors; the report itself is on stdout.
    return `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
}

/**
 * Keyed by file + rule + message, deliberately *not* by line number, so that
 * editing an unrelated part of a file does not invalidate its baseline entries.
 */
function parseErrors(output) {
  const errors = new Map();

  for (const line of output.split(/\r?\n/)) {
    const match = ERROR_LINE.exec(line.trim());

    if (!match) {
      continue;
    }

    const [, file, , , code, message] = match;
    const key = `${file.replace(/\\/g, '/')} | ${code} | ${message}`;

    errors.set(key, (errors.get(key) ?? 0) + 1);
  }

  return errors;
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    return new Map();
  }

  return new Map(Object.entries(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).errors ?? {}));
}

function saveBaseline(errors) {
  const sorted = [...errors.entries()].sort(([a], [b]) => a.localeCompare(b));

  writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(
      {
        comment:
          'Pre-existing type errors, tolerated by scripts/typecheck.js. Fix them and run `pnpm typecheck:update` to shrink this file. Do not add to it.',
        errors: Object.fromEntries(sorted),
      },
      null,
      2,
    )}\n`,
  );
}

const current = parseErrors(runTsc());

if (process.argv.includes('--update')) {
  saveBaseline(current);
  console.log(`Baseline written: ${current.size} known error(s).`);
  process.exit(0);
}

const baseline = loadBaseline();

const added = [...current].filter(([key, count]) => count > (baseline.get(key) ?? 0));
const fixed = [...baseline].filter(([key]) => !current.has(key));

if (fixed.length) {
  console.log(`${fixed.length} baseline error(s) no longer occur. Run \`pnpm typecheck:update\`:`);
  for (const [key] of fixed) {
    console.log(`  - ${key}`);
  }
  console.log('');
}

if (added.length) {
  console.error(`Typecheck failed: ${added.length} new type error(s).\n`);
  for (const [key, count] of added) {
    const known = baseline.get(key) ?? 0;
    const times = count > 1 ? ` (x${count}${known ? `, ${known} in baseline` : ''})` : '';
    console.error(`  ${key}${times}`);
  }
  console.error(`\n${baseline.size} pre-existing error(s) are tolerated; these are not.`);
  process.exit(1);
}

console.log(`Typecheck passed. ${baseline.size} pre-existing error(s) tolerated, 0 new.`);
