import { Spec, Step } from '../types.js';

const ASSERTION_KEYWORDS = [
  'see', 'verify', 'check', 'confirm', 'expect', 'should',
  'shows', 'displays', 'contains', 'visible', 'present',
  'assert', 'ensure', 'must', 'appear',
];

function classifyStep(description: string): 'action' | 'assertion' {
  const lower = description.toLowerCase();
  return ASSERTION_KEYWORDS.some((kw) => lower.includes(kw)) ? 'assertion' : 'action';
}

export function parseMarkdown(content: string): Spec {
  const lines = content.split('\n');

  let title = '';
  let url = '';
  let why: string | undefined;
  const steps: Step[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Extract title from first H1 or H2
    if (!title) {
      const titleMatch = trimmed.match(/^#{1,2}\s+(.+)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
        continue;
      }
    }

    // Extract URL from "- App: <url>" or "- URL: <url>"
    const urlMatch = trimmed.match(/^-\s+(?:App|URL|url|app):\s*(.+)/i);
    if (urlMatch) {
      url = urlMatch[1].trim();
      continue;
    }

    // Extract "why" from blockquote
    const whyMatch = trimmed.match(/^>\s*(?:Why:\s*)?(.+)/i);
    if (whyMatch && !why) {
      why = whyMatch[1].trim();
      continue;
    }

    // Extract numbered steps
    const stepMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (stepMatch) {
      const description = stepMatch[2].trim();
      steps.push({
        index: steps.length + 1,
        description,
        type: classifyStep(description),
      });
    }
  }

  // Fallback title from section headers
  if (!title) {
    for (const line of lines) {
      const sectionMatch = line.trim().match(/^##\s+(?:Verify|Scenario|Steps):\s*(.+)/i);
      if (sectionMatch) {
        title = sectionMatch[1].trim();
        break;
      }
    }
  }

  if (!title) {
    title = 'Untitled Spec';
  }

  return { title, url, why, steps };
}
