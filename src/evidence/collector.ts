import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { RunResult } from '../types.js';

const RUNS_DIR = '.accept/runs';
const MAX_RUNS = 10;

export function getRunDir(runId: number): string {
  return join(RUNS_DIR, String(runId).padStart(3, '0'));
}

export function getNextRunId(): number {
  if (!existsSync(RUNS_DIR)) {
    mkdirSync(RUNS_DIR, { recursive: true });
    return 1;
  }

  const entries = readdirSync(RUNS_DIR)
    .filter((e) => /^\d+$/.test(e))
    .map((e) => parseInt(e, 10))
    .sort((a, b) => a - b);

  return entries.length > 0 ? entries[entries.length - 1] + 1 : 1;
}

export function saveRunResult(result: RunResult): void {
  const dir = getRunDir(result.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'results.json'), JSON.stringify(result, null, 2));
}

export function cleanupOldRuns(): void {
  if (!existsSync(RUNS_DIR)) return;

  const entries = readdirSync(RUNS_DIR)
    .filter((e) => /^\d+$/.test(e))
    .map((e) => parseInt(e, 10))
    .sort((a, b) => a - b);

  while (entries.length > MAX_RUNS) {
    const oldest = entries.shift()!;
    const dir = getRunDir(oldest);
    rmSync(dir, { recursive: true, force: true });
  }
}
