import chalk from 'chalk';
import { StepResult, RunResult } from '../types.js';

export function reportTerminalStep(result: StepResult): void {
  const icon = result.status === 'passed' ? chalk.green('✓') : chalk.red('✗');
  const duration = chalk.dim(`(${(result.durationMs / 1000).toFixed(1)}s)`);
  const desc = result.step.description;

  console.log(`  ${icon} Step ${result.step.index}: ${desc} ${duration}`);

  if (result.error) {
    console.log(chalk.red(`    Error: ${result.error}`));
  }

  console.log(chalk.dim(`    Screenshot: ${result.screenshotPath}`));
}

export function reportTerminalSummary(result: RunResult): void {
  console.log('');
  const passedStr = chalk.green(`${result.passed} passed`);
  const failedStr = result.failed > 0 ? chalk.red(`, ${result.failed} failed`) : '';
  const total = (result.totalDurationMs / 1000).toFixed(1);

  const runId = String(result.id).padStart(3, '0');
  console.log(
    `Run #${runId} | ${passedStr}${failedStr} | ${total}s`,
  );
  console.log(chalk.dim(`Report: ${result.reportPath}`));
  if (result.shareUrl) {
    console.log(chalk.cyan(`Share: ${result.shareUrl}`));
  }
}
