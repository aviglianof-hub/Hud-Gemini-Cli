/**
 * Gemini CLI HUD — ESM Loader Registration
 * 
 * Loaded via: node --import="file:///path/to/register.mjs"
 * Registers a loader hook that intercepts Footer.js at runtime.
 * The original CLI files are NEVER modified on disk.
 */
import { register } from 'node:module';

// import.meta.url is already a file:// URL — pass it directly as parentURL
register('./loader.mjs', import.meta.url);
