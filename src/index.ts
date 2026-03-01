#!/usr/bin/env node
import { Command } from 'commander';
import { execSync } from 'child_process';
import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import { loadRunResult, saveRunResult, cleanupOldRuns } from './evidence/collector.js';
import { saveHtmlReport } from './reporter/html.js';
import { reportTerminalStep, reportTerminalSummary } from './reporter/terminal.js';
import { uploadResults, fetchCloudRuns } from './uploader/cloud.js';
import { generateVideo } from './video/generator.js';
import { loadConfig, saveConfig } from './config.js';
import { RunResult } from './types.js';
import { getRepoSlug, getPrInfo } from './utils/git.js';
import { buildPrComment } from './reporter/github.js';

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

    // 3. Create skill files
    const skillDir = '.claude/skills/accept';
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(`${skillDir}/SKILL.md`, generateSkill());
    console.log(chalk.green(`Created ${skillDir}/SKILL.md`));

    const maketestDir = '.claude/skills/accept-maketest';
    mkdirSync(maketestDir, { recursive: true });
    writeFileSync(`${maketestDir}/SKILL.md`, generateMaketestSkill());
    console.log(chalk.green(`Created ${maketestDir}/SKILL.md`));

    const prDir = '.claude/skills/accept-pr';
    mkdirSync(prDir, { recursive: true });
    writeFileSync(`${prDir}/SKILL.md`, generatePrSkill());
    console.log(chalk.green(`Created ${prDir}/SKILL.md`));

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

    // 5. Create example spec inside .accept/specs/
    mkdirSync('.accept/specs', { recursive: true });
    const exampleSpec = `# Verify Homepage

## Metadata
- **Priority**: critical
- **Area**: public
- **Requires Auth**: no
- **Estimated Duration**: fast (<30s)

- App: ${appUrl}

> Why: The homepage is the first thing users see. If it's broken, nothing else matters.

## Preconditions
- Application is running at ${appUrl}
- No authentication required

## Steps
1. Navigate to the homepage
2. Verify the main heading is visible
3. Check that the navigation menu loads
4. Verify no error messages are displayed

## Success Criteria
- Homepage loads without errors
- Main heading and navigation are visible
- No console errors present

## Notes
- Page may show a brief loading spinner while fetching data
`;
    if (!existsSync('.accept/specs/example.accept.md')) {
      writeFileSync('.accept/specs/example.accept.md', exampleSpec);
      console.log(chalk.green('Created .accept/specs/example.accept.md'));
    }

    // 5b. Create fixtures directory
    mkdirSync('.accept/specs/fixtures', { recursive: true });
    writeFileSync('.accept/specs/fixtures/.gitkeep', '');
    console.log(chalk.green('Created .accept/specs/fixtures/ directory'));

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

    // 7. Check for ffmpeg (needed for video recording)
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      console.log(chalk.green('ffmpeg detected — video recording enabled'));
    } catch {
      console.log(chalk.yellow('⚠ ffmpeg not found — video recording will be disabled'));
      console.log(chalk.dim('  Install it: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)'));
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

      // Generate video from screenshots if not already done
      if (!result.videoPath) {
        const videoPath = await generateVideo(result);
        if (videoPath) {
          result.videoPath = videoPath;
          // Re-save results.json with videoPath so upload picks it up
          const { writeFileSync } = await import('fs');
          const { join } = await import('path');
          writeFileSync(join(options.dir, 'results.json'), JSON.stringify(result, null, 2));
        }
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
        await saveRunResult(result);
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
          specFile: result.specFile || null,
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        if (result.specFile) {
          console.log(chalk.dim(`Spec: ${result.specFile}`));
        }
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

// --- specs command ---
program
  .command('specs')
  .description('List .accept.md spec files in this project')
  .action(async () => {
    const { readdirSync, statSync } = await import('fs');
    const { join } = await import('path');

    function findSpecFiles(dir: string): string[] {
      const results: string[] = [];
      try {
        for (const entry of readdirSync(dir)) {
          if (entry === 'node_modules' || entry === '.git') continue;
          const fullPath = join(dir, entry);
          try {
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
              results.push(...findSpecFiles(fullPath));
            } else if (entry.endsWith('.accept.md')) {
              results.push(fullPath);
            }
          } catch { /* skip inaccessible */ }
        }
      } catch { /* skip unreadable dirs */ }
      return results;
    }

    const specFiles = findSpecFiles('.accept/specs');

    if (specFiles.length === 0) {
      console.log(chalk.dim('No .accept.md spec files found.'));
      console.log(chalk.dim('Run codacy-accept init to create an example spec.'));
      return;
    }

    console.log(chalk.bold(`\nSpecs (${specFiles.length}):\n`));

    for (const file of specFiles.sort()) {
      // Parse title and metadata from spec file
      let title = file;
      let priorityBadge = '';
      let areaBadge = '';
      let durationBadge = '';
      try {
        const content = readFileSync(file, 'utf-8');
        const headingMatch = content.match(/^#\s+(.+)$/m);
        if (headingMatch) {
          title = headingMatch[1];
        }
        // Parse metadata
        const priorityMatch = content.match(/\*\*Priority\*\*:\s*(\w+)/);
        if (priorityMatch) {
          const p = priorityMatch[1].toLowerCase();
          const colors: Record<string, (s: string) => string> = {
            critical: chalk.red, high: chalk.yellow, medium: chalk.blue, low: chalk.dim,
          };
          priorityBadge = (colors[p] || chalk.dim)(`[${p}]`) + ' ';
        }
        const areaMatch = content.match(/\*\*Area\*\*:\s*(.+)/);
        if (areaMatch) {
          areaBadge = chalk.cyan(`[${areaMatch[1].trim()}]`) + ' ';
        }
        const durationMatch = content.match(/\*\*Estimated Duration\*\*:\s*(\w+)/);
        if (durationMatch) {
          durationBadge = chalk.dim(`~${durationMatch[1].trim()}`) + ' ';
        }
      } catch {
        // ignore
      }

      // Check for latest local run status
      let statusStr = '';
      const runsDir = '.accept/runs';
      if (existsSync(runsDir)) {
        const { readdirSync } = await import('fs');
        const entries = readdirSync(runsDir)
          .filter((e: string) => /^\d+$/.test(e))
          .sort()
          .reverse();

        for (const entry of entries) {
          const resultsPath = `${runsDir}/${entry}/results.json`;
          if (existsSync(resultsPath)) {
            try {
              const data = JSON.parse(readFileSync(resultsPath, 'utf-8')) as RunResult;
              if (data.specFile === file) {
                statusStr = data.failed === 0
                  ? chalk.green(' PASS')
                  : chalk.red(' FAIL');
                break;
              }
            } catch {
              // ignore
            }
          }
        }
      }

      console.log(`  ${priorityBadge}${areaBadge}${chalk.bold(title)}${statusStr} ${durationBadge}`);
      console.log(`  ${chalk.dim(file)}\n`);
    }
  });

// --- pr command ---
program
  .command('pr <number>')
  .description('Post verification results as a GitHub PR comment')
  .option('--run <id>', 'Specific run ID to use (e.g. 001)')
  .action(async (number: string, options: { run?: string }) => {
    try {
      const prNumber = parseInt(number, 10);
      if (isNaN(prNumber)) {
        console.error(chalk.red('Error: PR number must be a number'));
        process.exit(1);
      }

      // 1. Validate gh auth
      try {
        execSync('gh auth status', { stdio: 'ignore' });
      } catch {
        console.error(chalk.red('Error: GitHub CLI not authenticated. Run `gh auth login` first.'));
        process.exit(1);
      }

      // 2. Get repo slug
      const slug = getRepoSlug();
      if (!slug) {
        console.error(chalk.red('Error: Could not determine repository. Are you in a GitHub repo?'));
        process.exit(1);
      }

      // 3. Get PR info
      const prInfo = getPrInfo(prNumber);
      if (!prInfo) {
        console.error(chalk.red(`Error: PR #${prNumber} not found.`));
        process.exit(1);
      }

      console.log(chalk.bold(`\nPosting to PR #${prNumber}: ${prInfo.title}\n`));

      // 4. Find matching run
      const runsDir = '.accept/runs';
      if (!existsSync(runsDir)) {
        console.error(chalk.red('Error: No accept runs found. Run `/accept` first.'));
        process.exit(1);
      }

      const { readdirSync } = await import('fs');
      let runDir: string | null = null;

      if (options.run) {
        // Use specific run
        const padded = options.run.padStart(3, '0');
        const candidate = `${runsDir}/${padded}`;
        if (existsSync(`${candidate}/results.json`)) {
          runDir = candidate;
        } else {
          console.error(chalk.red(`Error: Run ${options.run} not found at ${candidate}`));
          process.exit(1);
        }
      } else {
        // Find run matching PR head commit, or most recent
        const entries = readdirSync(runsDir)
          .filter((e: string) => /^\d+$/.test(e))
          .sort()
          .reverse();

        // First pass: look for commit match
        for (const entry of entries) {
          const resultsPath = `${runsDir}/${entry}/results.json`;
          if (existsSync(resultsPath)) {
            try {
              const data = JSON.parse(readFileSync(resultsPath, 'utf-8'));
              if (data.commit === prInfo.headRefOid) {
                runDir = `${runsDir}/${entry}`;
                console.log(chalk.dim(`Found run #${entry} matching PR head commit`));
                break;
              }
            } catch { /* skip */ }
          }
        }

        // Fallback: most recent run
        if (!runDir) {
          for (const entry of entries) {
            if (existsSync(`${runsDir}/${entry}/results.json`)) {
              runDir = `${runsDir}/${entry}`;
              console.log(chalk.dim(`Using most recent run #${entry}`));
              break;
            }
          }
        }
      }

      if (!runDir) {
        console.error(chalk.red('Error: No accept runs found. Run `/accept` first.'));
        process.exit(1);
      }

      // 5. Load result
      const result = loadRunResult(runDir);
      if (!result) {
        console.error(chalk.red(`Error: Could not load results from ${runDir}`));
        process.exit(1);
      }

      // 6. Auto-upload if no shareUrl
      if (!result.shareUrl) {
        console.log(chalk.dim('Uploading results to cloud...'));
        saveHtmlReport(result);
        const shareUrl = await uploadResults(result);
        if (shareUrl) {
          result.shareUrl = shareUrl;
          await saveRunResult(result);
          console.log(chalk.dim(`Uploaded: ${shareUrl}`));
        } else {
          console.log(chalk.yellow('Warning: Upload failed. Comment will not include cloud link.'));
        }
      }

      // 7. Build comment
      const comment = buildPrComment(result);

      // 8. Check for existing comments
      try {
        const existingJson = execSync(
          `gh api repos/${slug}/issues/${prNumber}/comments --jq '[.[] | select(.body | contains("Codacy Accept — Verification Report"))] | length'`,
          { encoding: 'utf-8' },
        ).trim();
        const existingCount = parseInt(existingJson, 10);
        if (existingCount > 0) {
          console.log(chalk.yellow(`Warning: PR #${prNumber} already has ${existingCount} Codacy Accept comment(s).`));
          console.log(chalk.yellow('Posting a new comment anyway. Use the GitHub UI to remove duplicates if needed.'));
        }
      } catch {
        // Non-fatal — continue with posting
      }

      // 9. Post comment
      const commentFile = `${runDir}/pr-comment.md`;
      writeFileSync(commentFile, comment);

      try {
        const responseJson = execSync(
          `gh api repos/${slug}/issues/${prNumber}/comments -F body=@${commentFile}`,
          { encoding: 'utf-8' },
        );
        const response = JSON.parse(responseJson);
        console.log(chalk.green(`\nComment posted!`));
        console.log(chalk.cyan(response.html_url));
      } catch (err) {
        console.error(chalk.red('Error posting comment to GitHub.'));
        console.error(chalk.dim(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    } catch (err) {
      console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
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
- Capture the browser version for inclusion in results.json:
  1. Read \`.mcp.json\` and find the \`--browser\` arg in the playwright server's args array. Map the value: no flag or \`chrome\` → \`Chrome\`, \`firefox\` → \`Firefox\`, \`webkit\` → \`WebKit\`, \`msedge\` → \`Edge\`.
  2. Get the version number by running \`browser_evaluate\` with \`() => navigator.userAgent\`, then extract the version from the matching token (\`Chrome/<ver>\`, \`Firefox/<ver>\`, or \`Version/<ver>\` for WebKit).
  3. Combine into a short string, e.g. \`Chrome 143.0.0.0\`.

### 2. Parse the request

If "$ARGUMENTS" is a path to a \`.accept.md\` file (e.g. \`.accept/specs/checkout.accept.md\`):
1. Read the file contents
2. Parse all sections:
   - **Title**: from \`# Heading\`
   - **App URL**: from \`- App: <url>\`
   - **Why**: from \`> Why: ...\`
   - **Metadata** (optional): from \`## Metadata\` section — parse \`**Priority**:\`, \`**Area**:\`, \`**Requires Auth**:\`, \`**Estimated Duration**:\`
   - **Preconditions** (optional): from \`## Preconditions\` section — list items (\`- ...\`)
   - **Steps**: from \`## Steps\` section. Two formats are supported:
     - **Simple**: numbered items \`1. ...\`, \`2. ...\` — treat each as a step description
     - **Detailed**: \`### Step N: title\` with \`**Action**:\` and \`**Expected**:\` lines — use the Action as what to do and Expected as the pass/fail criteria for that step
   - **Success Criteria** (optional): from \`## Success Criteria\` section — list items (\`- ...\`)
   - **Notes** (optional): from \`## Notes\` section — list items (\`- ...\`)
3. Use the parsed title, URL, why, metadata, preconditions, steps, success criteria, and notes for the verification run
4. Set \`specFile\` in results.json to the file path (e.g. \`.accept/specs/checkout.accept.md\`)
5. Set \`specContent\` in results.json to the raw markdown content of the file
6. **Extract spec context**: Analyze the spec holistically (title, why, steps, metadata, notes) and generate a \`specContext\` object:
   - **category**: Classify the spec as one of: \`bug-fix\`, \`feature\`, \`epic\`, \`regression-test\`, \`smoke-test\`, \`integration-test\`, \`ux-improvement\`, \`performance\`, \`security\`, \`accessibility\`, or \`other\`. Use these heuristics:
     - If the title or why mentions "bug", "fix", "broken", "issue", "error" → \`bug-fix\`
     - If it describes a new capability or page → \`feature\`
     - If it covers a large multi-step workflow across multiple areas → \`epic\`
     - If it re-verifies something after a change → \`regression-test\`
     - If it checks basic health of a page or component → \`smoke-test\`
     - If it tests interaction between multiple systems or services → \`integration-test\`
     - If it focuses on visual polish, layout, responsiveness → \`ux-improvement\`
     - If it measures load times, rendering speed → \`performance\`
     - If it checks auth, CSRF, injection, permissions → \`security\`
     - If it checks ARIA, keyboard nav, screen reader compat → \`accessibility\`
   - **scope**: \`minor\` (1-3 steps, single component), \`moderate\` (4-7 steps, single feature), or \`major\` (8+ steps or multiple features/pages)
   - **summary**: A single sentence describing what this spec proves. Example: "Proves that the checkout flow completes successfully with a valid payment method."
   - **tags**: Extract 2-5 relevant tags from the content (e.g., \`["checkout", "payments", "cart"]\`). Derive from area, page names, component names, or domain concepts mentioned.
   - **businessContext**: (optional) A sentence describing the business impact. Derive this from the \`why\` field and the overall spec purpose. Example: "Revenue-critical path — broken checkout directly impacts sales."
   Set this as \`specContext\` in results.json.
7. If preconditions are present, verify them before running steps (e.g., check app is running)
8. After running all steps, evaluate success criteria and note which are met vs unmet

If "$ARGUMENTS" is a plain text description (not a file path), break it into 3-7 concrete test steps. Each step should be a single user action or assertion. For example:
- "verify the login page works" → navigate to login, check form fields visible, enter credentials, click submit, verify redirect
- "check homepage loads" → navigate to homepage, verify heading, check nav menu, verify no errors
In this case, do NOT set specFile, specContent, or specContext in results.json.

### 3. Execute each step with Playwright MCP

For each step:

1. **Understand the page**: Use \`browser_snapshot\` to get the accessibility tree. This tells you what elements are on the page and how to interact with them.

2. **Perform the action**:
   - \`browser_navigate\` — go to a URL
   - \`browser_click\` — click an element (use the \`ref\` from the snapshot)
   - \`browser_type\` — type text into an input (use the \`ref\` from the snapshot)
   - \`browser_select_option\` — select from a dropdown
   - \`browser_press_key\` — press a key (Enter, Tab, etc.)

3. **Highlight the target element**: If the step targets a specific element (click, type, assert visibility, etc.), use \`browser_evaluate\` with the element's \`ref\` to inject a visual highlight overlay before taking the screenshot. This makes screenshots self-explanatory by showing exactly which element was verified or interacted with.

   **Inject the highlight** (pass the element's \`ref\` and \`element\` description):
   \`\`\`js
   (element) => {
     const rect = element.getBoundingClientRect();
     const overlay = document.createElement('div');
     overlay.id = 'accept-highlight';
     overlay.style.cssText = \`
       position: fixed;
       top: \${rect.top - 4}px;
       left: \${rect.left - 4}px;
       width: \${rect.width + 8}px;
       height: \${rect.height + 8}px;
       border: 3px solid #e74c3c;
       border-radius: 6px;
       pointer-events: none;
       z-index: 999999;
       box-shadow: 0 0 0 4000px rgba(0,0,0,0.15), 0 0 12px rgba(231,76,60,0.6);
     \`;
     document.body.appendChild(overlay);
   }
   \`\`\`

   **Skip highlighting** for steps that have no specific target element, such as:
   - Navigation steps (\`browser_navigate\`)
   - Page-level assertions (e.g., verify page title, check for console errors)

4. **Take a viewport screenshot**: Use \`browser_take_screenshot\` after each step. Save the screenshot to \`.accept/runs/<NNN>/step-<N>.png\`. Always take a **viewport** screenshot (not an element screenshot) so the highlight overlay is visible in context.

5. **Remove the highlight**: After taking the screenshot, remove the overlay so it doesn't appear in subsequent steps. Use \`browser_evaluate\` without a \`ref\` (page-level):
   \`\`\`js
   () => {
     const el = document.getElementById('accept-highlight');
     if (el) el.remove();
   }
   \`\`\`

6. **Record the result**: Track pass/fail status and timing for each step.

**Important**: Use \`browser_snapshot\` before EVERY action to understand the current page state. The accessibility tree gives you the \`ref\` values needed for \`browser_click\`, \`browser_type\`, and the highlight injection.

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
    "why": "<why statement, if present>",
    "metadata": {
      "priority": "critical|high|medium|low",
      "area": "<area tag>",
      "requiresAuth": false,
      "estimatedDuration": "fast|medium|slow"
    },
    "preconditions": ["<condition 1>", "<condition 2>"],
    "successCriteria": ["<criterion 1>", "<criterion 2>"],
    "notes": ["<note 1>"],
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
  "reportPath": ".accept/runs/<NNN>",
  "browserVersion": "<short browser version, e.g. Chromium 143.0.0.0>",
  "specFile": "<path to .accept.md file, if applicable>",
  "specContent": "<raw markdown content, if applicable>",
  "specContext": {
    "category": "feature|bug-fix|epic|regression-test|smoke-test|integration-test|ux-improvement|performance|security|accessibility|other",
    "scope": "minor|moderate|major",
    "summary": "<one sentence describing what this spec proves>",
    "tags": ["<tag1>", "<tag2>"],
    "businessContext": "<optional: business impact sentence>"
  }
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

function generateMaketestSkill(): string {
  return `---
name: accept:maketest
description: Create a repeatable visual test spec by exploring your running app
user-invocable: true
argument-hint: '"login flow" or "checkout" or .accept/specs/03-dashboard.accept.md"'
---

# Accept — Create Repeatable Test Spec

When the user invokes this skill, YOU (Claude Code) explore the running app using Playwright MCP, then generate a detailed \`.accept.md\` test spec that can be re-run with \`/accept\`.

## Prerequisites

- The app must be running locally (check with the user if unsure)
- Playwright MCP server must be available (added by \`codacy-accept init\`)

## Steps

### 1. Setup

- Read \`.accept/config.json\` for the app URL. If not found, ask the user.
- Determine the test name and area from "$ARGUMENTS". Examples:
  - \`"login flow"\` → \`.accept/specs/02-auth-flow.accept.md\`
  - \`"checkout"\` → \`.accept/specs/04-checkout.accept.md\`
  - \`.accept/specs/03-dashboard.accept.md\` → use that exact path
- Look at existing \`.accept/specs/*.accept.md\` files to determine the next available number prefix and avoid duplicate coverage.

### 2. Explore the app

Open the app and **actively explore** the area the user asked about:

1. Use \`browser_navigate\` to go to the app URL
2. Use \`browser_snapshot\` to understand the page structure — read the full accessibility tree
3. Navigate through the relevant flows:
   - Click links, buttons, and menu items related to the requested area
   - Fill forms with example data to understand the flow
   - Note what pages/routes exist, what elements are interactive
   - Pay attention to loading states, error handling, empty states
4. Use \`browser_console_messages\` to check for errors
5. Take screenshots of key pages for your reference

**Goal**: Build a mental model of how the feature works so you can write precise Action/Expected pairs.

### 3. Generate the test spec

Write a \`.accept.md\` file using the **detailed step format**. Follow this structure exactly:

\`\`\`markdown
# Test: [Descriptive Title]

## Metadata
- **Priority**: critical | high | medium | low
- **Area**: [domain tag, e.g., auth, dashboard, commerce]
- **Requires Auth**: yes | no
- **Estimated Duration**: fast (<30s) | medium (<2min) | slow (>2min)

- App: [app URL from config]

> Why: [One sentence explaining the business importance of this test]

## Preconditions
- Application is running at \\\`[app URL]\\\`
- [Any other requirements: auth state, test data, fixtures]

## Steps

### Step 1: [Short action title]
**Action**: [Precise description of what to do — navigate, click, fill, wait, etc.]
**Expected**: [Observable page state after the action. What the user would see. Be specific about element visibility, text content, and URL changes.]

### Step 2: [Short action title]
**Action**: [...]
**Expected**: [...]

[... more steps ...]

## Success Criteria
- [Bullet points defining what "passing" means at a high level]

## Notes
- [Timing considerations, known edge cases, infrastructure dependencies]
\`\`\`

### 4. Writing rules for steps

Each step MUST have both **Action** and **Expected**:

- **Action** should be precise enough that someone (or Claude) can execute it unambiguously:
  - Name specific UI elements: "Click the 'Sign In' button" not "Click the button"
  - Include URLs when navigating: "Navigate to \\\`http://localhost:3000/auth\\\`"
  - Specify input values: "Type 'test@example.com' in the email field"
  - Reference fixture files by path: "Upload \\\`.accept/specs/fixtures/sample.pdf\\\`"

- **Expected** should describe the observable result:
  - What elements become visible: "A success toast appears saying 'Saved'"
  - URL changes: "The browser navigates to \\\`/dashboard\\\`"
  - Data displayed: "The table shows at least 3 rows of order data"
  - Loading states: "A spinner appears briefly, then the content loads"
  - Error absence: "No error-level console messages are present"

### 5. Scenarios

If the feature has multiple paths (e.g., success + error, with auth + without auth), use scenarios:

\`\`\`markdown
## Scenario A: Successful Login

### Step 1: Navigate to login
...

## Scenario B: Failed Login Attempt

### Step 7: Navigate to login with invalid credentials
...
\`\`\`

Number steps continuously across scenarios (don't restart at 1).

### 6. Fixtures

If the test needs fixtures (test data, file uploads, seeding scripts):

1. Create files in \`.accept/specs/fixtures/\`:
   - Upload files: \`.accept/specs/fixtures/sample-upload.pdf\`
   - Test data: \`.accept/specs/fixtures/test-data.json\`
   - Seeding scripts: \`.accept/specs/fixtures/scripts/seed-data.sh\`
2. Reference them in the spec's Preconditions section
3. Seeding scripts should output JSON to stdout with created IDs and credentials

### 7. Save and present

1. Write the spec file to the determined path (e.g., \`.accept/specs/03-dashboard.accept.md\`)
2. Present a summary to the user:
   \`\`\`
   Created: .accept/specs/03-dashboard.accept.md
   Steps: 8 (6 actions, 2 assertions)
   Area: dashboard
   Priority: high

   Run it with: /accept .accept/specs/03-dashboard.accept.md
   \`\`\`
3. Offer to run the test immediately with \`/accept\`

## Rules

- Always explore the app FIRST before writing the spec — don't guess at page structure
- Use \`browser_snapshot\` to understand element names and structure — reference elements by their visible labels, not CSS selectors
- Write steps that are **reproducible** — another Claude session should be able to execute them without ambiguity
- Keep step counts between 5-15 per scenario
- Use the numbered prefix convention: \`01-\`, \`02-\`, etc.
- If the area requires authentication, include login steps or reference \`.accept/auth.json\`
- Check existing specs to avoid overlap — extend rather than duplicate
- Include a console error check as the final step
`;
}

function generatePrSkill(): string {
  return `---
name: accept:pr
description: Post verification evidence on a GitHub PR as a rich comment
user-invocable: true
argument-hint: '<PR number>'
---

# Accept — Post Verification Evidence on GitHub PR

When the user invokes this skill, post the most recent \`/accept\` verification results as a rich markdown comment on a GitHub PR. This gives reviewers and PMs visual proof that the code works without leaving GitHub.

## Prerequisites

- \`gh\` CLI must be installed and authenticated (\`gh auth status\`)
- A recent \`/accept\` run must exist in \`.accept/runs/\`

## Steps

### 1. Validate environment

- Run \`gh auth status\` to confirm GitHub CLI is authenticated. If not, tell the user to run \`gh auth login\`.
- Run \`gh pr view $ARGUMENTS --json number,title,headRefOid,url\` to validate the PR exists. If not found, report the error.

### 2. Find the matching accept run

- Look in \`.accept/runs/\` for available runs (directories with \`results.json\`).
- If no runs exist, tell the user to run \`/accept\` first.
- Prefer a run whose \`commit\` field matches the PR's \`headRefOid\`. Otherwise use the most recent run.
- Read the \`results.json\` to confirm it loaded correctly.

### 3. Upload if needed

- Check if \`results.json\` has a \`shareUrl\` field.
- If not, run: \`codacy-accept upload --dir .accept/runs/<NNN> --json\`
- This generates the HTML report and uploads to the cloud, returning a share URL.

### 4. Post the PR comment

Run: \`codacy-accept pr $ARGUMENTS\`

This will:
- Build a rich markdown comment with a summary table, step details, and cloud report link
- Check for existing Codacy Accept comments on the PR (duplicate detection)
- Post the comment via the GitHub API
- Return the comment URL

### 5. Report to user

Tell the user:
- The comment URL (so they can see it on GitHub)
- Whether the run passed or failed
- The cloud report link for full screenshots and video

## Error Handling

| Scenario | What to do |
|----------|------------|
| \`gh\` not authenticated | Tell user to run \`gh auth login\` |
| PR not found | Tell user the PR number is invalid |
| No runs in \`.accept/runs/\` | Tell user to run \`/accept\` first |
| Upload fails | The comment will still be posted, just without the cloud link |
| Duplicate comment exists | Warn the user, but still post (they can delete duplicates on GitHub) |

## Rules

- Always validate the PR exists before attempting to post
- Never post without a verification run — the whole point is evidence
- Keep the comment concise — detailed screenshots are in the cloud report link
- If the run has failures, still post — reviewers need to see what failed too
`;
}
