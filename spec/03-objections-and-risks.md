# Codacy Accept: Objections, Risks, and Why This Might Fail
## The Strongest Case Against Building This Product
## February 2026

---

## Purpose of This Document

This is the **devil's advocate** analysis. Every objection here is real, grounded in historical evidence, and deserves a serious answer before committing resources. If we can't address these honestly, we shouldn't build this.

---

## OBJECTION 1: "Non-Devs Writing Specs" Is a 20-Year-Old Fantasy That Has Never Worked

### The Evidence Is Overwhelming

The idea that non-technical stakeholders will write structured specifications has been tried repeatedly for over two decades. It has failed **every single time** at scale.

**Cucumber/BDD (2006-present):** The Gherkin `Given/When/Then` syntax was designed explicitly so product managers would write acceptance scenarios. After 20 years:
- SmartBear surveys found that **in 70%+ of BDD-using teams, only developers write Gherkin**. Business stakeholders almost never write them and rarely even read them.
- Aslak Hellesoy (Cucumber creator) spent years giving talks on "Cucumber Anti-Patterns," acknowledging most teams misuse the tool.
- Dan North (who coined BDD) distanced himself from Cucumber-style tooling, emphasizing BDD was about conversations, not automation syntax.
- Matt Wynne (co-creator of Cucumber) acknowledged that 90%+ of users were "doing it wrong" — but if 90% of users can't use your tool correctly, the tool is the problem.

**FitNesse (2001-present, effectively dead):** Robert "Uncle Bob" Martin's wiki-based acceptance testing tool. Non-technical people would write tests in wiki tables. What happened: they never did. Developers wrote them. The tool is effectively abandoned.

**Concordion (2008-present, niche):** Markdown/HTML specs with embedded test assertions. Never achieved adoption outside ThoughtWorks. Non-technical stakeholders did not read the specs, let alone write them.

**Gauge (ThoughtWorks, 2014-present, struggling):** ThoughtWorks' own markdown-based testing framework. Despite ThoughtWorks' enormous brand in testing/agile, Gauge never achieved meaningful market share. GitHub stars stagnated. The 2023 ThoughtWorks Technology Radar stopped featuring it.

**Robot Framework (2005-present, niche):** Keyword-driven, human-readable test format. Despite being mature and well-maintained, it remains niche because the human-readable format is read by humans approximately never.

### Why PMs Won't Write Specs

Product managers are measured on **shipping features and driving business metrics**, not on the quality of their acceptance criteria. Their incentive structure actively discourages precise specification:

- Writing a Jira ticket with "user should be able to log in" takes **30 seconds**
- Writing a precise markdown spec takes **15-30 minutes** and requires thinking through edge cases, data states, and UI specifics
- When a PM has 47 Jira tickets to triage before sprint planning, they will not spend time writing detailed acceptance criteria in a separate tool
- PMs already feel overworked. Adding "maintain acceptance specs in the repo" to their plate is a non-starter.

### The "It's Just Markdown" Trap

Markdown is lower friction than Gherkin, yes. But the barrier was never the syntax. It's the **discipline**:

- Even among developers, markdown documentation rots at an alarming rate
- README files become stale within months
- Architecture Decision Records (ADRs) are abandoned after the initial enthusiasm
- The idea that non-developers will maintain living markdown documents with the precision needed for automated testing is aspirational to the point of fantasy

### Potential Counter-Arguments
- "AI agents change the equation — the spec isn't optional overhead, it's the input to the agent"
- "In a vibe-coding world, the spec is the ONLY thing the human contributes"
- "We're not asking PMs to learn a new tool — markdown in GitHub web editor is enough"
- "The AI can help generate/refine specs, not just consume them"

**Verdict: This is the #1 risk. If non-devs don't write specs, the entire thesis collapses.**

---

## OBJECTION 2: AI Translation Is Fundamentally Non-Deterministic — And Tests Must Be Deterministic

### The Core Paradox

LLMs are probabilistically non-deterministic systems. Tests must be deterministic. These are fundamentally opposed.

Even with temperature=0, the same prompt can produce different outputs across model versions, API calls, and context states. A test that uses AI inference is a test that might behave differently tomorrow for reasons nobody can explain. **This is antithetical to the purpose of testing.**

### The 80/20 Problem

Even if AI generates correct Playwright tests 80% of the time (optimistic for complex scenarios), the remaining 20% is catastrophic:

- If 1 in 5 tests fails because the AI generated incorrect code (not because of a real bug), the team learns to **distrust all test results**
- This is the "boy who cried wolf" problem — false failures train people to ignore real failures
- Debugging requires understanding both the intended behavior AND the AI-generated code — meaning a developer must review every failure, defeating the purpose
- The AI will fail on the **hardest, most important tests** (complex flows, edge cases) while succeeding on trivial tests that add little value

### Caching Creates Different Brittleness

Caching AI-generated tests sounds like a solution to non-determinism. But:

- Cached tests become **stale when the UI changes**. A button that was `.btn-primary` is now `[data-testid="submit"]`. The cached test breaks.
- Cache invalidation requires knowing when to regenerate vs. reuse — itself a hard problem
- If you cache aggressively → stale tests. If you regenerate frequently → non-determinism + high API costs. **No comfortable middle ground.**

### Complex Interactions AI Can't Reliably Handle

| Interaction | Why It's Hard |
|-------------|---------------|
| **Drag-and-drop** | Different libraries (react-beautiful-dnd, dnd-kit, SortableJS) handle drag events differently. AI must generate the exact mouse event sequence. |
| **Canvas elements** | `<canvas>` content is opaque to Playwright. AI can't assert on canvas state. |
| **Shadow DOM** | Requires piercing selectors (`>>`). AI must know which components use shadow DOM. |
| **Iframes** | Cross-origin iframes, nested iframes, dynamic iframes all need specific handling. |
| **Third-party widgets** | Stripe Elements, Google Maps, reCAPTCHA, OAuth popups — common in real apps, extremely hard to automate. |
| **Rich text editors** | ProseMirror, TipTap, Slate, CKEditor — each has different input handling. |
| **File uploads** | Require specific Playwright APIs, not just "click upload." |
| **WebSockets** | Real-time updates that change page state unpredictably during test execution. |

### The Cost Problem at Scale

For a medium-sized application with 200 acceptance criteria:
- Initial generation: 200 specs × 3 AI calls = 600 API calls
- Regeneration per sprint (~20% UI churn): 120 more calls
- At $0.01-0.05 per call → $6-30 per generation cycle
- Across multiple devices: multiply by 3-5x
- Daily CI runs: compounds rapidly
- **Teams cannot predict or control this cost** because regeneration is triggered by UI changes

### Potential Counter-Arguments
- "Generate-then-cache means most runs are deterministic (no AI calls)"
- "The accessibility tree approach is more reliable than screenshot-based"
- "We can fall back to Playwright codegen for complex interactions"
- "Cost decreases as models get cheaper and caching improves"

**Verdict: Solvable with aggressive caching, but the 80/20 trust problem is real and may be fatal.**

---

## OBJECTION 3: Testing Tools Have Notoriously Low Adoption

### Developer Tool Adoption Is Brutally Darwinian

The adoption funnel for testing tools is a massacre:

| Stage | Dropout Rate | Reality |
|-------|-------------|---------|
| Awareness | — | Developer hears about the tool |
| Trial | ~20% drop | Works on TodoMVC |
| Real-world attempt | **~80% drop** | Chokes on real app (auth, state, dynamic content) |
| Team adoption | **~80% drop** | Team has preferred approaches |
| Sustained use (6 months) | **~50% drop** | Maintenance burden becomes apparent |

**Net: For every 1,000 developers who try it, perhaps 10-20 are still using it after 6 months.**

### The "Tests Are Overhead" Mindset

Despite decades of advocacy:
- Managers and product leaders rarely ask "do we have tests?" — they ask "when will it ship?"
- The ROI of testing is diffuse and long-term, making it perpetually deprioritized
- E2E tests specifically are seen as the **most expensive, most fragile, least-valuable** layer of the testing pyramid
- Google's testing strategy explicitly recommends **minimizing E2E tests**

### The "Just Enough Testing" Equilibrium

Most mature teams have settled into a stable equilibrium:
- Unit tests for business logic (genuinely useful to developers)
- Some integration tests for critical paths
- A handful of E2E smoke tests (login, happy-path purchase)
- Manual QA for everything else

Codacy Accept must **disrupt this equilibrium**. But most teams don't believe their current approach is inadequate — or if they do, they want "more unit tests" not "more E2E tests."

### E2E Tests Are the First Casualty

When under pressure (which is always), E2E tests are cut first because:
- They're slow (minutes vs. seconds for unit tests)
- They're flaky (false failures erode trust)
- They break on every UI change (high maintenance)
- They catch relatively few bugs per test (low ROI)

Adding AI-generated E2E tests doesn't solve these fundamental problems.

### Potential Counter-Arguments
- "This isn't a testing tool — it's a collaboration/alignment tool that happens to use tests as the mechanism"
- "The AI agent workflow is new — existing adoption patterns may not apply"
- "The free CLI + Claude Code skill creates a zero-friction entry point"
- "We're not asking developers to do more work — the agent does the work"

**Verdict: Real risk, but the agent-native distribution channel (Claude Code skill) may change the adoption dynamic.**

---

## OBJECTION 4: Technical Obstacles Are Massive

### Environment Setup Is the Hidden Killer

For Codacy Accept to work, the application must be:
- **Running and accessible** — requires deployment infrastructure or local dev setup
- **Seeded with correct test data** — requires database fixtures (app-specific)
- **In a known state** — requires ability to reset state between tests
- **Authenticated** — requires test credentials, token management, session handling

**Each of these is a multi-day setup task** that Codacy Accept cannot solve. The product presupposes the hardest part of E2E testing is writing the tests. It's not. It's the infrastructure.

### Authentication Is a Nightmare

Real applications have:
- OAuth2/OIDC with third-party providers (Google, GitHub, Okta)
- Multi-factor authentication
- CSRF tokens
- Session management and token refresh
- Role-based access control (tests need different users with different permissions)
- SSO integration

An AI writing tests from markdown has no way to handle authentication without extensive custom scaffolding — exactly the developer work this product claims to eliminate.

### The Flaky Test Problem Is Unsolved

Even without AI in the loop:
- Google research (2016): **~16% of tests exhibited flakiness** — in a world-class testing infrastructure
- Microsoft study (2020): Flaky tests cost **thousands of developer-hours per month**
- Primary causes — timing issues, race conditions, network variability — are **inherent to E2E testing** and cannot be solved by better test generation

Adding AI-generated tests will **increase flakiness**, not decrease it.

### Dynamic Content Breaks Everything

| Challenge | Why It's Hard |
|-----------|---------------|
| Skeleton loaders | Content appears after API calls complete |
| Infinite scroll | Page structure changes as user scrolls |
| WebSocket updates | Page changes during test execution |
| CSS animations | Elements may not be clickable during transitions |
| Lazy-loaded components | Elements don't exist until they're needed |
| Optimistic UI | Brief incorrect states during updates |

Each requires specific Playwright handling (`waitForSelector`, `waitForResponse`, animation disabling) that the AI must infer from natural language. It will frequently get this wrong.

### Multi-Device Emulation Is a Lie

Playwright device emulation:
- Emulates viewport sizes and user-agents but **not actual device rendering engines**
- Cannot catch Safari-specific bugs (Playwright's WebKit ≠ Safari)
- Cannot catch real mobile browser quirks (touch targets, software keyboard, mobile CSS bugs)
- Cannot test on actual iOS devices at all
- Creates **false confidence** that may be worse than no coverage

### Potential Counter-Arguments
- "The `codacy-accept init` command can scaffold environment setup"
- "Auth can be handled with a login-before-test step or cookie injection config"
- "Flakiness is a Playwright problem, not our problem — we use Playwright's built-in retry/wait mechanisms"
- "Emulation catches 80% of responsive issues; real devices are a paid tier feature"

**Verdict: These are real, hard problems. The MVP must scope them honestly — don't promise to solve auth or environment setup. Focus on apps that are already running and accessible.**

---

## OBJECTION 5: The Market May Not Exist (Or May Be Too Small)

### Platform Players Could Eat This

| Threat | Likelihood | Impact |
|--------|-----------|--------|
| **Playwright adds `--from-spec` flag** | Medium | Fatal — Microsoft has the resources and the user base |
| **Claude Code builds native acceptance testing** | Medium-High | Fatal — removes the need for a separate tool |
| **Cursor/Copilot add spec-to-test generation** | High | Severe — does the same thing inside the editor |
| **GitHub adds acceptance testing to Actions** | Medium | Severe — distribution advantage is overwhelming |

The risk of platform subsumption is extremely high in this category. Every major AI coding tool is 6-12 months from offering similar functionality as a built-in feature.

### The Market May Be Smaller Than Projected

- Only **30-40% of software teams** do any automated E2E testing at all
- Of those, most use Selenium (legacy) or Cypress (incumbent), not Playwright
- Of Playwright users, most are developers comfortable writing tests directly
- The target market — teams that want E2E testing, use Playwright (or will switch), and want non-devs to write specs — is a **very thin intersection**

### "Nice to Have" vs "Must Have"

Testing tools live in "nice to have" territory:
- First budget line cut in a downturn
- Must compete with "must have" tools (APM, CI/CD, source control) for budget
- Long sales cycles — nobody is in urgent pain
- High churn — teams experiment, see moderate results, don't renew

### The Pricing Pressure Problem

- Playwright is free
- Claude Code can already generate Playwright tests from natural language prompts
- Auto-playwright is open source
- Any developer can build a basic "markdown to Playwright" pipeline in a weekend hackathon
- The value-add that justifies $29-99/seat/month must be **dramatically clear** — multi-device, reporting, cloud execution must be genuinely differentiated

### Potential Counter-Arguments
- "Platform risk exists for every startup — you build faster and more focused than the platforms"
- "The collaboration layer (PM-facing reports, bidirectional workflow) is NOT something Playwright/Claude will build"
- "We're not a testing tool — we're a business alignment tool. Different buyer, different budget."
- "Codacy already has 30K+ customers to cross-sell into"

**Verdict: Platform risk is real but manageable if the product is positioned as a collaboration/alignment tool (not a testing tool) with organizational purchasing dynamics.**

---

## OBJECTION 6: The Collaboration Myth

### Developers and Business Don't Collaborate on Specs — Ever

**Organizational structure prevents it.** Each group has optimized around their tools:
- PMs: Jira, Linear, Notion, Shortcut
- Designers: Figma, Sketch
- Developers: IDEs, terminals, Git
- QA: Their own tools

Asking any group to adopt an additional tool for "collaboration" faces enormous inertia. This is not a technology problem — it's an organizational behavior problem.

### The GitHub Literacy Barrier

For non-developers, Git is an incomprehensible tool:
- Pull requests, branches, merge conflicts — foreign concepts
- Even GitHub's web UI is intimidating for non-technical users accustomed to Notion
- "Files in a repository" is fundamentally different from "pages in a wiki" or "tickets in Jira"
- Non-technical people prefer the latter **overwhelmingly**

### Specs in Repos Don't Get Read by Non-Technical People

Historical evidence:
- README files → read primarily by developers
- API documentation in repos → read primarily by developers
- Architecture Decision Records → read primarily by developers
- **Pattern: non-technical people do not go to repositories to read documents**, regardless of format

### Why Jira/Notion Win

Non-technical stakeholders stay in Jira/Notion because:
- Notifications, @mentions, comments, activity feeds fit their workflow
- Integration with Slack, email, calendars
- Permission models that make sense to them
- No version control understanding required
- Rich media support (images, embeds, tables)
- **Most importantly: it's where the rest of the non-technical organization already is**

Asking a PM to write acceptance criteria in a markdown file instead of a Jira ticket is asking them to change their core workflow for a testing tool. This will not happen at scale.

### The Incentive Mismatch

For collaboration to work, both parties need to benefit:
- Developers benefit from clear specs → but they can get this by asking clarifying questions in Jira comments
- PMs benefit from knowing requirements are tested → but they can get this from a dashboard without writing specs themselves
- **Neither party benefits enough from the collaboration itself to justify a new tool and workflow**

### Potential Counter-Arguments
- "AI agents change the equation — the spec isn't optional documentation, it's the mandatory input"
- "In a no-code/vibe-coding world, the PM IS the programmer — the spec is their code"
- "We can import from Jira/Linear, not require PMs to use GitHub"
- "The cloud dashboard is the PM's interface, not the repo"
- "GitHub web editor is simpler than people think — PMs edit markdown in Notion already"

**Verdict: The strongest counter is the Jira/Linear import path. Meet PMs where they are. Don't force them into repos.**

---

## OBJECTION 7: "Writing Test Code" Isn't the Hard Part

### The Meta-Objection

The hard part of testing is **not writing the test code**. Modern frameworks (Playwright, Cypress) have made test code writing relatively straightforward. The actual hard parts are:

| Hard Part | % of Testing Effort | Does Codacy Accept Address It? |
|-----------|--------------------|---------------------------------|
| Deciding what to test | 25% | Partially (PM writes criteria) |
| Setting up test data and environments | 25% | No |
| Maintaining tests as the product evolves | 20% | Partially (AI re-generates) |
| Debugging flaky tests | 15% | No (may make it worse) |
| Building a culture that values testing | 10% | Partially (PM-visible results) |
| Writing the actual test code | 5% | **Yes** |

Codacy Accept primarily addresses **~5% of the testing problem** (writing test code) while marketing it as a revolution. The remaining 95% — environment setup, test data, maintenance, debugging, culture — remains untouched.

### The Expertise Paradox

- People with enough domain expertise to write good specs (detailed, precise, covering edge cases) usually have enough technical skill to write test code
- People without technical skill write vague, incomplete specs requiring developer interpretation
- The "sweet spot" audience (deep domain knowledge + zero coding ability + willingness to write detailed specs) is **vanishingly small**

### Potential Counter-Arguments
- "We're not solving the 'write test code' problem — we're solving the 'business intent → verified code' alignment problem"
- "The agent handles environment setup (run `npm start`, seed data)"
- "AI re-generation handles maintenance automatically"
- "The value isn't in automating test-writing — it's in making business requirements executable"

**Verdict: Valid criticism. The product must be positioned around the alignment/collaboration value, not the test-generation value.**

---

## OBJECTION 8: Historical Pattern — Every Generation Promises This and Fails

### The Cycle Repeats Every 5 Years

| Era | Technology | Promise | Outcome |
|-----|-----------|---------|---------|
| 2001 | FitNesse (wikis) | "Business writes tests in wiki tables" | Business never wrote tables. Tool died. |
| 2006 | Cucumber (BDD) | "Business writes tests in plain English" | Developers wrote all the Gherkin. Step definitions became a maintenance nightmare. |
| 2008 | Concordion (spec docs) | "Living documentation from specs" | Remained niche. Non-devs never engaged. |
| 2014 | Gauge (markdown) | "Markdown-based specs anyone can write" | ThoughtWorks' own tool never took off. |
| 2018 | Mabl/Testim (ML) | "AI makes tests self-healing" | Moderate adoption. AI was oversold. Trust issues. |
| 2023 | Momentic/Octomind (LLMs) | "AI writes and maintains E2E tests" | Early traction. Reliability concerns growing. |
| **2026** | **Codacy Accept (LLMs + markdown)** | **"Non-devs write specs, AI runs tests"** | **???** |

The pattern is identical every cycle:
1. New technology enables a better abstraction layer
2. Startup promises to bridge the business-developer gap
3. Impressive demos on simple applications
4. Reality hits on complex real-world codebases
5. Non-technical stakeholders never engage as hoped
6. Tool becomes "just another testing framework" used only by developers
7. Developers prefer existing code-based tools they already know

### Why Is This Time Different?

The honest answer: **it might not be different.** The same fundamental barriers exist:
- Non-technical people don't want to write specs (incentive problem)
- Natural language is ambiguous; tests need precision (precision problem)
- AI adds non-determinism to a process that requires determinism (paradox problem)
- The hard parts of testing aren't addressed (scope problem)

### But There Are Legitimate Reasons It COULD Be Different

1. **AI agents fundamentally change the developer workflow.** When a coding agent commits code autonomously, someone must define acceptance criteria. The spec isn't optional anymore — it's the control mechanism. This is new.

2. **The AI is the translation layer, not a human developer.** Cucumber failed because the step-definition maintenance fell on developers. If AI maintains the translation, the burden shifts.

3. **"Vibe coding" creates a new persona.** Non-technical founders building entire products with AI didn't exist in 2014. They genuinely need acceptance testing and can't write Playwright code.

4. **The spec IS the product definition, not test overhead.** In a world where AI writes all the code, the human's contribution is the spec. This reframes the tool from "testing overhead" to "product definition."

---

## OBJECTION 9: Specific Failure Modes to Watch For

### The Most Likely Ways This Dies

**Failure Mode 1: "Developer-Only Tool"**
PMs never write specs. Developers write them. The tool becomes a Playwright wrapper with AI assist — competing directly with Copilot, Cursor, and Claude Code. No differentiation. Slow death.

**Failure Mode 2: "Works on Demo, Dies on Real Apps"**
The demo on a simple app is amazing. Real customers have auth, complex state, third-party integrations. Onboarding takes weeks, not minutes. Churn spikes at month 3.

**Failure Mode 3: "AI Flakiness Destroys Trust"**
Tests fail randomly due to AI translation inconsistencies. Developers lose trust. They disable the tool or ignore its results. The "boy who cried wolf" dynamic takes hold.

**Failure Mode 4: "Platform Subsumption"**
Playwright adds a `--from-spec` flag, or Claude Code adds native acceptance testing. Codacy Accept's value proposition disappears overnight. 6-12 month risk window.

**Failure Mode 5: "Collaboration Theater"**
The tool is adopted, but PMs never look at the specs or results. Developers write the specs, run the tests, fix the failures. The "collaboration" is theoretical. The product becomes a testing tool with extra steps.

**Failure Mode 6: "Scope Creep into Platform"**
To solve the real problems (environment setup, auth, test data, CI integration, PM-friendly UI), the product grows into a full platform. Development slows. Complexity kills the "simple" value proposition.

---

## SUMMARY: Risk Matrix

| Risk | Severity | Likelihood | Mitigable? |
|------|----------|-----------|------------|
| Non-devs won't write specs | **Critical** | **High** | Partially — Jira import, AI-assisted spec generation |
| AI translation unreliable | **High** | **Medium** | Yes — caching, generate-then-run, fallback to codegen |
| Platform subsumption | **High** | **Medium** | Partially — collaboration layer is defensible |
| Testing tool low adoption | **High** | **Medium** | Partially — agent-native distribution is novel |
| Environment/auth complexity | **High** | **High** | Partially — must scope MVP honestly |
| "Writing tests" isn't the hard part | **High** | **Certain** | Requires repositioning as alignment tool |
| GitHub literacy barrier for non-devs | **Medium** | **High** | Yes — cloud dashboard, Jira import |
| E2E test flakiness | **Medium** | **High** | Partially — inherent to the category |
| Market smaller than projected | **Medium** | **Medium** | Unknown until validated |
| AI costs at scale | **Low** | **Medium** | Yes — caching, model optimization |

### The Three Questions That Must Be Answered Before Building

1. **Will non-technical stakeholders actually write and maintain acceptance specs?** If the answer is "probably not" — and history says it's "probably not" — the product thesis must be reframed around developer-authored specs with PM-visible results. That's a different (and smaller) product.

2. **Can AI translation reach 95%+ reliability on real-world applications?** If not, the trust problem will kill adoption. This needs to be validated with real applications, not demos, before committing to a full product.

3. **Is the collaboration layer genuinely defensible against platform players?** If Playwright adds spec-to-test, if Claude Code adds native acceptance testing, if GitHub adds this to Actions — does the PM-facing collaboration layer alone justify a standalone product?

---

*Devil's Advocate Analysis — February 2026*
*If you can't answer these objections, don't build this. If you can, you might have something.*
