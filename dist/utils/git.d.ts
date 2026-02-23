export declare function getCommitHash(): string | undefined;
export declare function getRepoSlug(): string | null;
export interface PrInfo {
    number: number;
    title: string;
    headRefOid: string;
    url: string;
}
export declare function getPrInfo(prNumber: number): PrInfo | null;
//# sourceMappingURL=git.d.ts.map