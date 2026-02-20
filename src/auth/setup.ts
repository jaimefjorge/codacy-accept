import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import { AuthConfig } from '../types.js';

const AUTH_CONFIG_PATH = '.accept/auth.json';

const AUTH_FILE_PATTERNS = [
  'auth.ts', 'auth.js', 'auth.tsx', 'auth.jsx',
  'middleware.ts', 'middleware.js',
  'login.ts', 'login.tsx', 'login.js', 'login.jsx',
  'next-auth', 'passport', 'clerk', 'supabase',
];

function findAuthFiles(dir: string, depth = 3): string[] {
  if (depth <= 0 || !existsSync(dir)) return [];
  const { readdirSync, statSync } = require('fs') as typeof import('fs');
  const results: string[] = [];

  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          results.push(...findAuthFiles(full, depth - 1));
        } else if (AUTH_FILE_PATTERNS.some((p) => entry.toLowerCase().includes(p.toLowerCase()))) {
          results.push(full);
        }
      } catch {
        // skip inaccessible files
      }
    }
  } catch {
    // skip inaccessible dirs
  }

  return results;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function loadAuthConfig(): AuthConfig | null {
  if (!existsSync(AUTH_CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(AUTH_CONFIG_PATH, 'utf-8')) as AuthConfig;
  } catch {
    return null;
  }
}

export function saveAuthConfig(config: AuthConfig): void {
  mkdirSync('.accept', { recursive: true });
  writeFileSync(AUTH_CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function setupAuth(url: string, apiKey?: string): Promise<AuthConfig> {
  console.log('\nScanning project for auth patterns...\n');

  const authFiles = findAuthFiles('.');
  let context = '';

  if (authFiles.length > 0) {
    console.log(`Found ${authFiles.length} auth-related files:`);
    for (const f of authFiles.slice(0, 10)) {
      console.log(`  - ${f}`);
      try {
        const content = readFileSync(f, 'utf-8');
        context += `\n--- ${f} ---\n${content.slice(0, 2000)}\n`;
      } catch {
        // skip unreadable
      }
    }
  } else {
    console.log('No auth-related files found.');
  }

  const key = apiKey || process.env.ANTHROPIC_API_KEY;

  let suggestion = '';
  if (key && context) {
    console.log('\nAnalyzing auth patterns with AI...\n');
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze these auth-related files from a web app at ${url} and suggest the simplest way to authenticate for automated testing. Focus on: what auth strategy is used, where's the login page, what fields are needed.

${context}

Reply in 2-3 sentences, then suggest: test credentials approach, anonymous approach, or skip auth.`,
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

  let config: AuthConfig;

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
  } else if (choice === '3') {
    config = {
      strategy: 'none',
      notes: 'Manual config — edit .accept/auth.json',
    };
  } else {
    config = { strategy: 'none' };
  }

  saveAuthConfig(config);
  console.log(`\nAuth config saved to ${AUTH_CONFIG_PATH}`);
  return config;
}
