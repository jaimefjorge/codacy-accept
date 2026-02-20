# Codacy Accept

### The Verification Layer for AI-Generated Code

**February 2026**

---

## Slide 1: The Problem

**AI writes the code. Nobody verifies it works.**

- Bug rates up **41%** with AI copilots (Uplevel, 800+ devs)
- Code churn **doubled** with Copilot adoption (GitClear, 153M lines)
- 46%+ of code on GitHub is now AI-generated
- Developers using AI produce **less secure** code while believing it's **more secure** (Stanford)

The agent writes 2,000 lines across 15 files. The developer stares at the diff for 30 seconds. Merges. The PM finds out 3 days later in staging that it's wrong.

**The bottleneck is no longer writing code. It's verifying it.**

---

## Slide 2: The Trust Gap Nobody Owns

Every AI coding tool generates code. None verify it meets requirements.

| Tool | What It Does | What's Missing |
|------|-------------|----------------|
| GitHub Copilot | Generates code + unit tests | No acceptance validation |
| Claude Code | Writes + runs tests | No built-in acceptance framework |
| Cursor | Generates tests alongside code | Tests are suggestions, not validated |
| Devin ($500/mo) | Runs tests in sandbox | Acceptance testing not a focus |
| Bolt / v0 / Lovable | Generates full apps | Almost zero tests in output |

**When AI writes both code AND tests, it validates its own assumptions, not the actual requirements. There is no independent check.**

---

## Slide 3: The $45B Market Opportunity

- Global QA/test automation market: **$25B today, $45-55B by 2030**
- AI-in-testing segment growing at **25-35% CAGR**
- Heavy VC signal: Meticulous ($32M), QA Wolf ($36M), Momentic, Octomind all funded 2023-2024

**But none of them own "post-agent verification":**

- Meticulous needs production traffic
- QA Wolf is a $5-20K/mo managed service
- Momentic/Octomind target QA teams, not agent-using developers
- Playwright is infrastructure, not a workflow

**The segment we own: 500K-2M developers shipping agent-generated code daily. Growing 3-5x/year.**

---

## Slide 4: The Insight That Changed Everything

We stress-tested our assumptions against 20 years of failed "business writes specs" tools (Cucumber, FitNesse, Gauge, Concordion). The evidence is overwhelming: **non-technical people will not write specs.**

So we flipped it.

| What We Stopped Believing | What We Now Know |
|---|---|
| PMs will write acceptance specs | **Developers write specs (3 lines or inline)** |
| Collaboration means co-authoring | **Collaboration means shared visibility** |
| We're building a testing tool | **We're replacing manual clicking** |
| The spec is the product | **The proof is the product** |

> The developer verifies. The whole team sees the proof. No signup needed.

---

## Slide 5: Codacy Accept — How It Works

**30 seconds from command to shareable proof.**

```
Developer: /accept "verify checkout — add item, apply discount, pay, see confirmation"

  Codacy Accept
  ─────────────

  ✓ Add item to cart                     2.1s  📸
  ✓ Apply discount code SAVE20           1.8s  📸
  ✓ Complete payment                     3.2s  📸
  ✓ See order confirmation               1.5s  📸

  Run #007 | 4/4 passed | 8.6s
  Share: codacy.com/accept/r/a1b2c3d ← no signup needed
```

The developer pastes the link in Slack. The PM clicks it. Screenshots of every step. **Zero Git literacy required.**

**This is `git diff` for behavior.** `git diff` shows what code changed. `/accept` shows what the product does now.

---

## Slide 6: Why This Time Is Different

Every 5 years someone promises "business writes tests in plain English." It always fails. Here's why we're not that:

| Past Failures | Codacy Accept |
|---|---|
| Required non-devs to write specs | **Developer writes specs (they already do when prompting agents)** |
| Testing was optional overhead | **Verification is a need when you ship 2,000 lines you didn't write** |
| Tools needed org-wide adoption | **`/accept` works solo, day one, no org buy-in** |
| The hard part was step definitions | **AI is the translation layer — no step definitions, ever** |
| Required formal spec authoring | **One inline command or 3-5 lines of markdown** |

**The competitor isn't Playwright. It's alt-tabbing to a browser and clicking around for 10 minutes.**

---

## Slide 7: Why Codacy Wins This

| Codacy Asset | How It Applies |
|---|---|
| Existing CI/CD integrations | Natural deployment channel for verification gates |
| Developer trust + brand | Already associated with code quality |
| 30K+ customer base | Cross-sell into teams already generating AI code |
| Code quality expertise | From "is the code good?" to "does the code do what was asked?" |

**Our moat: the proof/visibility layer.** Platform players (Playwright, Claude Code) will improve test generation. They will NOT build PM-readable dashboards, Jira integration, or organized proof-per-commit that non-developers browse.

**Nobody else lets a developer verify agent output in 30 seconds and share visual proof with the whole team — no signup, no code uploaded.**

---

## Slide 8: Business Model

**Free gets developers in. Multi-device + team visibility gets organizations paying.**

| | Free (no signup) | Pro $19/mo/seat | Team $49/mo/seat |
|---|---|---|---|
| `/accept` inline + file specs | Unlimited | Unlimited | Unlimited |
| Screenshots per step | Yes | Yes | Yes |
| Shareable proof link | Yes (30-day expiry) | Persistent | Persistent |
| Multi-device (mobile + tablet) | -- | 4 devices | Unlimited |
| Lock mode (deterministic CI) | -- | Yes | Yes |
| PR comments with screenshots | -- | -- | Yes |
| Cloud dashboard | -- | -- | Yes |
| Jira/Linear integration | -- | -- | Yes |

**Conversion arc:** Developer installs, uses `/accept`, shares a link with PM. PM asks "can I get this for every PR?" Team upgrades.

---

## Slide 9: Phased Roadmap

| Phase | Timeline | Goal | Go/No-Go Gate |
|---|---|---|---|
| **0: Validate** | Weeks 1-3 | Can AI reliably drive a browser on real apps? | >90% success on 10+ real apps |
| **1: Dev Tool MVP** | Weeks 4-8 | `/accept` that developers use daily | 5+ Codacy devs using it daily |
| **2: Proof Layer** | Weeks 9-14 | Multi-device, PR comments, lock mode for CI | 20%+ of runs generate shared reports |
| **3: Org Value** | Weeks 15-22 | Team dashboard, Jira integration, analytics | PMs checking dashboard weekly |

**Phase 0 is embedded in the build.** We know if the product works before we're halfway through. Data-driven, not hope-driven.

**Phase 1 build: 2 parallel workstreams.** CLI (TypeScript/Playwright) + Results Server (Lovable). 1 engineer + Lovable. 5 weeks.

---

## Slide 10: The Bet

**In the age of AI agents, coding is cheap. Verification is the bottleneck.**

Every AI-generated PR that ships without verification is a liability. Every developer who merges agent code after a 30-second diff review knows they're gambling.

Codacy Accept is the quality gate the industry needs:
- **Zero friction** — one command, no signup, instant proof
- **Developer-adopted** — fits the agent workflow naturally
- **Team-visible** — PM sees proof without asking a developer
- **Category-defining** — nobody owns "post-agent verification"

> **Codacy Accept: Proof that your AI agent's code actually works.**

The window to establish category leadership is now.

---

*Codacy | February 2026*
