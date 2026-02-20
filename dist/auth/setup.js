import Anthropic from '@anthropic-ai/sdk';
import { chromium } from 'playwright';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import chalk from 'chalk';
import { executeLogin } from './login.js';
const AUTH_CONFIG_PATH = '.accept/auth.json';
const AUTH_FILE_PATTERNS = [
    'auth.ts', 'auth.js', 'auth.tsx', 'auth.jsx',
    'middleware.ts', 'middleware.js',
    'login.ts', 'login.tsx', 'login.js', 'login.jsx',
    'next-auth', 'passport', 'clerk', 'supabase',
    'session', 'jwt', 'token',
];
function findAuthFiles(dir, depth = 3) {
    if (depth <= 0 || !existsSync(dir))
        return [];
    const results = [];
    try {
        for (const entry of readdirSync(dir)) {
            if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.next')
                continue;
            const full = join(dir, entry);
            try {
                const stat = statSync(full);
                if (stat.isDirectory()) {
                    results.push(...findAuthFiles(full, depth - 1));
                }
                else if (AUTH_FILE_PATTERNS.some((p) => entry.toLowerCase().includes(p.toLowerCase()))) {
                    results.push(full);
                }
            }
            catch {
                // skip inaccessible files
            }
        }
    }
    catch {
        // skip inaccessible dirs
    }
    return results;
}
async function prompt(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
export function loadAuthConfig() {
    if (!existsSync(AUTH_CONFIG_PATH))
        return null;
    try {
        return JSON.parse(readFileSync(AUTH_CONFIG_PATH, 'utf-8'));
    }
    catch {
        return null;
    }
}
export function saveAuthConfig(config) {
    mkdirSync('.accept', { recursive: true });
    writeFileSync(AUTH_CONFIG_PATH, JSON.stringify(config, null, 2));
}
async function testLogin(url, config) {
    console.log(chalk.dim('\nTesting login...'));
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
        const page = await context.newPage();
        await executeLogin(page, config);
        // Navigate to the app URL to confirm we're authenticated
        await page.goto(url, { waitUntil: 'networkidle' });
        const finalUrl = page.url();
        await context.close();
        await browser.close();
        // If we didn't get redirected back to login, auth worked
        const loginUrl = config.loginUrl || '';
        if (finalUrl.includes(loginUrl) && loginUrl) {
            console.log(chalk.red('  Login failed — redirected back to login page.'));
            return false;
        }
        console.log(chalk.green('  Login successful — reached authenticated state.'));
        return true;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(chalk.red(`  Login test failed: ${msg}`));
        if (browser)
            await browser.close().catch(() => { });
        return false;
    }
}
export async function setupAuth(url, apiKey) {
    console.log('\nScanning project for auth patterns...\n');
    const authFiles = findAuthFiles('.');
    let context = '';
    if (authFiles.length > 0) {
        console.log(`Found ${authFiles.length} auth-related files:`);
        for (const f of authFiles.slice(0, 10)) {
            console.log(chalk.dim(`  - ${f}`));
            try {
                const content = readFileSync(f, 'utf-8');
                context += `\n--- ${f} ---\n${content.slice(0, 3000)}\n`;
            }
            catch {
                // skip unreadable
            }
        }
    }
    else {
        console.log('No auth-related files found.');
    }
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    let suggestion = '';
    if (key && context) {
        console.log(chalk.dim('\nAnalyzing auth patterns with AI (Opus)...\n'));
        const client = new Anthropic({ apiKey: key });
        const response = await client.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 2048,
            messages: [
                {
                    role: 'user',
                    content: `You are analyzing a web application's authentication system for automated browser testing.

Given these source files from an app at ${url}, determine:
1. What auth framework/library is used? (NextAuth, Passport, Clerk, Auth0, Supabase Auth, custom JWT, etc.)
2. Where is the login page/route?
3. What login methods are supported? (email/password, OAuth, magic link, etc.)
4. How are sessions managed? (JWT, cookie, server session?)
5. Are there any test/seed users defined in the codebase?
6. What's the simplest way to authenticate for automated testing?

Be specific. Reference exact file paths and variable names.

Source files:
${context}

Provide your analysis in a clear, structured format. End with a recommendation: use test credentials, anonymous access, or skip auth.`,
                },
            ],
        });
        suggestion =
            response.content[0].type === 'text' ? response.content[0].text : '';
        console.log(suggestion);
    }
    console.log('\nAuth setup options:');
    console.log('  1. Use test credentials (fill login form)');
    console.log('  2. No auth needed (public app)');
    console.log('  3. Manual config (edit .accept/auth.json)');
    const choice = await prompt('\nChoose option (1-3): ');
    let config;
    if (choice === '1') {
        const loginUrl = await prompt('Login URL: ');
        const username = await prompt('Username/email: ');
        const password = await prompt('Password: ');
        config = {
            strategy: 'credentials',
            loginUrl,
            credentials: { username, password },
            notes: suggestion,
        };
        // Test the login before saving
        const loginWorks = await testLogin(url, config);
        if (!loginWorks) {
            console.log(chalk.yellow('\nLogin test failed. Saving config anyway — you can edit .accept/auth.json manually.'));
        }
    }
    else if (choice === '3') {
        config = {
            strategy: 'none',
            notes: 'Manual config — edit .accept/auth.json',
        };
    }
    else {
        config = { strategy: 'none' };
    }
    saveAuthConfig(config);
    console.log(chalk.green(`\nAuth config saved to ${AUTH_CONFIG_PATH}`));
    return config;
}
//# sourceMappingURL=setup.js.map