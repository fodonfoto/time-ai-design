/**
 * Diff two Figma JSON messages (decoded) to see gaps in node fields and counts.
 * Usage:
 *   node tools/diff-stitch.js <baseline.json> <target.json>
 *
 * Defaults:
 *   baseline: webapp/fixtures/stitch-text.json (Stitch reference)
 *   target:   webapp/fixtures/generated.json (put your encoder output here)
 */
const { readFileSync } = require('fs');
const path = require('path');

function loadJson(p) {
  const abs = path.resolve(p);
  return JSON.parse(readFileSync(abs, 'utf8'));
}

function countByType(nodes) {
  const out = {};
  for (const n of nodes || []) out[n.type] = (out[n.type] || 0) + 1;
  return out;
}

function keySetForType(nodes, type) {
  const keys = new Set();
  for (const n of nodes || []) {
    if (n.type === type) Object.keys(n).forEach(k => keys.add(k));
  }
  return keys;
}

function diffKeys(baseSet, targetSet) {
  const missing = [...baseSet].filter(k => !targetSet.has(k));
  const extra = [...targetSet].filter(k => !baseSet.has(k));
  return { missing, extra };
}

function main() {
  const baselinePath = process.argv[2] || 'webapp/fixtures/stitch-text.json';
  const targetPath = process.argv[3] || 'webapp/fixtures/generated.json';

  const baseline = loadJson(baselinePath);
  const target = loadJson(targetPath);

  const baseNodes = baseline.nodeChanges || [];
  const tgtNodes = target.nodeChanges || [];

  console.log('Baseline counts:', countByType(baseNodes));
  console.log('Target counts  :', countByType(tgtNodes));

  const types = ['TEXT', 'FRAME', 'CANVAS', 'DOCUMENT', 'VECTOR', 'RECTANGLE', 'ELLIPSE', 'GROUP'];
  for (const t of types) {
    const bSet = keySetForType(baseNodes, t);
    const tSet = keySetForType(tgtNodes, t);
    if (bSet.size === 0 && tSet.size === 0) continue;
    const { missing, extra } = diffKeys(bSet, tSet);
    console.log(`\n[${t}] keys: baseline=${bSet.size} target=${tSet.size}`);
    if (missing.length) console.log('  missing in target:', missing.sort().join(', '));
    if (extra.length) console.log('  extra in target  :', extra.sort().join(', '));
  }

  const firstBaseText = baseNodes.find(n => n.type === 'TEXT');
  const firstTgtText = tgtNodes.find(n => n.type === 'TEXT');
  if (firstBaseText && firstTgtText) {
    const baseKeys = new Set(Object.keys(firstBaseText));
    const tgtKeys = new Set(Object.keys(firstTgtText));
    const { missing, extra } = diffKeys(baseKeys, tgtKeys);
    console.log('\n[TEXT sample] key diff');
    if (missing.length) console.log('  missing:', missing.sort().join(', '));
    if (extra.length) console.log('  extra  :', extra.sort().join(', '));
  }
}

main();
