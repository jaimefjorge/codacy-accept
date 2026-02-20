# Codacy Accept — Final Product Specification
## "Post-Agent Verification with Team-Visible Proof"
## February 2026 — The Spec That Absorbed Its Own Objections

---

## How to Read This Document

This is the definitive spec. It was forged through five rounds of analysis:
1. Market research → identified the opportunity
2. Product spec v1-v3 → designed the ideal product
3. Objections analysis → stress-tested every assumption against 20 years of evidence
4. Strategic pivot → killed the assumptions that don't survive contact with reality
5. Fine-tuning → deferred multi-device from MVP, added zero-friction cloud proof (no signup)
6. Implementation alignment → AI-powered auth setup, Sonnet/Opus model strategy, business context in specs

**Every design decision below has a corresponding objection it addresses.** Nothing is aspirational. Everything is grounded in what humans actually do.

---

## 1. What We're Building (Final)

### One Sentence
**A developer verification tool that proves AI agent output works — and makes that proof visible to the whole team, instantly, without signup.**

### What It Is
- A Claude Code skill (`/accept`) and CLI (`codacy-accept`) that drives a browser to verify what an agent just built
- Screenshots of every step in 30 seconds
- Shareable proof reports uploaded to the cloud automatically — no signup, no account, no code uploaded
- Anyone — PM, GTM, leadership — can click a link and see the proof without Git or code
- Organized history per commit/run

### What It Is NOT
- Not a testing framework (Playwright does that)
- Not a QA replacement (we replace manual clicking, not QA teams)
- Not a BDD/spec authoring tool (non-devs don't write specs)
- Not a comprehensive E2E suite (we verify specific changes, not regressions)

### The Mental Model
**`git diff` for behavior.** `git diff` shows what code changed. `/accept` shows what the product does now — with visual proof.

---

## 2. The Customer

### Primary: The Developer Shipping Agent-Generated Code

**Who:** 500K-2M developers using Claude Code, Cursor, Copilot, Devin, Windsurf daily. Growing 3-5x/year.

**Their moment of need:** The agent just wrote 2,000 lines across 15 files. The developer thinks: *"Does this actually work?"* Today they alt-tab to a browser and manually click around for 5-10 minutes. On one device. With no evidence. That's what we replace.

**Why they pay:** Screenshots in 30 seconds, instant shareable proof (no signup needed), habit-forming in the agent workflow.

| Objection this addresses | How |
|---|---|
| "Non-devs won't write specs" | **The developer writes specs — or just types an inline command.** No non-dev authorship required. |
| "Testing tools have low adoption" | **This isn't adopted as a testing tool.** It's adopted in the agent workflow moment: "I need to verify this before I push." |
| "Writing test code isn't the hard part" | **We're not about writing test code.** We replace manual clicking. The competitor is alt-tab, not Playwright. |

### Secondary: The Team That Wants Visibility

**Who:** Small-to-mid engineering teams (5-50 devs) where PMs have zero visibility into what agents are shipping.

**Their moment of need:** PM asks "is the checkout done?" Developer says "I think so." PM finds out 3 days later in staging that it's wrong.

**Why they pay:** Dashboard, PR integration, Jira/Linear proof — PM sees exactly what was built, with visual proof.

| Objection this addresses | How |
|---|---|
| "The collaboration myth" | **Non-devs CONSUME proof, not CREATE specs.** No Git literacy needed. PM reads a dashboard. |
| "GitHub literacy barrier" | **The cloud dashboard and shareable report links don't require GitHub.** PM clicks a URL. |
| "Incentive mismatch" | **PM benefits without doing extra work.** The developer runs `/accept`; the PM sees the output automatically. |

### Who Is NOT the Customer
- Enterprise QA teams with Selenium suites (Mabl/Testim's market)
- Teams not using AI agents (no urgency)
- Non-technical founders on Bolt/Lovable (too small, too price-sensitive)

---

## 3. Spec Input: How Developers Describe What to Verify

### Design Principle
**Three levels of effort, all valid. The developer chooses based on what's natural in the moment.**

| Objection this addresses | How |
|---|---|
| "Precision gap — natural language is ambiguous" | **We offer three levels from loose to precise. Developer picks.** |
| "PMs won't write formal specs" | **Nobody has to. The developer writes what feels natural.** |
| "BDD step-definition burden" | **No step definitions. No translation layer. AI handles it.** |

### Level 1: Inline Command (Zero Friction)

The developer just finished an agent task and types:

```
/accept "verify the login page works — enter email and password, click sign in, see the dashboard"
```

One line. No file. The AI expands it, drives the browser, captures screenshots.

**When to use:** Quick verification. Most common use case. 80% of runs will be this.

### Level 2: Minimal Spec File (Reusable)

For flows the developer verifies repeatedly:

```markdown
# specs/checkout.accept.md

- App: http://localhost:3000

> Why: Checkout is 80% of revenue. Broken checkout = lost orders.

## Verify: Checkout flow
1. Add a product to the cart
2. Apply discount code "SAVE20"
3. Go to checkout
4. Pay with test card 4242424242424242
5. See order confirmation with correct total
```

Written in 2 minutes. Lives in the repo. Reusable across runs and commits.

The `> Why:` block is **optional**. If present, it appears prominently at the top of the HTML report and cloud report page — giving PMs and non-technical stakeholders immediate business context before they see screenshots. For inline specs (Level 1), there's no `> Why:` — those are quick one-off verifications.

**When to use:** Core flows that get verified on every change. 15-20% of runs.

### Level 3: Auto-Derived from PR/Ticket (Zero Developer Effort)

In CI, the spec is derived from the PR description or linked Jira ticket:

```
PR #142: "Implement checkout with discount codes"
Description: "Users can add items, apply discount codes, and complete purchase with Stripe."

→ Codacy Accept auto-generates verification steps from this description
→ Runs them against the preview deployment
→ Posts results as a PR comment
```

**When to use:** CI/CD automation. Every agent-generated PR. 5% of runs initially, growing.

---

## 4. Two Execution Modes

### Design Principle
**Non-determinism is fine for exploration. Determinism is required for CI.**

| Objection this addresses | How |
|---|---|
| "AI is non-deterministic; tests must be deterministic" | **Explore mode embraces it; Lock mode eliminates it.** |
| "The 80/20 problem destroys trust" | **Explore mode is a verification session, not a regression test. Trust comes from screenshots/evidence, not binary pass/fail.** |
| "Caching creates staleness" | **Lock mode explicitly saves deterministic Playwright code. Developer controls when to regenerate.** |

### Explore Mode (Default — for `/accept`)

AI drives the browser in real-time:
1. Reads the spec (inline or file)
2. Authenticates if `.accept/auth.json` exists (login, inject cookies, etc.)
3. Navigates to the app
4. Interprets each step using the page's accessibility tree
5. Executes actions, captures screenshots at every step
6. Verifies assertions ("I should see the dashboard")
7. Reports results with evidence

**Non-deterministic by design.** Like a human QA session — the value is "did this work right now?" with photographic evidence. Not "will this pass identically forever."

**Failure handling:** When a step fails, the output shows:
- What was expected
- What was found (with screenshot)
- The exact step that failed
- Suggestion: "Should I fix the code, or is the spec wrong?"

**Speed target: 30 seconds for 5 steps.**

### Lock Mode (For CI — saves deterministic tests)

After a successful Explore run:
```
/accept lock specs/checkout.accept.md
```

This saves the AI-generated Playwright code as a deterministic test file:
```
.accept/locked/checkout.spec.ts    ← Standard Playwright test
```

This file:
- Runs without AI calls (fast, free, deterministic)
- Can be committed to the repo
- Runs in CI like any Playwright test
- Only needs regeneration when the spec or UI fundamentally changes

**The developer controls the lifecycle:** Explore for new features. Lock for regression. Regenerate when stale.

---

## 5. Output: The Proof Layer

### Design Principle
**The proof is the product.** Screenshots, organized results, and shareable reports are what make this valuable — not the test execution itself.

| Objection this addresses | How |
|---|---|
| "Platform players could eat this" | **The proof/visibility layer is what they won't build.** Playwright executes; we prove. |
| "Testing tools are nice-to-have" | **Proof that your agent's work is correct is need-to-have when you're shipping 2,000 lines you didn't write.** |

### Terminal Output (What the Developer Sees)

```
$ /accept "verify checkout flow works"

  Codacy Accept — Explore Mode
  Target: http://localhost:3000

  Checkout Flow
  ─────────────

  ✓ Add product to cart                              2.1s
    📸 screenshot captured

  ✓ Apply discount code SAVE20                       1.8s
    📸 screenshot captured

  ✓ Go to checkout                                   2.4s
    📸 screenshot captured

  ✓ Pay with test card                               3.2s
    📸 screenshot captured

  ✓ See order confirmation                           1.5s
    📸 screenshot captured

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Run #007 | 5/5 passed | 11.0s

  Report: .accept/runs/007/report.html
  Share:  codacy.com/accept/r/a1b2c3d ← no signup needed

  💡 Proof uploaded. Anyone with the link can view it.
```

### HTML Report (What the Developer Shares)

Generated at `.accept/runs/<id>/report.html` and **automatically uploaded to Codacy cloud**. Contains:

- **Business context** (if `> Why:` block present): prominent callout explaining why this verification matters — the first thing a PM reads
- Summary: pass/fail per step
- Screenshot gallery: every step with full screenshots
- Failure detail: expected vs actual with highlighted screenshot
- Commit info: which commit was verified
- Timestamp and run duration
- **Automatically shareable** — every run gets a cloud URL. No signup, no account, no code uploaded. Only results (screenshots + report). Private by default, viewable by anyone with the link.

### PR Comment (Team tier — What the Team Sees)

Posted automatically on agent-generated PRs:

```markdown
## ✅ Codacy Accept — Verification Results

**PR #142**: Implement checkout flow
**Commit**: a1b2c3d
**Verified**: 5 steps

| Step | Result |
|------|--------|
| Add product to cart | ✅ |
| Apply discount SAVE20 | ✅ |
| Go to checkout | ✅ |
| Pay with test card | ✅ |
| Order confirmation | ✅ |

📸 [View full report with screenshots](https://codacy.com/accept/r/a1b2c3d)
```

**The PM reads this in the PR or in the dashboard. Zero Git literacy required. Zero effort from the PM.**

### Cloud Dashboard (Team tier — What the Organization Sees)

```
Codacy Accept Dashboard — Acme Corp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Projects                    Last Verified    Status
─────────────────────────────────────────────────────
acme-web                    2 hours ago      ✅ 12/12 passed
acme-mobile-web             1 day ago        ❌ 8/10 passed
acme-admin                  3 days ago       ✅ 5/5 passed

Recent Runs
─────────────────────────────────────────────────────
PR #142  Checkout flow     a1b2c3d  ❌ 4/5   2h ago
PR #139  User settings     f4e5d6c  ✅ 3/3   1d ago
PR #137  Login redesign    9e8f7a6  ✅ 6/6   2d ago
PR #135  Dashboard charts  b5c4d3e  ✅ 4/4   3d ago
```

---

## 6. Technical Architecture

### Design Principle
**Playwright does the hard work. We do the workflow, the proof, and the visibility.**

| Objection this addresses | How |
|---|---|
| "Environment setup is the hidden killer" | **We require the app to be running. We don't pretend to solve env setup.** |
| "Auth is a nightmare" | **AI-powered setup: `codacy-accept setup` reads the codebase, understands auth patterns, asks the developer how to handle login. One-time per project. Covers credentials, cookie injection, anonymous users. Honest about OAuth/MFA limits.** |
| "E2E test flakiness is unsolved" | **Explore mode tolerates non-determinism. Lock mode uses Playwright's built-in retry/wait.** |

### System Diagram

```
┌─────────────────────────────────────────────────────┐
│                   ENTRY POINTS                       │
│                                                      │
│  /accept (Claude Code)    CLI (codacy-accept)    CI  │
│        │                       │                  │  │
│        ▼                       ▼                  ▼  │
│  ┌──────────────────────────────────────────────┐    │
│  │              CORE ENGINE (Node.js/TS)         │    │
│  │                                               │    │
│  │  1. Input Parser                              │    │
│  │     • Inline string → structured steps        │    │
│  │     • Markdown file → structured steps        │    │
│  │     • PR description → structured steps       │    │
│  │     • Optional > Why: business context        │    │
│  │                                               │    │
│  │  2. Auth Manager                              │    │
│  │     • Setup: AI (Opus) reads codebase         │    │
│  │     • Detects auth patterns, asks developer   │    │
│  │     • Saves config to .accept/auth.json       │    │
│  │     • Login before verification steps         │    │
│  │                                               │    │
│  │  3. AI Translator (Claude Sonnet)             │    │
│  │     • Steps + accessibility tree → Playwright │    │
│  │     • Cache: hash(spec + page structure)      │    │
│  │     • Lock: save as .spec.ts file             │    │
│  │                                               │    │
│  │  4. Executor (Playwright)                     │    │
│  │     • Run actions in Chromium                 │    │
│  │     • Screenshot every step                   │    │
│  │     • Video if enabled                        │    │
│  │     • Trace for debugging                     │    │
│  │                                               │    │
│  │  5. Evidence Collector                        │    │
│  │     • Organize: run → step                    │    │
│  │     • Diff from previous run                  │    │
│  │     • Link to commit                          │    │
│  │                                               │    │
│  │  6. Reporter                                  │    │
│  │     • Terminal: color-coded, step-by-step      │    │
│  │     • HTML: self-contained, with Why context   │    │
│  │     • JSON: for CI/programmatic use            │    │
│  │     • PR comment: for GitHub/GitLab            │    │
│  │                                               │    │
│  │  7. Cloud Uploader (No-Signup)                │    │
│  │     • Auto-upload results (screenshots + HTML) │    │
│  │     • No code uploaded — results only          │    │
│  │     • Anonymous token stored locally           │    │
│  │     • Returns shareable URL                    │    │
│  └──────────────────────────────────────────────┘    │
│        │                                              │
│        ▼                                              │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Local        │  │ Cloud      │  │ Results      │  │
│  │ Playwright   │  │ Dashboard  │  │ .accept/     │  │
│  │ (Chromium)   │  │ (Codacy)   │  │ runs/<id>/   │  │
│  └─────────────┘  └────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Language | TypeScript (Node.js) | Playwright-native, npm distribution |
| Browser engine | Playwright + Chromium | Industry standard, video/trace/screenshots |
| AI provider | Claude API (Anthropic) — **Sonnet** for translation/assertions (fast, cheap, high volume), **Opus** for auth analysis + failure diagnosis (critical reasoning, one-time or rare) | Best reasoning, native to Claude Code ecosystem. Dual-model strategy keeps costs low (~$0.01/run). |
| Spec parsing | Custom (lightweight) | Inline strings + minimal markdown with optional `> Why:` business context. No remark/unified needed for MVP. |
| Caching | File-based (`.accept/cache/`) | Key: hash(spec + page a11y snapshot). Simple, local, fast. |
| Reports | Self-contained HTML | Single file, embedded screenshots (base64), no server needed |
| Distribution | npm (`codacy-accept`) | `npx codacy-accept` works day one |
| Claude Code skill | Markdown file (`.claude/skills/accept.md`) | Zero-install for skill; CLI installed separately |
| Cloud results | Codacy Accept API (S3-backed) | Upload screenshots + HTML only. No code. Anonymous token. |
| Anonymous identity | UUID stored in `~/.accept/identity` | No signup. Persists across projects. User can later "claim" by linking to Codacy account. |

### What We Require from the User

| Requirement | Why It's Reasonable |
|-------------|---------------------|
| App running locally | The developer just built something — of course it's running |
| Node.js installed | They're already using Claude Code / npm ecosystem |
| Anthropic API key (or Codacy token) | For AI translation. Free tier includes limited API access. |

**What We Explicitly Don't Require:**
| NOT required | Why |
|-------------|-----|
| Account creation / signup | Zero friction. Anonymous token auto-generated on first run. |
| Email or personal data | Results are private via anonymous token, not account. |
| Code upload | Only results (screenshots + HTML report) go to cloud. Never source code. |

### What We Explicitly Don't Solve

| Problem | Our Position | Why |
|---------|-------------|-----|
| Environment setup / DB seeding | "Your app must be running" | Solving this is a platform play. We're a tool. |
| Complex OAuth/SSO | AI setup detects OAuth and recommends cookie injection. Honest about MFA/2FA limits. | AI handles common auth patterns; edge cases fall back to manual cookie export. |
| Canvas / WebGL / native apps | "Works best with modern web apps" | Our segment builds React/Next/Vue. That's 80%+ of agent output. |
| Full regression testing | "Use Playwright directly for regression suites" | We verify specific changes. Playwright tests everything. |
| Multi-device / mobile viewports | "Coming in Phase 2. MVP runs desktop Chromium only." | Keeps MVP focused. Clear upgrade path. |
| Safari rendering bugs | "Real devices in future paid tier" | Honest about limits. |

---

## 7. Phased Implementation Plan

### Design Principle
**Each phase must deliver standalone value. No phase depends on "if only we also had X."**

---

### PHASE 0: Prototype & Validate (Weeks 1-3)

**Goal:** Answer the critical question: *"Can AI reliably drive a browser to verify a 5-step spec on a modern web app?"*

**Build:**
- Hardcoded prototype: takes an inline string, translates via Claude API, executes via Playwright, captures screenshots
- Test against 10-20 real web applications (not TodoMVC)
- Measure: success rate, speed, failure modes

**Validate:**
- If success rate < 80% on modern web apps → **stop. The product doesn't work.**
- If success rate > 90% → proceed to Phase 1
- If 80-90% → identify failure patterns, decide if solvable

**Output:** Internal report with success/failure data. Go/no-go decision.

**Team:** 1 engineer, 2 weeks.

**Objections addressed:**
| Objection | How Phase 0 addresses it |
|---|---|
| "AI translation unreliable" | We measure before committing. Data, not hope. |
| "Works on demo, fails on real apps" | We test on real apps, not demos. |
| "The 80/20 problem" | We know the exact ratio before building the product. |

---

### PHASE 1: Developer Tool MVP (Weeks 4-8)

**Goal:** A working `/accept` command that developers at Codacy use daily.

**Build:**

| Feature | Description | Priority |
|---------|-------------|----------|
| **CLI: `codacy-accept run`** | Takes inline string OR spec file, runs against a URL | P0 |
| **Inline spec parsing** | `codacy-accept run "verify login works" --url http://localhost:3000` | P0 |
| **File spec parsing** | `codacy-accept run specs/login.accept.md` | P0 |
| **AI translation** | Claude API: spec steps + page a11y tree → Playwright code | P0 |
| **Translation caching** | Cache in `.accept/cache/`, keyed on spec + page hash | P0 |
| **Single-device execution** | Chromium, headless, local | P0 |
| **Screenshot per step** | Saved to `.accept/runs/<id>/` | P0 |
| **Terminal output** | Color-coded, step-by-step with timing | P0 |
| **HTML report** | Self-contained, embedded screenshots | P0 |
| **No-signup cloud upload** | Auto-upload results (screenshots + HTML report) to Codacy cloud. No account needed. No code uploaded — results only. Returns shareable URL. Anonymous token stored locally in `.accept/identity`. | P0 |
| **AI-powered auth setup** | `codacy-accept setup` — AI (Opus) reads codebase to understand auth patterns, asks developer how to handle login (test credentials, anonymous user, cookie injection). Saves to `.accept/auth.json`. One-time per project. | P0 |
| **Claude Code skill** | `.claude/skills/accept.md` — enables `/accept` | P1 |
| **`codacy-accept init`** | Scaffolds skill + example spec + .gitignore for .accept/ | P1 |
| **Run history** | Last 10 runs stored locally with metadata | P1 |
| **npm publish** | `npx codacy-accept` works globally | P0 |

**What this does NOT include:**
- Multi-device (deferred to Phase 2+)
- Cloud execution
- Cloud dashboard
- PR integration
- CI/CD action
- Lock mode
- Video recording
- Jira/Linear integration

**Validate:**
- Dogfood at Codacy with 10+ developers using Claude Code
- Measure: Do developers use `/accept` more than once? Does it become habitual?
- Measure: How often do they share reports with non-devs?
- Target: 5+ developers using it daily within 2 weeks of internal launch

**Team:** 2 engineers, 5 weeks.

**Objections addressed:**
| Objection | How Phase 1 addresses it |
|---|---|
| "Non-devs won't write specs" | Developer writes specs (inline or file). Non-devs aren't involved yet. |
| "Testing tools have low adoption" | Zero-friction: `npx codacy-accept` or `/accept`. No signup. Results auto-uploaded. No org buy-in needed. |
| "Environment setup is the killer" | App must be running. That's it. We don't touch env setup. |
| "Auth is a nightmare" | AI reads your codebase, understands your auth system, asks you what to do. One-time setup. Covers 80%+ of real apps. |
| "Signup kills conversion" | No account needed. Run the command, get a shareable URL. Identity is a local anonymous token. |
| "E2E tests are the first casualty" | These aren't E2E tests. They're 30-second verifications. Different category. |

---

### PHASE 2: Proof Layer (Weeks 9-14)

**Goal:** The developer's verification becomes shareable proof that the whole team can see.

**Build:**

| Feature | Description | Priority |
|---------|-------------|----------|
| **Multi-device execution** | Desktop + mobile presets (iPhone 14, iPad, etc.), parallel execution | P0 |
| **Shareable report URLs (authenticated)** | Link results to a Codacy account for persistent history and team sharing | P0 |
| **PR comment integration** | Post verification results as GitHub/GitLab PR comment with screenshots | P0 |
| **Lock mode** | `codacy-accept lock` saves Playwright code from successful explore run | P0 |
| **CI runner** | `codacy-accept run --ci` mode with JSON output and exit codes | P0 |
| **GitHub Action** | `codacy/accept-action@v1` — runs locked specs in CI | P1 |
| **Run history (cloud)** | Unlimited history, organized by commit/PR, on Codacy dashboard | P1 |
| **Video recording** | Playwright built-in video, per scenario per device | P1 |
| **Codacy API token** | Authenticate CLI to Codacy cloud for reports and history | P0 |

**What this unlocks:**
- Developer runs `/accept` → shares URL in Slack → PM sees screenshots
- CI runs locked specs on every PR → PR comment shows proof
- Dashboard shows all recent verifications across the team

**Validate:**
- External beta: 50 teams outside Codacy
- Measure: How many reports are shared (URL opens by non-authors)?
- Measure: Do PMs actually look at the dashboard/PR comments?
- Measure: Conversion from free (anonymous) to Pro (multi-device + persistent history)
- Target: 20% of active users share at least one report per week

**Team:** 3 engineers, 6 weeks.

**Objections addressed:**
| Objection | How Phase 2 addresses it |
|---|---|
| "The collaboration myth" | Non-devs CONSUME proof (read reports, see PR comments). They don't create specs. |
| "GitHub literacy barrier" | Reports are shareable URLs. Dashboard is a web app. No Git required. |
| "AI is non-deterministic" | Lock mode saves deterministic Playwright code for CI. Explore mode for dev. |
| "Platform players could eat this" | The proof layer (reports, dashboard, PR comments) is what platforms won't build. |
| "Nice to have vs must have" | PR comments with screenshots become expected. Teams that have it don't go back. |

---

### PHASE 3: Organizational Value (Weeks 15-22)

**Goal:** Codacy Accept becomes an organizational tool that PMs and leadership rely on.

**Build:**

| Feature | Description | Priority |
|---------|-------------|----------|
| **Team dashboard** | All projects, all PRs, all verifications in one view | P0 |
| **Jira/Linear integration** | Link verification results to tickets. PM sees proof in Jira. | P0 |
| **Auto-derive specs from PR** | AI reads PR description and generates verification steps automatically | P1 |
| **Trend analytics** | "Login has been verified green for 30 days" / "Mobile failures up 40% this sprint" | P1 |
| **Slack notifications** | "PR #142 verification failed on iPhone 14" | P1 |
| **Multiple projects** | Org-level dashboard with multiple repos | P0 |
| **Role-based access** | Developers see everything. PMs see dashboard. Leadership sees trends. | P1 |
| **Real device cloud (BrowserStack)** | Paid tier: run on actual iPhones, Pixels, etc. | P2 |

**What this unlocks:**
- PM checks dashboard before sprint review — sees what's verified, what's broken
- Jira ticket automatically updated with verification proof when PR merges
- Engineering manager sees mobile failure trends across the team
- Leadership has confidence: "we verified 94% of agent-generated PRs last sprint"

**Validate:**
- Enterprise pilot: 5 organizations with 20+ developers
- Measure: Do PMs log into the dashboard weekly?
- Measure: Do teams enforce verification as a merge requirement?
- Measure: Conversion from Pro ($19) to Team ($49)
- Target: 3 of 5 pilot orgs have PMs regularly checking the dashboard

**Team:** 4 engineers + 1 designer, 8 weeks.

**Objections addressed:**
| Objection | How Phase 3 addresses it |
|---|---|
| "Specs in repos don't get read by non-devs" | Jira/Linear integration puts proof WHERE non-devs already are. |
| "Market might be smaller than projected" | Org-level dashboard creates organizational lock-in and larger deals. |
| "Incentive mismatch" | PM gets visibility with zero effort. The developer does the work. PM benefits. |
| "The historical failure pattern" | We reach Phase 3 only AFTER proving Phase 1 (developers use it) and Phase 2 (they share it). No leap of faith. |

---

### PHASE 4: Category (Weeks 23+)

**Goal:** Codacy Accept becomes the standard verification layer in every agent CI pipeline.

**Build (selectively, based on Phase 1-3 data):**

| Feature | Description | Build If... |
|---------|-------------|-------------|
| MCP server | Expose as MCP tool for any AI agent | Phase 1 shows agent-native adoption |
| Spec generation | AI explores a URL and suggests verification spec | Phase 2 shows spec authorship is friction |
| Self-healing locked tests | Auto-regenerate when UI changes intentionally | Phase 2 Lock mode shows staleness is a problem |
| API verification | Verify API contracts, not just browser behavior | Customer demand signals |
| Compliance reports | "100% of PRs verified before merge last quarter" | Enterprise pilot demand |
| Multi-provider AI | Support OpenAI/Gemini alongside Claude | Customer demand |

**These are NOT committed.** They're options we open based on data from Phase 1-3.

---

## 8. Pricing

### Design Principle
**Free must be genuinely useful. Paid must feel obvious when you hit the limit.**

| | Free (no signup) | Pro ($19/mo/seat) | Team ($49/mo/seat) |
|---|---|---|---|
| `/accept` inline + file specs | ✅ Unlimited | ✅ | ✅ |
| Desktop (single device) | ✅ | ✅ | ✅ |
| Screenshots per step | ✅ | ✅ | ✅ |
| HTML report (local + cloud) | ✅ | ✅ | ✅ |
| **Shareable report URL (no signup)** | ✅ auto-uploaded | ✅ | ✅ |
| Cloud result storage | Last 10 runs (30-day expiry) | Unlimited (persistent) | Unlimited (persistent) |
| Multi-device (mobile + tablet) | ❌ | ✅ 4 devices | ✅ Unlimited |
| Run history (local) | Last 5 | Unlimited | Unlimited |
| Lock mode (deterministic CI) | ❌ | ✅ | ✅ |
| Video recording | ❌ | ✅ | ✅ |
| PR comments with screenshots | ❌ | ❌ | ✅ |
| Cloud dashboard | ❌ | ❌ | ✅ |
| Jira/Linear integration | ❌ | ❌ | ✅ |
| Trend analytics | ❌ | ❌ | ✅ |
| Real device cloud | ❌ | ❌ | Add-on |

### The Conversion Triggers

| Moment | Trigger | Upgrade To |
|--------|---------|-----------|
| Developer's 11th cloud run expires | "Upgrade for persistent unlimited history" | Free → Pro |
| Developer tries iPhone viewport | "Multi-device is Pro only" | Free → Pro |
| Developer wants CI lock mode | "Lock mode is Pro only" | Free → Pro |
| Team wants PR comments | "PR integration is Team only" | Pro → Team |
| PM asks "can I see all verifications?" | "Dashboard is Team only" | Pro → Team |

---

## 9. Success Metrics Per Phase

### Phase 0 (Prototype): Go/No-Go

| Metric | Go | No-Go |
|--------|----|-------|
| AI translation success rate on real apps | >90% | <80% |
| Average verification time (5 steps) | <20s | >60s |
| Failure modes identifiable and fixable | Yes | Unpredictable |

### Phase 1 (Dev Tool): Product-Market Fit Signal

| Metric | Strong Signal | Weak Signal |
|--------|--------------|-------------|
| Codacy developers using `/accept` daily | >5 of 10 | <2 of 10 |
| Average runs per active user per week | >5 | <2 |
| npm installs (first month) | >500 | <100 |
| Unprompted sharing of reports | Happens | Doesn't happen |
| Retention after 2 weeks | >50% | <20% |

### Phase 2 (Proof Layer): Growth Signal

| Metric | Strong Signal | Weak Signal |
|--------|--------------|-------------|
| Reports shared (URL opens by non-authors) | >20% of runs | <5% of runs |
| Free → Pro conversion | >5% | <1% |
| GitHub stars | >500 in 3 months | <100 |
| External beta teams active weekly | >30 of 50 | <10 of 50 |

### Phase 3 (Org): Revenue Signal

| Metric | Strong Signal | Weak Signal |
|--------|--------------|-------------|
| Pro → Team conversion | >10% | <3% |
| PMs logging into dashboard weekly | >50% of team accounts | <20% |
| Jira integration active | >30% of team accounts | <10% |
| NPS among PM users | >40 | <20 |

---

## 10. Risk Mitigations (Final)

| Risk | Severity | Mitigation | Phase Addressed |
|------|----------|-----------|----------------|
| AI can't reliably navigate real web apps | **Critical** | Phase 0 validates with real apps. Kill switch if <80% | Phase 0 |
| Developers don't adopt `/accept` | **Critical** | Dogfood at Codacy first. Iterate on UX before external launch | Phase 1 |
| Multi-device is too slow (>60s) | **High** | Parallel device execution. Speed is a P0 requirement. | Phase 2 |
| Nobody shares reports | **High** | Make sharing one-click. Track sharing metrics. If <5% share, pivot proof strategy. | Phase 2 |
| PMs don't look at dashboard | **Medium** | Jira/Linear integration puts proof where PMs already are. Don't force them to a new tool. | Phase 3 |
| Playwright/Claude adds native verification | **Medium** | Our moat is the proof/visibility layer, not the execution. Accelerate Phase 2-3 if threatened. | Phase 2-3 |
| Lock mode tests go stale | **Medium** | Clear UX: "This locked test is 30 days old and the page has changed. Regenerate?" | Phase 2 |
| Enterprise auth complexity | **Medium** | AI-powered setup reads codebase, detects auth patterns, asks developer. Covers credentials + cookies. OAuth/MFA: honest about limits, fallback to cookie export. | Phase 1 |

---

## 11. What We Learned (The Evolution)

| Iteration | Core Thesis | What Killed It | What Survived |
|-----------|-------------|----------------|---------------|
| v1 | "Markdown specs → Playwright tests" | Just a testing tool. No differentiation. | Markdown-based specs |
| v2 | "Non-devs write specs, multi-device" | Non-devs won't write specs (20yr evidence) | Multi-device as future value |
| v3 | "Collaboration between business and agents" | Collaboration requires co-authoring. Non-devs won't co-author. | Visibility for non-devs |
| v4 | "Developers verify, proof visible to everyone" | Multi-device adds scope to MVP. Signup kills first-run conversion. | Zero-friction cloud proof |
| v5 | "Zero-friction verification with instant shareable proof" | Auth deferred = PoC can't verify real apps. No business context = PMs ignore reports. | No-signup cloud, proof layer |
| **v6 (Final)** | **"AI understands your app, verifies it, proves it works — with business context visible to the team."** | **TBD — needs Phase 0 validation** | — |

### The Surviving Insights (Carried Forward From Every Iteration)

1. **AI agents create a verification gap.** (v1) — Unchanged. This is the market.
2. **Multi-device is a differentiator worth paying for.** (v2) — Deferred from MVP to Phase 2. Keeps MVP focused and creates a clear upgrade path.
3. **Non-devs need visibility into what agents are building.** (v3) — Reframed from "authorship" to "consumption."
4. **The developer is the buyer. The proof is the product.** (v4) — The positioning.
5. **Zero friction beats features. No signup, instant cloud proof.** (v5) — The conversion insight. Get value before asking for anything.
6. **AI should understand your app, not just drive a browser.** (v6) — Auth setup reads the codebase. Business context in specs bridges developers and PMs. Sonnet for speed, Opus for thinking.

---

## 12. The Pitch (Final)

### For developers:
> Your AI agent just wrote 2,000 lines of code. Does it work? Type `/accept`. Get screenshots in 30 seconds. Share the proof link — no signup needed.

### For PMs (spoken by the developer who shares the report):
> "Here's proof the checkout works — screenshots of every step. Click the link."

### For the board:
> In the age of AI agents, coding is cheap and verification is the bottleneck. Codacy Accept is the verification layer — zero-friction, developer-adopted, team-visible, organized per commit. The proof that AI-generated code does what it was supposed to. No signup needed to start.

### The one-liner:
> **Codacy Accept: Proof that your AI agent's code actually works.**

---

*Final Specification v3 — February 2026*
*Informed by: market research, five product iterations, devil's advocate analysis, strategic pivot, fine-tuning, and implementation alignment.*
*Ready for Phase 0 prototype.*
