/**
 * แปลงชุดโครง JSON จากไฟล์ figma-json-node-shacdn.md ให้เป็น clipboard HTML (fig-kiwi)
 * และ decoded JSON เพื่อใช้เทียบ/ทดสอบ
 *
 * ใช้:
 *   npm run shacdn-export
 *
 * อินพุต:
 *   webapp/fixtures/figma-json-node-shacdn.md   — markdown มีชื่อคอมโพเนนต์ + JSON
 *   webapp/fixtures/shacdn-style.json           — style tokens (ถ้ามีจะโหลดไว้ แต่ยังไม่บังคับใช้)
 *
 * เอาต์พุต:
 *   webapp/fixtures/shacdn/<slug>.html          — clipboard HTML พร้อม (figma) block
 *   webapp/fixtures/shacdn/<slug>.decoded.json  — message ที่ decode แล้วไว้เทียบคีย์
 */
const fs = require('fs');
const path = require('path');
const { buildSync } = require('esbuild');

const MD_PATH = path.join(__dirname, '../webapp/fixtures/figma-json-node-shacdn.md');
const STYLE_PATH = path.join(__dirname, '../webapp/fixtures/shacdn-style.json');
const OUT_DIR = path.join(__dirname, '../webapp/fixtures/shacdn');

// Map Tailwind-ish color names to hex from style tokens
function buildColorMap(styleTokens) {
  const map = {};
  if (!styleTokens || !styleTokens.variables) return map;
  for (const [key, obj] of Object.entries(styleTokens.variables)) {
    if (obj && obj.value) {
      // key: color-slate-900 -> slate/900
      const name = key.replace(/^color-/, '').replace(/-/g, '/');
      map[name] = obj.value;
    }
  }
  return map;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'component';
}

// bundle figma-encoder.ts for Node
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
  const mod = { exports: {} };
  new Function('exports', 'require', 'module', '__filename', '__dirname', bundled)(
    mod.exports,
    require,
    mod,
    entry,
    path.dirname(entry)
  );
  return mod.exports;
}

// Parse markdown blocks: "Name\n\n[JSON]"
function parseMarkdown(md) {
  const blocks = [];
  const regex = /([A-Za-z0-9 _-]+)\n\n(\[[\s\S]*?)(?=\n\n[A-Za-z0-9 _-]+\n\n|\n*$)/g;
  let match;
  while ((match = regex.exec(md)) !== null) {
    const name = match[1].trim();
    const jsonStr = match[2].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      blocks.push({ name, data: parsed });
    } catch (e) {
      console.warn(`⚠️  JSON parse failed for block "${name}": ${e.message}`);
    }
  }
  return blocks;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const len = h.length === 3 ? 1 : 2;
  const factor = len === 1 ? 17 : 1;
  if (len === 1) {
    const r = ((bigint >> 8) & 0xf) * factor;
    const g = ((bigint >> 4) & 0xf) * factor;
    const b = (bigint & 0xf) * factor;
    return { r: r / 255, g: g / 255, b: b / 255 };
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

function extractFigmaBase64(html) {
  const m = html.match(/<!--\(figma\)([\s\S]+?)\(\/figma\)-->/);
  if (!m) throw new Error('No figma block found in html');
  return m[1];
}

async function main() {
  ensureDir(OUT_DIR);

  const styleJson = fs.existsSync(STYLE_PATH) ? JSON.parse(fs.readFileSync(STYLE_PATH, 'utf8')) : null;
  const colorMap = buildColorMap(styleJson || {});
  if (!styleJson) {
    console.warn('⚠️  shacdn-style.json ว่างหรือไม่พบไฟล์ (ข้ามการใช้ tokens)');
  }

  const md = fs.readFileSync(MD_PATH, 'utf8');
  const blocks = parseMarkdown(md);
  if (!blocks.length) {
    console.error('❌ ไม่พบบล็อก JSON ใน figma-json-node-shacdn.md');
    process.exit(1);
  }

  const { createFigmaClipboardHTML, decodeFigmaClipboard } = loadEncoder();

  for (const block of blocks) {
    const slug = slugify(block.name);

    // Apply color token mapping: convert fills with {name, hex} or known token name to normalized RGB
    const applyColors = (node) => {
      const n = Array.isArray(node) ? node : [node];
      n.forEach((item) => {
        if (!item) return;
        if (item.fills && Array.isArray(item.fills)) {
          item.fills = item.fills.map((f) => {
            if (!f) return f;
            if (f.hex && typeof f.hex === 'string') {
              f.color = hexToRgb(f.hex);
            } else if (f.name && colorMap[f.name]) {
              f.color = hexToRgb(colorMap[f.name]);
            }
            return f;
          });
        }
        if (item.children) applyColors(item.children);
      });
    };

    const pruneNulls = (node) => {
      if (Array.isArray(node)) {
        return node.filter(Boolean).map(pruneNulls);
      }
      if (node && node.children) {
        node.children = pruneNulls(node.children);
      }
      return node;
    };

    const sanitizeNodes = (node) => {
      if (Array.isArray(node)) {
        return node
          .filter((n) => n && typeof n === 'object' && (n.type || n.name))
          .map(sanitizeNodes);
      }
      if (!node || typeof node !== 'object') return null;
      if (node.children) {
        node.children = sanitizeNodes(node.children);
      }
      return node;
    };

    const design = pruneNulls(JSON.parse(JSON.stringify(block.data)));
    sanitizeNodes(design);
    applyColors(design);
    try {
      const { html, success, error } = await createFigmaClipboardHTML(block.data);
      if (!success || !html) {
        console.error(`❌ encode ล้มเหลวสำหรับ ${block.name}: ${error}`);
        continue;
      }

      const htmlPath = path.join(OUT_DIR, `${slug}.html`);
      fs.writeFileSync(htmlPath, html, 'utf8');

      const b64 = extractFigmaBase64(html);
      const decoded = decodeFigmaClipboard(b64);
      const decodedPath = path.join(OUT_DIR, `${slug}.decoded.json`);
      fs.writeFileSync(decodedPath, JSON.stringify(decoded.data || decoded, null, 2), 'utf8');

      console.log(`✅ ${block.name} -> ${htmlPath} + ${decodedPath}`);
    } catch (e) {
      console.error(`❌ Error on ${block.name}: ${e.message}`);
    }
  }
}

main();
