# Codacy Accept — Phase 1 Implementation Plan
## The Atomic Proof of Concept
## February 2026

---

## What This Document Is

This is the build plan. Not the vision, not the strategy — those are in files 01-05. This is what we build, how we build it, and in what order. Two deliverables:

1. **CLI** (`codacy-accept`) — Node.js/TypeScript. Runs locally. Drives a browser. Captures proof.
2. **Results Server** — Built with Lovable. Accepts uploads. Serves shareable URLs. That's it.

The goal: a developer types `/accept "verify checkout works"`, gets screenshots in 30 seconds, and shares a link with their PM. No signup. No account. No code uploaded.

---

## Scope: What's In, What's Out

### IN (this build)

| Component | Description |
|-----------|-------------|
| **CLI: `codacy-accept run`** | Takes inline string or spec file, runs against a URL |
| **Inline spec parsing** | `codacy-accept run "verify login works" --url http://localhost:3000` |
| **File spec parsing** | `codacy-accept run specs/login.accept.md` |
| **AI translation** | Claude API: natural language steps + page accessibility tree → Playwright actions |
| **Translation caching** | Cache in `.accept/cache/`, keyed on hash(spec + page a11y snapshot) |
| **Single-device execution** | Chromium, headless, local Playwright |
| **Screenshot per step** | Saved to `.accept/runs/<id>/` |
| **Terminal output** | Color-coded, step-by-step with timing |
| **HTML report** | Self-contained, embedded screenshots (base64) |
| **No-signup cloud upload** | Auto-upload results to server, return shareable URL |
| **AI-powered auth setup** | `codacy-accept setup` — AI reads the codebase to understand auth, then asks the developer how to handle login (credentials, anonymous user, etc.). Saves auth config to `.accept/auth.json`. |
| **Claude Code skill** | `.claude/skills/accept.md` — enables `/accept` in Claude Code |
| **`codacy-accept init`** | Scaffolds skill file + example spec + .gitignore |
| **Local run history** | Last 10 runs with metadata |
| **npm package** | `npx codacy-accept` works globally |
| **Results server** | Lovable app: receives uploads, stores results, serves report pages |

### OUT (deferred — not in this build)

| Feature | Why It's Out |
|---------|-------------|
| Multi-device | Phase 2. Keeps MVP focused. |
| PR comment integration | Phase 2. Requires GitHub app, OAuth. Adds scope. |
| Team dashboard | Phase 3. No org-level features in PoC. |
| Lock mode | Phase 2. Explore mode is the PoC. |
| CI/CD mode | Phase 2. This is a developer tool first. |
| Video recording | Phase 2. Screenshots are the proof. |
| Jira/Linear integration | Phase 3. |
| Codacy user accounts | Not needed. Anonymous token is the identity. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  DEVELOPER'S MACHINE                                     │
│                                                          │
│  ┌─────────────────┐     ┌──────────────────────────┐   │
│  │ Claude Code      │     │ Terminal                  │   │
│  │                  │     │                           │   │
│  │ /accept "verify  │     │ $ codacy-accept run       │   │
│  │  checkout works" │     │   "verify checkout works" │   │
│  └────────┬─────────┘     │   --url localhost:3000    │   │
│           │               └─────────────┬─────────────┘   │
│           ▼                             ▼                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │               codacy-accept (Node.js/TS)              │ │
│  │                                                       │ │
│  │  ┌─────────────┐  ┌───────────────┐  ┌────────────┐ │ │
│  │  │ 1. Parser    │  │ 2. Translator │  │ 3. Runner  │ │ │
│  │  │              │  │               │  │            │ │ │
│  │  │ inline str   │→│ Claude API    │→│ Playwright  │ │ │
│  │  │ or .md file  │  │ steps + a11y  │  │ Chromium   │ │ │
│  │  │ → steps[]    │  │ → PW actions  │  │ headless   │ │ │
│  │  └─────────────┘  └───────────────┘  └─────┬──────┘ │ │
│  │                                             │        │ │
│  │  ┌─────────────┐  ┌───────────────┐  ┌─────▼──────┐ │ │
│  │  │ 6. Uploader  │←│ 5. Reporter   │←│ 4. Evidence│ │ │
│  │  │              │  │               │  │            │ │ │
│  │  │ POST results │  │ terminal out  │  │ screenshot │ │ │
│  │  │ to server    │  │ HTML report   │  │ per step   │ │ │
│  │  │ get URL back │  │ JSON data     │  │ organize   │ │ │
│  │  └──────┬───────┘  └───────────────┘  └────────────┘ │ │
│  └─────────┼─────────────────────────────────────────────┘ │
│            │                                                │
│  Local:    │    .accept/                                    │
│            │    ├── cache/          (translation cache)     │
│            │    ├── identity        (anonymous UUID)        │
│            │    └── runs/                                   │
│            │        ├── 001/                                │
│            │        │   ├── report.html                     │
│            │        │   ├── results.json                    │
│            │        │   ├── step-1.png                      │
│            │        │   ├── step-2.png                      │
│            │        │   └── ...                             │
│            │        └── 002/                                │
└────────────┼────────────────────────────────────────────────┘
             │
             │  HTTPS POST (results only — no code)
             │  { screenshots[], report.html, metadata }
             ▼
┌─────────────────────────────────────────────────────────┐
│  RESULTS SERVER (Lovable)                                │
│                                                          │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐ │
│  │ Upload API    │  │ Storage    │  │ Report Viewer   │ │
│  │               │  │            │  │                 │ │
│  │ POST /upload  │→│ S3 / Supabase │→│ GET /r/:id   │ │
│  │ anon token    │  │ bucket     │  │ renders HTML   │ │
│  │ → returns URL │  │            │  │ with screenshots│ │
│  └──────────────┘  └────────────┘  └─────────────────┘ │
│                                                          │
│  No auth required. No accounts. No code stored.          │
│  Results expire after 30 days (free tier).               │
└─────────────────────────────────────────────────────────┘
```

---

## Two Workstreams, Built in Parallel

### Workstream A: CLI (`codacy-accept`)

**Owner:** Engineer (Claude Code / TypeScript)
**Stack:** TypeScript, Node.js, Playwright, Claude API
**Distribution:** npm package (`npx codacy-accept`)

### Workstream B: Results Server

**Owner:** Built with Lovable (rapid prototyping)
**Stack:** Whatever Lovable generates (likely React + Supabase or similar)
**Scope:** 3 API endpoints + 1 page. Minimal.

These two workstreams can be built simultaneously. The CLI uploads to a URL. The server accepts at that URL. The contract between them is a single API endpoint.

---

## Workstream A: CLI — Detailed Build Plan

### A1. Project Scaffold

```
codacy-accept/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              ← CLI entry (commander.js)
│   ├── parser/
│   │   ├── inline.ts         ← parse inline string → Step[]
│   │   └── markdown.ts       ← parse .accept.md file → Step[]
│   ├── translator/
│   │   ├── translate.ts      ← Claude API: steps + a11y → Playwright code
│   │   └── cache.ts          ← file-based translation cache
│   ├── runner/
│   │   └── explore.ts        ← Playwright: execute actions, capture screenshots
│   ├── evidence/
│   │   └── collector.ts      ← organize screenshots, build results.json
│   ├── reporter/
│   │   ├── terminal.ts       ← color-coded terminal output
│   │   └── html.ts           ← self-contained HTML report (base64 images)
│   ├── uploader/
│   │   └── cloud.ts          ← POST results to server, return URL
│   ├── auth/
│   │   ├── setup.ts          ← AI reads codebase, asks dev how to auth
│   │   └── login.ts          ← execute auth before verification steps
│   ├── identity/
│   │   └── anonymous.ts      ← manage ~/.accept/identity UUID
│   └── types.ts              ← shared types
├── skill/
│   └── accept.md             ← Claude Code skill file (copied by `init`)
├── templates/
│   └── report.html           ← HTML report template
└── bin/
    └── codacy-accept         ← npm bin entry
```

### A2. Core Types

```typescript
// types.ts

interface Step {
  index: number;
  description: string;       // "Add a product to the cart"
  type: 'action' | 'assertion';  // inferred by AI
}

interface Spec {
  title: string;              // "Checkout flow"
  url: string;                // "http://localhost:3000"
  why?: string;               // "Checkout is 80% of revenue. Broken checkout = business stops."
  steps: Step[];
}

interface AuthConfig {
  strategy: 'credentials' | 'cookie' | 'anonymous-user' | 'none';
  loginUrl?: string;          // "/login", "/auth/signin"
  credentials?: {
    usernameField: string;    // selector or label
    passwordField: string;
    username: string;
    password: string;
  };
  cookiePath?: string;        // path to exported cookies.json
  setupScript?: string;       // custom Playwright code for auth (AI-generated)
  notes?: string;             // AI's understanding of the auth system
}

interface StepResult {
  step: Step;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;           // ms
  screenshot: string;         // file path to .png
  error?: string;             // failure message
  expected?: string;          // what was expected
  actual?: string;            // what was found
}

interface RunResult {
  id: string;                 // incrementing run number
  spec: Spec;
  steps: StepResult[];
  totalDuration: number;
  timestamp: string;          // ISO 8601
  commit?: string;            // git HEAD if available
  passed: number;
  failed: number;
  reportPath: string;         // local HTML report path
  shareUrl?: string;          // cloud URL after upload
}
```

### A3. AI Model Strategy

Not every task needs the same brain. Use Sonnet for speed/cost, Opus for tasks where getting it right matters more than speed.

| Task | Model | Why |
|------|-------|-----|
| **Inline spec → structured steps** | **Sonnet** | Simple parsing/expansion. Speed matters. |
| **Auth codebase analysis** | **Opus** | Must reason about auth patterns across multiple files, frameworks, middleware. Getting this wrong = broken setup. |
| **Auth setup conversation** | **Opus** | Must ask the right questions based on codebase understanding. One-time cost per project. |
| **Step → Playwright code translation** | **Sonnet** | High volume (every step, every run). Must be fast and cheap. Cached after first call. |
| **Assertion verification** | **Sonnet** | "Is this what the user expected?" — straightforward visual/text matching. |
| **Failure diagnosis** | **Opus** | When a step fails, explain WHY in a way the developer can act on. Needs deep reasoning about what went wrong. |
| **Spec auto-expansion** (inline → full steps) | **Sonnet** | "verify checkout works" → 5 discrete steps. Pattern matching, not deep reasoning. |

**Cost estimate per run (5 steps, no cache hits):**
- 5 × Sonnet translation calls ≈ $0.01-0.02
- 0-1 Opus failure diagnosis calls ≈ $0.03-0.05 (only on failure)
- Typical run: **$0.01-0.02** (most steps will cache after first run)

**Cost estimate for auth setup (one-time per project):**
- 1 Opus codebase analysis ≈ $0.05-0.10
- Amortized over all future runs = negligible

### A4. Build Order (sequential — each depends on the previous)

#### Step 1: Parser + Spec Format (Day 1-2)

**Inline parser:**
- Input: `"verify the login page works — enter email, click sign in, see dashboard"`
- Output: `Step[]` — split on sentence boundaries, numbered
- Simple: split on commas, periods, dashes, newlines. Each fragment = one step.
- The AI translator handles ambiguity — the parser just tokenizes.

**Markdown parser:**
- Input: `.accept.md` file
- Output: `Spec { title, url, why?, steps[] }`
- Parse frontmatter-style metadata (`- App: http://...`)
- Parse optional `> Why:` blockquote as business context
- Parse numbered list items as steps
- Lightweight: regex/string-based. No AST library needed.

**Spec format with business context (`> Why:` block):**

```markdown
# specs/checkout.accept.md

- App: http://localhost:3000

> Why: Checkout is 80% of revenue. Broken checkout = lost orders.
> This is the most critical flow for the business.

## Verify: Checkout flow
1. Add a product to the cart
2. Apply discount code "SAVE20"
3. Go to checkout
4. Pay with test card 4242424242424242
5. See order confirmation with correct total
```

The `> Why:` block is **optional**. If present, it appears prominently at the top of the HTML report and cloud report page. This is how the developer communicates business context to the PM who opens the proof link — they see *why this matters* before they see the screenshots.

For inline specs, there's no `> Why:` block — those are quick one-off verifications.

**Test:** Parse 10 inline strings and 5 markdown files (some with `> Why:`, some without). Assert correct Spec output.

#### Step 2: AI Translator (Day 3-5)

The core intelligence. This is where Claude turns natural language into Playwright actions.

**Input:**
```typescript
{
  step: "Add a product to the cart",
  pageAccessibilityTree: "..." // from page.accessibility.snapshot()
}
```

**Output:**
```typescript
{
  playwrightCode: `
    await page.getByRole('button', { name: 'Add to Cart' }).first().click();
    await page.waitForSelector('[data-testid="cart-count"]');
  `,
  reasoning: "Found 'Add to Cart' button via accessibility tree"
}
```

**The Claude API prompt (uses Sonnet — high volume, must be fast and cheap):**

```
You are a browser automation expert. Given a user's instruction and the page's
accessibility tree, generate Playwright code to execute the instruction.

Rules:
1. Use ONLY accessibility-tree selectors (getByRole, getByText, getByLabel).
   Never use CSS selectors or XPath.
2. Always wait for the action to complete (waitForSelector, waitForNavigation,
   or waitForLoadState as appropriate).
3. If the instruction is an assertion ("see the dashboard", "shows the total"),
   use expect() with a meaningful assertion.
4. Return ONLY executable Playwright code. No imports, no test wrapper.
5. If you cannot determine how to execute the step, return an error message
   starting with "ERROR:".

Page accessibility tree:
{accessibility_tree}

User instruction:
{step_description}

Playwright code:
```

**Translation cache:**
- Key: `hash(step.description + accessibilityTreeSnapshot)`
- Value: `{ playwrightCode, timestamp }`
- Storage: `.accept/cache/<hash>.json`
- Cache hit = skip Claude API call = fast + free

**Test:** Translate 20 steps across 5 different web apps. Measure success rate. This IS Phase 0 validation.

#### Step 3: Auth Setup (Day 5-6)

**The problem:** Most real web apps require authentication. If `/accept` can't get past the login screen, it's useless for 60%+ of real verification scenarios.

**The solution:** An AI-powered setup step that reads the codebase, understands how auth works, and asks the developer what to do — once per project.

**`codacy-accept setup`:**

```
$ codacy-accept setup --url http://localhost:3000

  Codacy Accept — Project Setup
  ──────────────────────────────

  🔍 Analyzing your codebase for authentication patterns...

  Found:
  • Auth framework: NextAuth.js (src/auth.ts)
  • Login page: /login (src/app/login/page.tsx)
  • Providers: credentials (email/password), Google OAuth
  • Session: JWT stored in httpOnly cookie
  • Test users: found in seed/users.ts (test@example.com / testpass123)

  How should Codacy Accept handle authentication?

  [1] Use test credentials (test@example.com / testpass123)  ← recommended
  [2] Create an anonymous/guest session
  [3] I'll provide different credentials
  [4] Skip auth — my app doesn't require login
  [5] Let me configure this manually

  > 1

  ✓ Auth configured. Saved to .accept/auth.json
  ✓ Tested login — successfully reached authenticated state.

  You're ready. Try: codacy-accept run "verify the dashboard loads"
```

**How the AI codebase analysis works (uses Opus):**

```typescript
async function analyzeAuth(projectDir: string): Promise<AuthAnalysis> {
  // 1. Scan for auth-related files
  const authFiles = await findAuthFiles(projectDir);
  // Looks for: auth.ts, middleware.ts, login/, signin/,
  // next-auth, passport, clerk, auth0, supabase auth,
  // JWT utils, session config, etc.

  // 2. Read the relevant files (not the whole codebase)
  const fileContents = await readFiles(authFiles);

  // 3. Ask Opus to analyze (one-time cost per project)
  const analysis = await claude.opus({
    prompt: `You are analyzing a web application's authentication system.

    Given these source files, determine:
    1. What auth framework/library is used?
    2. Where is the login page/route?
    3. What login methods are supported (email/pass, OAuth, magic link)?
    4. How are sessions managed (JWT, cookie, server session)?
    5. Are there any test/seed users defined?
    6. What's the simplest way to authenticate for testing?

    Be specific. Reference exact file paths and variable names.

    Source files:
    ${fileContents}`,
  });

  return analysis;
}
```

**What gets saved (`.accept/auth.json`):**

```json
{
  "strategy": "credentials",
  "loginUrl": "/login",
  "credentials": {
    "usernameField": "Email",
    "passwordField": "Password",
    "username": "test@example.com",
    "password": "testpass123"
  },
  "notes": "NextAuth.js with credentials provider. Login page at /login. Test user from seed/users.ts.",
  "generatedAt": "2026-02-20T14:30:00Z"
}
```

**How auth is used during verification runs:**

Before executing spec steps, the Runner checks for `.accept/auth.json`. If present:

1. Navigate to `loginUrl`
2. AI generates Playwright code to fill credentials and submit (using Sonnet — it's a simple form interaction)
3. Wait for successful login (detect redirect to authenticated page)
4. Proceed with spec steps on the now-authenticated session

If auth fails, the run stops with a clear error: "Login failed. Run `codacy-accept setup` to reconfigure."

**Auth is cached per browser context:** Login happens once per run, not once per step. Playwright's browser context preserves cookies/session across all steps.

**Edge cases handled:**
- **No auth needed:** Developer picks option 4 ("Skip auth"). No login step added.
- **OAuth/SSO:** AI detects OAuth and recommends cookie injection instead: "I found Google OAuth. For testing, export your browser cookies and provide the path." Falls back to `--cookies cookies.json`.
- **MFA/2FA:** AI detects MFA and warns: "This app uses 2FA. For testing, either disable 2FA for test users or provide a cookie file from an authenticated session."
- **API keys:** AI detects API-key auth (common in internal tools) and asks for the key.

**The key insight:** This is a **one-time setup per project**. The cost of one Opus call to deeply understand the codebase is amortized across every future `/accept` run. And because the AI reads the actual code, it can give specific, correct guidance — not generic "configure auth" instructions.

#### Step 4: Runner (Day 6-8)

**Explore mode execution:**

```typescript
async function explore(spec: Spec): Promise<RunResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Auth: if .accept/auth.json exists, login first
  const authConfig = loadAuthConfig();
  if (authConfig && authConfig.strategy !== 'none') {
    await executeLogin(page, authConfig);  // navigate to login, fill creds, wait for redirect
  }

  await page.goto(spec.url);
  const results: StepResult[] = [];

  for (const step of spec.steps) {
    const startTime = Date.now();

    // 1. Get current page state
    const a11yTree = await page.accessibility.snapshot();

    // 2. Translate step (or cache hit)
    const translation = await translate(step, a11yTree);

    // 3. Execute Playwright code
    try {
      await executePlaywrightCode(page, translation.playwrightCode);

      // 4. Screenshot
      const screenshotPath = `.accept/runs/${runId}/step-${step.index}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        step,
        status: 'passed',
        duration: Date.now() - startTime,
        screenshot: screenshotPath,
      });
    } catch (error) {
      // Screenshot on failure too
      const screenshotPath = `.accept/runs/${runId}/step-${step.index}-failed.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        step,
        status: 'failed',
        duration: Date.now() - startTime,
        screenshot: screenshotPath,
        error: error.message,
      });
    }
  }

  await browser.close();
  return buildRunResult(spec, results);
}
```

**Key decisions:**
- `headless: true` by default. `--headed` flag for debugging.
- Screenshot is viewport-only (not fullPage) — faster, more relevant.
- Execution continues after failure (captures remaining steps as skipped or attempts them).
- `executePlaywrightCode` uses `new Function()` or `vm.runInNewContext()` to execute the AI-generated Playwright code safely within the page context.

**Test:** Run 10 specs against real web apps. Measure pass rate and timing.

#### Step 5: Evidence Collector (Day 8-9)

**Organizes run output:**

```
.accept/runs/007/
├── results.json          ← structured run data
├── report.html           ← self-contained HTML report
├── step-1.png
├── step-2.png
├── step-3.png
├── step-4-failed.png
└── step-5.png
```

**`results.json`:**
```json
{
  "id": "007",
  "spec": { "title": "Checkout flow", "url": "http://localhost:3000" },
  "timestamp": "2026-02-20T14:30:00Z",
  "commit": "a1b2c3d",
  "totalDuration": 11000,
  "passed": 4,
  "failed": 1,
  "steps": [
    {
      "index": 1,
      "description": "Add a product to the cart",
      "status": "passed",
      "duration": 2100,
      "screenshot": "step-1.png"
    }
  ]
}
```

**Run numbering:** Auto-increment. Read `.accept/runs/` directory, find highest number, +1.

**Git commit:** Read `git rev-parse HEAD` if in a git repo. Optional — works without git.

**History management:** Keep last 10 runs. Delete oldest when limit reached.

#### Step 6: Terminal Reporter (Day 9-10)

**Output format:**

```
  Codacy Accept — Explore Mode
  Target: http://localhost:3000

  Checkout Flow
  ─────────────

  ✓ Add product to cart                              2.1s
    📸 screenshot captured

  ✓ Apply discount code SAVE20                       1.8s
    📸 screenshot captured

  ✗ Go to checkout                                   2.4s
    Expected: checkout page visible
    Found: button "Checkout" not found in page
    📸 .accept/runs/007/step-3-failed.png

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Run #007 | 4/5 passed, 1 failed | 11.0s

  Report: .accept/runs/007/report.html
  Share:  https://accept.codacy.com/r/a1b2c3d ← no signup needed
```

**Implementation:** Use `chalk` for colors. Green ✓, red ✗. Progress shown in real-time as steps execute (not batched at end).

#### Step 7: HTML Reporter (Day 10-11)

**Self-contained HTML file** — single .html file with everything embedded:
- CSS inline (no external stylesheets)
- Screenshots embedded as base64 data URIs
- No JavaScript frameworks — vanilla HTML/CSS
- Clean, professional design. Each step = a card with screenshot.
- Print-friendly (someone might print this for a meeting — seriously)

**Template approach:** A single `report.html` template file. Inject data via string replacement. No template engine needed.

**Key sections:**
1. Header: spec title, URL, timestamp, commit, pass/fail summary
2. **Business context** (if `> Why:` block present): prominent callout box explaining why this verification matters. This is the first thing a PM reads. Styled differently from technical content — larger text, business language, no code.
3. Step cards: one per step — description, status badge, timing, screenshot
4. Footer: "Generated by Codacy Accept" + link to product page

#### Step 8: Cloud Uploader (Day 11-12)

**On every run, automatically upload results:**

```typescript
async function upload(runResult: RunResult): Promise<string> {
  const identity = getOrCreateIdentity();  // ~/.accept/identity

  // Build upload payload — NO CODE, only results
  const payload = {
    anonymousId: identity.uuid,
    results: runResult,  // metadata only, not Playwright code
    report: readFileSync(runResult.reportPath),  // HTML report
    screenshots: runResult.steps.map(s => ({
      stepIndex: s.step.index,
      data: readFileSync(s.screenshot),  // base64 PNG
    })),
  };

  const response = await fetch('https://accept.codacy.com/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const { url } = await response.json();
  return url;  // e.g. "https://accept.codacy.com/r/a1b2c3d"
}
```

**Anonymous identity:**
- First run: generate UUIDv4, save to `~/.accept/identity`
- Subsequent runs: read from file
- This UUID groups all runs from this developer (for future "claim your results" flow)
- No PII. No email. No name.

**Upload is non-blocking:** If upload fails (network error, server down), the CLI still completes. Local results are always available. Upload failure shows a warning, not an error.

**Opt-out:** `--no-upload` flag or `CODACY_ACCEPT_NO_UPLOAD=1` env var.

#### Step 9: CLI Entry Point (Day 12-13)

```
codacy-accept run "verify checkout works" --url http://localhost:3000
codacy-accept run specs/checkout.accept.md
codacy-accept run specs/checkout.accept.md --headed    (visible browser)
codacy-accept run specs/checkout.accept.md --no-upload (skip cloud upload)
codacy-accept setup --url http://localhost:3000        (AI-powered auth setup)
codacy-accept init                                     (scaffold skill + example)
codacy-accept history                                  (list last 10 runs)
```

**CLI framework:** `commander.js` — lightweight, standard.

**`codacy-accept init`:**
1. Creates `.claude/skills/accept.md` (the Claude Code skill file)
2. Creates `specs/example.accept.md` (example spec with `> Why:` block)
3. Appends `.accept/` to `.gitignore`
4. Prints: "Done. Run `codacy-accept setup --url http://localhost:3000` to configure auth, then try `/accept 'verify your app works'`"

#### Step 10: Claude Code Skill File (Day 13-14)

The skill file is what enables `/accept` in Claude Code. It's a markdown file that teaches Claude Code how to use the CLI.

```markdown
# /accept — Verify what your AI agent just built

## Usage
/accept "description of what to verify"
/accept specs/checkout.accept.md

## What this does
Runs Codacy Accept to verify your application works. Drives a browser,
captures screenshots at every step, and uploads proof to the cloud.

## Prerequisites
- Your app must be running locally (e.g., http://localhost:3000)
- Install: npm install -g codacy-accept (or npx codacy-accept)

## How to run
When the user types /accept followed by a description or file path:

1. Determine the app URL:
   - If the spec file has `- App: <url>`, use that
   - Otherwise, check if a dev server is running and use its URL
   - If unclear, ask the user: "What URL is your app running on?"

2. Check if auth is configured:
   - If `.accept/auth.json` does not exist and the app likely requires login,
     suggest: "This app may require authentication. Run `codacy-accept setup --url <url>` first."

3. Run the command:
   ```bash
   codacy-accept run "<user's description>" --url <app-url>
   ```
   OR if a spec file was provided:
   ```bash
   codacy-accept run <spec-file-path>
   ```

4. Show the terminal output to the user

5. If any steps fail, ask:
   "Step X failed: <error>. Should I fix the code, or is the spec wrong?"

## Example
User: /accept "verify the login page works — enter email and password, click sign in, see the dashboard"

Run: codacy-accept run "verify the login page works — enter email and password, click sign in, see the dashboard" --url http://localhost:3000
```

#### Step 11: npm Package & Polish (Day 14-15)

- `package.json` with `bin` field pointing to CLI entry
- `postinstall` script to check Playwright browsers installed (`npx playwright install chromium`)
- `README.md` with quickstart (3 commands to first verification)
- Error messages that are helpful, not stack traces
- Graceful handling of: no internet, no API key, app not running, Playwright not installed

---

## Workstream B: Results Server — Detailed Build Plan

### Built with Lovable

The server is intentionally minimal. Three API endpoints and one page.

### B1. Data Model

```
Table: runs
  id          UUID (primary key, auto-generated)
  short_id    VARCHAR(8) (for URL: /r/a1b2c3d) — random, unique
  anonymous_id UUID (from client's ~/.accept/identity)
  title       VARCHAR(255) (spec title)
  why         TEXT (business context from > Why: block, nullable)
  url         VARCHAR(255) (app URL that was tested)
  commit      VARCHAR(40) (git commit hash, nullable)
  timestamp   TIMESTAMP
  duration_ms INTEGER
  passed      INTEGER
  failed      INTEGER
  results_json JSONB (full results.json)
  report_html TEXT (full HTML report)
  created_at  TIMESTAMP (for 30-day expiry)

Table: screenshots
  id          UUID (primary key)
  run_id      UUID (FK → runs.id)
  step_index  INTEGER
  image_data  BYTEA or S3 reference
```

### B2. API Endpoints

#### `POST /api/upload`

Receives run results from the CLI. Returns a shareable URL.

**Request:**
```json
{
  "anonymousId": "uuid-from-client",
  "results": { /* results.json content */ },
  "report": "<html>...</html>",
  "screenshots": [
    { "stepIndex": 1, "data": "base64-encoded-png" },
    { "stepIndex": 2, "data": "base64-encoded-png" }
  ]
}
```

**Response:**
```json
{
  "url": "https://accept.codacy.com/r/a1b2c3d",
  "shortId": "a1b2c3d",
  "expiresAt": "2026-03-22T14:30:00Z"
}
```

**Logic:**
1. Generate unique `short_id` (7 chars, alphanumeric)
2. Store results, report HTML, and screenshots
3. Return the shareable URL

**No authentication. No rate limiting (initially). No validation beyond basic sanity checks.**

#### `GET /r/:shortId`

Serves the report page for anyone with the link.

**Logic:**
1. Look up run by `short_id`
2. If not found → 404 page
3. If found → render report page with screenshots

**The page:**
- Clean, professional, read-only view
- Spec title, URL, timestamp, commit
- Step-by-step results with screenshots
- Pass/fail summary
- "Generated by Codacy Accept" footer with link to product
- No login, no paywall, no cookie banner

#### `GET /api/runs?anonymousId=:uuid`

Returns list of runs for a given anonymous ID. Used by `codacy-accept history --cloud`.

**Response:**
```json
{
  "runs": [
    {
      "shortId": "a1b2c3d",
      "title": "Checkout flow",
      "timestamp": "2026-02-20T14:30:00Z",
      "passed": 5,
      "failed": 0,
      "url": "https://accept.codacy.com/r/a1b2c3d"
    }
  ]
}
```

### B3. Report Viewer Page

The single most important page. When someone clicks a shared link, this is what they see.

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  Codacy Accept — Verification Report             │
│                                                   │
│  Checkout Flow                                    │
│  http://localhost:3000                            │
│  Feb 20, 2026 · commit a1b2c3d · 11.0s          │
│                                                   │
│  ┌─── Why this matters ───────────────────────┐  │
│  │ Checkout is 80% of revenue. Broken          │  │
│  │ checkout = lost orders.                     │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─── ✅ 5/5 passed ──────────────────────────┐  │
│  │                                              │  │
│  │  ✅ 1. Add product to cart            2.1s  │  │
│  │  ┌──────────────────────────────────┐       │  │
│  │  │                                  │       │  │
│  │  │        [screenshot]              │       │  │
│  │  │                                  │       │  │
│  │  └──────────────────────────────────┘       │  │
│  │                                              │  │
│  │  ✅ 2. Apply discount code SAVE20     1.8s  │  │
│  │  ┌──────────────────────────────────┐       │  │
│  │  │                                  │       │  │
│  │  │        [screenshot]              │       │  │
│  │  │                                  │       │  │
│  │  └──────────────────────────────────┘       │  │
│  │                                              │  │
│  │  ...                                         │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  Generated by Codacy Accept · codacy.com/accept   │
└──────────────────────────────────────────────────┘
```

**Key UX decisions:**
- Screenshots are large and prominent — the PM is here to SEE proof
- Failures are highlighted in red with expected vs actual
- Mobile-responsive (PM might open the link on their phone)
- Fast load — screenshots lazy-loaded
- No login prompts, no upsell banners, no cookie consent

### B4. Expiry & Cleanup

- Free-tier runs expire after 30 days
- CRON job (or Supabase scheduled function) deletes expired runs + screenshots
- Before deletion window, show "expires in X days" on the report page
- Future: "Claim this run" → link to Codacy account for permanent storage

---

## The Contract Between CLI and Server

The integration point is simple: one API call.

```
CLI                                    Server
 │                                       │
 │  POST /api/upload                     │
 │  {                                    │
 │    anonymousId: "uuid",               │
 │    results: { ... },                  │
 │    report: "<html>...</html>",        │
 │    screenshots: [{ base64 }]          │
 │  }                                    │
 │  ──────────────────────────────────►  │
 │                                       │
 │  { url: "https://accept.codacy.com/   │
 │         r/a1b2c3d" }                  │
 │  ◄──────────────────────────────────  │
 │                                       │
```

**Max payload size:** ~10MB (5 steps × 2MB screenshots). Sufficient for MVP. Optimize later if needed.

**Error handling:** If server is unreachable, CLI prints warning and continues. Local results always work.

---

## Build Timeline

```
Week 1:  ┌─ Steps 1-2: Scaffold + Parser + Spec Format ───┐  ┌─ B1-B2: Server scaffold + API ─┐
         └─────────────────────────────────────────────────┘  └─────────────────────────────────┘

Week 2:  ┌─ Step 2: AI Translator (the hard part) ─── Phase 0 validation ─────┐
         └─────────────────────────────────────────────────────────────────────┘
         ┌─ B3: Report viewer page (with Why block) ──────────────────────────┐
         └────────────────────────────────────────────────────────────────────┘

  2.5:   ┌─ Buffer: if 80-90% success, iterate on prompts (3 days) ──────────┐
         └────────────────────────────────────────────────────────────────────┘

Week 3:  ┌─ Step 3: Auth Setup (Opus codebase analysis) ──────────────────────┐
         └─────────────────────────────────────────────────────────────────────┘
         ┌─ Step 4: Runner + Auth integration ─────────────────────────────────┐
         └─────────────────────────────────────────────────────────────────────┘
         ┌─ B4: Expiry + polish ──────┐
         └────────────────────────────┘

Week 4:  ┌─ Steps 5-8: Evidence + Reporters + Cloud Uploader ─────────────────┐
         └─────────────────────────────────────────────────────────────────────┘
         ┌─ Integration testing (CLI ↔ Server) ────────────────────────────────┐
         └─────────────────────────────────────────────────────────────────────┘

Week 5:  ┌─ Steps 9-11: CLI polish + Skill file + npm publish ────────────────┐
         └─────────────────────────────────────────────────────────────────────┘
         ┌─ Dogfood at Codacy ─────────────────────────────────────────────────┐
         └─────────────────────────────────────────────────────────────────────┘
```

**Total: 5 weeks + 3-day buffer. 1 engineer on CLI. Lovable for server. Overlap in weeks 1-3.**

---

## Phase 0 Embedded in the Build

Phase 0 (validation) isn't separate — it's embedded in Step A3 (AI Translator).

**During Week 2, while building the translator, test against real apps:**

| App Type | Examples to Test Against |
|----------|------------------------|
| React/Next.js | Any Vercel template, a real client app |
| Vue/Nuxt | Nuxt starter, real project |
| Standard HTML | Marketing pages, docs sites |
| Auth flows | Login pages with forms |
| E-commerce | Checkout flows, cart interactions |

**Go/no-go at end of Week 2:**
- >90% success on 5-step specs against 10+ real apps → continue
- 80-90% → identify failure patterns, decide if fixable in 1 week
- <80% → stop. Reassess approach.

**This means we know if the product works before we're halfway through the build.**

---

## What the Developer Experiences (End-to-End)

### First Time

```bash
# Install
$ npm install -g codacy-accept

# Init (sets up Claude Code skill + example spec)
$ codacy-accept init
  ✓ Created .claude/skills/accept.md
  ✓ Created specs/example.accept.md
  ✓ Updated .gitignore

# Setup auth (one-time per project — AI reads your codebase)
$ codacy-accept setup --url http://localhost:3000

  🔍 Analyzing your codebase for authentication patterns...

  Found: NextAuth.js with credentials provider.
  Test user: test@example.com (from seed/users.ts)

  How should Codacy Accept handle authentication?
  [1] Use test credentials (test@example.com / testpass123) ← recommended
  > 1

  ✓ Auth configured. Saved to .accept/auth.json
  ✓ Tested login — success.

# First run — inline
$ codacy-accept run "verify the homepage loads and shows a hero section" --url http://localhost:3000

  Codacy Accept — Explore Mode
  Target: http://localhost:3000

  Homepage Verification
  ─────────────────────

  ✓ Homepage loads                                     1.2s
    📸 screenshot captured

  ✓ Hero section visible                               0.8s
    📸 screenshot captured

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Run #001 | 2/2 passed | 2.0s

  Report: .accept/runs/001/report.html
  Share:  https://accept.codacy.com/r/x7k9m2p ← no signup needed

# Developer copies the link, pastes in Slack:
# "Hey @pm — homepage is verified, here's proof: https://accept.codacy.com/r/x7k9m2p"
```

### From Claude Code

```
Developer: /accept "verify the checkout flow works — add item, apply SAVE20 discount, complete payment, see confirmation"

Claude Code: Running codacy-accept...

  Codacy Accept — Explore Mode
  Target: http://localhost:3000

  Checkout Flow
  ─────────────

  ✓ Add item to cart                                   2.1s
  ✓ Apply discount code SAVE20                         1.8s
  ✓ Complete payment                                   3.2s
  ✓ See order confirmation                             1.5s

  Run #003 | 4/4 passed | 8.6s
  Share: https://accept.codacy.com/r/p3q8r1s

Claude Code: All 4 verification steps passed. The checkout flow is working
correctly. Proof link: https://accept.codacy.com/r/p3q8r1s
```

---

## Success Criteria for This Build

| Metric | Target |
|--------|--------|
| A developer can go from `npm install` to shareable proof link | < 5 minutes |
| 5-step verification completes | < 30 seconds |
| AI translation success rate on real web apps | > 90% |
| Cloud upload works without any signup | 100% of runs |
| PM can open shared link and understand results | Without explanation |
| Codacy developers use `/accept` daily after internal launch | > 5 of 10 |

---

## Dependencies & Risks

| Dependency | Risk | Mitigation |
|-----------|------|------------|
| Claude API availability/cost | Medium | Cache aggressively. Sonnet for translation ($0.01/run). Opus only for one-time setup + failure diagnosis. |
| Playwright browser install | Low | `postinstall` script handles it. Well-documented. |
| Lovable-generated server reliability | Medium | Server is dead simple (3 endpoints). If Lovable output is shaky, rebuild in Express in 2 days. |
| AI translation quality (Sonnet) | **High** | This is the make-or-break. Embedded Phase 0 validates before committing. Week 2.5 buffer for prompt iteration. |
| Auth codebase analysis (Opus) | Medium | One-time cost per project. If Opus misidentifies auth pattern, developer corrects during interactive setup. |
| Upload payload size (screenshots) | Low | Compress PNGs. 5 screenshots ≈ 2-5MB. Acceptable. |

---

## What Comes After This Build

If this PoC works — developers use it, share links, PMs look at proof — then:

1. **Multi-device** (Phase 2) — Desktop + mobile viewports in parallel
2. **PR comments** (Phase 2) — Auto-post results on GitHub PRs
3. **Lock mode** (Phase 2) — Save deterministic Playwright tests for CI
4. **Team dashboard** (Phase 3) — Org-level view of all verifications
5. **Account claiming** — Link anonymous runs to a Codacy account

But none of that matters if developers don't use `/accept` more than once. This build proves whether they do.

---

*Implementation Plan v2 — February 2026*
*Scope: Phase 1 PoC = CLI (with auth setup) + Results Server*
*AI models: Sonnet (translation, assertions) + Opus (auth analysis, failure diagnosis)*
*Build with: Claude Code (CLI) + Lovable (Server)*
*Timeline: 5 weeks + 3-day buffer*
