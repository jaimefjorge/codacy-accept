# Accept — Visual Verification Skill

When the user says `/accept "description"` or `/accept`, run a visual verification of the app.

## How to use

1. **Detect the app URL**: Look for `dev` or `start` scripts in `package.json`, or check for running dev servers on common ports (3000, 5173, 8080, 4321). If unsure, ask the user.

2. **Check auth**: If `.accept/auth.json` exists, auth is configured. If not and the app needs auth, suggest running `codacy-accept setup --url <url>` first.

3. **Run the verification**:
   - If the user provided an inline description: `codacy-accept run "<description>" --url <url>`
   - If there's a `.accept.md` file: `codacy-accept run <file>`

4. **Interpret results**:
   - If all steps pass: Report success, show the share URL (links to https://codacy-accept.lovable.app/r/...)
   - If steps fail: Read the error details, look at what went wrong, and suggest code fixes
   - Always mention the HTML report path for detailed review
   - Share URLs are auto-generated — anyone with the link can view the report (no login needed)

## Examples

```
/accept "verify the login page works"
→ codacy-accept run "verify the login page works" --url http://localhost:3000

/accept "checkout flow adds item and shows total"
→ codacy-accept run "checkout flow adds item and shows total" --url http://localhost:3000

/accept specs/checkout.accept.md
→ codacy-accept run specs/checkout.accept.md
```

## On failure

When verification fails:
1. Read the error message from the terminal output
2. Look at the screenshot to understand visual state
3. Check the relevant source code
4. Suggest a specific fix
5. After fixing, re-run the verification
