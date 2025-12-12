/**
 * Figma Native Encoder Module (Web App Version)
 * 
 * Uses REAL Figma Kiwi schema from fig-kiwi
 * for proper native clipboard paste functionality
 */

import { zlibSync } from 'fflate';
import { compileSchema, encodeBinarySchema, parseSchema } from 'kiwi-schema';
import { fromByteArray } from 'base64-js';
import { defaultSchema } from './figma-schema';

// ============================================
// Constants
// ============================================

// ============================================
// Constants
// ============================================

const FIG_KIWI_PRELUDE = 'fig-kiwie';
const FIG_KIWI_VERSION = 15;

// ============================================
// Archive Writer (from grida/fig-kiwi)
// ============================================

class FigmaArchiveWriter {
    header: { prelude: string; version: number };
    files: Uint8Array[];

    constructor() {
        this.header = {
            prelude: FIG_KIWI_PRELUDE,
            version: FIG_KIWI_VERSION,
        };
        this.files = [];
    }

    write(): Uint8Array {
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

export function resetIdCounter() {
    nodeIdCounter = 1000;
}

// ============================================
// Types
// ============================================

interface AINode {
    type: string;
    name?: string;
    visible?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    children?: AINode[];
    fills?: any[];
    characters?: string;
    fontName?: { family: string; style: string };
    fontSize?: number;
    layoutMode?: 'VERTICAL' | 'HORIZONTAL' | 'NONE';
    itemSpacing?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    cornerRadius?: number;
    [key: string]: any;
}

// ============================================
// Node Transformation
// ============================================

/**
 * Transform AI node to Figma NodeChange
 */
export function transformToNodeChange(node: AINode, parentIndex: { guid: { sessionID: number; localID: number }; position: string } | null = null) {
    const guid = generateGUID();

    const baseChange: any = {
        guid: guid,
        phase: 'CREATED',
        parentIndex: parentIndex,
        name: node.name || 'Layer',
        visible: node.visible !== false,
        opacity: 1,
        blendMode: 'PASS_THROUGH',

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
            if (node.layoutMode && node.layoutMode !== 'NONE') {
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
                        postscript: ''
                    },
                    fontSize: node.fontSize || 14,
                    letterSpacing: { value: 0, units: 'PIXELS' }
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
            blendMode: 'NORMAL',
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
export function transformToNodeChanges(designRoot: AINode | AINode[]) {
    resetIdCounter();
    const changes: any[] = [];

    function processNode(node: AINode, parentGuid: { sessionID: number; localID: number } | null = null) {
        // Construct parentIndex object if parent exists
        const parentIndex = parentGuid ? {
            guid: parentGuid,
            position: 'A' // Simple positioning
        } : null;

        const { change, guid } = transformToNodeChange(node, parentIndex);
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
export function createFigmaMessage(aiDesign: AINode | AINode[]) {
    return {
        type: 'NODE_CHANGES',
        sessionID: 0,
        ackID: 0,
        pasteID: Math.floor(Math.random() * 1000000000),
        pasteFileKey: null,
        pasteIsPartiallyOutsideEnclosingFrame: false,
        nodeChanges: transformToNodeChanges(aiDesign),
        blobs: [] as any[]
    };
}

/**
 * Write Figma archive using real Kiwi schema
 */
export function writeFigArchive(message: any, schema: string | null = null) {
    try {
        const schemaToUse = schema ? parseSchema(schema) : defaultSchema;
        const compiledSchema = compileSchema(schemaToUse);
        const binSchema = encodeBinarySchema(schemaToUse);

        const writer = new FigmaArchiveWriter();

        // Encode message using the schema
        const encodedMessage = (compiledSchema as any).encodeMessage(message);

        writer.files = [
            zlibSync(binSchema),
            zlibSync(encodedMessage)
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
export function composeHTMLClipboard(meta: any, figmaBuffer: Uint8Array) {
    const metaJSON = JSON.stringify(meta) + '\n';
    // Use window.btoa for browser environment
    const metaB64 = btoa(unescape(encodeURIComponent(metaJSON)));
    const figmaB64 = fromByteArray(figmaBuffer);

    return `<meta charset="utf-8" /><span data-metadata="<!--(figmeta)${metaB64}(/figmeta)-->"></span><span data-buffer="<!--(figma)${figmaB64}(/figma)-->"></span><span style="white-space: pre-wrap"></span>`;
}

/**
 * Create complete Figma clipboard HTML from AI design
 * This is the main export function
 */
export async function createFigmaClipboardHTML(aiDesign: AINode | AINode[]) {
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
    } catch (error: any) {
        console.error('❌ Kiwi encoding error:', error);
        return { html: null, success: false, error: error.message };
    }
}
