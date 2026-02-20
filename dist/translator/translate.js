import Anthropic from '@anthropic-ai/sdk';
import { getCached, setCache } from './cache.js';
const SYSTEM_PROMPT = `You are an expert Playwright test automation engineer. Your job is to translate a human-readable test step into executable Playwright code.

RULES:
1. Use ONLY accessibility-based selectors: getByRole, getByText, getByLabel, getByPlaceholder, getByTestId
2. NEVER use CSS selectors, XPath, or page.locator with CSS
3. Always await actions
4. For assertions, use expect() with meaningful checks
5. Return ONLY the executable code, no imports, no function wrappers
6. The variable "page" is already available in scope
7. Always wait for navigation or network activity to settle after clicks that trigger navigation
8. Use page.waitForLoadState('networkidle') after navigation actions

EXAMPLES:
Step: "Click the sign in button"
Code:
await page.getByRole('button', { name: /sign in/i }).click();

Step: "Enter email address test@example.com"
Code:
await page.getByLabel(/email/i).fill('test@example.com');

Step: "Verify the dashboard heading is visible"
Code:
await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();`;
export async function translateStep(step, a11yTree, apiKey) {
    // Check cache first
    const cached = getCached(step.description, a11yTree);
    if (cached) {
        return {
            playwrightCode: cached.playwrightCode,
            reasoning: cached.reasoning + ' (cached)',
        };
    }
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
        throw new Error('ANTHROPIC_API_KEY is required. Set it as an environment variable or pass it directly.');
    }
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: 'user',
                content: `Step to translate: "${step.description}"
Step type: ${step.type}

Current page accessibility tree:
\`\`\`
${a11yTree}
\`\`\`

Return a JSON object with two fields:
- "code": the Playwright code (string)
- "reasoning": brief explanation of your approach (string)`,
            },
        ],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let code;
    let reasoning;
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            code = parsed.code;
            reasoning = parsed.reasoning;
        }
        else {
            // Fallback: treat entire response as code
            code = text.trim();
            reasoning = 'Direct code response (no JSON wrapper)';
        }
    }
    catch {
        code = text.trim();
        reasoning = 'Failed to parse JSON, using raw response';
    }
    // Cache the result
    setCache(step.description, a11yTree, { playwrightCode: code, reasoning });
    return { playwrightCode: code, reasoning };
}
//# sourceMappingURL=translate.js.map