import { RunResult } from '../types.js';
interface VideoOptions {
    /** Seconds each step screenshot is shown (default: 2) */
    frameDuration?: number;
    /** Output width in pixels — height scales proportionally (default: 1280) */
    width?: number;
    /** Fade transition duration in seconds (default: 0.3) */
    fadeDuration?: number;
}
/**
 * Generate an MP4 video from a run's step screenshots.
 *
 * Each frame is annotated with a banner showing the step number,
 * description, and pass/fail status. Frames are joined with
 * crossfade transitions.
 *
 * Returns the path to the generated video, or null if generation fails.
 */
export declare function generateVideo(result: RunResult, options?: VideoOptions): Promise<string | null>;
/**
 * Read a video file as base64 for embedding or uploading.
 */
export declare function videoToBase64(videoPath: string): string;
export {};
//# sourceMappingURL=generator.d.ts.map