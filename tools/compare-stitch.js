const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const { buildSync } = require('esbuild');
const { Script } = require('vm');

/**
 * Bundle and load the figma-encoder (TypeScript) so we can reuse decodeFigmaClipboard in Node.
 */
function loadEncoder() {
  const entry = path.join(__dirname, '../webapp/src/lib/figma-encoder.ts');

  const result = buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    write: false,
  });

  const bundled = result.outputFiles[0].text;
  const module = { exports: {} };
  // Execute bundled CJS code to fill module.exports
  const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', bundled);
  fn(module.exports, require, module, entry, path.dirname(entry));

  return module.exports;
}

/**
 * Extract raw base64 from the figma marker inside compare_text_layer.md
 */
function extractBase64FromMarkdown() {
  const mdPath = path.join(__dirname, '../compare_text_layer.md');
  const md = readFileSync(mdPath, 'utf8');
  // First try raw comment format, else fallback to HTML-escaped data-buffer
  const raw = md.match(/<!--\(figma\)([\s\S]+?)\(\/figma\)-->/);
  if (raw) return raw[1].trim();

  const encoded = md.match(/data-buffer="&lt;!--\(figma\)([\s\S]+?)\(\/figma\)--&gt;"/);
  if (encoded) return encoded[1].trim();

  throw new Error('figma clipboard block not found in compare_text_layer.md');
}

function main() {
  const { decodeFigmaClipboard } = loadEncoder();
  const base64 = extractBase64FromMarkdown();

  const decoded = decodeFigmaClipboard(base64);
  if (!decoded || decoded.error || !decoded.data) {
    throw new Error(`Decode failed: ${decoded?.error || 'unknown error'}`);
  }

  const outPath = path.join(__dirname, '../webapp/fixtures/stitch-text.json');
  writeFileSync(outPath, JSON.stringify(decoded.data, null, 2), 'utf8');
  console.log(`✅ Stitch fixture saved: ${outPath}`);
}

main();
