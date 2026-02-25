# Codacy Accept

[![npm version](https://img.shields.io/npm/v/codacy-accept.svg)](https://www.npmjs.com/package/codacy-accept)
[![license](https://img.shields.io/npm/l/codacy-accept.svg)](https://github.com/jaimefjorge/codacy-accept/blob/main/LICENSE)

Proof that your AI agent's code actually works.

## What is this?

Accept is a markdown-driven visual verification tool for web applications. You write what to test in plain English, Claude drives the browser with Playwright MCP, and you get screenshots, video recordings, and shareable proof links -- no signup needed.

Think of it as "acceptance tests you can write in 30 seconds and share with anyone."

## Requirements

- **Node.js** >= 18
- **Claude Code** with Playwright MCP
- **ffmpeg** (optional, for video recording) -- `brew install ffmpeg` / `apt install ffmpeg`

## Install

```bash
npm install -g codacy-accept
```

Or from source:

```bash
git clone https://github.com/jaimefjorge/codacy-accept.git
cd codacy-accept && npm install && npm run build
npm install -g .
```

## Quick Start

```bash
cd your-project
codacy-accept init
```

Then open Claude Code and run:

```
/accept "verify the login page works"
```

Or point it at a spec file:

```
/accept .accept/specs/01-auth-flow.accept.md
```

## How It Works

```
You write a spec          Claude drives the browser       You get proof
┌──────────────┐          ┌──────────────────────┐       ┌──────────────────┐
│ .accept.md   │  ──────> │ Playwright MCP        │ ───> │ Screenshots      │
│ or free text │          │ clicks, types, waits  │      │ Video recording  │
└──────────────┘          └──────────────────────┘       │ Shareable link   │
                                                          └──────────────────┘
```

1. **You describe** what to verify -- in plain text or a `.accept.md` spec file
2. **Claude drives the browser** using Playwright MCP, executing each step
3. **Screenshots are captured** after every step as visual evidence
4. **A video recording** is assembled from the screenshots with annotated overlays
5. **Results are uploaded** to get a shareable link anyone can view

## Commands

### `codacy-accept init`

Sets up Accept in your project:

- Creates `.accept/` directory (config, specs, fixtures, runs)
- Detects your app URL from `package.json`
- Installs the `/accept` and `/accept:maketest` Claude Code skills
- Adds Playwright MCP to `.mcp.json`
- Checks for `ffmpeg` (needed for video recording)

### `codacy-accept upload --dir <path>`

Uploads a run to the cloud and returns a shareable link.

```bash
codacy-accept upload --dir .accept/runs/001
# => https://codacy-accept.lovable.app/r/abc1234
```

Use `--json` for machine-readable output (used by the skill internally).

### `codacy-accept specs`

Lists all `.accept.md` spec files with metadata badges (priority, area, duration) and latest run status.

### `codacy-accept history`

Shows recent local runs. Use `--cloud` to include cloud history.

## Skills

### `/accept`

Run a visual verification. Accepts either a free-text description or a path to a spec file.

```
/accept "verify checkout works"
/accept .accept/specs/02-checkout.accept.md
```

Claude will:
1. Parse the request into concrete steps
2. Drive the browser through each step
3. Capture screenshots and record pass/fail
4. Generate a video recording with step annotations
5. Upload results and return a shareable link

### `/accept:maketest`

Create a repeatable test spec. Claude explores your running app first, then generates a detailed `.accept.md` file with precise **Action/Expected** pairs for each step.

```
/accept:maketest "login flow"
/accept:maketest "public pages"
```

The generated spec can then be re-run anytime with `/accept`.

## Spec File Format

Specs are markdown files (`.accept.md`) stored in `.accept/specs/`:

```markdown
# Verify Checkout Flow

## Metadata
- **Priority**: critical
- **Area**: commerce
- **Requires Auth**: yes
- **Estimated Duration**: medium (<2min)

- App: http://localhost:3000

> Why: Checkout is the primary revenue path. A broken checkout means lost sales.

## Preconditions
- Application is running at http://localhost:3000
- Test user account exists

## Steps

### Step 1: Navigate to the product catalog
**Action**: Navigate to `http://localhost:3000/products`.
**Expected**: The page loads with a grid of product cards visible.

### Step 2: Add a product to the cart
**Action**: Click the "Add to Cart" button on the first product.
**Expected**: A toast appears saying "Added to cart". The cart badge shows "1".

### Step 3: Complete checkout
**Action**: Click the cart icon, then "Proceed to Checkout". Fill in details and click "Place Order".
**Expected**: An order confirmation page appears with an order number.

## Success Criteria
- Product can be added to cart
- Checkout completes without errors
- Order confirmation is displayed

## Notes
- Shipping calculation may take 1-2 seconds
```

Steps support two formats:
- **Simple**: `1. Navigate to the homepage` -- for quick verifications
- **Detailed**: `### Step N:` with `**Action**:` and `**Expected**:` -- for repeatable tests

Use numbered prefixes for ordering: `01-homepage.accept.md`, `02-auth.accept.md`, etc.

## Video Recording

Accept automatically generates an MP4 video from step screenshots:

- Each frame shows an **overlay banner** with step number, description, and pass/fail status
- Frames are joined with **crossfade transitions**
- The video is embedded in HTML reports and uploaded to the cloud
- Uses `sharp` for rendering overlays and `ffmpeg` for video assembly
- If ffmpeg is not available, everything still works -- you just don't get a video

## Project Structure

After running `codacy-accept init`:

```
your-project/
  .accept/
    config.json             # App URL and settings
    auth.json               # Optional authentication config
    specs/
      01-homepage.accept.md # Verification specs
      02-auth-flow.accept.md
      fixtures/             # Test data, uploads, seeding scripts
    runs/
      001/
        results.json        # Structured results
        summary.md          # Markdown summary
        report.html         # Visual report with screenshots + video
        recording.mp4       # Annotated video recording
        step-1.png          # Screenshot evidence
        step-2.png
  .claude/skills/
    accept/SKILL.md         # /accept skill
    accept-maketest/SKILL.md # /accept:maketest skill
  .mcp.json                 # Playwright MCP config
```

Everything lives inside `.accept/` to keep your project tidy. The directory is gitignored by default.

## Shareable Reports

Every run can be uploaded to get a public link:

- **No signup required** -- uses an anonymous ID
- Reports show step-by-step results with inline screenshots
- Video recording plays inline when available
- Links expire after 30 days

## Configuration

### App URL (`.accept/config.json`)

```json
{
  "appUrl": "http://localhost:3000"
}
```

Auto-detected during `init` from your `package.json` scripts.

### Authentication (`.accept/auth.json`)

Optional. Supports:
- **credentials** -- fills a login form with username/password
- **cookie** -- injects cookies from a file
- **none** -- no auth needed

## License

MIT
