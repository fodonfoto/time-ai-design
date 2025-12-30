
import * as fs from 'fs';
import * as path from 'path';
import { compileSchema } from 'kiwi-schema';
import { unzipSync, inflateSync } from 'fflate';
import { toByteArray } from 'base64-js';
import { defaultSchema } from './src/lib/figma-schema';

// Helper to decode
function decodeStitchFile() {
    try {
        const filePath = path.join(process.cwd(), 'stitch-data.txt');
        console.log('📖 Reading file:', filePath);
        const base64Data = fs.readFileSync(filePath, 'utf-8').trim();

        console.log('🔍 Decoding data of length:', base64Data.length);
        const binary = toByteArray(base64Data);

        // Print Header
        const header = Array.from(binary.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        const ascii = Array.from(binary.slice(0, 32)).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
        console.log('📦 Header Hex:', header);
        console.log('📦 Header ASCII:', ascii);

        // Check prelude
        const prelude = new TextDecoder().decode(binary.slice(0, 8));
        if (prelude !== 'fig-kiwi') {
            console.log('⚠️ Prelude is not fig-kiwi:', prelude);
        }

        // Try Chunk Parsing
        let offset = 8; // Skip prelude
        const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);

        // Read Version
        const version = view.getUint32(offset, true);
        console.log('📦 Version:', version);
        offset += 4;

        // Chunk 1
        if (offset + 4 > binary.length) return;
        const len1 = view.getUint32(offset, true);
        console.log('📦 Chunk 1 Length:', len1);
        offset += 4;

        const chunk1Ctx = binary.slice(offset, offset + len1);
        offset += len1;

        // Chunk 2
        if (offset + 4 > binary.length) {
            console.log('⚠️ End of file before Chunk 2');
        } else {
            const len2 = view.getUint32(offset, true);
            console.log('📦 Chunk 2 Length:', len2);
            offset += 4;
            const chunk2Ctx = binary.slice(offset, offset + len2);

            // Try to decode Chunk 2 as Message
            // Note: Data is likely DEFLATED (compressed) inside the chunk if created by Grida.
            // But standard Figma Copy might be raw or compressed.
            // Grida's `writeFigFile` uses `deflateSync`.
            // Let's try to inflate it.

            try {
                // Try inflate
                // We need to check if it's zlib stream or raw deflate.
                // Usually fflate.inflateSync handles zlib/deflate.
                // Or maybe it is NOT compressed?
                // Let's look at the first bytes of chunk2.
                const c2Head = Array.from(chunk2Ctx.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
                console.log('📦 Chunk 2 Head:', c2Head);

                // Try unzip/inflate
                // import inflateSync is available
                // If it fails, try raw decode
            } catch (e) { console.log(e); }

            const compiled = compileSchema(defaultSchema);

            // ATTEMPT 1: Decode Raw
            try {
                console.log('🔍 Attempting Raw Decode...');
                const decoded = (compiled as any).decodeMessage(chunk2Ctx);
                console.log('✅ Success Raw Decode!');
                const outputPath = path.join(process.cwd(), 'stitch-decoded.json');
                fs.writeFileSync(outputPath, JSON.stringify(decoded, null, 2));
                console.log('✅ Decoded data written to:', outputPath);
                return;
            } catch (e) {
                console.log('❌ Raw decode failed, trying inflate...');
            }

            // ATTEMPT 2: Inflate then Decode
            try {
                const inflated = inflateSync(chunk2Ctx);
                console.log('✅ Inflated size:', inflated.length);
                const decoded = (compiled as any).decodeMessage(inflated);
                console.log('✅ Success Inflated Decode!');
                const outputPath = path.join(process.cwd(), 'stitch-decoded.json');
                fs.writeFileSync(outputPath, JSON.stringify(decoded, null, 2));
                console.log('✅ Decoded data written to:', outputPath);
                return;
            } catch (e: any) {
                console.log('❌ Inflate failed:', e.message);
            }
        }

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

decodeStitchFile();
