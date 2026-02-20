import Anthropic from '@anthropic-ai/sdk';
const ASSERTION_KEYWORDS = [
    'see', 'verify', 'check', 'confirm', 'expect', 'should',
    'shows', 'displays', 'contains', 'visible', 'present',
    'assert', 'ensure', 'must', 'appear',
];
function classifyStep(description) {
    const lower = description.toLowerCase();
    return ASSERTION_KEYWORDS.some((kw) => lower.includes(kw)) ? 'assertion' : 'action';
}
function splitInlineString(input) {
    return input
        .split(/[,\n]|(?:\s—\s)/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
export function parseInlineSimple(input) {
    const fragments = splitInlineString(input);
    return fragments.map((description, i) => ({
        index: i + 1,
        description,
        type: classifyStep(description),
    }));
}
export async function parseInlineWithExpansion(input, apiKey) {
    const simple = parseInlineSimple(input);
    if (simple.length >= 3) {
        return simple;
    }
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
        return simple;
    }
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: `You are a QA expert. Expand this terse verification description into 3-7 concrete, actionable test steps. Each step should be a single action or assertion.

Input: "${input}"

Return ONLY a JSON array of strings, each being one step description. Example:
["Navigate to the homepage", "Click the login button", "Enter email address", "Click sign in", "Verify dashboard is visible"]`,
            },
        ],
    });
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const match = text.match(/\[[\s\S]*\]/);
        if (!match)
            return simple;
        const descriptions = JSON.parse(match[0]);
        return descriptions.map((description, i) => ({
            index: i + 1,
            description,
            type: classifyStep(description),
        }));
    }
    catch {
        return simple;
    }
}
//# sourceMappingURL=inline.js.map