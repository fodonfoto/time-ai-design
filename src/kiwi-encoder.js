/**
 * Kiwi Encoder Module V2
 * 
 * Uses REAL Figma Kiwi schema from grida/fig-kiwi
 * for proper native clipboard paste functionality
 */

import { deflateSync } from 'fflate';
import { parseSchema, compileSchema, encodeBinarySchema } from 'kiwi-schema';
import { fromByteArray } from 'base64-js';
import { defaultSchema } from './figma-schema.ts';

// ============================================
// Constants
// ============================================

const FIG_KIWI_PRELUDE = 'fig-kiwi';
const FIG_KIWI_VERSION = 15;

// ============================================
// Archive Writer (from grida/fig-kiwi)
// ============================================

class FigmaArchiveWriter {
    constructor() {
        this.header = {
            prelude: FIG_KIWI_PRELUDE,
            version: FIG_KIWI_VERSION,
        };
        this.files = [];
    }

    write() {
        const enc = new TextEncoder();
        const preludeBytes = enc.encode(FIG_KIWI_PRELUDE);

        // Calculate total size
        const headerSize = preludeBytes.length + 4; // prelude + version
        const filesSize = this.files.reduce((sz, f) => sz + 4 + f.byteLength, 0);
        const totalSize = headerSize + filesSize;

        const buffer = new Uint8Array(totalSize);
        const view = new DataView(buffer.buffer);

        let offset = 0;

        // Write prelude
        buffer.set(preludeBytes, offset);
        offset += preludeBytes.length;

        // Write version
        view.setUint32(offset, this.header.version, true);
        offset += 4;

        // Write files (each with size prefix)
        for (const file of this.files) {
            view.setUint32(offset, file.byteLength, true);
            offset += 4;
            buffer.set(file, offset);
            offset += file.byteLength;
        }

        return buffer;
    }
}

// ============================================
// ID Generation
// ============================================

let nodeIdCounter = 1000;

function generateGUID() {
    return {
        sessionID: 0,
        localID: nodeIdCounter++
    };
}

function resetIdCounter() {
    nodeIdCounter = 1000;
}

// ============================================
// Node Transformation
// ============================================

/**
 * Transform AI node to Figma NodeChange
 */
function transformToNodeChange(node, parentIndex = null) {
    const guid = generateGUID();

    const baseChange = {
        guid: guid,
        phase: 'CREATED',
        parentIndex: parentIndex,
        name: node.name || 'Layer',
        visible: node.visible !== false,
        opacity: 1,

        // Transform
        transform: {
            m00: 1, m01: 0, m02: node.x || 0,
            m10: 0, m11: 1, m12: node.y || 0
        },

        // Size
        size: {
            x: node.width || 100,
            y: node.height || 100
        },
    };

    // Map node type
    switch (node.type) {
        case 'FRAME':
            baseChange.type = 'FRAME';
            baseChange.resizeToFit = false;
            baseChange.frameMaskDisabled = true;
            if (node.layoutMode) {
                baseChange.stackMode = node.layoutMode === 'VERTICAL' ? 'VERTICAL' : 'HORIZONTAL';
                baseChange.stackSpacing = node.itemSpacing || 0;
                baseChange.stackPaddingTop = node.paddingTop || 0;
                baseChange.stackPaddingBottom = node.paddingBottom || 0;
                baseChange.stackPaddingLeft = node.paddingLeft || 0;
                baseChange.stackPaddingRight = node.paddingRight || 0;
            }
            break;
        case 'TEXT':
            baseChange.type = 'TEXT';
            baseChange.textData = {
                characters: node.characters || '',
                styleOverrideTable: [{
                    styleID: 0,
                    fontName: {
                        family: node.fontName?.family || 'Inter',
                        style: node.fontName?.style || 'Regular',
                        postScript: ''
                    },
                    fontSize: node.fontSize || 14,
                    letterSpacing: { value: 0, units: 'PIXELS' },
                    lineHeight: { value: 0, units: 'AUTO' }
                }]
            };
            break;
        case 'RECTANGLE':
            baseChange.type = 'RECTANGLE';
            if (node.cornerRadius) {
                baseChange.cornerRadius = node.cornerRadius;
            }
            break;
        case 'ELLIPSE':
            baseChange.type = 'ELLIPSE';
            break;
        default:
            baseChange.type = 'FRAME';
    }

    // Fill paints
    if (node.fills && Array.isArray(node.fills)) {
        baseChange.fillPaints = node.fills.map(fill => ({
            type: 'SOLID',
            visible: fill.visible !== false,
            opacity: fill.opacity ?? 1,
            color: {
                r: fill.color?.r ?? 0.5,
                g: fill.color?.g ?? 0.5,
                b: fill.color?.b ?? 0.5,
                a: 1
            }
        }));
    }

    return { change: baseChange, guid };
}

/**
 * Transform entire AI design tree to NodeChanges array
 */
function transformToNodeChanges(designRoot) {
    resetIdCounter();
    const changes = [];

    function processNode(node, parentGuid = null) {
        const { change, guid } = transformToNodeChange(node, parentGuid);
        changes.push(change);

        // Process children recursively
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(child => {
                processNode(child, guid);
            });
        }
    }

    // Handle array or single node input
    const nodes = Array.isArray(designRoot) ? designRoot : [designRoot];
    nodes.forEach(node => processNode(node));

    return changes;
}

// ============================================
// Main Encoder Functions
// ============================================

/**
 * Create Figma Message from AI design
 */
export function createFigmaMessage(aiDesign) {
    return {
        type: 'NODE_CHANGES',
        sessionID: 0,
        ackID: 0,
        pasteID: Date.now(),
        pasteFileKey: null,
        pasteIsPartiallyOutsideEnclosingFrame: false,
        nodeChanges: transformToNodeChanges(aiDesign),
        blobs: []
    };
}

/**
 * Write Figma archive using real Kiwi schema
 */
export function writeFigArchive(message, schema = null) {
    try {
        const schemaToUse = schema || defaultSchema;
        const compiledSchema = compileSchema(schemaToUse);
        const binSchema = encodeBinarySchema(schemaToUse);

        const writer = new FigmaArchiveWriter();
        writer.files = [
            deflateSync(binSchema),
            deflateSync(compiledSchema.encodeMessage(message))
        ];

        return writer.write();
    } catch (error) {
        console.error('writeFigArchive error:', error);
        throw error;
    }
}

/**
 * Compose Figma HTML clipboard string
 */
export function composeHTMLClipboard(meta, figmaBuffer) {
    const metaJSON = JSON.stringify(meta) + '\n';
    const metaB64 = btoa(unescape(encodeURIComponent(metaJSON)));
    const figmaB64 = fromByteArray(figmaBuffer);

    return `<meta charset="utf-8" /><span data-metadata="<!--(figmeta)${metaB64}(/figmeta)-->"></span><span data-buffer="<!--(figma)${figmaB64}(/figma)-->"></span><span style="white-space: pre-wrap"></span>`;
}

/**
 * Create complete Figma clipboard HTML from AI design
 * This is the main export function for popup.js
 */
export function createFigmaClipboardHTML(aiDesign) {
    try {
        console.log('🔄 Creating Figma message from AI design...');
        const message = createFigmaMessage(aiDesign);
        console.log('📝 NodeChanges created:', message.nodeChanges.length);

        // Create meta (like Stitch does)
        const meta = {
            fileKey: 'IAMA_DUMMY_FILE_KEY_AMA',
            pasteID: 777,
            dataType: 'scene'
        };

        console.log('🔄 Writing Figma archive with real schema...');
        const archiveBuffer = writeFigArchive(message);
        console.log('✅ Archive created:', archiveBuffer.length, 'bytes');

        // Compose HTML
        const html = composeHTMLClipboard(meta, archiveBuffer);
        console.log('✅ HTML clipboard ready');

        return { html, success: true };
    } catch (error) {
        console.error('❌ Kiwi encoding error:', error);
        return { html: null, success: false, error: error.message };
    }
}

// ============================================
// Exports
// ============================================

export { transformToNodeChanges, transformToNodeChange };
