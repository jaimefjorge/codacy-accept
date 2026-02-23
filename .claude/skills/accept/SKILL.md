---
name: accept
description: Run visual verification of your app with screenshots and shareable proof links
user-invocable: true
argument-hint: '"verify checkout works"'
---

# Accept — Visual Verification with Playwright MCP

When the user invokes this skill, YOU (Claude Code) automate the browser directly using Playwright MCP tools to verify the app works, then upload results for a shareable proof link.

## Prerequisites

- The app must be running locally (check with the user if unsure)
- Playwright MCP server must be available (added by `codacy-accept init`)

## Steps

### 1. Setup

- Read `.accept/config.json` for the app URL. If not found, detect from `package.json` scripts or ask the user.
- Create a run directory: determine the next run ID by looking at `.accept/runs/`, then create `.accept/runs/<NNN>/` (zero-padded to 3 digits).
- Start a timer for total duration tracking.

### 2. Parse the request

If "$ARGUMENTS" is a path to a `.accept.md` file (e.g. `specs/checkout.accept.md`):
1. Read the file contents
2. Parse all sections:
   - **Title**: from `# Heading`
   - **App URL**: from `- App: <url>`
   - **Why**: from `> Why: ...`
   - **Metadata** (optional): from `## Metadata` section — parse `**Priority**:`, `**Area**:`, `**Requires Auth**:`, `**Estimated Duration**:`
   - **Preconditions** (optional): from `## Preconditions` section — list items (`- ...`)
   - **Steps**: from `## Steps` section or numbered items `1. ...`, `2. ...`, etc.
   - **Success Criteria** (optional): from `## Success Criteria` section — list items (`- ...`)
   - **Notes** (optional): from `## Notes` section — list items (`- ...`)
3. Use the parsed title, URL, why, metadata, preconditions, steps, success criteria, and notes for the verification run
4. Set `specFile` in results.json to the file path (e.g. `specs/checkout.accept.md`)
5. Set `specContent` in results.json to the raw markdown content of the file
6. If preconditions are present, verify them before running steps (e.g., check app is running)
7. After running all steps, evaluate success criteria and note which are met vs unmet

If "$ARGUMENTS" is a plain text description (not a file path), break it into 3-7 concrete test steps. Each step should be a single user action or assertion. For example:
- "verify the login page works" → navigate to login, check form fields visible, enter credentials, click submit, verify redirect
- "check homepage loads" → navigate to homepage, verify heading, check nav menu, verify no errors
In this case, do NOT set specFile or specContent in results.json.

### 3. Execute each step with Playwright MCP

For each step:

1. **Understand the page**: Use `browser_snapshot` to get the accessibility tree. This tells you what elements are on the page and how to interact with them.

2. **Perform the action**:
   - `browser_navigate` — go to a URL
   - `browser_click` — click an element (use the `ref` from the snapshot)
   - `browser_type` — type text into an input (use the `ref` from the snapshot)
   - `browser_select_option` — select from a dropdown
   - `browser_press_key` — press a key (Enter, Tab, etc.)

3. **Take a screenshot**: Use `browser_screenshot` after each step. Save the screenshot to `.accept/runs/<NNN>/step-<N>.png`.

4. **Record the result**: Track pass/fail status and timing for each step.

**Important**: Use `browser_snapshot` before EVERY action to understand the current page state. The accessibility tree gives you the `ref` values needed for `browser_click` and `browser_type`.

### 4. Handle authentication

If `.accept/auth.json` exists, read it first. It may contain:
- `loginUrl`: navigate here first
- `credentials`: username/password to enter
- `strategy`: how to authenticate

Perform login steps via MCP before running the main verification steps.

### 5. Save results

Write `.accept/runs/<NNN>/results.json` with this structure:

```json
{
  "id": <NNN>,
  "spec": {
    "title": "<title from user request>",
    "url": "<app url>",
    "why": "<why statement, if present>",
    "metadata": {
      "priority": "critical|high|medium|low",
      "area": "<area tag>",
      "requiresAuth": false,
      "estimatedDuration": "fast|medium|slow"
    },
    "preconditions": ["<condition 1>", "<condition 2>"],
    "successCriteria": ["<criterion 1>", "<criterion 2>"],
    "notes": ["<note 1>"],
    "steps": [
      { "index": 1, "description": "<step description>", "type": "action|assertion" }
    ]
  },
  "steps": [
    {
      "step": { "index": 1, "description": "<step description>", "type": "action|assertion" },
      "status": "passed|failed",
      "durationMs": <ms>,
      "screenshotPath": ".accept/runs/<NNN>/step-1.png",
      "error": null
    }
  ],
  "totalDurationMs": <total ms>,
  "timestamp": "<ISO 8601>",
  "passed": <count>,
  "failed": <count>,
  "reportPath": ".accept/runs/<NNN>",
  "specFile": "<path to .accept.md file, if applicable>",
  "specContent": "<raw markdown content, if applicable>"
}
```

### 6. Upload results

Run: `codacy-accept upload --dir .accept/runs/<NNN> --json`

This generates an HTML report, uploads to the cloud, and returns a JSON object with the share URL.

**Important**: The upload command automatically generates a recording video from the step screenshots and includes it in the upload. If a `recording.mp4` or similar video file exists in the run directory, it **must** be uploaded — do not skip or ignore it. The video is a key piece of shareable proof.

### 7. Present results

Display results as a markdown table:

**All passing:**
```
## Verification: <title>

| Step | Result | Time |
|------|--------|------|
| 1. <description> | Passed | <time>s |
| 2. <description> | Passed | <time>s |
| 3. <description> | Passed | <time>s |

**All <N> steps passed** in <total>s

Share: <shareUrl>
```

**With failures:**
```
## Verification: <title>

| Step | Result | Time |
|------|--------|------|
| 1. <description> | Passed | 1.2s |
| 2. <description> | Failed | 3.4s |

**<passed> of <total> steps passed** in <total>s

Step 2 failed: <error description based on screenshot analysis>

Share: <shareUrl>
```

### 8. On failure

When a step fails:
1. Read the screenshot of the failed step to understand the visual state
2. Analyze what went wrong (element not found, wrong text, page error, etc.)
3. Check the app's source code for the relevant component
4. Suggest a specific fix
5. Offer to re-run the verification after the fix

## Rules

- Always use `browser_snapshot` before interacting — never guess element selectors
- Take screenshots AFTER each step, not before
- Save all artifacts to `.accept/runs/<NNN>/`
- Use the `ref` attribute from snapshots for `browser_click` and `browser_type`
- If the page doesn't load, check if the app is running and suggest starting it
- Keep step descriptions concise and user-readable
