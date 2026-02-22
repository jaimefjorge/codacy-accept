import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { RunResult } from '../types.js';
import { videoToBase64 } from '../video/generator.js';

function screenshotToBase64(path: string): string {
  try {
    const buffer = readFileSync(path);
    return buffer.toString('base64');
  } catch {
    return '';
  }
}

export function generateHtmlReport(result: RunResult): string {
  const stepsHtml = result.steps
    .map((s) => {
      const statusClass = s.status === 'passed' ? 'passed' : 'failed';
      const statusIcon = s.status === 'passed' ? '&#x2705;' : '&#x274C;';
      const b64 = screenshotToBase64(s.screenshotPath);
      const imgTag = b64
        ? `<img src="data:image/png;base64,${b64}" alt="Step ${s.step.index} screenshot" />`
        : '<p class="no-screenshot">No screenshot available</p>';
      const errorHtml = s.error
        ? `<div class="error"><strong>Error:</strong> ${escapeHtml(s.error)}</div>`
        : '';
      const diagnosisHtml = '';
      const duration = (s.durationMs / 1000).toFixed(1);

      return `
      <div class="step-card ${statusClass}">
        <div class="step-header">
          <span class="step-icon">${statusIcon}</span>
          <span class="step-num">Step ${s.step.index}</span>
          <span class="step-desc">${escapeHtml(s.step.description)}</span>
          <span class="step-duration">${duration}s</span>
        </div>
        ${errorHtml}
        ${diagnosisHtml}
        <div class="step-screenshot">${imgTag}</div>
      </div>`;
    })
    .join('\n');

  const whyHtml = result.spec.why
    ? `<div class="why-block"><strong>Why:</strong> ${escapeHtml(result.spec.why)}</div>`
    : '';

  // Metadata badges
  const metaBadges: string[] = [];
  if (result.spec.metadata?.priority) {
    const priorityColors: Record<string, string> = { critical: '#991b1b', high: '#b45309', medium: '#1d4ed8', low: '#6b7280' };
    const priorityBgs: Record<string, string> = { critical: '#fee2e2', high: '#fef3c7', medium: '#dbeafe', low: '#f3f4f6' };
    const p = result.spec.metadata.priority;
    metaBadges.push(`<span class="badge" style="background:${priorityBgs[p] || '#f3f4f6'};color:${priorityColors[p] || '#6b7280'}">${escapeHtml(p)}</span>`);
  }
  if (result.spec.metadata?.area) {
    metaBadges.push(`<span class="badge" style="background:#e0e7ff;color:#3730a3">${escapeHtml(result.spec.metadata.area)}</span>`);
  }
  if (result.spec.metadata?.estimatedDuration) {
    metaBadges.push(`<span class="badge" style="background:#f0fdf4;color:#166534">~${escapeHtml(result.spec.metadata.estimatedDuration)}</span>`);
  }
  const metaBadgesHtml = metaBadges.length > 0 ? metaBadges.join(' ') : '';

  // Preconditions block
  const preconditionsHtml = result.spec.preconditions && result.spec.preconditions.length > 0
    ? `<div class="preconditions-block"><strong>Preconditions:</strong><ul>${result.spec.preconditions.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul></div>`
    : '';

  // Success criteria block
  const successCriteriaHtml = result.spec.successCriteria && result.spec.successCriteria.length > 0
    ? `<div class="success-criteria-block"><strong>Success Criteria:</strong><ul class="criteria-list">${result.spec.successCriteria.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>`
    : '';

  // Notes block
  const notesHtml = result.spec.notes && result.spec.notes.length > 0
    ? `<div class="notes-block"><strong>Notes:</strong><ul>${result.spec.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul></div>`
    : '';

  const statusBadge =
    result.failed === 0
      ? `<span class="badge badge-pass">${result.passed}/${result.passed} passed</span>`
      : `<span class="badge badge-fail">${result.passed}/${result.passed + result.failed} passed</span>`;

  const commitHtml = result.commit
    ? `<span class="meta-item">Commit: <code>${result.commit.slice(0, 7)}</code></span>`
    : '';

  const totalDuration = (result.totalDurationMs / 1000).toFixed(1);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(result.spec.title)} — Codacy Accept</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; color: #1a1a2e; line-height: 1.6; }
  .container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
  .header { margin-bottom: 2rem; }
  .header h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; color: #666; font-size: 0.875rem; margin-bottom: 0.5rem; }
  .meta-item { }
  .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-weight: 600; font-size: 0.875rem; }
  .badge-pass { background: #dcfce7; color: #166534; }
  .badge-fail { background: #fee2e2; color: #991b1b; }
  .why-block { background: #fef9c3; border-left: 4px solid #eab308; padding: 1rem 1.25rem; border-radius: 0.5rem; margin-bottom: 2rem; font-size: 1rem; }
  .preconditions-block { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 1rem 1.25rem; border-radius: 0.5rem; margin-bottom: 2rem; }
  .preconditions-block ul, .notes-block ul { margin: 0.5rem 0 0 1.25rem; }
  .success-criteria-block { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 1rem 1.25rem; border-radius: 0.5rem; margin: 2rem 0; }
  .criteria-list { margin: 0.5rem 0 0 1.25rem; list-style: disc; }
  .notes-block { background: #fefce8; border-left: 4px solid #ca8a04; padding: 1rem 1.25rem; border-radius: 0.5rem; margin: 2rem 0; }
  .step-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; margin-bottom: 1.5rem; overflow: hidden; }
  .step-card.failed { border-color: #fca5a5; }
  .step-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; }
  .step-icon { font-size: 1.25rem; }
  .step-num { font-weight: 600; color: #666; font-size: 0.875rem; }
  .step-desc { flex: 1; }
  .step-duration { color: #999; font-size: 0.875rem; }
  .step-screenshot img { width: 100%; display: block; }
  .error { padding: 0.75rem 1.25rem; background: #fef2f2; color: #991b1b; font-size: 0.875rem; }
  .diagnosis { padding: 0.75rem 1.25rem; background: #fffbeb; border-left: 3px solid #f59e0b; color: #92400e; font-size: 0.875rem; }
  .no-screenshot { padding: 2rem; text-align: center; color: #999; }
  .video-section { margin-bottom: 2rem; }
  .video-section h2 { font-size: 1.25rem; margin-bottom: 0.75rem; color: #374151; }
  .run-video { width: 100%; border-radius: 0.75rem; border: 1px solid #e5e7eb; background: #000; }
  .footer { text-align: center; color: #999; font-size: 0.8rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
  .footer a { color: #666; }
  @media print { body { background: #fff; } .container { padding: 0; } }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${escapeHtml(result.spec.title)}</h1>
    <div class="meta">
      <span class="meta-item">${escapeHtml(result.spec.url)}</span>
      <span class="meta-item">${new Date(result.timestamp).toLocaleString()}</span>
      ${commitHtml}
      <span class="meta-item">${totalDuration}s total</span>
    </div>
    ${statusBadge} ${metaBadgesHtml}
  </div>

  ${whyHtml}
  ${preconditionsHtml}

  ${(() => {
    if (!result.videoPath) return '';
    const b64 = videoToBase64(result.videoPath);
    if (!b64) return '';
    return `
  <div class="video-section">
    <h2>Recording</h2>
    <video controls playsinline preload="metadata" class="run-video">
      <source src="data:video/mp4;base64,${b64}" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </div>`;
  })()}

  ${stepsHtml}

  ${successCriteriaHtml}
  ${notesHtml}

  <div class="footer">
    Generated by <a href="https://codacy.com/accept">Codacy Accept</a>
  </div>
</div>
</body>
</html>`;

  return html;
}

export function saveHtmlReport(result: RunResult): string {
  const html = generateHtmlReport(result);
  const reportPath = join(result.reportPath, 'report.html');
  writeFileSync(reportPath, html);
  return reportPath;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
