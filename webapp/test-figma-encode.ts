/**
 * Debug script to test Figma Kiwi encoding
 * Run with: npx ts-node --esm test-figma-encode.ts
 */

import { deflateRaw, inflateRaw } from 'pako';
import { compileSchema, encodeBinarySchema, parseSchema, decodeBinarySchema } from 'kiwi-schema';
import { fromByteArray, toByteArray } from 'base64-js';
import { defaultSchema } from './src/lib/figma-schema.js';

// Test message structure
const testMessage = {
    type: 'NODE_CHANGES',
    sessionID: 0,
    ackID: 0,
    pasteID: 123456789,
    pasteFileKey: null,
    pasteIsPartiallyOutsideEnclosingFrame: false,
    nodeChanges: [
        {
            guid: { sessionID: 0, localID: 1000 },
            phase: 'CREATED',
            parentIndex: null,
            type: 'FRAME',
            name: 'TestFrame',
            visible: true,
            opacity: 1,
            blendMode: 'PASS_THROUGH',
            transform: { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 },
            size: { x: 100, y: 100 },
            fillPaints: [{
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: 'NORMAL',
                color: { r: 0.5, g: 0.5, b: 0.5, a: 1 }
            }]
        }
    ],
    blobs: []
};

console.log('\n=== Figma Kiwi Encoding Test ===\n');

try {
    // Compile schema
    const compiledSchema = compileSchema(defaultSchema);
    const binSchema = encodeBinarySchema(defaultSchema);

    console.log('✅ Schema compiled successfully');
    console.log('   Binary schema size:', binSchema.length, 'bytes');

    // Try to encode the message
    console.log('\n🔄 Encoding test message...');
    const encodedMessage = (compiledSchema as any).encodeMessage(testMessage);
    console.log('✅ Message encoded successfully');
    console.log('   Encoded message size:', encodedMessage.length, 'bytes');

    // Compress
    const compressedSchema = deflateRaw(binSchema);
    const compressedMessage = deflateRaw(encodedMessage);
    console.log('✅ Compressed successfully');
    console.log('   Compressed schema:', compressedSchema.length, 'bytes');
    console.log('   Compressed message:', compressedMessage.length, 'bytes');

    // Create archive
    const FIG_KIWI_PRELUDE = 'fig-kiwi';
    const FIG_KIWI_VERSION = 15;

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

    console.log('✅ Archive created');
    console.log('   Total archive size:', buffer.length, 'bytes');
    console.log('   Header:', String.fromCharCode(...preludeBytes), 'v' + FIG_KIWI_VERSION);

    // Create HTML clipboard string
    const meta = {
        fileKey: 'IAMA_DUMMY_FILE_KEY_AMA',
        pasteID: 777,
        dataType: 'scene'
    };
    const metaJSON = JSON.stringify(meta) + '\n';
    const metaB64 = Buffer.from(metaJSON).toString('base64');
    const figmaB64 = fromByteArray(buffer);

    const html = `<meta charset="utf-8" /><meta charset="utf-8" /><span
  data-metadata="<!--(figmeta)${metaB64}(/figmeta)-->"
></span
><span
  data-buffer="<!--(figma)${figmaB64}(/figma)-->"
></span
><span style="white-space: pre-wrap"></span>`;

    console.log('\n✅ HTML Clipboard String generated');
    console.log('   HTML length:', html.length, 'chars');
    console.log('   Meta B64 length:', metaB64.length);
    console.log('   Figma B64 length:', figmaB64.length);

    // Verify by decoding
    console.log('\n🔄 Verifying by decoding...');
    const decompressedSchema = inflateRaw(compressedSchema);
    const decompressedMessage = inflateRaw(compressedMessage);
    const decodedSchema = decodeBinarySchema(decompressedSchema);
    const recompiledSchema = compileSchema(decodedSchema);
    const decodedMessage = (recompiledSchema as any).decodeMessage(decompressedMessage);

    console.log('✅ Decoded message type:', decodedMessage.type);
    console.log('   NodeChanges count:', decodedMessage.nodeChanges?.length || 0);

    console.log('\n=== TEST PASSED ===\n');

} catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    console.log('\n=== TEST FAILED ===\n');
}
