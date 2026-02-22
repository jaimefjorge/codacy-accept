import chalk from 'chalk';
export function reportTerminalStep(result) {
    const icon = result.status === 'passed' ? chalk.green('✓') : chalk.red('✗');
    const duration = chalk.dim(`(${(result.durationMs / 1000).toFixed(1)}s)`);
    const desc = result.step.description;
    console.log(`  ${icon} Step ${result.step.index}: ${desc} ${duration}`);
    if (result.error) {
        console.log(chalk.red(`    Error: ${result.error}`));
    }
    console.log(chalk.dim(`    Screenshot: ${result.screenshotPath}`));
}
export function reportTerminalSummary(result) {
    console.log('');
    // Step results table
    const colStep = 5;
    const colDesc = Math.max(...result.steps.map(s => s.step.description.length), 12);
    const colResult = 6;
    const colTime = 7;
    const header = `  ${'#'.padEnd(colStep)} ${'Step'.padEnd(colDesc)} ${'Result'.padEnd(colResult)} ${'Time'.padEnd(colTime)}`;
    const separator = `  ${'-'.repeat(colStep)} ${'-'.repeat(colDesc)} ${'-'.repeat(colResult)} ${'-'.repeat(colTime)}`;
    console.log(chalk.bold(header));
    console.log(chalk.dim(separator));
    for (const s of result.steps) {
        const num = String(s.step.index).padEnd(colStep);
        const desc = s.step.description.padEnd(colDesc);
        const statusStr = s.status === 'passed'
            ? chalk.green('PASS'.padEnd(colResult))
            : chalk.red('FAIL'.padEnd(colResult));
        const duration = `${(s.durationMs / 1000).toFixed(1)}s`.padEnd(colTime);
        console.log(`  ${num} ${desc} ${statusStr} ${duration}`);
    }
    console.log('');
    // Error categorization
    const failedSteps = result.steps.filter(s => s.status === 'failed');
    if (failedSteps.length > 0) {
        console.log(chalk.red.bold('Errors:'));
        for (const s of failedSteps) {
            console.log(chalk.red(`  Step ${s.step.index}: ${s.error || 'Unknown error'}`));
        }
        console.log('');
    }
    const passedStr = chalk.green(`${result.passed} passed`);
    const failedStr = result.failed > 0 ? chalk.red(`, ${result.failed} failed`) : '';
    const total = (result.totalDurationMs / 1000).toFixed(1);
    const runId = String(result.id).padStart(3, '0');
    console.log(`Run #${runId} | ${passedStr}${failedStr} | ${total}s`);
    console.log(chalk.dim(`Report: ${result.reportPath}`));
    if (result.shareUrl) {
        console.log(chalk.cyan(`Share: ${result.shareUrl}`));
    }
}
//# sourceMappingURL=terminal.js.map