/**
 * Gemini CLI HUD — ESM Loader Hook
 * 
 * Intercepts the loading of Footer.js from @google/gemini-cli
 * and replaces it with our custom HUD version stored in hud-footer.mjs.
 * All other modules load normally.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hudFooterPath = join(__dirname, 'hud-footer.mjs');

export async function load(url, context, nextLoad) {
    // Intercept Footer.js from gemini-cli UI components
    if (url.includes('gemini-cli') && url.endsWith('/Footer.js') && url.includes('/ui/components/')) {
        try {
            const source = readFileSync(hudFooterPath, 'utf8');
            return {
                format: 'module',
                source,
                shortCircuit: true,
            };
        } catch (e) {
            // If our HUD file is missing/broken, fall through to original
            return nextLoad(url, context);
        }
    }
    return nextLoad(url, context);
}
