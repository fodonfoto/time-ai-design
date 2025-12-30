
import * as fs from 'fs';
import * as path from 'path';
import { inflateSync } from 'fflate';
import { compileSchema } from 'kiwi-schema';
import { defaultSchema } from './src/lib/figma-schema';

const STITCH_FILE = path.resolve('/Users/Niwat.yah/Downloads/time-design/figma-clipboard-data (2).txt');
const TIME_AI_FILE = path.resolve('/Users/Niwat.yah/Downloads/time-design/figma-clipboard-data (3).txt');

const compiledSchema = compileSchema(defaultSchema);

function toByteArray(base64: string) {
    const binString = atob(base64);
    const len = binString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}

// Helper for atob in Node
function atob(str: string) {
    return Buffer.from(str, 'base64').toString('binary');
}

function decodeFile(filePath: string, label: string) {
    console.log(`\n📂 Decoding ${label} (${filePath})...`);
    try {
        let base64Data = fs.readFileSync(filePath, 'utf-8').trim();
        if (base64Data.includes('<!--(figma)')) {
            base64Data = base64Data.split('<!--(figma)')[1].split('-->')[0];
        }

        const binary = toByteArray(base64Data);
        let offset = 12; // Skip prelude + version
        const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);

        const len1 = view.getUint32(offset, true);
        offset += 4 + len1; // Skip schema

        const len2 = view.getUint32(offset, true);
        offset += 4; // Skip msg len

        const messageBytes = binary.slice(offset, offset + len2);

        let decoded: any;
        try {
            const inflated = inflateSync(messageBytes);
            decoded = (compiledSchema as any).decodeMessage(inflated);
        } catch (e) {
            decoded = (compiledSchema as any).decodeMessage(messageBytes);
        }

        return decoded;

    } catch (e: any) {
        // console.error(`❌ Error decoding ${label}:`, e.message);
        return null;
    }
}

function findTextNode(node: any): any {
    if (node.nodeChanges) {
        for (const change of node.nodeChanges) {
            if (change.type === 'TEXT') return change;
        }
    }
    if (node.type === 'TEXT') return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findTextNode(child);
            if (found) return found;
        }
    }
    return null;
}

function compare() {
    const stitchDecoded = decodeFile(STITCH_FILE, 'Stitch');
    // console.log('Stitch Decoded Keys:', Object.keys(stitchDecoded));

    if (stitchDecoded.blobs && stitchDecoded.blobs.length > 0) {
        console.log(`📦 Stitch Blobs Found: ${stitchDecoded.blobs.length}`);
        stitchDecoded.blobs.forEach((b: any, i: number) => {
            // Convert Uint8Array to Base64 manually or using buffer
            const u8 = new Uint8Array(b.bytes);
            const b64 = Buffer.from(u8).toString('base64');
            console.log(`   Blob ${i} (${u8.length} bytes): "${b64}"`);
        });
    } else {
        console.log('📦 No Blobs in Stitch data');
    }

    const stitchData = stitchDecoded; // Fallback: If local file not found, use stored result or mock
    // For now we assume file exists as it was used before.

    if (!stitchData) {
        console.error("❌ Failed to decode Stitch file.");
        return;
    }

    const timeAiData = fs.readFileSync(TIME_AI_FILE);
    const timeAiDecoded = decodeFile(TIME_AI_FILE, 'Time AI'); // Corrected `decode` to `decodeFile`
    const timeAiText = findTextNode(timeAiDecoded);
    console.log('--- TIME AI TEXT NODE ---');
    console.log(JSON.stringify(timeAiText, null, 2));

    const stitchText = findTextNode(stitchData);

    if (stitchText) {
        console.log('🔍 Stitch TEXT Node Keys:', Object.keys(stitchText));
        console.log('🔍 Stitch TEXT Node Full Dump:', JSON.stringify(stitchText, null, 2));
    } else {
        console.log('⚠️ No TEXT node in Stitch data');
    }
}

compare();
