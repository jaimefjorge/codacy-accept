# Codacy Accept

Proof that your AI agent's code actually works. Run a verification, get screenshots, share a link — no signup needed.

## Quickstart

```bash
npm install -g codacy-accept
npx playwright install chromium
codacy-accept init
```

Then run your first verification:

```bash
codacy-accept run "verify the homepage loads" --url http://localhost:3000
```

## How it works

1. You describe what to verify (inline or in a `.accept.md` file)
2. Codacy Accept launches a browser, translates your steps into Playwright actions using AI, and captures a screenshot at every step
3. Results are uploaded automatically — you get a shareable link anyone can open (no login required)

## Requirements

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/) set as `ANTHROPIC_API_KEY`

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Commands

### `codacy-accept run`

Run a verification spec.

```bash
# Inline spec
codacy-accept run "add item to cart, go to checkout, see payment form" --url http://localhost:3000

# From a spec file
codacy-accept run specs/checkout.accept.md

# With visible browser (for debugging)
codacy-accept run specs/checkout.accept.md --headed

# Skip cloud upload
codacy-accept run specs/checkout.accept.md --no-upload
```

### `codacy-accept setup`

AI-powered auth setup. Scans your codebase, identifies the auth system, and configures login for automated testing.

```bash
codacy-accept setup --url http://localhost:3000
```

### `codacy-accept init`

Initialize Codacy Accept in your project:

```bash
codacy-accept init
```

This creates:
- `.claude/skills/accept.md` — enables `/accept` in Claude Code
- `specs/example.accept.md` — example spec file
- Adds `.accept/` to `.gitignore`

### `codacy-accept history`

Show recent runs.

```bash
codacy-accept history          # local runs
codacy-accept history --cloud  # include cloud runs
```

## Spec files (`.accept.md`)

```markdown
# Checkout Flow

- App: http://localhost:3000

> Why: Checkout is 80% of revenue. Broken checkout = lost orders.

1. Add a product to the cart
2. Apply discount code "SAVE20"
3. Go to checkout
4. Pay with test card 4242424242424242
5. See order confirmation with correct total
```

The `> Why:` block is optional. When present, it appears prominently in reports so non-technical stakeholders understand why the verification matters.

## Using with Claude Code

After `codacy-accept init`, use `/accept` in Claude Code:

```
/accept "verify the login page works"
```

## Output

Each run produces:
- Terminal output with pass/fail per step
- Screenshots in `.accept/runs/<id>/`
- A self-contained HTML report
- A shareable cloud link (e.g., `https://codacy-accept.lovable.app/r/a1b2c3d`)

## Configuration

### Auth (`.accept/auth.json`)

Created by `codacy-accept setup`. Supports:
- **credentials** — fills a login form with username/password
- **cookie** — injects cookies from a file
- **none** — no auth needed

### Environment variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required. Your Anthropic API key. |
| `CODACY_ACCEPT_NO_UPLOAD` | Set to `1` to disable cloud upload. |

## License

MIT
