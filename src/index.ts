#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import { parseInlineWithExpansion } from './parser/inline.js';
import { parseMarkdown } from './parser/markdown.js';
import { runSpec, RunOptions } from './runner/explore.js';
import { saveRunResult, cleanupOldRuns, getRunDir } from './evidence/collector.js';
import { saveHtmlReport } from './reporter/html.js';
import { uploadResults, fetchCloudRuns } from './uploader/cloud.js';
import { setupAuth, loadAuthConfig } from './auth/setup.js';
import { Spec } from './types.js';

const program = new Command();

program
  .name('codacy-accept')
  .description('Proof that your AI agent\'s code actually works')
  .version('0.1.0');

program
  .command('run')
  .description('Run a verification spec')
  .argument('<spec>', 'Inline description string or path to .accept.md file')
  .option('--url <url>', 'App URL (required for inline specs)')
  .option('--headed', 'Run browser in headed mode for debugging')
  .option('--no-upload', 'Skip uploading results to cloud')
  .action(async (spec: string, options: { url?: string; headed?: boolean; upload?: boolean }) => {
    try {
      let parsedSpec: Spec;

      if (existsSync(spec) && spec.endsWith('.md')) {
        // File spec
        const content = readFileSync(spec, 'utf-8');
        parsedSpec = parseMarkdown(content);
        if (options.url) {
          parsedSpec.url = options.url;
        }
      } else {
        // Inline spec
        if (!options.url) {
          console.error(chalk.red('Error: --url is required for inline specs'));
          process.exit(1);
        }
        const steps = await parseInlineWithExpansion(spec);
        parsedSpec = {
          title: spec.length > 60 ? spec.slice(0, 57) + '...' : spec,
          url: options.url,
          steps,
        };
      }

      if (!parsedSpec.url) {
        console.error(chalk.red('Error: No URL specified. Use --url or set App: in your spec file.'));
        process.exit(1);
      }

      if (parsedSpec.steps.length === 0) {
        console.error(chalk.red('Error: No steps found in spec.'));
        process.exit(1);
      }

      console.log(chalk.bold(`\nRunning: ${parsedSpec.title}`));
      console.log(chalk.dim(`URL: ${parsedSpec.url}`));
      console.log(chalk.dim(`Steps: ${parsedSpec.steps.length}\n`));

      // Load auth config if available
      const authConfig = loadAuthConfig();

      const runOptions: RunOptions = {
        headed: options.headed,
        auth: authConfig ?? undefined,
      };

      const result = await runSpec(parsedSpec, runOptions);

      // Save results
      saveRunResult(result);
      const reportPath = saveHtmlReport(result);
      console.log(chalk.dim(`HTML Report: ${reportPath}`));

      // Upload if not disabled
      if (options.upload !== false && !process.env.CODACY_ACCEPT_NO_UPLOAD) {
        process.stdout.write(chalk.dim('Uploading to cloud... '));
        const shareUrl = await uploadResults(result);
        if (shareUrl) {
          result.shareUrl = shareUrl;
          saveRunResult(result); // Update with share URL
          console.log(chalk.green('done'));
          console.log(chalk.cyan(`\nShare: ${shareUrl}`));
        } else {
          console.log(chalk.yellow('failed (results saved locally)'));
        }
      }

      // Cleanup old runs
      cleanupOldRuns();

      process.exit(result.failed > 0 ? 1 : 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\nError: ${msg}`));

      if (msg.includes('ANTHROPIC_API_KEY')) {
        console.error(chalk.yellow('\nTo fix: Set your Anthropic API key:'));
        console.error(chalk.yellow('  export ANTHROPIC_API_KEY=sk-ant-...'));
        console.error(chalk.dim('  Get a key at https://console.anthropic.com/'));
      } else if (msg.includes('browserType.launch') || msg.includes('Executable doesn\'t exist') || msg.includes('chromium')) {
        console.error(chalk.yellow('\nTo fix: Install Playwright browsers:'));
        console.error(chalk.yellow('  npx playwright install chromium'));
      } else if (msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('ECONNREFUSED')) {
        console.error(chalk.yellow('\nTo fix: Make sure your app is running at the specified URL.'));
      } else if (msg.includes('net::ERR_NAME_NOT_RESOLVED')) {
        console.error(chalk.yellow('\nTo fix: Check that the URL is correct and the server is reachable.'));
      }

      process.exit(1);
    }
  });

program
  .command('setup')
  .description('AI-powered auth setup')
  .requiredOption('--url <url>', 'App URL to configure auth for')
  .action(async (options: { url: string }) => {
    try {
      await setupAuth(options.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`Setup error: ${msg}`));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize Codacy Accept in this project')
  .action(() => {
    // Create skill file
    const skillDir = '.claude/skills';
    mkdirSync(skillDir, { recursive: true });
    const skillContent = `# Accept — Visual Verification Skill

When the user says \`/accept "description"\` or \`/accept\`, run a visual verification of the app.

## How to use

1. **Detect the app URL**: Look for \`dev\` or \`start\` scripts in \`package.json\`, or check for running dev servers on common ports (3000, 5173, 8080, 4321). If unsure, ask the user.

2. **Check auth**: If \`.accept/auth.json\` exists, auth is configured. If not and the app needs auth, suggest running \`codacy-accept setup --url <url>\` first.

3. **Run the verification**:
   - If the user provided an inline description: \`codacy-accept run "<description>" --url <url>\`
   - If there's a \`.accept.md\` file: \`codacy-accept run <file>\`

4. **Interpret results**:
   - If all steps pass: Report success, show the share URL (links to https://codacy-accept.lovable.app/r/...)
   - If steps fail: Read the error details, look at what went wrong, and suggest code fixes
   - Always mention the HTML report path for detailed review
   - Share URLs are auto-generated — anyone with the link can view the report (no login needed)

## Examples

\`\`\`
/accept "verify the login page works"
> codacy-accept run "verify the login page works" --url http://localhost:3000

/accept "checkout flow adds item and shows total"
> codacy-accept run "checkout flow adds item and shows total" --url http://localhost:3000

/accept specs/checkout.accept.md
> codacy-accept run specs/checkout.accept.md
\`\`\`

## On failure

When verification fails:
1. Read the error message from the terminal output
2. Look at the screenshot to understand visual state
3. Check the relevant source code
4. Suggest a specific fix
5. After fixing, re-run the verification
`;
    writeFileSync(`${skillDir}/accept.md`, skillContent);
    console.log(chalk.green(`Created ${skillDir}/accept.md`));

    // Create example spec
    mkdirSync('specs', { recursive: true });
    const exampleSpec = `# Verify Homepage

- App: http://localhost:3000

> Why: The homepage is the first thing users see. If it's broken, nothing else matters.

1. Navigate to the homepage
2. Verify the main heading is visible
3. Check that the navigation menu loads
4. Verify no error messages are displayed
`;
    if (!existsSync('specs/example.accept.md')) {
      writeFileSync('specs/example.accept.md', exampleSpec);
      console.log(chalk.green('Created specs/example.accept.md'));
    }

    // Append to .gitignore
    const gitignorePath = '.gitignore';
    if (existsSync(gitignorePath)) {
      const content = readFileSync(gitignorePath, 'utf-8');
      if (!content.includes('.accept/')) {
        appendFileSync(gitignorePath, '\n.accept/\n');
        console.log(chalk.green('Added .accept/ to .gitignore'));
      }
    } else {
      writeFileSync(gitignorePath, '.accept/\n');
      console.log(chalk.green('Created .gitignore with .accept/'));
    }

    console.log(chalk.bold('\nCodacy Accept initialized!'));
    console.log(chalk.dim('Run: codacy-accept run specs/example.accept.md'));
  });

program
  .command('history')
  .description('Show recent runs')
  .option('--cloud', 'Show cloud history (uploaded runs)')
  .action(async (options: { cloud?: boolean }) => {
    // Show local runs
    const runsDir = '.accept/runs';
    let hasLocal = false;

    if (existsSync(runsDir)) {
      const { readdirSync } = await import('fs');
      const entries = readdirSync(runsDir)
        .filter((e: string) => /^\d+$/.test(e))
        .sort()
        .reverse()
        .slice(0, 10);

      if (entries.length > 0) {
        hasLocal = true;
        console.log(chalk.bold('\nLocal runs:\n'));
        for (const entry of entries) {
          const resultsPath = `${runsDir}/${entry}/results.json`;
          if (existsSync(resultsPath)) {
            try {
              const data = JSON.parse(readFileSync(resultsPath, 'utf-8'));
              const status =
                data.failed === 0 ? chalk.green('PASS') : chalk.red('FAIL');
              const time = new Date(data.timestamp).toLocaleString();
              const shareInfo = data.shareUrl ? chalk.cyan(` → ${data.shareUrl}`) : '';
              console.log(
                `  #${entry} ${status} ${data.spec?.title || 'Untitled'} (${time})${shareInfo}`,
              );
            } catch {
              console.log(`  #${entry} (corrupt results)`);
            }
          }
        }
      }
    }

    // Show cloud runs
    if (options.cloud) {
      console.log(chalk.bold('\nCloud runs:\n'));
      const cloudRuns = await fetchCloudRuns();
      if (cloudRuns.length === 0) {
        console.log('  No cloud runs found.');
      } else {
        for (const run of cloudRuns) {
          const status =
            run.failed === 0 ? chalk.green('PASS') : chalk.red('FAIL');
          const time = new Date(run.timestamp).toLocaleString();
          console.log(
            `  ${status} ${run.title} (${time}) ${chalk.cyan(run.url)}`,
          );
        }
      }
    }

    if (!hasLocal && !options.cloud) {
      console.log('No local runs yet. Use --cloud to check cloud history.');
    }
  });

program.parse();
