import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import { generateVideo, videoToBase64 } from '../src/video/generator.js';
import type { RunResult } from '../src/types.js';

const TEST_DIR = join(process.cwd(), '.accept/runs/999');

function createTestScreenshot(path: string, color: string): void {
  execSync(
    `ffmpeg -y -f lavfi -i "color=c=${color}:s=800x600:d=1" -frames:v 1 "${path}"`,
    { stdio: 'ignore' },
  );
}

function buildFakeResult(screenshotPaths: string[]): RunResult {
  const descriptions = [
    'Navigate to the homepage',
    'Click the sign-in button',
    'Verify the dashboard loads',
    'Check no console errors',
  ];
  return {
    id: 999,
    spec: {
      title: 'Video Test',
      url: 'http://localhost:3000',
      steps: screenshotPaths.map((_, i) => ({
        index: i + 1,
        description: descriptions[i] || `Step ${i + 1}`,
        type: 'action' as const,
      })),
    },
    steps: screenshotPaths.map((p, i) => ({
      step: { index: i + 1, description: descriptions[i] || `Step ${i + 1}`, type: 'action' as const },
      status: (i === 2 ? 'failed' : 'passed') as 'passed' | 'failed',
      durationMs: 1000 + i * 500,
      screenshotPath: p,
    })),
    totalDurationMs: screenshotPaths.length * 1000,
    timestamp: new Date().toISOString(),
    passed: screenshotPaths.length - 1,
    failed: 1,
    reportPath: TEST_DIR,
  };
}

describe('video generator', () => {
  beforeAll(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    createTestScreenshot(join(TEST_DIR, 'step-1.png'), '#2563eb');
    createTestScreenshot(join(TEST_DIR, 'step-2.png'), '#16a34a');
    createTestScreenshot(join(TEST_DIR, 'step-3.png'), '#dc2626');
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('generates an annotated MP4 video from screenshots', async () => {
    const paths = [1, 2, 3].map((i) => join(TEST_DIR, `step-${i}.png`));
    const result = buildFakeResult(paths);

    const videoPath = await generateVideo(result, { frameDuration: 1, fadeDuration: 0.2 });

    expect(videoPath).not.toBeNull();
    expect(existsSync(videoPath!)).toBe(true);
    expect(videoPath!).toMatch(/recording\.mp4$/);

    const stats = statSync(videoPath!);
    expect(stats.size).toBeGreaterThan(0);
    console.log(`  Video size: ${(stats.size / 1024).toFixed(1)} KB`);
  });

  it('handles a single screenshot', async () => {
    const paths = [join(TEST_DIR, 'step-1.png')];
    const result = buildFakeResult(paths);

    const videoPath = await generateVideo(result, { frameDuration: 1 });

    expect(videoPath).not.toBeNull();
    expect(existsSync(videoPath!)).toBe(true);
  });

  it('returns null when no screenshots exist', async () => {
    const result = buildFakeResult(['/nonexistent/step-1.png']);
    const videoPath = await generateVideo(result);
    expect(videoPath).toBeNull();
  });

  it('converts video to base64', async () => {
    const paths = [1, 2, 3].map((i) => join(TEST_DIR, `step-${i}.png`));
    const result = buildFakeResult(paths);

    const videoPath = await generateVideo(result, { frameDuration: 1, fadeDuration: 0.2 });
    expect(videoPath).not.toBeNull();

    const b64 = videoToBase64(videoPath!);
    expect(b64.length).toBeGreaterThan(0);
    const decoded = Buffer.from(b64, 'base64');
    expect(decoded.length).toBeGreaterThan(0);
  });

  it('cleans up temporary annotated frames', async () => {
    const paths = [1, 2, 3].map((i) => join(TEST_DIR, `step-${i}.png`));
    const result = buildFakeResult(paths);

    await generateVideo(result, { frameDuration: 1, fadeDuration: 0.2 });

    // Temporary _frame-*.png files should be cleaned up
    const tempFrames = [1, 2, 3].map((i) => join(TEST_DIR, `_frame-${i}.png`));
    for (const f of tempFrames) {
      expect(existsSync(f)).toBe(false);
    }
  });
});
