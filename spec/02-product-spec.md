# Product Spec: Codacy Accept
## "The Alignment Layer Between Business Intent and AI-Generated Code"
## February 2026 — MVP Specification (v3 — collaboration-centered)

---

## 1. Vision

**One sentence:** The business defines what the product should do. AI agents build it. Codacy Accept proves they match — and keeps both sides in sync.

**This is not a testing tool.** This is the collaboration layer between the people who decide what gets built (product, GTM, founders, designers) and the AI agents that build it. The acceptance spec is the shared contract. The test results are the proof. The feedback loop is continuous and bidirectional.

**The core problem in 2026:** AI agents write code autonomously. But the people who know what the product *should* do — the PMs, the GTM leads, the founders — have no way to verify the agent's output without asking a developer to manually check it. That bottleneck breaks the entire promise of AI-generated code.

**The core solution:** A plain markdown file that anyone can write and edit becomes an executable contract. The agent runs it. The business sees the results. When business needs change, the spec changes. When the spec changes, the tests change. No developer in the loop for the verification step.

### The Collaboration Model

```
┌──────────────────────┐                    ┌──────────────────────┐
│   THE BUSINESS        │                    │   THE AGENTS          │
│                       │                    │                       │
│  PM, GTM, Founders,   │    accept.md       │  Claude Code, Cursor, │
│  Designers, QA        │◄──────────────────►│  Devin, CI pipelines  │
│                       │  (shared contract) │                       │
│  • Write specs        │                    │  • Read specs         │
│  • Read results       │                    │  • Generate code      │
│  • Edit criteria      │                    │  • Run /accept        │
│  • See screenshots    │                    │  • Fix failures       │
│  • Approve changes    │                    │  • Commit when green  │
└──────────────────────┘                    └──────────────────────┘
                    │                            │
                    └────────────┬───────────────┘
                                 │
                    ┌────────────▼───────────────┐
                    │     CODACY ACCEPT           │
                    │                             │
                    │  • Executes specs            │
                    │  • Multi-device validation   │
                    │  • Evidence (screenshots,    │
                    │    recordings, logs)          │
                    │  • Organized by commit/run   │
                    │  • Visible to everyone       │
                    └─────────────────────────────┘
```

**The key insight:** In the age of AI agents, the bottleneck is no longer writing code. It's **verifying that the code matches business intent**. And the people who understand business intent are not the people who can run Playwright tests.

---

## 2. Why Collaboration Is the Product

### The Real Problem Isn't Testing

Testing tools exist. Playwright exists. AI can generate tests. The real problem is:

1. **Business intent is invisible.** PMs write requirements in Jira. Developers (or agents) interpret them. There's no executable proof that the interpretation matches the intent.

2. **The feedback loop is broken.** When AI-generated code doesn't match what product wanted, the PM finds out in a demo, in staging, or in production — days or weeks later.

3. **Non-technical stakeholders are locked out.** A PM can't run Playwright. A GTM lead can't read test code. A founder can't interpret CI logs. The people who know what the product should do have no way to verify it themselves.

4. **Specs and code drift apart.** Requirements in Jira, code in GitHub, tests in CI — three sources of truth that inevitably diverge. Nobody knows which one is "right."

### What Codacy Accept Changes

| Before | After |
|--------|-------|
| Requirements in Jira, code in GitHub — disconnected | **One spec file in the repo** — the single source of truth |
| PM finds mismatches in demos/staging | **PM sees results per commit** — instant feedback |
| "It works on my machine" | **Evidence on every device** — screenshots, recordings |
| Developer interprets PM intent | **Spec is executable** — no interpretation needed |
| PM can't read test code | **PM wrote the spec** — it's their words, their criteria |
| Test failures are developer-only noise | **Failures show what product asked for vs what was built** — in plain English |
| Changing requirements = rewrite tests | **Edit the spec → tests auto-update** — no code changes needed |
| AI agent ships code with no validation | **Agent runs `/accept` before committing** — automated quality gate |

### The Three Audiences and What They See

**Product / GTM / Business:**
- A markdown file they can read and edit (the spec)
- A report showing pass/fail per scenario, per device, with screenshots
- Business context ("why this matters") alongside test results
- A clear feedback mechanism: edit the spec to change what gets tested

**Developers / Agent Operators:**
- `/accept` in Claude Code — fire and forget
- Organized logs per commit/run
- Failure details they can act on (or feed back to the agent)
- The spec as a contract they code against

**AI Agents (in CI):**
- JSON output for programmatic consumption
- Pass/fail exit codes for quality gates
- Detailed failure descriptions for self-correction loops

---

## 3. The Collaboration Workflows

### Workflow 1: PM Writes Spec → Agent Builds → Results Prove Alignment

```
1. PM writes specs/checkout.accept.md
   (plain English, no code, describes what the checkout should do)

2. PM commits to the repo (or edits via GitHub web UI)

3. Developer tells Claude Code:
   "Implement the checkout flow per specs/checkout.accept.md"

4. Agent reads the spec, writes the code

5. Agent runs /accept

6. Results:
   ✅ "Add item to cart" — PASS on all devices
   ✅ "Apply discount code" — PASS on all devices
   ❌ "Complete purchase" — FAIL on iPhone 14
      → "Expected: order confirmation page. Found: spinner that never resolves."
      → Screenshot attached.

7. Agent fixes the mobile issue, re-runs /accept

8. All green. Agent commits. PM sees the green report.
```

**Who is involved at each step:**
- PM: steps 1, 2, 8 (write spec, see results)
- Developer: step 3 (instruct agent)
- Agent: steps 4, 5, 6, 7 (build + verify + fix)
- **Nobody manually tests anything.**

### Workflow 2: Business Requirements Change → Spec Updates → Code Follows

```
1. GTM lead realizes the checkout needs a "gift wrapping" option
   (competitor launched this feature)

2. GTM edits specs/checkout.accept.md, adds:

   ## Scenario: Gift wrapping option
   1. Add an item to cart
   2. Go to checkout
   3. I should see a "Add gift wrapping" checkbox
   4. Check "Add gift wrapping"
   5. I should see a $5.00 gift wrapping fee added to the total
   6. Complete the purchase
   7. The order confirmation should show "Gift wrapping: Yes"

3. GTM commits the spec change

4. CI runs /accept → new scenario FAILS (feature doesn't exist yet)

5. Developer (or agent) sees the failing spec, implements gift wrapping

6. Runs /accept → all green → ships
```

**The spec change drove the code change.** Not the other way around. And the GTM lead — a non-developer — initiated it by editing a markdown file.

### Workflow 3: Test Failure → Business Decides What's Correct

```
1. Agent runs /accept after a code change

2. Failure:
   ❌ "Wrong password shows a clear error"
   → Expected: "Invalid credentials"
   → Found: "Incorrect email or password"

3. Report visible to PM. Two options:
   a) PM says: "The new wording is better, update the spec"
      → PM edits spec → tests pass
   b) PM says: "No, we decided on 'Invalid credentials'"
      → Developer/agent fixes the code → tests pass

4. Either way, spec and code are in sync.
   The business made the decision, not the developer.
```

### Workflow 4: Living Documentation for the Whole Organization

```
The specs/ directory becomes the company's living product documentation:

specs/
  auth/
    login.accept.md          ← "How login works"
    registration.accept.md   ← "How registration works"
    password-reset.accept.md ← "How password reset works"
  checkout/
    cart.accept.md           ← "How the cart works"
    payment.accept.md        ← "How payment works"
    discounts.accept.md      ← "How discounts work"
  admin/
    user-management.accept.md
    billing.accept.md

Each file:
- Is readable by anyone (it's plain English markdown)
- Explains the "why" (business context blocks)
- Is executable (can be run against the live product at any time)
- Is always up to date (if it weren't, the tests would fail)
- Is version-controlled (you can see when and why any requirement changed)
```

**This is what Joao meant:** *"How to make business logic explicit — what we're implementing and why — and then see if that's reflected in the code. Visible to product and GTM."*

The specs ARE the business logic documentation. And they're provably in sync with the code because they're executable.

---

## 4. User Personas

### The Spec Author: "The Business Person"
- Product manager, GTM lead, founder, designer, QA lead
- Knows what the product should do and why
- Writes acceptance criteria in plain English markdown
- **Cannot and should not need to** understand Playwright, CSS selectors, or test code
- Edits specs when requirements change — and expects the system to keep up
- Reads results in a report with screenshots, not in a terminal
- **Their superpower:** They define the contract that code must satisfy

### The Agent Operator: "The Developer"
- Uses Claude Code, Cursor, or Copilot daily
- Types `/accept` and walks away — fire and forget
- Uses acceptance tests as a quality gate before committing
- Feeds failure output back to the agent for self-correction
- **Their superpower:** They connect the business spec to the AI agent

### The Autonomous Agent: "The CI Bot"
- Claude Code in GitHub Actions, Devin, SWE-agent
- Reads specs programmatically, runs tests, interprets failures
- Self-corrects code when acceptance criteria aren't met
- **Its role:** The tireless executor that keeps code aligned to specs

### The Collaboration Dynamic
```
Business Person          Developer/Agent         AI Agent
writes spec    ──────►   runs /accept   ──────►  builds & fixes code
reads results  ◄──────   sees pass/fail ◄──────  reports evidence
edits spec     ──────►   re-runs        ──────►  re-validates
```
**Everyone has a role. Nobody is blocked. The spec is the shared language.**

---

## 5. The Markdown Spec Format (Revised for Non-Devs)

### Design Principles
- **A PM can write it.** No technical knowledge required.
- **Reads like a user story.** Not like test code, not like Gherkin.
- **Multi-device aware.** Specify which devices/viewports matter.
- **Business logic is visible.** The "why" is captured alongside the "what."
- **Lives in the repo.** Version-controlled, diffable, reviewable in PRs.

### Format: `specs/login.accept.md`

```markdown
# Login Flow

> **Why:** Login is the first experience for every user. A broken login
> means zero revenue. This must work flawlessly on all devices.

## Config
- App: http://localhost:3000
- Devices: Desktop (1280x720), iPhone 14, iPad

## Scenario: Successful login
As a registered user, I should be able to log in and see my dashboard.

1. Go to the login page
2. Enter "user@test.com" as email
3. Enter "password123" as password
4. Click the sign in button
5. I should see the dashboard
6. I should see a "Welcome back" message
7. The URL should be /dashboard

## Scenario: Wrong password shows a clear error
As a user who types the wrong password, I should see a helpful error — not a blank page.

1. Go to the login page
2. Enter "user@test.com" as email
3. Enter "wrongpassword" as password
4. Click the sign in button
5. I should see an error message saying "Invalid credentials"
6. I should still be on the login page

## Scenario: Logout clears everything
1. Log in as "user@test.com"
2. Click my avatar in the top right
3. Click "Sign Out"
4. I should be back on the login page
5. If I try to go to /dashboard, I should be redirected to login
```

### What Changed from v1
- **No `**Verify:**` prefix** — just natural language ("I should see...")
- **`> Why:` blocks** — capture business context. Visible to product/GTM.
- **`Devices:` in config** — multi-device is first-class
- **Scenario titles are user stories** — not test names
- **Conversational steps** — "Go to" not "Navigate to", "Click my avatar" not "Click element#avatar"
- **A PM wrote this.** That's the test.

---

## 6. Claude Code Skill: `/accept` (Primary Interface)

### This Is the Entry Point

The primary way to use Codacy Accept is as a **Claude Code skill**. Not a separate CLI. Not a separate tool. It's native to the agent workflow.

### How It Works

```
Developer in Claude Code:

> /accept

  🔍 Found specs: specs/login.accept.md, specs/checkout.accept.md
  🌐 Target: http://localhost:3000 (from specs config)
  📱 Devices: Desktop, iPhone 14, iPad

  Running acceptance tests...

  specs/login.accept.md
  ─────────────────────

  ✓ Successful login
    Desktop ✓  iPhone 14 ✓  iPad ✓                             4.2s

  ✗ Wrong password shows a clear error
    Desktop ✗  iPhone 14 ✗  iPad ✗                             3.1s
    ↳ Expected: "Invalid credentials"
    ↳ Found: "Login failed"
    ↳ Screenshots: .accept/run-003/wrong-password-desktop.png

  ✓ Logout clears everything
    Desktop ✓  iPhone 14 ✓  iPad ✓                             5.1s

  specs/checkout.accept.md
  ────────────────────────

  ✓ Add item to cart                    Desktop ✓  iPhone 14 ✓  iPad ✓
  ✓ Apply discount code                 Desktop ✓  iPhone 14 ✓  iPad ✓
  ✓ Complete purchase                   Desktop ✓  iPhone 14 ✓  iPad ✓

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Run #003 | Commit: a1b2c3d | 5/6 passed | 1 failed | 12.4s
  Report: .accept/runs/003/report.html

  💡 The "Wrong password" scenario expects "Invalid credentials"
     but the app shows "Login failed". Should I update the code
     to match the spec, or update the spec to match the code?
```

### Skill Behavior

**`/accept`** — Run all `*.accept.md` specs found in the project
**`/accept specs/login.accept.md`** — Run a specific spec
**`/accept --commit`** — Run, and if all pass, auto-commit with results
**`/accept --fix`** — Run, and if tests fail, attempt to fix the code to match the spec

### The `/accept --fix` Loop (Fire and Forget)

This is the killer feature. The developer says:

```
> Implement the checkout flow per specs/checkout.accept.md then /accept --fix
```

The agent:
1. Reads the spec
2. Implements the feature
3. Runs `/accept`
4. If tests fail → reads the failure output → fixes the code → re-runs
5. Loops until all acceptance criteria pass
6. Reports the final results

**This is TDD driven by a PM's spec, executed by an AI agent, with zero developer involvement in the testing loop.**

### Technical Implementation (Claude Code Skill)

A Claude Code skill is defined in the project's `.claude/` directory:

```
.claude/
  skills/
    accept.md          # The skill definition
```

The skill definition tells Claude Code how to invoke the underlying CLI:

```markdown
# /accept - Run Acceptance Tests

When the user invokes /accept, run acceptance tests against the current project.

## Steps

1. Find all `*.accept.md` files in the project (typically in `specs/` directory)
2. Read the Config section from each spec to determine the target URL and devices
3. Run `npx codacy-accept run <spec-files> --json` to execute the tests
4. Parse the JSON output and present results in an organized format
5. If tests fail and `--fix` flag is present, analyze failures and fix the code
6. If `--commit` flag is present and all tests pass, create a commit

## Arguments
- No args: run all specs
- File path: run specific spec
- `--fix`: attempt to fix code on failure
- `--commit`: auto-commit if all pass
- `--devices <list>`: override device list
```

---

## 7. Multi-Device Testing (Core Feature)

### Why Multi-Device Is P0 (Not P2)

From the conversation: *"If you had multiple devices and stuff, would you pay for this?"* — Yes. This is a monetization-worthy feature.

### How It Works

Devices are declared in the spec's Config:

```markdown
## Config
- Devices: Desktop (1280x720), iPhone 14, iPad, Pixel 7
```

Each scenario runs on **every declared device**. Results are reported per-device:

```
✓ Successful login
  Desktop ✓  iPhone 14 ✓  iPad ✓  Pixel 7 ✓          4.2s

✗ Navigation menu works
  Desktop ✓  iPhone 14 ✗  iPad ✓  Pixel 7 ✗          6.3s
  ↳ iPhone 14: Hamburger menu doesn't open (screenshot attached)
  ↳ Pixel 7: Menu items overlap (screenshot attached)
```

### Device Presets (Built-in)

Playwright has built-in device descriptors. We expose them with friendly names:

| Friendly Name | Playwright Device | Viewport |
|--------------|-------------------|----------|
| Desktop | — | 1280x720 |
| Desktop HD | — | 1920x1080 |
| iPhone 14 | iPhone 14 | 390x844 |
| iPhone 14 Pro Max | iPhone 14 Pro Max | 430x932 |
| iPad | iPad (gen 7) | 810x1080 |
| Pixel 7 | Pixel 7 | 412x915 |
| Galaxy S23 | Galaxy S23 | 360x780 |

Custom viewports: `Custom (375x812)`

---

## 8. Organized Logs Per Commit/Run

### The Dashboard View (What PM/GTM Sees)

Every run is tracked and organized:

```
Run History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run #005 | 2026-02-20 14:32 | Commit: f4e5d6c | ✅ 6/6 passed
Run #004 | 2026-02-20 13:15 | Commit: a1b2c3d | ❌ 5/6 passed (1 failed)
Run #003 | 2026-02-20 11:02 | Commit: 9e8f7a6 | ❌ 3/6 passed (3 failed)
Run #002 | 2026-02-19 16:45 | Commit: b5c4d3e | ✅ 4/4 passed
Run #001 | 2026-02-19 09:30 | Commit: 7a6b5c4 | ✅ 4/4 passed
```

### Local Report (MVP)

Generated as `.accept/runs/<run-id>/report.html`:

- Summary: pass/fail per scenario, per device
- Screenshots for every step (gallery view)
- Failure details with expected vs actual
- Diff from previous run (what changed?)
- Link to the git commit that was tested
- **Business context visible** — the "Why" blocks from specs are shown

### Cloud Dashboard (v0.2+)

- Same data, hosted on Codacy
- Shareable URLs — PM can send link to stakeholders
- Historical trends — "login tests have been green for 30 days"
- Notifications — "acceptance tests failed on PR #142"
- Video replay of test runs

---

## 9. The Bidirectional Workflow (PM ↔ Code)

### PM Updates Spec → Tests Auto-Update

```
PM edits specs/login.accept.md:
- Changes "I should see an error message saying 'Invalid credentials'"
- To "I should see an error message saying 'Incorrect email or password'"

PM commits the change.

CI runs /accept → Test now expects the new wording.
If code still shows "Invalid credentials" → Test fails.
Developer (or agent) updates the error message in code.
```

**No step definitions to update. No test code to change. The spec IS the test.**

### Test Failure → PM Sees What Broke

When a test fails, the report shows:

```
❌ Wrong password shows a clear error

  Business Context:
  "Login is the first experience for every user. A broken login
   means zero revenue."

  What Happened:
  Step 5 failed: "I should see an error message saying 'Invalid credentials'"

  What We Found:
  The page shows "Login failed" instead.

  📸 Screenshot: [click to view]

  Suggestion: Either update the code to show "Invalid credentials"
  or update the spec if "Login failed" is the intended message.
```

**A PM can read this. A PM can act on this.** No developer needed to interpret test output.

---

## 10. Architecture (Revised)

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     ENTRY POINTS                              │
│                                                               │
│  Claude Code Skill    CLI Tool         CI/CD Action           │
│  (/accept)            (codacy-accept)  (GitHub Action)        │
│       │                    │                │                  │
│       ▼                    ▼                ▼                  │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                   CORE ENGINE                        │      │
│  │                                                      │      │
│  │  1. Spec Parser (markdown → structured test plan)    │      │
│  │  2. AI Translator (test plan → Playwright code)      │      │
│  │  3. Device Matrix (multiply tests × devices)         │      │
│  │  4. Executor (run Playwright, capture evidence)      │      │
│  │  5. Reporter (results → terminal / HTML / JSON)      │      │
│  │  6. Run Tracker (organize by commit/run)             │      │
│  └─────────────────────────────────────────────────────┘      │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Local Browser│  │ Cloud Browser │  │ Results Storage     │   │
│  │ (Playwright) │  │ (BrowserBase)│  │ (.accept/runs/)     │   │
│  └─────────────┘  └──────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Processing Pipeline (Revised)

**Step 1: Discover & Parse**
- Find all `*.accept.md` files (or use specified files)
- Parse: Config (URL, devices), Scenarios (title, why, steps), Assertions ("I should see...")
- Build test matrix: scenarios × devices

**Step 2: AI Translation**
- For each scenario, send steps to Claude API with page accessibility tree
- Generate Playwright code per scenario
- **Cache aggressively** — keyed on spec hash + page structure hash
- Only regenerate when spec or page changes

**Step 3: Device Matrix Execution**
- Run each scenario on each declared device (using Playwright device emulation)
- Capture: screenshot per step, video per scenario, trace per scenario
- Track timing per device

**Step 4: Evidence Collection**
- Screenshots organized by: run → scenario → device → step
- Video (if enabled) per scenario per device
- Playwright traces for debugging

**Step 5: Reporting**
- Terminal: color-coded, device columns, summary per commit
- HTML report: embedded screenshots, business context, diffs
- JSON: for programmatic consumption (CI, agents)
- Run tracking: `.accept/runs/<run-id>/` with metadata

---

## 11. MVP Scope (v0.1 — Revised)

### In Scope

| Feature | Priority | Notes |
|---------|----------|-------|
| **Claude Code skill (`/accept`)** | **P0** | Primary interface. Skill definition + CLI invocation. |
| CLI tool (`codacy-accept`) | P0 | Node.js/npm. Powers the skill. |
| Non-dev-friendly spec format | P0 | Natural language steps, "I should see..." assertions. |
| AI translation to Playwright | P0 | Claude API, with caching. |
| **Multi-device execution** | **P0** | Desktop + 2 mobile presets minimum. |
| **Organized run history** | **P0** | `.accept/runs/<id>/` with commit tracking. |
| Terminal output with device columns | P0 | Color-coded, per-device pass/fail. |
| Screenshots (every step, every device) | P0 | Core evidence for PM review. |
| HTML report with business context | P1 | "Why" blocks, screenshot gallery, per-device results. |
| `--fix` mode (agent self-corrects) | P1 | The fire-and-forget loop. |
| `--commit` mode | P1 | Auto-commit when all pass. |
| Playwright trace capture | P1 | For developer debugging. |
| Video recording (local) | P2 | Per-scenario, per-device. |
| `codacy-accept generate` | P2 | AI suggests spec from exploring URL. |

### Promoted from v0.2 to MVP
- **Multi-device** (was P2, now P0) — this is a monetization feature and key differentiator
- **Run history/organization** (was not in v1) — core to the "organized log per commit" insight
- **Claude Code skill** (was "MCP in v0.2") — this is the primary entry point, not an afterthought

### Out of Scope for MVP

| Feature | When | Why Defer |
|---------|------|-----------|
| Cloud execution (BrowserBase/E2B) | v0.2 | Validate local-first. Cloud is the paid tier. |
| Cloud dashboard (Codacy-hosted) | v0.2 | Build after we have local usage data. |
| CI/CD GitHub Action | v0.2 | After skill + CLI are validated. |
| PR status checks | v0.2 | Requires GitHub App. |
| Video recording in cloud | v0.3 | Requires cloud infra. |
| Jira/Linear spec import | v0.3 | Import acceptance criteria from tickets. |
| Spec suggestions from PM edits | v0.3 | "You changed the spec, should I update the code?" |
| Parallel device execution | v0.2 | Sequential per-device is fine for MVP. |
| Self-healing specs | v1.0 | AI detects intentional UI changes. |

---

## 12. Technical Decisions

### Language/Runtime: Node.js (TypeScript)
- Playwright is Node.js native
- npm distribution is the developer path of least resistance
- Claude Code skills invoke CLI tools via Bash

### Claude Code Skill Implementation
- Skill defined as a markdown file in `.claude/skills/accept.md`
- Skill invokes `npx codacy-accept run` under the hood
- Skill adds intelligence: interprets results, suggests fixes, can iterate
- **This is a project-level skill** — any repo can add it by including the skill file

### Distribution Strategy
```bash
# For developers (install the engine)
npm install -g codacy-accept

# For any project (add the Claude Code skill)
npx codacy-accept init
# Creates:
#   .claude/skills/accept.md     (the skill)
#   specs/example.accept.md      (example spec)
#   .accept/                     (gitignored results directory)
```

### AI Provider: Claude API
- Best reasoning for complex UI interpretation
- Native to Claude Code ecosystem
- Abstraction layer for future providers (OpenAI, Gemini)

### Multi-Device: Playwright Device Emulation
- Playwright has built-in device descriptors (100+ devices)
- Emulates viewport, user agent, touch, device scale factor
- No real devices needed for MVP — emulation is sufficient
- Real device clouds (BrowserStack, Sauce Labs) for v0.3+

---

## 13. Monetization (Revised)

### Free Tier (The CLI + Skill)
- `codacy-accept` CLI — free forever, open source
- `/accept` Claude Code skill — free (it's a markdown file)
- Local execution — free
- Unlimited specs, unlimited local runs
- Single-device execution

### Paid: Multi-Device + Cloud + Dashboard
| Feature | Free | Pro ($29/mo per seat) | Team ($99/mo per seat) |
|---------|------|------|------|
| Local execution | ✅ | ✅ | ✅ |
| Desktop device | ✅ | ✅ | ✅ |
| Mobile devices (emulated) | 1 device | Unlimited | Unlimited |
| Run history (local) | Last 10 runs | Unlimited | Unlimited |
| Cloud execution | — | ✅ | ✅ |
| Video recording | — | ✅ | ✅ |
| Cloud dashboard | — | ✅ | ✅ |
| Shareable reports (PM/GTM) | — | — | ✅ |
| PR status checks | — | — | ✅ |
| CI/CD integration | — | — | ✅ |
| Real device cloud | — | — | ✅ |
| Priority AI (faster translation) | — | — | ✅ |

### Why This Works
- **Free tier is genuinely useful** — drives adoption via Claude Code skill
- **Multi-device is the upsell trigger** — "it works on desktop, but does it work on iPhone?"
- **Team features** lock in organizations — shareable reports, PR checks, dashboard
- **PM/GTM visibility** is an organizational purchase, not individual

---

## 14. Competitive Positioning (Sharpened)

### vs. Firebase Test Lab / Google Device Testing
- Firebase does device testing but has **no MCP/Claude Code integration**
- No natural language specs — you write traditional test code
- No business context or PM-facing reports
- Joao's exact words: *"Firebase does this and you get free Google credits, but then you don't have a good MCP to connect with Claude Code"*

### vs. Momentic / Octomind
- They're AI E2E testing platforms
- We're **spec-driven acceptance testing where non-devs write the specs**
- They target QA teams. We target **the PM ↔ developer boundary**
- They're standalone platforms. We're **native to the AI coding agent workflow**

### vs. QA Wolf
- They're a managed service ($5-20K/mo)
- We're a **self-serve tool** with a free tier
- They own the testing. **The PM owns the spec** with us.

### Our Unique Position
**Nobody else lets a non-developer write acceptance criteria in markdown, fire it from Claude Code, test on multiple devices, and get organized results that product and GTM can see and edit.**

---

## 15. Roadmap (Revised)

### Phase 1: MVP — "Fire and Forget" (Weeks 1-8)
- Claude Code skill (`/accept`)
- CLI engine (`codacy-accept`)
- Non-dev spec format (natural language markdown)
- AI translation with caching (Claude API)
- Multi-device execution (Playwright emulation)
- Run history organized by commit
- Terminal output + HTML report
- Screenshots per step per device
- npm publish + `codacy-accept init`
- Internal dogfood on Codacy products

### Phase 2: Cloud + Team — "PM Can See It" (Weeks 9-16)
- Cloud execution (BrowserBase or E2B)
- Video recording
- Hosted dashboard (Codacy-branded)
- Shareable report URLs
- GitHub Action for CI
- PR status checks
- Paid tier launch (Pro + Team)
- Jira/Linear import (read acceptance criteria from tickets)

### Phase 3: Intelligence — "The Spec Is Alive" (Weeks 17-24)
- Spec suggestions when PM edits criteria
- Auto-detection of intentional vs accidental UI changes
- Historical trend analysis ("login has been green for 90 days")
- Real device cloud integration
- Requirement traceability (ticket → spec → test → code → PR)
- Team notifications (Slack/email on failure)

### Phase 4: Category — "The Quality Gate" (Weeks 25+)
- Standard quality gate for all agent CI pipelines
- Self-healing specs
- Confidence scoring for AI-generated PRs
- Multiple AI provider support
- API testing specs (not just browser)
- Spec templates marketplace

---

## 16. The Pitch (v3 — Collaboration-Centered)

### For a Developer Audience

> **Your PM writes the spec. Your AI writes the code. Codacy Accept proves they match.**
>
> Type `/accept` in Claude Code. Fire and forget. Tests run on desktop, iPhone, iPad. You get organized results per commit. If something fails, the agent fixes it. If the PM changes the spec, the tests update automatically.

### For a Business / Product Audience

> **Finally see if your product does what you asked for — without asking a developer.**
>
> Write what your product should do in plain English. Put it in the repo. Every time code changes, Codacy Accept verifies it still does what you described — on every device. You see the results. You own the spec. You change the requirements, the tests follow.

### For an Investor / Board Audience

> **The alignment layer between business intent and AI-generated code.**
>
> AI agents are writing most of the code. But the people who define what gets built — product, GTM, founders — have no way to verify the output. Codacy Accept is the executable contract between business intent and code reality. Non-developers write specs in markdown. AI validates the code against those specs. The business stays in control of what ships.

### The One-Liner

> **Codacy Accept: Where business requirements become executable proof.**

---

## 17. Open Questions (Updated)

| Question | Recommendation | Status |
|----------|----------------|--------|
| **Claude Code skill vs MCP server?** | **Both.** Skill for v0.1 (simpler, ships faster). MCP server for v0.2 (enables other agents). | Decided |
| **Open source?** | **Yes.** OSS the CLI + skill. Monetize cloud + multi-device + dashboard. | Decided |
| **Spec format — how structured?** | **Minimal structure.** AI interprets natural language. Only Config section is structured. | Decided |
| **Real devices vs emulation?** | **Emulation for MVP.** Real devices via BrowserStack/Sauce Labs for paid tier. | Decided |
| **Where does the spec live?** | **In the repo** (`specs/*.accept.md`). Diffable, reviewable, version-controlled. | Decided |
| **Can PM edit specs without a code editor?** | TBD — GitHub web editor works. Could build a simple web UI in v0.3. | Open |
| **How to handle auth in specs?** | TBD — Cookie injection? Login-as-first-step? Shared auth config? | Open |
| **What about API-only acceptance criteria?** | Defer to v0.3. Browser-first for MVP. | Decided |
| **How does PM access reports without terminal?** | Cloud dashboard in v0.2. For MVP: HTML report + shareable file. | Open |
| **Spec authoring UX for non-devs?** | MVP: GitHub web editor / any text editor. v0.3: dedicated web UI or Notion-like editor. | Open |

---

## 18. Why This Is Bigger Than Testing

This product looks like a testing tool. It's not. It's a **collaboration protocol**.

In the pre-AI era, the collaboration protocol was: PM writes ticket → Developer reads ticket → Developer writes code → PM reviews in staging. The ticket was the contract, but it was never enforced — it was just a suggestion.

In the AI era, the collaboration protocol needs to be: **PM writes spec → Agent reads spec → Agent writes code → Spec validates code automatically.** The spec is the contract, and it IS enforced — every commit, every device.

This means Codacy Accept sits at the intersection of three massive trends:
1. **AI code generation** — agents writing code autonomously
2. **Product-led quality** — business stakeholders owning what "correct" means
3. **Continuous verification** — automated proof that intent and reality match

The long-term vision isn't "a better testing tool." It's **the way organizations maintain control over AI-generated software.** The spec is how humans stay in the loop when AI writes the code.

---

*Spec v0.3 — February 2026 — Revised with collaboration as the core thesis. Stakeholder input from Jaime Jorge (CEO, Codacy) and Joao Graca.*
