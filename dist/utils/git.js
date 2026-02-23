import { execSync } from 'child_process';
export function getCommitHash() {
    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    }
    catch {
        return undefined;
    }
}
export function getRepoSlug() {
    try {
        return execSync('gh repo view --json nameWithOwner -q .nameWithOwner', {
            encoding: 'utf-8',
        }).trim();
    }
    catch {
        return null;
    }
}
export function getPrInfo(prNumber) {
    try {
        const json = execSync(`gh pr view ${prNumber} --json number,title,headRefOid,url`, { encoding: 'utf-8' });
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=git.js.map