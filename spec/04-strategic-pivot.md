# Strategic Pivot: What the Objections Tell Us About the Real Product
## From "Non-Devs Write Specs" to "Agents Prove Their Work"
## February 2026

---

## The Core Realization

The objections document proves one thing beyond doubt: **non-technical people will not write acceptance specifications.** Twenty years of BDD, Cucumber, FitNesse, Gauge, and Concordion have proven this. No amount of AI or markdown simplicity will change this human behavior.

But the objections also reveal something else: the original product vision was solving the wrong problem for the wrong person. Let's find the right problem.

---

## 1. What's Actually Happening Right Now

### The Real Workflow in 2026

```
Developer opens Claude Code (or Cursor, or Devin)
    → Types: "Build the checkout flow with discount codes and Stripe integration"
    → Agent writes 2,000 lines of code across 15 files
    → Agent creates a PR
    → Developer stares at the diff for 30 seconds
    → Developer: "...looks reasonable, I think?"
    → Merges
    → PM sees it in staging 3 days later: "Where's the gift wrapping option I asked for?"
```

### What's Actually Painful

The pain is NOT "we need better testing." The pain is:

1. **The developer can't verify what the agent built.** 2,000 lines across 15 files — nobody reviews that properly. The developer who prompted the agent barely understands the output.

2. **The PM has zero visibility.** They wrote a ticket, the agent built something, the developer merged it. The PM finds out whether it matches their intent days later in staging.

3. **The agent has no feedback loop.** The agent commits and moves on. If it built the wrong thing, nobody catches it until much later. There's no "did I actually do what was asked?" check.

4. **Review is the bottleneck, not coding.** Coding is fast (agents handle it). Review is slow (humans handle it). The growing volume of agent-generated PRs is overwhelming human review capacity.

### The Pain Point That's Exploding

It's not "we need acceptance tests." It's:

> **"I told the agent to build X. Did it actually build X? And how do I prove it to my team without manually clicking through the app?"**

This is a **developer pain point**. Not a PM pain point. Not a QA pain point. The developer is the one stuck between the agent's output and the team's expectations.

---

## 2. The Pivot: Flip Who Writes and Who Reads

### What We Got Wrong (v1-v3)

```
NON-DEV writes spec → Agent builds → Tool verifies → Everyone sees results
         ↑
    THIS DOESN'T HAPPEN (20 years of evidence)
```

### What the Market Actually Wants

```
DEVELOPER prompts agent → Agent builds → Tool verifies → NON-DEV sees proof
         ↑                                                        ↑
    THIS ALREADY HAPPENS                                 THIS IS THE VALUE
    (developers already                                  (visibility into
     describe what they want                              what was built)
     when they prompt agents)
```

### The Fundamental Insight

**The developer's prompt to the agent IS the acceptance spec.** They already write it. Every time. "Build the checkout flow with discount codes" — that's the requirement. The developer doesn't need to write it again in a separate file. We just need to capture it, verify it, and make the results visible.

But wait — there's a more powerful version of this.

---

## 3. Three Product Directions to Consider

### Direction A: "Agent Verification" — The Developer Tool

**The pitch:** After your agent builds something, verify it actually works. One command. Screenshots. Multi-device. Share the proof.

**Who writes the spec:** The developer, as a natural part of their agent workflow.
**Who reads the results:** The developer first, then the team.
**Entry point:** `/accept` in Claude Code.
**Key insight:** The spec is minimal and developer-authored — not a PM document.

**Pros:**
- Developer is the buyer AND the user (simple GTM)
- Solves a real, growing, daily pain point
- No behavior change required — developers already prompt agents
- Low barrier: one command after agent finishes
- Addresses the #1 objection (non-devs don't write specs) by not requiring them to

**Cons:**
- Smaller market than a "collaboration platform"
- Less defensible against platform players (Claude Code could build this natively)
- No organizational lock-in — individual developer tool

**Risk level:** Low. This is a tool that solves a real problem for people who already exist.

---

### Direction B: "Proof of Work" — The Visibility Layer

**The pitch:** Every time an AI agent ships code, Codacy Accept generates proof that it works — screenshots on every device, organized by commit, visible to the whole team. The PM doesn't write specs. The PM sees proof.

**Who writes the spec:** The developer (or the spec is auto-derived from the PR description / commit message / linked ticket).
**Who reads the results:** Everyone — PM, GTM, leadership, the developer.
**Entry point:** Automatic in CI, or `/accept` in Claude Code.
**Key insight:** The value for non-devs is READING results, not WRITING specs.

**Pros:**
- Addresses the collaboration objection honestly: non-devs consume, not create
- Organizational value — PM can see "the checkout works on iPhone" without asking anyone
- Ties into CI/CD naturally — runs on every PR, generates reports
- Defensible: the collaboration/visibility layer is NOT something Playwright or Claude Code will build
- Codacy's existing platform can host the dashboard

**Cons:**
- Requires CI integration to be truly useful (not just CLI)
- The "auto-derive spec from PR/ticket" is technically ambitious
- Risk of being "nice to have" reports that nobody checks

**Risk level:** Medium. The value is clear but adoption depends on CI integration and dashboard quality.

---

### Direction C: "The Quality Gate for Agents" — The CI/CD Primitive

**The pitch:** A mandatory checkpoint in every agent-generated PR. Before merge, Codacy Accept runs the acceptance criteria and posts the results to the PR. Like a linter, but for "did the agent do what was asked?"

**Who writes the spec:** Specs live in the repo, maintained by whoever defines requirements (developers, tech leads, occasionally PMs).
**Who reads the results:** Everyone who reviews PRs — developers, tech leads, PMs (via dashboard).
**Entry point:** GitHub Action / GitLab CI / Codacy integration.
**Key insight:** Quality gates are not optional. They're required. This changes the adoption dynamic.

**Pros:**
- "Must have" not "nice to have" — it's a CI gate, like linting or type checking
- Aligns with Codacy's existing product (code quality gates)
- Forces adoption at the team/org level, not individual
- Defensible: CI quality gates have organizational lock-in
- The growing volume of agent PRs makes this increasingly urgent

**Cons:**
- Requires mature CI/CD — not for early-stage teams
- Higher barrier to entry — requires repo-level setup
- Spec maintenance falls on developers (which is fine, but is it differentiated enough?)

**Risk level:** Medium-High. Ambitious positioning but if it works, it's a moat.

---

## 4. The Recommended Direction: B + A (Proof of Work, Developer-First)

### Why This Combination Wins

Take the best of A (developer tool, `/accept`) and B (visibility layer, proof for the team):

**The developer uses `/accept` to verify agent output. The results become visible proof for the whole organization.**

This works because:

1. **The developer is the buyer and the user.** No behavior change required from non-devs. No "PM writes specs" fantasy. The developer already prompts agents — we just add a verification step.

2. **Non-devs are consumers, not creators.** The PM doesn't write specs. The PM sees a report: "The checkout flow was verified on Desktop, iPhone 14, and iPad. 5/5 scenarios passed. Screenshots attached." This is what Joao actually wanted — visibility into business logic, not spec authorship.

3. **The spec stays lightweight.** A developer's acceptance spec doesn't need to be a formal document. It can be:
   - A few lines in a markdown file
   - Derived from the PR description
   - Derived from the linked Jira ticket
   - Written inline in the `/accept` command itself

4. **The proof is the product, not the spec.** The value isn't in the spec format. It's in the organized, visual, multi-device proof that the code works — shareable with anyone, linked to the commit.

### The Revised Value Proposition

> **Before:** "Your PM writes the spec. Your AI writes the code. Codacy Accept proves they match."
>
> **After:** "Your AI agent writes the code. Codacy Accept proves it works — on every device, every commit. Your whole team sees the proof."

The shift: from "PM-authored specs" to "developer-verified, team-visible proof."

---

## 5. Who Is the Customer (Honestly)

### Primary Segment: "Developers Shipping Agent-Generated Code"

**Who they are:**
- 500K-2M developers actively using AI coding agents daily (Claude Code, Cursor, Copilot, Devin, Windsurf)
- Growing 3-5x per year
- Already frustrated by the verification gap
- Mostly at startups and mid-market companies (enterprises are slower to adopt agents)

**Why they'll pay:**
- They're shipping code they don't fully understand — that's scary
- They need a quick way to verify before merging
- Multi-device proof gives them confidence they can't get by manually clicking around
- The `/accept` command fits naturally in their existing workflow

**Why this segment is defensible:**
- Momentic/Octomind target QA teams, not agent-using developers
- Playwright targets test engineers, not developers who DON'T want to write test code
- QA Wolf targets companies who want to outsource QA
- **Nobody targets "the developer who just told an agent to build something and needs 60-second verification"**

### Secondary Segment: "Teams Where Developers Ship and PMs Need Visibility"

**Who they are:**
- Small-to-mid engineering teams (5-50 devs) with product managers
- Using AI agents to accelerate development
- PM is frustrated by lack of visibility into what's shipping
- No dedicated QA team

**Why they'll pay:**
- The developer already uses `/accept` (primary segment adoption)
- The PM sees the reports and says "I want this for every PR"
- This becomes an org-level purchase, not individual
- The dashboard shows PM what's working, what's broken, on which devices

### Who Is NOT the Customer

- **Enterprise QA teams** — they have Selenium suites, dedicated QA engineers, and are resistant to AI tools. Let Mabl/Testim fight over them.
- **Teams that don't use AI agents** — no urgency for them. The pain doesn't exist yet.
- **Non-technical founders building with Bolt/Lovable** — tempting but too small, too unsophisticated, too price-sensitive.

---

## 6. Addressing Each Objection With the Revised Product

### Objection 1: "Non-devs won't write specs"

**Old answer:** "But with AI and markdown it's different this time!"
**New answer:** **They don't have to.** Non-devs consume results, not create specs. The developer writes the acceptance criteria — which they already do when prompting the agent. The spec is short, developer-authored, and lives alongside the code.

**What the spec actually looks like now:**

```markdown
# Checkout Flow
- App: http://localhost:3000
- Devices: Desktop, iPhone 14

## Verify: Cart and checkout
1. Add a product to the cart
2. Apply discount code "SAVE20"
3. Proceed to checkout
4. Complete payment with test card
5. See order confirmation with correct total
```

That's it. A developer writes this in 2 minutes. Not a PM. Not a formal BDD document. Just "what should I check after the agent builds this?"

**If the developer doesn't want to write even this:**

```
> /accept "verify the checkout flow works — add item, apply SAVE20 discount, complete payment, see confirmation"
```

One line. Inline. The AI expands it into steps and runs them.

---

### Objection 2: "AI translation is non-deterministic"

**Old answer:** "We'll cache the generated tests!"
**New answer:** **Lean into the non-determinism for exploration, use determinism for regression.**

Two modes:

1. **Explore mode (default for `/accept`):** AI drives the browser in real-time, verifying each criterion. Non-deterministic but useful — like a human clicking through the app. The value is "did this work right now?" not "will this always pass exactly the same way." Screenshots and recordings are the evidence, not a pass/fail binary.

2. **Lock mode (for CI):** After a successful explore run, the generated Playwright code is locked/saved as a deterministic test. This runs in CI without AI calls. Fast, free, deterministic. Only regenerated when the spec or page changes.

**This reframes the non-determinism:**
- Explore mode is like a human QA session — nobody expects a human to click the exact same pixels every time
- Lock mode is traditional Playwright — deterministic and reliable
- The AI is used for **translation** (once), not **execution** (every time)

---

### Objection 3: "Testing tools have low adoption"

**Old answer:** "But our CLI is easy to install!"
**New answer:** **This isn't a testing tool. It's a verification step in the agent workflow.**

The adoption dynamic is completely different from traditional testing tools:

| Traditional Testing Tool | Codacy Accept |
|---|---|
| Adopted by QA team | Adopted by **individual developer** |
| Requires organizational buy-in | `/accept` works solo, day one |
| Must be integrated into CI to be useful | Works locally from Claude Code immediately |
| Competes with manual QA | **Replaces** the "let me quickly click through this" step |
| "Nice to have" | "I need to verify before I merge this agent PR" |

**The trigger for adoption isn't "we should have better testing."** It's "I just generated 2,000 lines of code and I need to know it works before I push." That's a moment of need, not a planning decision.

**Distribution via Claude Code skill:**
- Developer installs the skill once
- Every time they use an agent, `/accept` is available
- Zero-friction adoption within the existing workflow
- No "let me set up a testing framework" step

---

### Objection 4: "Technical obstacles (environment, auth, flakiness)"

**Old answer:** "We'll figure it out!"
**New answer:** **Scope ruthlessly. Solve the 80% case. Be honest about limits.**

**What we DO support in MVP:**
- Apps that are already running locally (developer just built something — of course it's running)
- Simple authentication (cookie injection, login-as-first-step)
- Modern web apps with reasonable HTML semantics
- Chromium + device emulation

**What we DON'T claim to support:**
- Complex OAuth/SSO flows (requires custom setup, documented clearly)
- Canvas-heavy or WebGL applications
- Legacy enterprise apps with deeply nested iframes
- Native mobile apps

**The honest positioning:**
> "Codacy Accept works best for modern web applications. If your agent just built a React/Next.js/Vue feature, `/accept` will verify it in 30 seconds. If you need to test a Java enterprise app with 15 iframes, this isn't the right tool."

**This is a strength, not a weakness.** The segment using AI agents to build features is overwhelmingly building modern web applications. We don't need to support everything.

**On flakiness:**
- Explore mode tolerates some non-determinism (it's a verification session, not a regression test)
- Lock mode uses standard Playwright with built-in retries and waits
- We're explicit: "this is verification, not comprehensive testing"

---

### Objection 5: "Platform players could eat this"

**Old answer:** "We'll move faster!"
**New answer:** **Build what they won't build: the proof layer.**

Playwright will never build an organizational visibility dashboard. Claude Code will never build a report that a PM can read. GitHub Actions will never build multi-device screenshot galleries organized by commit.

**What platform players will build:**
- Better test generation from natural language (already happening)
- AI-assisted test debugging
- Codegen improvements

**What they will NOT build:**
- A PM-readable dashboard showing "here's what your product does on every device"
- Organized proof-per-commit that non-technical stakeholders can browse
- The collaboration layer between developer verification and team visibility
- Integration with Jira/Linear to close the loop between ticket → code → proof

**The moat is the visibility/proof layer, not the test execution.** Playwright executes. We prove.

---

### Objection 6: "The collaboration myth"

**Old answer:** "PMs will write specs in the repo!"
**New answer:** **Collaboration doesn't mean co-authoring. It means shared visibility.**

We stop asking for collaboration on INPUTS (specs) and start providing collaboration on OUTPUTS (proof).

| Old Model (Broken) | New Model (Realistic) |
|---|---|
| PM writes spec | PM writes Jira ticket (as they already do) |
| Spec lives in repo | Ticket linked to PR |
| PM needs Git literacy | PM reads a dashboard with screenshots |
| PM edits spec when requirements change | PM updates Jira ticket, developer updates spec |
| "Collaboration" on spec authorship | **Shared visibility** on verification results |

**What the PM actually sees:**

```
Codacy Accept — PR #142: "Implement checkout flow"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Linked ticket: PROJ-456 "Add checkout with discount codes"

✅ Cart and checkout — Verified on 3 devices
   Desktop  ✅ | iPhone 14  ✅ | iPad  ✅

   Step 1: Add product to cart           [📸 screenshot]
   Step 2: Apply discount code SAVE20    [📸 screenshot]
   Step 3: Proceed to checkout           [📸 screenshot]
   Step 4: Complete payment              [📸 screenshot]
   Step 5: Order confirmation            [📸 screenshot]

🎬 Recording: [Watch 30s video of the full flow]
```

The PM doesn't need Git. The PM doesn't need to write anything. The PM opens a link and sees **proof that their ticket was implemented correctly, on every device, with screenshots.**

**This is what Joao actually described:** *"Make business logic visible to product and GTM."* He didn't say "make product write specs." He said "make the results visible."

---

### Objection 7: "'Writing test code' isn't the hard part"

**Old answer:** "We're not a testing tool, we're an alignment tool!"
**New answer:** **Correct. So let's stop building a testing tool.**

The revised product is NOT a testing framework. It's a **verification and proof system**.

| Testing Framework | Codacy Accept (Revised) |
|---|---|
| Comprehensive test suites | Quick verification of specific changes |
| Runs in CI for regression | Runs after agent builds for verification |
| Written once, maintained forever | Written per-feature, disposable |
| Goal: prevent regressions | **Goal: verify agent output meets intent** |
| Replaces manual QA | **Replaces the "let me click through this" step** |
| 200+ tests in a suite | 3-10 verification steps per feature |

**We're not competing with Playwright test suites.** We're competing with the developer alt-tabbing to a browser and manually clicking through what the agent just built. That takes 5-10 minutes per feature, doesn't cover multiple devices, produces no evidence, and isn't shareable. We do it in 30 seconds with screenshots.

---

## 7. The Revised Product: "Codacy Accept v4"

### One-Sentence Description

**Verify what your AI agent built. Prove it to your team.**

### How It Works

```
1. Developer uses AI agent to build a feature
2. Developer types: /accept "checkout flow works on all devices"
3. Codacy Accept drives a browser, follows the steps, captures evidence
4. Results: pass/fail + screenshots + recording, organized by commit
5. Report is shareable — anyone can see the proof, no Git required
```

### What We Stopped Trying to Do

| Dropped | Why |
|---------|-----|
| Non-devs write specs | They won't. 20 years of evidence. |
| Comprehensive E2E testing | That's Playwright's job. We verify specific changes. |
| Replace QA teams | We replace the "let me check this manually" step. |
| Formal spec format | A developer writes 3-5 lines or a one-line command. |
| Bidirectional spec editing | One-directional: developer verifies → team sees proof. |

### What We're Betting On

| Bet | Confidence |
|-----|-----------|
| Developers using AI agents need quick verification | **Very High** — the behavior already exists (manual clicking) |
| Multi-device proof is worth paying for | **High** — nobody wants to test on 3 viewports manually |
| Non-devs want to SEE proof, even if they don't write specs | **High** — Joao confirmed this |
| The agent workflow creates a natural adoption moment | **High** — "/accept" after agent builds is a natural step |
| This is defensible against platform players | **Medium-High** — the proof/visibility layer is ours |

---

## 8. The Segment Nobody Else Is Focused On

### "Post-Agent Verification"

This segment didn't exist 18 months ago. It's now one of the largest and fastest-growing pain points in software development.

**Size:** 500K-2M developers using AI agents daily, growing 3-5x annually
**Pain frequency:** Multiple times per day (every time an agent builds something)
**Current solution:** Manually clicking through the app (slow, no evidence, single device)
**Willingness to pay:** High for multi-device, evidence, and team visibility

### Why Competitors Won't Focus Here

| Competitor | Their Focus | Why They'll Miss This |
|------------|-------------|----------------------|
| **Momentic / Octomind** | AI-powered E2E test suites | They build comprehensive test suites for QA teams. We verify specific agent outputs for developers. Different user, different use case. |
| **Playwright** | Browser automation framework | They provide the engine. We provide the workflow. Microsoft doesn't build PM-facing dashboards. |
| **QA Wolf** | Managed QA service | $5-20K/mo service. We're a $29/mo tool. Different market entirely. |
| **Meticulous** | Record-and-replay regression testing | They need production traffic. We work on localhost with zero traffic. Different trigger. |
| **Claude Code / Cursor** | AI coding assistance | They help build. We help verify. They could add basic verification, but not the proof/visibility layer. |
| **BrowserStack / Sauce Labs** | Cross-browser testing infrastructure | Infrastructure providers. We're a workflow tool. They're the engine; we're the car. |

**Our unique positioning:** Post-agent verification with team-visible proof. Nobody owns this.

---

## 9. Revised Feature Priorities

### What Actually Matters (Ordered by Pain Point Impact)

**Tier 1: "This is why I install it" (MVP)**

1. **`/accept` with inline spec** — `/accept "verify checkout works"` — one command, no separate file needed
2. **Multi-device screenshots** — Desktop + iPhone + iPad in one run. This is the "wow" feature.
3. **30-second results** — Must be faster than manual clicking. If it takes 5 minutes, it's not better than doing it myself.
4. **Shareable HTML report** — One link I can paste in Slack/Jira. PM clicks, sees screenshots. No Git required.

**Tier 2: "This is why I keep using it" (v0.2)**

5. **Organized run history per commit** — "Show me what was verified for the last 10 commits"
6. **Lock mode for CI** — Save successful verifications as deterministic tests for regression
7. **PR integration** — Post verification results as a PR comment with screenshots
8. **Cloud dashboard** — Hosted reports, shareable URLs, team workspace

**Tier 3: "This is why my company pays for it" (v0.3)**

9. **Team dashboard** — All verification results across the org, organized by project/PR
10. **Jira/Linear integration** — Link verification results to tickets. PM sees proof in the ticket itself.
11. **Video recording** — Watch the full verification flow
12. **Trend analytics** — "Checkout has been verified green on all devices for 30 days"

### What We Explicitly Deprioritize

- Formal spec authoring tools for non-devs (the fantasy)
- Comprehensive test suite management (Playwright's job)
- Self-healing test maintenance (solving the wrong problem)
- BDD/Gherkin compatibility (baggage from a failed paradigm)

---

## 10. Revised Pricing (Based on Real Value)

### Free: "The Developer Verification Tool"
- `/accept` with inline specs — unlimited
- Desktop single-device verification — unlimited
- Local execution — unlimited
- Last 5 runs history
- Terminal output only

### Pro ($19/mo per seat): "Multi-Device Proof"
- Multi-device verification (Desktop + 3 mobile devices)
- Shareable HTML reports (linkable, no login required)
- Unlimited run history
- Screenshot galleries per run
- Video recording (local)

### Team ($49/mo per seat): "Organizational Proof"
- Cloud dashboard (Codacy-hosted)
- PR integration (GitHub/GitLab comments with screenshots)
- Jira/Linear integration (proof linked to tickets)
- Team workspace (all project verifications in one place)
- Lock mode for CI (deterministic regression from verified specs)
- Priority AI (faster translation)
- Trend analytics

### Why Lower Pricing Than v3

v3 had $29/$99 because it was positioned as a "collaboration platform." The revised product is positioned as a **developer verification tool with team visibility.** Developers have lower willingness to pay than organizations buying "collaboration platforms." But the volume is much higher, and the conversion funnel is simpler.

$19/mo for "multi-device screenshots of everything my agent builds" is an impulse purchase for any developer shipping agent-generated code.

---

## 11. The Honest One-Liner for Each Audience

**For developers:**
> "Verify what your AI agent built. Multi-device. 30 seconds. `/accept`"

**For engineering managers:**
> "Every agent-generated PR comes with proof it works — on every device."

**For PMs (they don't buy it, but they benefit):**
> "See exactly what was built, on every device, with screenshots. No asking developers."

**For investors:**
> "The verification layer for AI-generated code. Developers use it every time an agent ships. The team sees the proof."

---

## 12. The Go/No-Go Questions (Revisited)

### Original Question 1: "Will non-technical stakeholders write specs?"
**Old answer:** "We hope so!"
**New answer:** **We no longer require them to.** Question is retired.

### Original Question 2: "Can AI translation reach 95%+ reliability?"
**Old answer:** "We need to validate this."
**New answer:** **We need 95% reliability for explore mode, which is achievable for modern web apps with reasonable HTML.** Lock mode is deterministic (standard Playwright). The explore mode is more like "can an AI navigate a modern web app?" — and the answer in 2026 is yes, for the 80% of apps that are React/Next.js/Vue with semantic HTML.

**Real validation needed:** Build a prototype, test against 20 real applications (not demos), measure success rate. If it's below 80%, the product doesn't work. If it's above 90%, ship it.

### Original Question 3: "Is this defensible against platform players?"
**Old answer:** "The collaboration layer is defensible."
**New answer:** **The proof/visibility layer is defensible.** Platform players (Playwright, Claude Code) will improve test generation. They will NOT build:
- PM-readable dashboards with screenshot galleries
- Jira/Linear integration showing proof in tickets
- Organizational analytics on what's been verified
- Shareable reports that non-developers can read

**The moat is making verification results useful to people who don't write code.**

### New Question 4: "Can we get to 30-second verification?"
**Critical.** If verification takes longer than manual clicking (5-10 minutes for complex flows), the product fails. Target: 30 seconds for a 5-step verification on 3 devices. This requires:
- Parallel device execution from day one
- Aggressive AI translation caching
- Fast browser startup (Playwright is already fast here)

### New Question 5: "Is the developer adoption moment real?"
**Hypothesis:** After an agent builds something, there's a 30-second window where the developer thinks "does this actually work?" During that window, `/accept` must be the path of least resistance — easier than opening a browser and clicking around.

**How to validate:** Dogfood internally at Codacy. Give it to 10 developers using Claude Code. See if `/accept` becomes habitual.

---

## 13. What We're Really Building

### The Mental Model

Codacy Accept is not a testing tool. It's **`git diff` for behavior.**

- `git diff` shows you what the code changed
- `codacy-accept` shows you **what the product does now** — with visual proof, on every device

Just as `git diff` is the natural "before I commit" step for code, `/accept` becomes the natural "before I merge" step for agent-generated changes.

### The Adoption Arc

```
Week 1:  Developer installs, tries /accept once. "Oh cool, screenshots."
Week 2:  Developer uses /accept after every major agent task. Habitual.
Week 3:  Developer shares a report with PM in Slack. "Here's what I built."
Week 4:  PM asks: "Can I get this for every PR?"
Week 5:  Team upgrades to Pro. Multi-device on every commit.
Week 8:  Engineering manager sees value. Upgrades to Team. Dashboard.
Week 12: PM checks dashboard before every sprint review. Organizational habit.
```

The product grows from developer tool → team tool → organizational tool. But it starts with the developer. Always.

---

## 14. Summary: What Changed and Why

| Dimension | v3 (Before Objections) | v4 (After Objections) |
|-----------|----------------------|----------------------|
| **Who writes specs** | Non-devs (PM, GTM) | **Developers** (3-5 lines or inline) |
| **Who reads results** | Everyone | Everyone (unchanged) |
| **Core value** | Collaboration on specs | **Proof that agent output works** |
| **Positioning** | "Acceptance testing platform" | **"Post-agent verification with team-visible proof"** |
| **Competitor frame** | vs. Momentic, QA Wolf | **vs. manually clicking through the app** |
| **Non-dev role** | Author | **Consumer of proof** |
| **Spec formality** | Structured markdown files | **Inline commands or minimal markdown** |
| **Primary segment** | "Teams doing acceptance testing" | **"Developers shipping agent-generated code"** |
| **Adoption trigger** | "We should have better testing" | **"I need to verify what this agent just built"** |
| **Pricing** | $29-99/seat (platform play) | **$19-49/seat (tool → team)** |
| **Moat** | Spec format + collaboration | **Proof/visibility layer for non-devs** |

### The One Thing That Didn't Change

> **The business needs visibility into what AI agents are building.**

That was always the insight. We just had the wrong mechanism. The mechanism isn't "business writes specs." The mechanism is "developers verify, and the proof is visible to everyone."

---

*Strategic Pivot Document — February 2026*
*Built on: 01-market-research.md, 02-product-spec.md (v3), 03-objections-and-risks.md*
