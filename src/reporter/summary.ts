import { writeFileSync } from 'fs';
import { join } from 'path';
import { RunResult } from '../types.js';

export function generateMarkdownSummary(result: RunResult): string {
  const date = new Date(result.timestamp).toLocaleString();
  const overallResult = result.failed === 0 ? 'PASS' : 'FAIL';
  const totalDuration = (result.totalDurationMs / 1000).toFixed(1);
  const commitLine = result.commit ? `- **Commit**: ${result.commit.slice(0, 7)}\n` : '';

  let md = `# Results: ${result.spec.title}\n\n`;
  md += `- **Date**: ${date}\n`;
  if (result.specFile) {
    md += `- **Spec File**: ${result.specFile}\n`;
  }
  md += `- **App**: ${result.spec.url}\n`;
  md += `- **Result**: ${overallResult}\n`;
  md += `- **Steps**: ${result.passed} passed, ${result.failed} failed out of ${result.passed + result.failed} total\n`;
  md += `- **Duration**: ${totalDuration}s\n`;
  md += commitLine;

  // Step results table
  md += `\n## Step Results\n\n`;
  md += `| # | Step | Result | Duration | Notes |\n`;
  md += `|---|------|--------|----------|-------|\n`;

  for (const s of result.steps) {
    const duration = (s.durationMs / 1000).toFixed(1);
    const status = s.status === 'passed' ? 'PASS' : 'FAIL';
    const notes = s.error ? s.error.replace(/\|/g, '\\|') : '';
    md += `| ${s.step.index} | ${s.step.description} | ${status} | ${duration}s | ${notes} |\n`;
  }

  // Errors section
  const failedSteps = result.steps.filter(s => s.status === 'failed');
  if (failedSteps.length > 0) {
    md += `\n## Errors\n\n`;
    for (const s of failedSteps) {
      md += `- Step ${s.step.index}: ${s.error || 'Unknown error'}\n`;
    }
  }

  // Success criteria section
  if (result.spec.successCriteria && result.spec.successCriteria.length > 0) {
    md += `\n## Success Criteria\n\n`;
    for (const criterion of result.spec.successCriteria) {
      // Mark as checked if all steps passed, unchecked if any failed
      const checked = result.failed === 0 ? 'x' : ' ';
      md += `- [${checked}] ${criterion}\n`;
    }
  }

  return md;
}

export function saveSummary(result: RunResult): string {
  const md = generateMarkdownSummary(result);
  const summaryPath = join(result.reportPath, 'summary.md');
  writeFileSync(summaryPath, md);
  return summaryPath;
}
