import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
/**
 * Generate an MP4 video from a run's step screenshots.
 *
 * Each frame is annotated with a banner showing the step number,
 * description, and pass/fail status. Frames are joined with
 * crossfade transitions.
 *
 * Returns the path to the generated video, or null if generation fails.
 */
export async function generateVideo(result, options = {}) {
    const { frameDuration = 2, width = 1280, fadeDuration = 0.3, } = options;
    // Collect steps with valid screenshots
    const validSteps = result.steps.filter((s) => s.screenshotPath && existsSync(s.screenshotPath));
    if (validSteps.length === 0)
        return null;
    // Check ffmpeg is available
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
    }
    catch {
        return null;
    }
    const outputDir = dirname(validSteps[0].screenshotPath);
    const outputPath = join(outputDir, 'recording.mp4');
    // Create annotated frames
    const annotatedPaths = [];
    for (const step of validSteps) {
        const annotatedPath = join(outputDir, `_frame-${step.step.index}.png`);
        const created = await createAnnotatedFrame(step, annotatedPath, width);
        annotatedPaths.push(created ? annotatedPath : step.screenshotPath);
    }
    // Assemble video
    let videoPath;
    if (annotatedPaths.length === 1) {
        videoPath = assembleOneFrame(annotatedPaths[0], outputPath, frameDuration, width);
    }
    else {
        videoPath = assembleWithTransitions(annotatedPaths, outputPath, frameDuration, width, fadeDuration);
    }
    // Clean up temporary annotated frames
    for (const p of annotatedPaths) {
        if (p.includes('_frame-')) {
            try {
                unlinkSync(p);
            }
            catch { /* ignore */ }
        }
    }
    return videoPath;
}
/**
 * Use sharp to composite a text banner onto a screenshot.
 * Falls back gracefully if sharp is not available.
 */
async function createAnnotatedFrame(step, outputPath, targetWidth) {
    try {
        const sharp = (await import('sharp')).default;
        const image = sharp(step.screenshotPath);
        const metadata = await image.metadata();
        const imgWidth = metadata.width || targetWidth;
        const imgHeight = metadata.height || 720;
        // Scale factor based on image width
        const scale = imgWidth / 1280;
        const bannerHeight = Math.round(56 * scale);
        const fontSize = Math.round(20 * scale);
        const smallFontSize = Math.round(14 * scale);
        const padding = Math.round(16 * scale);
        const badgeSize = Math.round(28 * scale);
        const badgeFontSize = Math.round(14 * scale);
        const isPassed = step.status === 'passed';
        const statusColor = isPassed ? '#16a34a' : '#dc2626';
        const statusLabel = isPassed ? 'PASS' : 'FAIL';
        const description = escapeXml(step.step.description);
        // Build the SVG overlay — dark banner at the top
        const svg = `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .banner { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
  </defs>
  <!-- Semi-transparent banner background -->
  <rect x="0" y="0" width="${imgWidth}" height="${bannerHeight}" fill="rgba(0,0,0,0.82)" rx="0"/>
  <!-- Step number badge -->
  <rect x="${padding}" y="${Math.round((bannerHeight - badgeSize) / 2)}" width="${badgeSize}" height="${badgeSize}" rx="${Math.round(badgeSize / 2)}" fill="rgba(255,255,255,0.15)"/>
  <text x="${padding + badgeSize / 2}" y="${Math.round(bannerHeight / 2 + badgeFontSize * 0.37)}" text-anchor="middle" class="banner" font-size="${badgeFontSize}" font-weight="600" fill="white">${step.step.index}</text>
  <!-- Step description -->
  <text x="${padding + badgeSize + Math.round(12 * scale)}" y="${Math.round(bannerHeight / 2 + fontSize * 0.35)}" class="banner" font-size="${fontSize}" font-weight="500" fill="white">${description}</text>
  <!-- Status badge (right side) -->
  <rect x="${imgWidth - padding - Math.round(60 * scale)}" y="${Math.round((bannerHeight - Math.round(24 * scale)) / 2)}" width="${Math.round(60 * scale)}" height="${Math.round(24 * scale)}" rx="${Math.round(12 * scale)}" fill="${statusColor}"/>
  <text x="${imgWidth - padding - Math.round(30 * scale)}" y="${Math.round(bannerHeight / 2 + smallFontSize * 0.37)}" text-anchor="middle" class="banner" font-size="${smallFontSize}" font-weight="700" fill="white">${statusLabel}</text>
</svg>`;
        await image
            .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
            .toFile(outputPath);
        return true;
    }
    catch {
        // sharp not available or error — skip annotation
        return false;
    }
}
function assembleOneFrame(framePath, outputPath, duration, width) {
    try {
        execSync(`ffmpeg -y -loop 1 -i "${framePath}" -t ${duration} ` +
            `-vf "scale=${width}:-2:flags=lanczos,pad=ceil(iw/2)*2:ceil(ih/2)*2" ` +
            `-c:v libx264 -pix_fmt yuv420p -r 30 "${outputPath}"`, { stdio: 'ignore', timeout: 30000 });
        return existsSync(outputPath) ? outputPath : null;
    }
    catch {
        return null;
    }
}
function assembleWithTransitions(frames, outputPath, frameDuration, width, fadeDuration) {
    const inputs = frames.map((p) => `-loop 1 -t ${frameDuration} -i "${p}"`).join(' ');
    const scaleFilters = frames
        .map((_, i) => `[${i}:v]scale=${width}:-2:flags=lanczos,pad=ceil(iw/2)*2:ceil(ih/2)*2,setsar=1,fps=30[v${i}]`)
        .join('; ');
    let filterComplex;
    if (frames.length === 2) {
        const offset = frameDuration - fadeDuration;
        filterComplex =
            `${scaleFilters}; ` +
                `[v0][v1]xfade=transition=fade:duration=${fadeDuration}:offset=${offset},format=yuv420p[out]`;
    }
    else {
        const xfades = [];
        let prevLabel = 'v0';
        for (let i = 1; i < frames.length; i++) {
            const offset = frameDuration - fadeDuration + (i - 1) * (frameDuration - fadeDuration);
            const outLabel = i === frames.length - 1 ? 'out' : `tmp${i - 1}`;
            xfades.push(`[${prevLabel}][v${i}]xfade=transition=fade:duration=${fadeDuration}:offset=${offset}${i === frames.length - 1 ? ',format=yuv420p' : ''}[${outLabel}]`);
            prevLabel = outLabel;
        }
        filterComplex = `${scaleFilters}; ${xfades.join('; ')}`;
    }
    try {
        execSync(`ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[out]" ` +
            `-c:v libx264 -pix_fmt yuv420p -r 30 "${outputPath}"`, { stdio: 'ignore', timeout: 60000 });
        return existsSync(outputPath) ? outputPath : null;
    }
    catch {
        return null;
    }
}
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Read a video file as base64 for embedding or uploading.
 */
export function videoToBase64(videoPath) {
    try {
        return readFileSync(videoPath).toString('base64');
    }
    catch {
        return '';
    }
}
//# sourceMappingURL=generator.js.map