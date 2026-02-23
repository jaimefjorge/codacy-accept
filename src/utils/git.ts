import { execSync } from 'child_process';

export function getCommitHash(): string | undefined {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return undefined;
  }
}

export function getRepoSlug(): string | null {
  try {
    return execSync('gh repo view --json nameWithOwner -q .nameWithOwner', {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return null;
  }
}

export interface PrInfo {
  number: number;
  title: string;
  headRefOid: string;
  url: string;
}

export function getPrInfo(prNumber: number): PrInfo | null {
  try {
    const json = execSync(
      `gh pr view ${prNumber} --json number,title,headRefOid,url`,
      { encoding: 'utf-8' },
    );
    return JSON.parse(json) as PrInfo;
  } catch {
    return null;
  }
}
