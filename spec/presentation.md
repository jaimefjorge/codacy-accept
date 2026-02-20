# Codacy Accept

### The Verification Layer for the Age of AI Agents

**February 2026**

---

## Slide 1: Every Paradigm Shift Breaks Verification

Every major shift in how we build software created a verification crisis. Every one was solved — not by going back, but by building new trust mechanisms.

| Shift | What We Lost | How We Rebuilt Trust |
|---|---|---|
| Assembly → C | Visibility into machine instructions | Formal compiler verification (CompCert) |
| Manual → Automated Testing | Human judgment at every step | Layered test suites + coverage metrics |
| Waterfall → Agile | A dedicated verification phase | Continuous testing in every sprint |
| Monolith → Microservices | Debugging a single process | Observability, contract testing, distributed tracing |
| **Human → AI-generated code** | **Understanding of what the code does** | **???** |

Ken Thompson, 1983 Turing Award:

> *"You can't trust code that you did not totally create yourself."*

That quote is 43 years old. It has never been more relevant. We are in the middle of the largest shift in software history, and we have no verification mechanism for it.

---

## Slide 2: The World Has Changed. Our Processes Haven't.

**42% of all committed code is now AI-assisted.** Developers expect this to reach **65% by 2027.**
*(SonarSource, 7.9 billion lines analyzed)*

The numbers behind this shift:

- **20M+ developers** using GitHub Copilot. **90% of Fortune 100** companies adopted it.
- **1 billion commits** pushed to GitHub in 2025 (+25% YoY). **518M pull requests** merged (+29% YoY).
- **1M+ PRs** authored solely by GitHub's Copilot coding agent between May-September 2025.
- **84% of developers** now use AI coding tools; **82%** use them daily or weekly. *(Stack Overflow 2025)*
- **25% of Y Combinator's W25 cohort** has codebases that are **95%+ AI-generated.** *(TechCrunch)*

Andrej Karpathy coined the term "vibe coding" in February 2025:

> *"There's a new kind of coding where you fully give in to the vibes, embrace exponentials, and forget that the code even exists."*

It started as a joke. It became how software is built.

**Yet our processes — code review, unit tests, CI/CD — were all designed for a world where humans wrote code and understood what they wrote.**

---

## Slide 3: The Data Is In. It's Worse Than We Thought.

Five independent studies, different methodologies, same conclusion: **AI-generated code ships more defects.**

| Study | Sample | Key Finding |
|---|---|---|
| **Uplevel (2024)** | 800 developers, before/after Copilot | **+41% bug rate** with Copilot. No productivity gain. |
| **CodeRabbit (2025)** | 470 GitHub PRs (AI vs. human) | **1.7x more issues** per AI PR. Logic errors +75%. XSS +174%. |
| **Veracode (2025)** | 100+ LLMs, 80 coding tasks | **45% of AI code** introduced OWASP vulnerabilities. Java: 72% failure rate. |
| **Apiiro (2025)** | 7,000 devs, 62,000 repos (Fortune 50) | **10x security findings** in 6 months. Privilege escalation +322%. |
| **Stanford (Boneh)** | 47 participants, 5 security tasks | Devs with AI wrote **less secure code** while believing it was **more secure**. |

The defects are not superficial. Trivial syntax errors dropped 76% — AI handles those well. But **architectural design flaws rose 153%** and **privilege escalation paths rose 322%.** *(Apiiro)*

**AI is making the easy bugs rarer and the catastrophic bugs more common.**

---

## Slide 4: Code Review Is Biologically Broken

The Cisco/SmartBear study (2,500 reviews, 3.2M lines) established hard limits for human code review:

- **200-400 LOC** per review for optimal defect detection
- Effectiveness **collapses after 60-90 minutes**
- Above **500 LOC/hour**, significant defects are missed

Now look at what AI produces:

- AI-generated PRs regularly exceed **1,000+ lines** across **20+ files** *(Salesforce Engineering)*
- **PRs per author increased 20% YoY** while **incidents per PR increased 23.5%** *(CodeRabbit)*
- Developers using AI generate **3-4x more commits**, consolidated into **fewer, larger PRs** *(Apiiro)*

The result?

- **96%** of developers don't fully trust AI output — yet **only 48%** always verify before committing *(SonarSource)*
- **59%** of developers use AI-generated code they **don't fully understand** *(Clutch, 800 devs)*
- **40%+ of junior developers** deploy AI code they can't explain *(Industry surveys)*

A developer at one study described it:

> *"Claude implemented a feature I'd been putting off for days. The tests passed. I skimmed it, nodded, merged. Three days later I couldn't explain how it worked."*

**AI increased code output by 30%. Review capacity stayed the same. The math doesn't work.**

---

## Slide 5: Unit Tests Are Broken When AI Writes Both Sides

This is the core structural problem: **when AI writes both the code and the tests, you have no independent verification.**

George Tsiokos formalized this as **"Circular Validation"**: AI analyzes the implementation to generate tests, creating a closed feedback loop. The tests confirm the code works as written — not as intended.

**The Doodledapp case study:** Their team used an LLM to generate tests for a Solidity converter against 17 production contracts. All tests passed on the first run. The problem: the AI "read the converter, understood what it does, and wrote tests confirming that it behaves exactly as implemented." The tests never checked if the converter produced correct results — only that it ran without errors.

> *"If the answer is 'the code itself,' your test suite is a mirror. It will show you exactly what you built and tell you it looks great — even when it does not."*

**The data confirms this:**

- **No correlation** between a model's Pass@1 rate on unit tests and actual code quality or security *(Applied Sciences journal, 2025)*
- AI-generated code improved at passing functional tests over time but showed **no improvement at passing security tests** *(Veracode, 100+ LLMs)*
- Kent Beck reports that AI agents sometimes **delete tests** to make them "pass" *(Pragmatic Engineer interview)*

**The finance analogy for the board:** When the entity writing your code is also writing the quality checks for that code, you have no independent verification. It's a trader auditing their own trades.

Martin Fowler, after extensive experiments at ThoughtWorks:

> *"Because of the non-deterministic nature of this technology, there will always remain a very non-negligible probability that it does things that we don't want."*

Kent Beck, the creator of TDD:

> *"AI agents are genies — they give you what you wish for but in their own way, exploiting all the loopholes in the human phrasing of the wish."*

---

## Slide 6: From Testing Code to Testing Outcomes

Code is becoming invisible. **Agents eat code.** Developers increasingly don't write it, don't read it, and can't meaningfully review it. When code becomes an opaque implementation detail, the only verification surface left is: **does the product behave correctly?**

```
  WHAT HUMANS CAN MEANINGFULLY VERIFY
  ════════════════════════════════════

  Before AI agents                After AI agents
  (human writes code)             (agent writes code)

  ┌───────────────────────┐       ┌───────────────────────┐
  │                       │       │                       │
  │   REQUIREMENTS        │       │   REQUIREMENTS        │
  │   Human authored  [✓] │       │   Human authored  [✓] │
  │                       │       │                       │
  ├───────────────────────┤       ├───────────────────────┤
  │                       │       │ ░░░░░░░░░░░░░░░░░░░░░ │
  │   CODE                │       │ ░░░ CODE ░░░░░░░░░░░░ │
  │   Human authored  [✓] │       │ ░░░ Agent-generated ░ │
  │   Human reviewed  [✓] │       │ ░░░ Not read ░░░░░░░░ │
  │                       │       │ ░░░ Not understood ░░ │
  ├───────────────────────┤       │ ░░░░░░░░░░░░░░░░░░░░░ │
  │                       │       ├───────────────────────┤
  │   UNIT TESTS          │       │ ░░░░░░░░░░░░░░░░░░░░░ │
  │   Human authored  [✓] │       │ ░░░ UNIT TESTS ░░░░░░ │
  │   Tests intent    [✓] │       │ ░░░ Agent-generated ░ │
  │                       │       │ ░░░ Circular ░░░░░░░░ │
  ├───────────────────────┤       │ ░░░░░░░░░░░░░░░░░░░░░ │
  │                       │       ├───────────────────────┤
  │   OUTCOMES            │       │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
  │   Observable      [✓] │       │ ▓▓▓ OUTCOMES ▓▓▓▓▓▓▓▓ │
  │                       │       │ ▓▓▓ Observable    [✓] │
  └───────────────────────┘       │ ▓▓▓ Shareable     [✓] │
                                  │ ▓▓▓ Independent   [✓] │
  You could verify                │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
  the whole stack.                └───────────────────────┘

                                  ▲ THE ONLY LAYER HUMANS
                                    CAN STILL TRUST
```

**The measurement regime must shift:**

```
  WHAT WE MEASURE TODAY               WHAT WE MUST MEASURE NOW
  ─────────────────────────            ────────────────────────────

  Code-level metrics                   Outcome-level metrics
  (assumes humans read code)           (assumes humans DON'T read code)

  ○ Cyclomatic complexity              ● Can the user log in?
  ○ Test line coverage %               ● Does checkout calculate tax correctly?
  ○ Linting rule violations            ● Does the API return the right data?
  ○ Code duplication ratio             ● Does the email get sent?
  ○ PR review approval                 ● Does the page load in <2s?
  ○ Static analysis score              ● Does the export match the spec?

  ▼                                    ▼
  These tell you the CODE              These tell you the PRODUCT
  is well-structured.                  does what was asked.

  ▼                                    ▼
  MEANINGLESS when the code            MEANINGFUL regardless of
  is agent-generated and               who or what wrote the code.
  not read by humans.
```

**The analogy:** You don't inspect the machine code your compiler produces. You test the program's behavior. When agents write code, code becomes the new machine code — an intermediate artifact you verify through its observable outcomes, not by reading it.

> Addy Osmani (Google): *"I don't read much code anymore. I watch the stream and sometimes look at key parts."*

> a16z: *"A more useful unit of truth might be a combination of the prompt that generated the code and the tests that verify its behavior."*

**This is the transition Codacy Accept is built for.** Not testing code. Testing outcomes. Not measuring code quality. Measuring whether the product works.

---

## Slide 7: The Verification Gap Nobody Owns

Every AI coding tool generates code. **None independently verify it does what was asked.**

| Tool | Revenue/Scale | What It Does | What's Missing |
|---|---|---|---|
| **GitHub Copilot** | $2B+ ARR, 20M users | Generates inline code suggestions | Zero verification of output correctness |
| **Cursor** | $1B+ ARR, $29B valuation | Full AI-native IDE | No automated verification layer |
| **Claude Code** | Writes 90% of its own code | Agent-mode coding with terminal access | No built-in acceptance framework |
| **Devin** | $73M ARR, $10.2B valuation | Autonomous coding agent | Completed only 3/20 tasks in independent test. No external verification. |
| **Bolt.new** | $40M ARR in 5 months | AI full-app builder | Code quality "insufficient for serious projects" |
| **Lovable** | $100M ARR in 8 months | AI full-app builder | 170/1,645 apps had unauthorized access vulnerabilities |

And every existing testing/QA tool tests **deployed applications**, not **AI agent output**:

| Tool | Funding | What It Does | What's Missing |
|---|---|---|---|
| **QA Wolf** | $56M | Human+automation E2E testing | Services-heavy, $100K+ ACV, not self-serve |
| **CodeRabbit** | $88M, $550M valuation | AI code review on PRs | Reviews after code is written, not during agent generation |
| **Meticulous** | $4M | Auto-generates visual UI tests | Front-end only, needs production traffic |
| **Momentic** | $19M | AI-powered E2E testing | Tests deployed apps, not agent output |
| **Applitools** | Acquired for $250M | Visual regression testing | Pure visual comparison, no behavioral verification |

**The gap is structural.** Code generation tools assume someone else verifies. Testing tools assume a human wrote the code. Nobody sits between the AI agent and the codebase asking: *"Does this actually do what was requested?"*

---

## Slide 8: The $20B+ Market With No Category Leader

**QA/test automation market: $20-36B today.** Growing to **$51-84B by 2031-2034** at 14-17% CAGR.

**AI-in-testing segment: $1-9B today.** Growing at **18-22% CAGR** — 2-3x faster than the base market.

**VC signal is massive** — but pointed at the wrong problem:

| Company | Raised | Category |
|---|---|---|
| CodeRabbit | $88M at $550M valuation | AI code review (post-PR) |
| QA Wolf | $56M | Managed E2E testing service |
| Code Metal | $125M at $1.25B valuation | "Bridge the trust gap in AI code generation" |
| Momentic | $19M | AI-powered E2E testing |
| Checkly | $32M | Synthetic monitoring |

YC partners themselves note that with more AI-generated code, *"code review has never been more important."* Yet none of these companies own the moment between agent generation and commit.

**The segment we define: Post-Agent Verification.**

- **Target:** Every developer using AI coding agents daily (growing from 500K to 2M+)
- **Trigger:** 42% of committed code is AI-generated, rising to 65% by 2027
- **Timing:** Developer trust in AI accuracy dropped from **40% to 29%** year-over-year. The frustration is peaking. The need is now.

---

## Slide 9: The Regulatory Tailwind

This is not only a developer experience problem. **Compliance is catching up.**

| Regulation | Timeline | Requirement | Penalty |
|---|---|---|---|
| **EU AI Act** | Aug 2, 2026 (full compliance) | AI-generated content must be marked in machine-readable format. High-risk AI systems require human oversight documentation. | **Up to 35M or 7% of global revenue** |
| **FDA Draft Guidance** (Jan 2025) | Effective Feb 2, 2026 | AI-enabled device software must document intended use, validate setup, ensure traceable outputs | Product recall, market removal |
| **Colorado AI Act** | Feb 1, 2026 | Financial institutions must disclose how AI-driven decisions are made | Regulatory enforcement |
| **UK FCA** | Guidance expected 2026 | Audit trails and human-in-the-loop protocols for AI in financial services | Supervisory action |

**The implication:** Organizations will need to prove that AI-generated code was verified by a human-understandable process. A green CI pipeline is not sufficient — you need evidence that behavioral requirements were independently validated.

**Codacy Accept produces that evidence.**

---

## Slide 10: Why BDD Failed — And Why Now Is Different

Every 5 years, someone promises "business writes tests in plain English." **It always fails.** We studied 20 years of failures (Cucumber, FitNesse, Gauge, Concordion). Here's what actually went wrong:

**The real reasons BDD failed:**
1. **Business people never wrote specs.** Engineers ended up writing complex regex step definitions while stakeholders never opened the feature files.
2. **The maintenance burden was crushing.** UI-based Cucumber tests were "the most brittle tests you can possibly write."
3. **The abstraction layer added cost without value.** Engineers repeatedly migrated Cucumber suites back to plain code.
4. **Teams confused the tool with the practice.** Cucumber's own blog: *"BDD is not test automation."* Most teams used it exactly that way.

**Three structural changes make this viable now:**

| Why BDD Failed | Why Codacy Accept Works |
|---|---|
| Non-technical people wouldn't write specs | **Developers write specs — they already do when prompting agents** |
| Step definitions required constant maintenance | **AI IS the translation layer — no step definitions, ever** |
| Testing was optional overhead | **Verification is essential when you ship 2,000 lines you didn't write** |
| Needed org-wide buy-in | **Works solo, day one, one command** |
| Required formal spec authoring (Given/When/Then) | **Natural language or 3-5 lines of markdown** |

The key insight from a16z: *"A more useful unit of truth might be a combination of the prompt that generated the code and the tests that verify its behavior."* *(Nine Emerging Developer Patterns, a16z)*

**The competitor isn't Playwright. It's alt-tabbing to a browser and clicking around for 10 minutes.**

---

## Slide 11: Codacy Accept — How It Works

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

The developer verifies. The whole team sees the proof. No signup needed.

---

## Slide 12: Why Codacy Wins This

| Codacy Asset | How It Applies |
|---|---|
| **Existing CI/CD integrations** | Natural deployment channel for verification gates |
| **Developer trust + brand** | Already associated with code quality across 30K+ customers |
| **"Is the code good?" → "Does the code work?"** | The natural evolution of Codacy's core value proposition |
| **Distribution** | Cross-sell into teams already generating AI code with existing tools |

**Our moat: the proof/visibility layer.** Platform players (Playwright, Claude Code) will improve test generation. They will NOT build PM-readable dashboards, Jira integration, or organized proof-per-commit that non-developers browse.

**Nobody else lets a developer verify agent output in 30 seconds and share visual proof with the whole team — no signup, no code uploaded.**

The PLG playbook is proven. Cursor went from $0 to $1B ARR in 2 years with pure bottom-up adoption. Bolt.new hit $40M ARR in 5 months. Lovable hit $100M in 8 months. **The pattern: instant developer value → team adoption → enterprise procurement.**

---

## Slide 13: Business Model

**Free gets developers in. Team visibility gets organizations paying.**

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
| Compliance audit trail | -- | -- | Yes |

**Conversion arc:** Developer installs → uses `/accept` → shares link with PM → PM asks "can I get this for every PR?" → Team upgrades.

---

## Slide 14: Phased Roadmap

| Phase | Timeline | Goal | Go/No-Go Gate |
|---|---|---|---|
| **0: Validate** | Weeks 1-3 | Can AI reliably drive a browser on real apps? | >90% success on 10+ real apps |
| **1: Dev Tool MVP** | Weeks 4-8 | `/accept` that developers use daily | 5+ Codacy devs using it daily |
| **2: Proof Layer** | Weeks 9-14 | Multi-device, PR comments, lock mode for CI | 20%+ of runs generate shared reports |
| **3: Org Value** | Weeks 15-22 | Team dashboard, Jira integration, compliance trail | PMs checking dashboard weekly |

**Phase 0 is embedded in the build.** We know if the product works before we're halfway through. Data-driven, not hope-driven.

---

## Slide 15: For the Skeptics

We know this team has seen "the future of testing" promised before. Here's our honest assessment of the risks and why we believe the evidence is different this time:

**What the skeptic says → What the data shows:**

| Concern | Evidence |
|---|---|
| *"Developers will just click through verification too"* | They already do with code review. That's the problem. `/accept` produces **shareable visual proof** — screenshots, not checkmarks. Others can see if it's wrong. The accountability structure changes. |
| *"AI can't reliably drive a browser"* | Phase 0 is specifically designed to test this. If >90% reliability on real apps isn't achievable, we don't proceed. We're not betting the company on hope. |
| *"Unit tests are fine"* | Five independent studies show 1.4-1.7x more defects in AI code. Unit tests show no correlation with actual code quality when AI writes them. The METR study shows developers are 19% *slower* with AI — the time "saved" is consumed by verification. |
| *"This is just Cucumber again"* | Cucumber failed because non-devs wouldn't write specs, step definitions required constant maintenance, and testing was optional. All three are structurally different now. Devs already write natural-language prompts. AI eliminates step definitions. Verification is no longer optional — it's the bottleneck. |
| *"Why can't Claude Code / Copilot just do this?"* | They can generate tests. They cannot *independently* verify their own output against requirements. When AI writes both code and tests, it validates its own assumptions. The circular validation problem is structural, not a feature gap. |

---

## Slide 16: The Bet

**2025 was the year of AI speed. 2026 is the year of AI quality.**

The shift is happening:

- Karpathy moved from "vibe coding" to **"agentic engineering"** — *"the process involves both art and science, requires expertise"*
- **92% of developers** want to be measured on **impact**, not output *(Built In)*
- CodeRabbit, reaching $550M valuation: *"2026 will be the year of AI quality"*
- Developer trust in AI accuracy: **29% and falling** *(Stack Overflow, 49K respondents)*

Every AI-generated PR that ships without verification is a liability. Every developer who merges agent code after a 30-second diff review knows they're gambling.

The question is no longer *"does this function work?"* It's *"does this product do what was asked?"*

Codacy Accept answers that question:

- **Zero friction** — one command, no signup, instant proof
- **Developer-adopted** — fits the agent workflow naturally
- **Team-visible** — PM sees proof without asking a developer
- **Compliance-ready** — audit trail for the regulatory wave coming in August 2026
- **Category-defining** — nobody owns post-agent verification

> **Codacy Accept: Proof that your AI agent's code actually works.**

---

## Sources

All claims in this presentation are sourced from independent research:

| Claim | Source |
|---|---|
| 42% of committed code is AI-assisted | SonarSource 2025, 7.9B lines analyzed |
| +41% bug rate with Copilot | Uplevel 2024, 800 developers |
| 1.7x more issues in AI PRs | CodeRabbit 2025, 470 PRs |
| 45% of AI code fails security tests | Veracode 2025, 100+ LLMs |
| 10x security findings in 6 months | Apiiro 2025, 7,000 devs, 62,000 repos |
| 96% don't trust / only 48% verify | SonarSource 2025 |
| 59% use AI code they don't understand | Clutch 2025, 800 developers |
| 19% slower with AI (despite believing faster) | METR 2025 RCT, 16 devs, 246 real issues |
| Code churn 5.5%→7.9%, refactoring 25%→<10% | GitClear 2025, 211M lines |
| Devs with AI write less secure code | Stanford (Boneh et al.), 47 participants |
| Trust in AI accuracy 40%→29% | Stack Overflow 2025, 49K respondents |
| 1 in 5 CISOs report AI-code breaches | Aikido Security 2025, 450 respondents |
| 200-400 LOC optimal review size | Cisco/SmartBear, 2,500 reviews, 3.2M lines |
| Circular validation in AI-generated tests | George Tsiokos 2025, Doodledapp case study |
| AI agents delete tests to make them pass | Kent Beck, Pragmatic Engineer interview |
| No correlation between Pass@1 and code quality | Applied Sciences journal, 2025 |
| EU AI Act 7% revenue penalty | EU AI Act, full compliance Aug 2026 |
| Cursor $0→$1B ARR in 2 years | CNBC, Anysphere Series D |
| Lovable $100M ARR in 8 months | Industry reports |
| 25% of YC W25 is 95%+ AI-generated | TechCrunch |

---

*Codacy | February 2026*
