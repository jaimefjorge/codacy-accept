import { readFileSync } from 'fs';
import { getAnonymousId } from '../identity/anonymous.js';
import { generateHtmlReport } from '../reporter/html.js';
const SUPABASE_URL = 'https://pyhdeeryzqmiydawwrjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5aGRlZXJ5enFtaXlkYXd3cmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODU4NDYsImV4cCI6MjA4NzE2MTg0Nn0.gaO4HcRycf3UNYa6QILQDRp5PHKHPjoTX4kcfke2Tas';
const UPLOAD_URL = `${SUPABASE_URL}/functions/v1/upload`;
const RUNS_URL = `${SUPABASE_URL}/functions/v1/runs`;
const APP_URL = 'https://codacy-accept.lovable.app';
function screenshotToBase64(path) {
    try {
        return readFileSync(path).toString('base64');
    }
    catch {
        return '';
    }
}
function supabaseHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
    };
}
export async function uploadResults(result) {
    try {
        const anonymousId = getAnonymousId();
        const reportHtml = generateHtmlReport(result);
        const screenshots = result.steps.map((s) => ({
            stepIndex: s.step.index,
            description: s.step.description,
            status: s.status,
            data: screenshotToBase64(s.screenshotPath),
        }));
        const payload = {
            anonymousId,
            title: result.spec.title,
            why: result.spec.why || null,
            appUrl: result.spec.url,
            commit: result.commit || null,
            timestamp: result.timestamp,
            durationMs: result.totalDurationMs,
            passed: result.passed,
            failed: result.failed,
            results: {
                steps: result.steps.map((s) => ({
                    index: s.step.index,
                    description: s.step.description,
                    status: s.status,
                    durationMs: s.durationMs,
                    error: s.error,
                    diagnosis: s.diagnosis,
                })),
            },
            reportHtml,
            screenshots,
        };
        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: supabaseHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            return null;
        }
        const data = (await response.json());
        // Server returns relative URL like /r/abc1234, make it absolute
        const shortId = data.shortId || data.url.replace('/r/', '');
        return `${APP_URL}/r/${shortId}`;
    }
    catch {
        return null;
    }
}
export async function fetchCloudRuns() {
    try {
        const anonymousId = getAnonymousId();
        const response = await fetch(`${RUNS_URL}?anonymousId=${anonymousId}`, {
            headers: supabaseHeaders(),
        });
        if (!response.ok)
            return [];
        const data = (await response.json());
        return (data.runs || []).map((r) => ({
            ...r,
            url: `${APP_URL}${r.url}`,
        }));
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=cloud.js.map