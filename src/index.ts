#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import { loadRunResult, saveRunResult, cleanupOldRuns } from './evidence/collector.js';
import { saveHtmlReport } from './reporter/html.js';
import { reportTerminalStep, reportTerminalSummary } from './reporter/terminal.js';
import { uploadResults, fetchCloudRuns } from './uploader/cloud.js';
import { loadConfig, saveConfig } from './config.js';
import { RunResult } from './types.js';

const program = new Command();

program
  .name('codacy-accept')
  .description('Proof that your AI agent\'s code actually works')
  .version('0.2.0');

// --- init command ---
program
  .command('init')
  .description('Initialize Codacy Accept in this project')
  .action(async () => {
    console.log(chalk.bold('\nCodacy Accept — Setup\n'));

    // 1. Create .accept/ directory structure
    mkdirSync('.accept/runs', { recursive: true });
    console.log(chalk.green('Created .accept/ directory'));

    // 2. Detect app URL from package.json
    let appUrl = 'http://localhost:3000';
    if (existsSync('package.json')) {
      try {
        const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
        const scripts = pkg.scripts || {};
        const devScript = scripts.dev || scripts.start || '';
        // Try to detect port from common patterns
        const portMatch = devScript.match(/(?:--port|PORT=|-p)\s*(\d+)/);
        if (portMatch) {
          appUrl = `http://localhost:${portMatch[1]}`;
        } else if (devScript.includes('vite') || devScript.includes('5173')) {
          appUrl = 'http://localhost:5173';
        } else if (devScript.includes('next') || devScript.includes('3000')) {
          appUrl = 'http://localhost:3000';
        } else if (devScript.includes('8080')) {
          appUrl = 'http://localhost:8080';
        } else if (devScript.includes('4321') || devScript.includes('astro')) {
          appUrl = 'http://localhost:4321';
        }
      } catch {
        // ignore parse errors
      }
    }

    saveConfig({ appUrl });
    console.log(chalk.green(`Detected app URL: ${appUrl}`));
    console.log(chalk.dim('Edit .accept/config.json to change it'));

    // 3. Create skill file
    const skillDir = '.claude/skills/accept';
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(`${skillDir}/SKILL.md`, generateSkill());
    console.log(chalk.green(`Created ${skillDir}/SKILL.md`));

    // 4. Add @playwright/mcp to .mcp.json
    const mcpConfigPath = '.mcp.json';
    let mcpConfig: Record<string, unknown> = {};
    if (existsSync(mcpConfigPath)) {
      try {
        mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));
      } catch {
        // start fresh
      }
    }
    const mcpServers = (mcpConfig.mcpServers || {}) as Record<string, unknown>;
    if (!mcpServers.playwright) {
      mcpServers.playwright = {
        command: 'npx',
        args: ['@playwright/mcp@latest'],
      };
      mcpConfig.mcpServers = mcpServers;
      writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2) + '\n');
      console.log(chalk.green('Added @playwright/mcp to .mcp.json'));
    } else {
      console.log(chalk.dim('@playwright/mcp already in .mcp.json'));
    }

    // 5. Create example spec
    mkdirSync('specs', { recursive: true });
    const exampleSpec = `# Verify Homepage

- App: ${appUrl}

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

    // 6. Append to .gitignore
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
    console.log(chalk.dim('Open Claude Code and type: /accept "verify your app works"'));
  });

// --- upload command ---
program
  .command('upload')
  .description('Upload verification results to cloud and get a share link')
  .option('--dir <path>', 'Path to a run directory with results.json + screenshots')
  .option('--json', 'Output result as JSON (for skill integration)')
  .action(async (options: { dir?: string; json?: boolean }) => {
    try {
      if (!options.dir) {
        console.error(chalk.red('Error: --dir <path> is required'));
        console.error(chalk.dim('Example: codacy-accept upload --dir .accept/runs/001'));
        process.exit(1);
      }

      const result = loadRunResult(options.dir);
      if (!result) {
        console.error(chalk.red(`Error: No results.json found in ${options.dir}`));
        process.exit(1);
      }

      // Generate HTML report if not already there
      const reportPath = saveHtmlReport(result);

      if (!options.json) {
        console.log(chalk.bold(`\nUploading: ${result.spec.title}`));
        reportTerminalSummary(result);
      }

      // Upload to Supabase
      const shareUrl = await uploadResults(result);
      if (shareUrl) {
        result.shareUrl = shareUrl;
        saveRunResult(result);
      }

      cleanupOldRuns();

      if (options.json) {
        const output = {
          title: result.spec.title,
          url: result.spec.url,
          passed: result.passed,
          failed: result.failed,
          totalDurationMs: result.totalDurationMs,
          shareUrl: shareUrl || null,
          reportPath,
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(chalk.dim(`HTML Report: ${reportPath}`));
        if (shareUrl) {
          console.log(chalk.cyan(`\nShare: ${shareUrl}`));
        } else {
          console.log(chalk.yellow('Upload failed (results saved locally)'));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (options.json) {
        console.log(JSON.stringify({ error: msg }));
      } else {
        console.error(chalk.red(`\nError: ${msg}`));
      }
      process.exit(1);
    }
  });

// --- history command ---
program
  .command('history')
  .description('Show recent runs')
  .option('--cloud', 'Show cloud history (uploaded runs)')
  .action(async (options: { cloud?: boolean }) => {
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

// --- Skill file generator ---

function generateSkill(): string {
  return `---
name: accept
description: Run visual verification of your app with screenshots and shareable proof links
user-invocable: true
argument-hint: '"verify checkout works"'
---

# Accept — Visual Verification with Playwright MCP

When the user invokes this skill, YOU (Claude Code) automate the browser directly using Playwright MCP tools to verify the app works, then upload results for a shareable proof link.

## Prerequisites

- The app must be running locally (check with the user if unsure)
- Playwright MCP server must be available (added by \`codacy-accept init\`)

## Steps

### 1. Setup

- Read \`.accept/config.json\` for the app URL. If not found, detect from \`package.json\` scripts or ask the user.
- Create a run directory: determine the next run ID by looking at \`.accept/runs/\`, then create \`.accept/runs/<NNN>/\` (zero-padded to 3 digits).
- Start a timer for total duration tracking.

### 2. Parse the request

Break "$ARGUMENTS" into 3-7 concrete test steps. Each step should be a single user action or assertion. For example:
- "verify the login page works" → navigate to login, check form fields visible, enter credentials, click submit, verify redirect
- "check homepage loads" → navigate to homepage, verify heading, check nav menu, verify no errors

### 3. Execute each step with Playwright MCP

For each step:

1. **Understand the page**: Use \`browser_snapshot\` to get the accessibility tree. This tells you what elements are on the page and how to interact with them.

2. **Perform the action**:
   - \`browser_navigate\` — go to a URL
   - \`browser_click\` — click an element (use the \`ref\` from the snapshot)
   - \`browser_type\` — type text into an input (use the \`ref\` from the snapshot)
   - \`browser_select_option\` — select from a dropdown
   - \`browser_press_key\` — press a key (Enter, Tab, etc.)

3. **Take a screenshot**: Use \`browser_screenshot\` after each step. Save the screenshot to \`.accept/runs/<NNN>/step-<N>.png\`.

4. **Record the result**: Track pass/fail status and timing for each step.

**Important**: Use \`browser_snapshot\` before EVERY action to understand the current page state. The accessibility tree gives you the \`ref\` values needed for \`browser_click\` and \`browser_type\`.

### 4. Handle authentication

If \`.accept/auth.json\` exists, read it first. It may contain:
- \`loginUrl\`: navigate here first
- \`credentials\`: username/password to enter
- \`strategy\`: how to authenticate

Perform login steps via MCP before running the main verification steps.

### 5. Save results

Write \`.accept/runs/<NNN>/results.json\` with this structure:

\`\`\`json
{
  "id": <NNN>,
  "spec": {
    "title": "<title from user request>",
    "url": "<app url>",
    "steps": [
      { "index": 1, "description": "<step description>", "type": "action|assertion" }
    ]
  },
  "steps": [
    {
      "step": { "index": 1, "description": "<step description>", "type": "action|assertion" },
      "status": "passed|failed",
      "durationMs": <ms>,
      "screenshotPath": ".accept/runs/<NNN>/step-1.png",
      "error": null
    }
  ],
  "totalDurationMs": <total ms>,
  "timestamp": "<ISO 8601>",
  "passed": <count>,
  "failed": <count>,
  "reportPath": ".accept/runs/<NNN>"
}
\`\`\`

### 6. Upload results

Run: \`codacy-accept upload --dir .accept/runs/<NNN> --json\`

This generates an HTML report, uploads to the cloud, and returns a JSON object with the share URL.

### 7. Present results

Display results as a markdown table:

**All passing:**
\`\`\`
## Verification: <title>

| Step | Result | Time |
|------|--------|------|
| 1. <description> | Passed | <time>s |
| 2. <description> | Passed | <time>s |
| 3. <description> | Passed | <time>s |

**All <N> steps passed** in <total>s

Share: <shareUrl>
\`\`\`

**With failures:**
\`\`\`
## Verification: <title>

| Step | Result | Time |
|------|--------|------|
| 1. <description> | Passed | 1.2s |
| 2. <description> | Failed | 3.4s |

**<passed> of <total> steps passed** in <total>s

Step 2 failed: <error description based on screenshot analysis>

Share: <shareUrl>
\`\`\`

### 8. On failure

When a step fails:
1. Read the screenshot of the failed step to understand the visual state
2. Analyze what went wrong (element not found, wrong text, page error, etc.)
3. Check the app's source code for the relevant component
4. Suggest a specific fix
5. Offer to re-run the verification after the fix

## Rules

- Always use \`browser_snapshot\` before interacting — never guess element selectors
- Take screenshots AFTER each step, not before
- Save all artifacts to \`.accept/runs/<NNN>/\`
- Use the \`ref\` attribute from snapshots for \`browser_click\` and \`browser_type\`
- If the page doesn't load, check if the app is running and suggest starting it
- Keep step descriptions concise and user-readable
`;
}
