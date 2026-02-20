import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { translateStep } from '../translator/translate.js';
import { diagnoseFailure } from '../translator/diagnose.js';
import { executeLogin } from '../auth/login.js';
import { getNextRunId, getRunDir } from '../evidence/collector.js';
import { getCommitHash } from '../utils/git.js';
import { reportTerminalStep, reportTerminalSummary } from '../reporter/terminal.js';
async function getAccessibilityTree(page) {
    try {
        const snapshot = await page.locator('body').ariaSnapshot();
        return snapshot || '(empty page)';
    }
    catch {
        return '(empty page)';
    }
}
async function executeGeneratedCode(page, code) {
    // Create an async function that has access to page and expect
    const fn = new Function('page', 'expect', `return (async () => { ${code} })();`);
    await fn(page, expect);
}
export async function runSpec(spec, options = {}) {
    const runId = getNextRunId();
    const runDir = getRunDir(runId);
    mkdirSync(runDir, { recursive: true });
    const startTime = Date.now();
    const stepResults = [];
    let browser;
    let context;
    try {
        browser = await chromium.launch({
            headless: !options.headed,
        });
        context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
        });
        const page = await context.newPage();
        // Execute auth if configured
        if (options.auth && options.auth.strategy !== 'none') {
            await executeLogin(page, options.auth);
        }
        // Navigate to spec URL
        await page.goto(spec.url, { waitUntil: 'networkidle' });
        // Execute each step
        for (const step of spec.steps) {
            const stepStart = Date.now();
            const screenshotPath = join(runDir, `step-${step.index}.png`);
            let a11yTree = '';
            try {
                // Get accessibility tree
                a11yTree = await getAccessibilityTree(page);
                // Translate step to Playwright code
                const translation = await translateStep(step, a11yTree, options.apiKey);
                // Execute the generated code
                await Promise.race([
                    executeGeneratedCode(page, translation.playwrightCode),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Step timeout (30s)')), 30000)),
                ]);
                // Wait for any navigation to settle
                await page.waitForLoadState('networkidle').catch(() => { });
                // Screenshot on success
                await page.screenshot({ path: screenshotPath });
                const result = {
                    step,
                    status: 'passed',
                    durationMs: Date.now() - stepStart,
                    screenshotPath,
                };
                stepResults.push(result);
                reportTerminalStep(result);
            }
            catch (err) {
                // Screenshot on failure too
                await page.screenshot({ path: screenshotPath }).catch(() => { });
                const error = err instanceof Error ? err.message : String(err);
                // Diagnose the failure with Opus
                const diagnosis = await diagnoseFailure(step.description, error, a11yTree, page.url(), options.apiKey);
                const result = {
                    step,
                    status: 'failed',
                    durationMs: Date.now() - stepStart,
                    screenshotPath,
                    error,
                    diagnosis: diagnosis ?? undefined,
                };
                stepResults.push(result);
                reportTerminalStep(result);
            }
        }
    }
    finally {
        await context?.close();
        await browser?.close();
    }
    const passed = stepResults.filter((r) => r.status === 'passed').length;
    const failed = stepResults.filter((r) => r.status === 'failed').length;
    const commit = getCommitHash();
    const runResult = {
        id: runId,
        spec,
        steps: stepResults,
        totalDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        commit,
        passed,
        failed,
        reportPath: runDir,
    };
    reportTerminalSummary(runResult);
    return runResult;
}
//# sourceMappingURL=explore.js.map