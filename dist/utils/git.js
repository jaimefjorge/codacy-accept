import { execSync } from 'child_process';
export function getCommitHash() {
    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=git.js.map