/**
 * Pre-compile Figma Kiwi schema for use in Chrome Extension
 * 
 * This script runs at build time to compile the schema and save
 * the encoded binary schema, avoiding CSP issues with compileSchema()
 */

const fs = require('fs');
const path = require('path');

async function buildSchema() {
    console.log('📦 Building pre-compiled Figma schema...');

    try {
        // Load kiwi-schema
        const { parseSchema, encodeBinarySchema } = require('kiwi-schema');

        // Read the schema text from figma-schema.ts
        const schemaPath = path.join(__dirname, 'src/figma-schema.ts');
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

        // Extract schemaText from the file
        const match = schemaContent.match(/const schemaText = `([\s\S]*?)`;/);
        if (!match) {
            throw new Error('Could not find schemaText in figma-schema.ts');
        }

        const schemaText = match[1];
        console.log('✅ Schema text extracted:', schemaText.length, 'chars');

        // Parse and encode to binary
        const schema = parseSchema(schemaText);
        const binarySchema = encodeBinarySchema(schema);

        console.log('✅ Schema compiled to binary:', binarySchema.length, 'bytes');

        // Save as base64 for easy loading
        const base64Schema = Buffer.from(binarySchema).toString('base64');

        // Create output file
        const output = `// Pre-compiled Figma Kiwi schema (generated at build time)
// DO NOT EDIT - regenerate with: node build-schema.js

export const PRECOMPILED_SCHEMA_B64 = "${base64Schema}";
export const SCHEMA_SIZE = ${binarySchema.length};
`;

        const outputPath = path.join(__dirname, 'src/precompiled-schema.js');
        fs.writeFileSync(outputPath, output);

        console.log('✅ Saved to src/precompiled-schema.js');
        console.log('📦 Pre-compiled schema build complete!');

    } catch (error) {
        console.error('❌ Schema build failed:', error.message);
        process.exit(1);
    }
}

buildSchema();
