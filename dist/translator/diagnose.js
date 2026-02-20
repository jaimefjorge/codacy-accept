import Anthropic from '@anthropic-ai/sdk';
export async function diagnoseFailure(stepDescription, error, a11yTree, pageUrl, apiKey) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key)
        return null;
    try {
        const client = new Anthropic({ apiKey: key });
        const response = await client.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: `A browser automation step failed. Analyze why and suggest how to fix it.

Step: "${stepDescription}"
Error: ${error}
Page URL: ${pageUrl}

Current page accessibility tree:
\`\`\`
${a11yTree.slice(0, 4000)}
\`\`\`

Return a JSON object with:
- "explanation": Why did this step fail? (1-2 sentences, plain English)
- "suggestion": What should the developer do to fix it? (1-2 sentences, actionable)`,
                },
            ],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                explanation: parsed.explanation || 'Unknown failure',
                suggestion: parsed.suggestion || 'Review the screenshot and error details',
            };
        }
        // Fallback: use the raw text as explanation
        return {
            explanation: text.slice(0, 200),
            suggestion: 'Review the screenshot and error details',
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=diagnose.js.map