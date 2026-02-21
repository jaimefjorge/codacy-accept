# Accept Framework Specification

Canonical reference for writing, executing, and reporting `.accept.md` verification specs.

---

## 1. Goals and Objectives

Accept provides markdown-driven visual verification of web applications using AI (Claude) + Playwright MCP. The goals are:

- **Proof over trust**: Generate shareable evidence that features actually work
- **Human-readable specs**: Anyone can write and understand verification scenarios
- **AI-executed**: Claude reads specs and drives the browser — no test code to maintain
- **Screenshot evidence**: Every step produces a screenshot for visual proof
- **Shareable results**: Upload results to get a share link for stakeholders

---

## 2. How It Works

### Architecture

```
.accept.md spec → Claude Code + Playwright MCP → Screenshots + Results → HTML Report + Share Link
```

### Execution Flow

1. User invokes `/accept .accept/specs/checkout.accept.md` (or a free-text description)
2. Claude reads the spec file, parsing all sections
3. For each step, Claude uses Playwright MCP to interact with the browser
4. After each step, a screenshot is taken as evidence
5. Results are saved to `.accept/runs/<NNN>/`
6. An HTML report is generated and optionally uploaded for sharing

### Directory Structure

```
project/
├── .accept/
│   ├── config.json              ← App URL and settings
│   ├── auth.json                ← Optional authentication config
│   ├── specs/
│   │   ├── 01-homepage.accept.md    ← Verification specs
│   │   ├── 02-auth-flow.accept.md
│   │   ├── fixtures/                ← Test data and seeding scripts
│   │   │   ├── sample-upload.pdf
│   │   │   ├── test-data.json
│   │   │   └── scripts/
│   │   │       └── seed-data.sh
│   │   └── ...
│   └── runs/
│       ├── 001/
│       │   ├── results.json     ← Structured run results
│       │   ├── summary.md       ← Markdown summary
│       │   ├── report.html      ← Visual HTML report
│       │   ├── step-1.png       ← Screenshot evidence
│       │   ├── step-2.png
│       │   └── ...
│       └── 002/
│           └── ...
├── .claude/skills/accept/
│   └── SKILL.md                 ← Claude skill definition
└── spec/
    └── FRAMEWORK_SPEC.md        ← This document
```

---

## 3. Spec File Format

Every `.accept.md` file follows this structure. Only **Title**, **App URL**, and **Steps** are required; all other sections are optional.

### Complete Example

```markdown
# Verify Checkout Flow

## Metadata
- **Priority**: critical
- **Area**: commerce
- **Requires Auth**: yes
- **Estimated Duration**: medium (~60s)

- App: http://localhost:3000

> Why: Checkout is the primary revenue path. A broken checkout means lost sales.

## Preconditions
- Application is running at http://localhost:3000
- Test user account exists (user@test.com / password123)
- At least one product is available in the catalog

## Steps
1. Navigate to the product catalog
2. Add the first product to the cart
3. Click the cart icon to view cart
4. Verify the product appears in the cart with correct price
5. Click "Proceed to Checkout"
6. Fill in shipping details
7. Complete the purchase
8. Verify the order confirmation page appears

## Success Criteria
- Product can be added to cart
- Cart displays correct items and totals
- Checkout completes without errors
- Order confirmation is displayed

## Notes
- Prices may include tax depending on locale settings
- Shipping calculation may take 1-2 seconds
```

### Section Reference

| Section | Required | Format | Description |
|---------|----------|--------|-------------|
| `# Title` | Yes | H1 heading | Name of the verification scenario |
| `## Metadata` | No | Key-value list | Priority, area, auth, duration |
| `- App: <url>` | Yes | List item | The application URL to verify |
| `> Why: ...` | No | Blockquote | Business reason for this verification |
| `## Preconditions` | No | Bullet list | What must be true before running |
| `## Steps` | Yes | Numbered list | Ordered verification steps |
| `## Success Criteria` | No | Bullet list | What defines success |
| `## Notes` | No | Bullet list | Additional context for the executor |

### Metadata Fields

| Field | Values | Description |
|-------|--------|-------------|
| **Priority** | `critical`, `high`, `medium`, `low` | Importance of this verification |
| **Area** | Free text (e.g., `public`, `auth`, `commerce`) | Functional area |
| **Requires Auth** | `yes`, `no` | Whether authentication is needed |
| **Estimated Duration** | `fast` (<30s), `medium` (~60s), `slow` (>60s) | Expected runtime |

---

## 4. Format Conventions

### Writing Good Steps

Steps can be written in two formats:

**Simple format** (quick verifications):
```markdown
## Steps
1. Navigate to the homepage
2. Verify the main heading is visible
3. Check that the navigation menu loads
```

**Detailed format** (repeatable integration tests):
```markdown
## Steps

### Step 1: Load the landing page
**Action**: Navigate to `http://localhost:3000/`.
**Expected**: The page loads successfully. The navigation bar is visible with links. The page contains hero content.

### Step 2: Check for console errors
**Action**: Check the browser console messages for errors.
**Expected**: No error-level console messages are present. Warnings are acceptable.
```

The detailed format is preferred for tests that need to be repeatable and unambiguous. Each step has:
- **Action**: Exactly what to do (navigate, click, fill, wait, etc.)
- **Expected**: The observable page state after the action — what the user would see

#### Step writing guidelines

- **Semantic descriptions**: Describe intent, not implementation. Say "Verify the user is logged in" not "Check that div.user-name contains text"
- **Atomic steps**: Each step should be one action or one assertion, not both
- **5-15 steps per spec**: Too few steps means the spec is trivial; too many means it should be split
- **One scenario per file**: Each `.accept.md` covers a single user journey or verification
- **Multiple scenarios**: For related flows (e.g., with/without auth), use `## Scenario A: ...` / `## Scenario B: ...` headings within the same file

### Naming Convention

Use numeric prefixes for ordering:

```
.accept/specs/
├── 01-public-pages.accept.md
├── 02-auth-flow.accept.md
├── 03-dashboard.accept.md
├── 04-checkout.accept.md
└── 05-admin-panel.accept.md
```

---

## 5. Execution Instructions for Claude

### Before Running

1. Read `.accept/config.json` for the app URL
2. Check `.accept/auth.json` for authentication config
3. Parse all sections of the `.accept.md` file
4. Verify preconditions if present (e.g., check app is running)
5. Create a run directory: `.accept/runs/<NNN>/`

### During Execution

1. Use `browser_snapshot` before EVERY interaction to understand page state
2. Use `ref` values from snapshots for clicks and typing — never guess selectors
3. Take a screenshot after each step with `browser_screenshot`
4. Record pass/fail, timing, and any errors for each step
5. If a step fails, capture the error and continue with remaining steps

### After Running

1. Save `results.json` with full structured results
2. Save `summary.md` with the markdown summary
3. Run `codacy-accept upload --dir .accept/runs/<NNN> --json` to generate report and get share link
4. Present results as a markdown table with pass/fail status
5. If failures occurred, analyze screenshots and suggest fixes

---

## 6. Fixtures Convention

Test fixtures live in `.accept/specs/fixtures/` alongside spec files.

### Structure

```
.accept/specs/fixtures/
├── sample-upload.pdf            ← File upload fixtures
├── test-image.png               ← Image fixtures
├── test-data.json               ← Structured test data
└── scripts/
    └── seed-data.sh             ← Database/API seeding scripts
```

### Principles

- **Colocated with specs**: Fixtures live next to the specs that use them, not buried in `src/`
- **Unique identifiers**: Seeding scripts should use timestamped or random identifiers to prevent collisions between runs
- **Fast seeding**: Scripts should complete in ~1 second by bypassing slow operations (use direct DB inserts or API calls, not UI flows)
- **JSON output**: Seeding scripts should output JSON with all created IDs and credentials to stdout so Claude can parse them
- **Idempotent**: Running a fixture script twice should not cause errors

### Example Seeding Script

```bash
#!/bin/bash
# .accept/specs/fixtures/scripts/seed-data.sh
# Creates a test user and returns credentials

TIMESTAMP=$(date +%s)
USERNAME="testuser_${TIMESTAMP}"
EMAIL="${USERNAME}@test.com"
PASSWORD="testpass123"

# Create user via API
curl -s -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"${USERNAME}\", \"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}"

# Output JSON for Claude to parse
echo "{\"username\": \"${USERNAME}\", \"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}"
```

### Referencing Fixtures in Specs

In your `.accept.md` files, reference fixtures in preconditions or notes:

```markdown
## Preconditions
- Run `.accept/specs/fixtures/scripts/seed-data.sh` to create test user
- Sample PDF available at `.accept/specs/fixtures/sample-upload.pdf`
```

---

## 7. Results and Reporting

### Output Files

Each run produces three files in `.accept/runs/<NNN>/`:

| File | Format | Purpose |
|------|--------|---------|
| `results.json` | JSON | Machine-readable structured results |
| `summary.md` | Markdown | Human-readable summary with step table |
| `report.html` | HTML | Visual report with embedded screenshots |

### Summary Format

The `summary.md` file includes:

- Run metadata (date, spec file, app URL, result, duration, commit)
- Step results table with status and timing
- Errors section listing all failures
- Success criteria checklist (if defined in spec)

### HTML Report

The HTML report includes:

- Header with title, metadata badges (priority, area), and pass/fail status
- Why block explaining the business reason
- Preconditions block
- Step cards with screenshots and error details
- Success criteria checklist
- Notes section

---

## 8. Guidelines for Writing Specs

1. **One scenario per file**: Don't combine "login" and "checkout" in one spec
2. **Use numeric prefixes**: `01-`, `02-` for natural ordering
3. **5-15 steps**: Keep specs focused but thorough
4. **Always include Why**: Explain the business reason — it helps prioritize failures
5. **Be specific in assertions**: "Verify heading shows 'Welcome, John'" not "Verify page looks correct"
6. **Include preconditions**: Document what must be true before the spec can run
7. **Define success criteria**: Make it clear what "passing" means beyond individual steps
8. **Add notes for timing**: If pages have loading states or animations, note them so Claude can wait appropriately

---

## 9. Limitations and Considerations

- **No parallel execution**: Specs run one at a time, sequentially
- **State carryover**: Browser state persists between steps within a spec (cookies, local storage). Between specs, state may or may not reset depending on execution context
- **Timing sensitivity**: Dynamic pages may need explicit waits. Use notes to document known timing issues
- **AI interpretation**: Claude interprets steps semantically — slight wording variations are fine, but be specific about expected outcomes
- **Screenshot accuracy**: Screenshots capture the visible viewport only. Content below the fold requires scrolling steps
- **No database assertions**: Accept verifies through the UI only. For backend state, use API calls in seeding scripts
- **Network dependency**: Upload and share features require internet connectivity
