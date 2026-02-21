---
name: accept:maketest
description: Create a repeatable visual test spec by exploring your running app
user-invocable: true
argument-hint: '"login flow" or "checkout" or .accept/specs/03-dashboard.accept.md"'
---

# Accept — Create Repeatable Test Spec

When the user invokes this skill, YOU (Claude Code) explore the running app using Playwright MCP, then generate a detailed `.accept.md` test spec that can be re-run with `/accept`.

## Prerequisites

- The app must be running locally (check with the user if unsure)
- Playwright MCP server must be available (added by `codacy-accept init`)

## Steps

### 1. Setup

- Read `.accept/config.json` for the app URL. If not found, ask the user.
- Determine the test name and area from "$ARGUMENTS". Examples:
  - `"login flow"` → `.accept/specs/02-auth-flow.accept.md`
  - `"checkout"` → `.accept/specs/04-checkout.accept.md`
  - `.accept/specs/03-dashboard.accept.md` → use that exact path
- Look at existing `.accept/specs/*.accept.md` files to determine the next available number prefix and avoid duplicate coverage.

### 2. Explore the app

Open the app and **actively explore** the area the user asked about:

1. Use `browser_navigate` to go to the app URL
2. Use `browser_snapshot` to understand the page structure — read the full accessibility tree
3. Navigate through the relevant flows:
   - Click links, buttons, and menu items related to the requested area
   - Fill forms with example data to understand the flow
   - Note what pages/routes exist, what elements are interactive
   - Pay attention to loading states, error handling, empty states
4. Use `browser_console_messages` to check for errors
5. Take screenshots of key pages for your reference

**Goal**: Build a mental model of how the feature works so you can write precise Action/Expected pairs.

### 3. Generate the test spec

Write a `.accept.md` file using the **detailed step format**. Follow this structure exactly:

```markdown
# Test: [Descriptive Title]

## Metadata
- **Priority**: critical | high | medium | low
- **Area**: [domain tag, e.g., auth, dashboard, commerce]
- **Requires Auth**: yes | no
- **Estimated Duration**: fast (<30s) | medium (<2min) | slow (>2min)

- App: [app URL from config]

> Why: [One sentence explaining the business importance of this test]

## Preconditions
- Application is running at `[app URL]`
- [Any other requirements: auth state, test data, fixtures]

## Steps

### Step 1: [Short action title]
**Action**: [Precise description of what to do — navigate, click, fill, wait, etc.]
**Expected**: [Observable page state after the action. What the user would see. Be specific about element visibility, text content, and URL changes.]

### Step 2: [Short action title]
**Action**: [...]
**Expected**: [...]

[... more steps ...]

## Success Criteria
- [Bullet points defining what "passing" means at a high level]

## Notes
- [Timing considerations, known edge cases, infrastructure dependencies]
```

### 4. Writing rules for steps

Each step MUST have both **Action** and **Expected**:

- **Action** should be precise enough that someone (or Claude) can execute it unambiguously:
  - Name specific UI elements: "Click the 'Sign In' button" not "Click the button"
  - Include URLs when navigating: "Navigate to `http://localhost:3000/auth`"
  - Specify input values: "Type 'test@example.com' in the email field"
  - Reference fixture files by path: "Upload `.accept/specs/fixtures/sample.pdf`"

- **Expected** should describe the observable result:
  - What elements become visible: "A success toast appears saying 'Saved'"
  - URL changes: "The browser navigates to `/dashboard`"
  - Data displayed: "The table shows at least 3 rows of order data"
  - Loading states: "A spinner appears briefly, then the content loads"
  - Error absence: "No error-level console messages are present"

### 5. Scenarios

If the feature has multiple paths (e.g., success + error, with auth + without auth), use scenarios:

```markdown
## Scenario A: Successful Login

### Step 1: Navigate to login
...

## Scenario B: Failed Login Attempt

### Step 7: Navigate to login with invalid credentials
...
```

Number steps continuously across scenarios (don't restart at 1).

### 6. Fixtures

If the test needs fixtures (test data, file uploads, seeding scripts):

1. Create files in `.accept/specs/fixtures/`:
   - Upload files: `.accept/specs/fixtures/sample-upload.pdf`
   - Test data: `.accept/specs/fixtures/test-data.json`
   - Seeding scripts: `.accept/specs/fixtures/scripts/seed-data.sh`
2. Reference them in the spec's Preconditions section
3. Seeding scripts should output JSON to stdout with created IDs and credentials

### 7. Save and present

1. Write the spec file to the determined path (e.g., `.accept/specs/03-dashboard.accept.md`)
2. Present a summary to the user:
   ```
   Created: .accept/specs/03-dashboard.accept.md
   Steps: 8 (6 actions, 2 assertions)
   Area: dashboard
   Priority: high

   Run it with: /accept .accept/specs/03-dashboard.accept.md
   ```
3. Offer to run the test immediately with `/accept`

## Rules

- Always explore the app FIRST before writing the spec — don't guess at page structure
- Use `browser_snapshot` to understand element names and structure — reference elements by their visible labels, not CSS selectors
- Write steps that are **reproducible** — another Claude session should be able to execute them without ambiguity
- Keep step counts between 5-15 per scenario
- Use the numbered prefix convention: `01-`, `02-`, etc.
- If the area requires authentication, include login steps or reference `.accept/auth.json`
- Check existing specs to avoid overlap — extend rather than duplicate
- Include a console error check as the final step
