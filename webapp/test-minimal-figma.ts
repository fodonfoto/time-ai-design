/**
 * Minimal Figma clipboard test - creates simplest possible valid paste data
 * This tests if our encoding format works at all with Figma
 */

import { deflateRaw } from 'pako';
import { compileSchema, encodeBinarySchema, parseSchema } from 'kiwi-schema';
import { fromByteArray } from 'base64-js';
import { defaultSchema } from './src/lib/figma-schema.js';

// MINIMAL message - just one simple rectangle
const minimalMessage = {
    type: 'NODE_CHANGES',
    sessionID: 0,
    ackID: 0,
    pasteID: 123456789,
    nodeChanges: [{
        guid: { sessionID: 0, localID: 1 },
        phase: 'CREATED',
        type: 'RECTANGLE',
        name: 'Test Rectangle',
        visible: true,
        opacity: 1.0,
        size: { x: 100, y: 100 },
        transform: {
            m00: 1, m01: 0, m02: 0,
            m10: 0, m11: 1, m12: 0
        },
        fillPaints: [{
            type: 'SOLID',
            color: { r: 1, g: 0, b: 0, a: 1 },
            opacity: 1,
            visible: true,
            blendMode: 'NORMAL'
        }]
    }],
    blobs: []
};

console.log('\n=== Minimal Figma Clipboard Test ===\n');

try {
    const compiledSchema = compileSchema(defaultSchema);
    const binSchema = encodeBinarySchema(defaultSchema);

    console.log('✅ Schema compiled successfully');

    // Encode the message
    const encodedMessage = (compiledSchema as any).encodeMessage(minimalMessage);
    console.log('✅ Message encoded:', encodedMessage.length, 'bytes');

    // Create archive
    const FIG_KIWI_PRELUDE = 'fig-kiwi';
    const FIG_KIWI_VERSION = 15;

    const compressedSchema = deflateRaw(binSchema);
    const compressedMessage = deflateRaw(encodedMessage);

    const preludeBytes = new TextEncoder().encode(FIG_KIWI_PRELUDE);
    const headerSize = preludeBytes.length + 4;
    const filesSize = 4 + compressedSchema.length + 4 + compressedMessage.length;
    const totalSize = headerSize + filesSize;

    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);

    let offset = 0;
    buffer.set(preludeBytes, offset);
    offset += preludeBytes.length;
    view.setUint32(offset, FIG_KIWI_VERSION, true);
    offset += 4;
    view.setUint32(offset, compressedSchema.length, true);
    offset += 4;
    buffer.set(compressedSchema, offset);
    offset += compressedSchema.length;
    view.setUint32(offset, compressedMessage.length, true);
    offset += 4;
    buffer.set(compressedMessage, offset);

    console.log('✅ Archive created:', buffer.length, 'bytes');

    // Create HTML with fig-kiwi exact format
    const meta = {
        fileKey: 'IAMA_DUMMY_FILE_KEY_AMA',
        pasteID: 777,
        dataType: 'scene'
    };

    const metaJSON = JSON.stringify(meta) + '\n';
    const metaB64 = Buffer.from(metaJSON).toString('base64');
    const figmaB64 = fromByteArray(buffer);

    // Exact fig-kiwi format
    const html = `<meta charset="utf-8" /><meta charset="utf-8" /><span
  data-metadata="<!--(figmeta)${metaB64}(/figmeta)-->"
></span
><span
  data-buffer="<!--(figma)${figmaB64}(/figma)-->"
></span
><span style="white-space: pre-wrap"></span>`;

    console.log('✅ HTML generated:', html.length, 'chars');

    // Output for manual testing
    console.log('\n=== Copy this HTML to test manually ===\n');
    console.log('Length:', html.length);
    console.log('First 200 chars:', html.substring(0, 200));
    console.log('...');
    console.log('Last 100 chars:', html.substring(html.length - 100));

    // Write to file for easy testing
    const fs = require('fs');
    fs.writeFileSync('test-clipboard.html', html);
    console.log('\n✅ Saved to test-clipboard.html');

    console.log('\n=== TEST COMPLETE ===\n');

} catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
}
