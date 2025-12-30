
import { createFigmaClipboardHTML, decodeFigmaClipboard } from './src/lib/figma-encoder';
import { AINode } from './src/lib/figma-encoder';

async function verify() {
    console.log('🧪 Verifying Figma Encoder Fixes...');

    const testNode: AINode = {
        type: 'TEXT',
        name: 'Test Text',
        characters: 'Hello World',
        fontSize: 16,
        fills: [] // Empty fills to test default fill logic
    };

    console.log('📝 Generating clipboard data for TEXT node...');
    const result = await createFigmaClipboardHTML(testNode);

    if (!result.success || !result.html) {
        console.error('❌ Generation failed:', result.error);
        return;
    }

    // Extract base64 from HTML
    const match = result.html.match(/<!--\(figma\)([\s\S]*?)\(\/figma\)-->/);
    if (!match) {
        console.error('❌ No figma block in HTML');
        console.log(result.html.substring(0, 100));
        return;
    }

    const base64 = match[1];
    console.log('📦 Extracted Base64 length:', base64.length);

    // Decode
    console.log('🔍 Decoding back...');
    const decoded = decodeFigmaClipboard(base64);

    if (decoded.error) {
        console.error('❌ Decode failed:', decoded.error);
        return;
    }

    if (decoded.success && decoded.data) {
        // Inspect the TEXT node
        const changes = decoded.data.nodeChanges;
        const textNode = changes.find((c: any) => c.type === 'TEXT');

        if (!textNode) {
            console.error('❌ No TEXT node found in decoded message');
            return;
        }

        console.log('✅ TEXT node found');

        // CHECK 1: textData.lines
        if (textNode.textData && textNode.textData.lines && textNode.textData.lines.length > 0) {
            console.log('✅ textData.lines present:', textNode.textData.lines.length);
        } else {
            console.error('❌ textData.lines MISSING or empty');
            console.log('textData:', JSON.stringify(textNode.textData, null, 2));
        }

        // CHECK 2: Default Fill
        if (textNode.fillPaints && textNode.fillPaints.length > 0) {
            console.log('✅ Default fill present:', textNode.fillPaints[0]);
        } else {
            console.error('❌ fillPaints MISSING');
        }

        // CHECK 3: Layout Version
        if (textNode.textUserLayoutVersion === 5) {
            console.log('✅ textUserLayoutVersion is 5');
        } else {
            console.error('❌ textUserLayoutVersion mismatch:', textNode.textUserLayoutVersion);
        }

        // CHECK 4: textAutoResize
        if (textNode.textAutoResize === 'HEIGHT') {
            console.log('✅ textAutoResize is HEIGHT');
        } else {
            console.error('❌ textAutoResize mismatch:', textNode.textAutoResize);
        }

    }
}

verify();
