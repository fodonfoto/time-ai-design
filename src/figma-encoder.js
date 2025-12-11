/**
 * Figma Native Encoder Module
 * 
 * Provides functions to encode/decode Figma clipboard format
 * for native paste functionality in Time AI Extension
 * 
 * Based on fig-kiwi library: https://github.com/darknoon/figma-format-parse
 */

import { inflateRaw, deflateRaw } from 'pako';
import { toByteArray, fromByteArray } from 'base64-js';

// ============================================
// Constants for Figma HTML Clipboard Format
// ============================================

const FIGMETA_START = '<!--(figmeta)';
const FIGMETA_END = '(/figmeta)-->';
const FIGMA_START = '<!--(figma)';
const FIGMA_END = '(/figma)-->';

// Figma Kiwi archive signature
const FIG_KIWI_SIGNATURE = 'fig-kiwie';

// ============================================
// Clipboard Parsing Functions
// ============================================

/**
 * Parse Figma HTML clipboard data
 * @param {string} html - HTML string from clipboard
 * @returns {{ meta: object, buffer: Uint8Array } | null}
 */
export function parseFigmaClipboard(html) {
    try {
        // Extract figmeta
        const metaStartIdx = html.indexOf(FIGMETA_START);
        const metaEndIdx = html.indexOf(FIGMETA_END);
        if (metaStartIdx === -1 || metaEndIdx === -1) {
            console.warn('figmeta not found in clipboard');
            return null;
        }

        const metaB64 = html.substring(metaStartIdx + FIGMETA_START.length, metaEndIdx);
        const metaJSON = new TextDecoder().decode(toByteArray(metaB64));
        const meta = JSON.parse(metaJSON);

        // Extract figma buffer
        const figmaStartIdx = html.indexOf(FIGMA_START);
        const figmaEndIdx = html.indexOf(FIGMA_END);
        if (figmaStartIdx === -1 || figmaEndIdx === -1) {
            console.warn('figma buffer not found in clipboard');
            return null;
        }

        const figmaB64 = html.substring(figmaStartIdx + FIGMA_START.length, figmaEndIdx);
        const buffer = toByteArray(figmaB64);

        return { meta, buffer };
    } catch (error) {
        console.error('Error parsing Figma clipboard:', error);
        return null;
    }
}

/**
 * Compose Figma HTML clipboard data
 * @param {{ meta: object, buffer: Uint8Array }} data
 * @returns {string} HTML string for clipboard
 */
export function composeFigmaClipboard(meta, buffer) {
    const metaJSON = JSON.stringify(meta) + '\n';
    const metaB64 = fromByteArray(new TextEncoder().encode(metaJSON));
    const figmaB64 = fromByteArray(buffer);

    return `<meta charset="utf-8" /><span
  data-metadata="${FIGMETA_START}${metaB64}${FIGMETA_END}"
></span
><span
  data-buffer="${FIGMA_START}${figmaB64}${FIGMA_END}"
></span
><span style="white-space: pre-wrap"></span>`;
}

// ============================================
// Kiwi Binary Archive Functions
// ============================================

/**
 * Parse Figma Kiwi archive header
 * @param {Uint8Array} data 
 * @returns {{ signature: string, version: number, fileCount: number, fileSizes: number[] }}
 */
export function parseKiwiHeader(data) {
    // First 9 bytes = signature "fig-kiwie"
    const signature = new TextDecoder().decode(data.slice(0, 9));

    if (signature !== FIG_KIWI_SIGNATURE) {
        throw new Error(`Invalid Kiwi signature: ${signature}`);
    }

    // Parse header using DataView
    const view = new DataView(data.buffer, data.byteOffset);

    // Bytes 9-12: Version (4 bytes, little-endian)
    // Note: Actual header structure may vary, this is simplified

    return {
        signature,
        rawHeader: data.slice(0, 50), // First 50 bytes for inspection
        totalSize: data.length
    };
}

// ============================================
// Node Transformation Functions
// ============================================

/**
 * Transform AI-generated JSON to Figma-compatible node structure
 * This creates the node changes message that Figma expects
 * 
 * @param {object} aiNode - AI generated design JSON
 * @returns {object} Figma message structure
 */
export function transformAIToFigmaMessage(aiNode) {
    const nodeId = generateNodeId();

    return {
        type: 'NODE_CHANGES',
        sessionID: 0,
        ackID: 0,
        pasteID: Date.now(),
        pasteFileKey: null, // Will be filled when pasting
        pasteIsPartiallyOutsideEnclosingFrame: false,
        pastePageId: {
            sessionID: 0,
            localID: 1
        },
        // The actual node changes
        nodeChanges: [
            transformNodeRecursive(aiNode, nodeId)
        ]
    };
}

/**
 * Recursively transform a node and its children
 */
function transformNodeRecursive(node, parentId = null, index = 0) {
    if (!node) return null;

    const nodeId = generateNodeId();

    const figmaNode = {
        guid: {
            sessionID: 0,
            localID: nodeId
        },
        parentIndex: parentId ? {
            guid: { sessionID: 0, localID: parentId },
            position: String.fromCharCode(65 + index) // A, B, C...
        } : null,
        type: mapNodeType(node.type),
        name: node.name || 'Layer',
        visible: true,

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

        // Fills
        fillPaints: transformFills(node.fills),
    };

    // Add text-specific properties
    if (node.type === 'TEXT') {
        figmaNode.textData = {
            characters: node.characters || '',
            fontName: {
                family: node.fontName?.family || 'Inter',
                style: node.fontName?.style || 'Regular'
            },
            fontSize: node.fontSize || 14,
            textAlignHorizontal: node.textAlignHorizontal || 'LEFT',
            textAlignVertical: node.textAlignVertical || 'TOP'
        };
    }

    // Add layout properties
    if (node.layoutMode && node.layoutMode !== 'NONE') {
        figmaNode.stackMode = node.layoutMode;
        figmaNode.stackSpacing = node.itemSpacing || 0;
        figmaNode.stackPadding = {
            top: node.paddingTop || 0,
            right: node.paddingRight || 0,
            bottom: node.paddingBottom || 0,
            left: node.paddingLeft || 0
        };
    }

    // Corner radius
    if (node.cornerRadius) {
        figmaNode.cornerRadius = node.cornerRadius;
    }

    // Process children
    if (node.children && Array.isArray(node.children)) {
        figmaNode.children = node.children
            .map((child, i) => transformNodeRecursive(child, nodeId, i))
            .filter(c => c !== null);
    }

    return figmaNode;
}

/**
 * Map AI node type to Figma node type
 */
function mapNodeType(type) {
    const typeMap = {
        'FRAME': 'FRAME',
        'TEXT': 'TEXT',
        'RECTANGLE': 'RECTANGLE',
        'ELLIPSE': 'ELLIPSE',
        'GROUP': 'GROUP',
        'VECTOR': 'VECTOR'
    };
    return typeMap[type] || 'FRAME';
}

/**
 * Transform fills array to Figma paint format
 */
function transformFills(fills) {
    if (!fills || !Array.isArray(fills)) return [];

    return fills.map(fill => ({
        type: fill.type || 'SOLID',
        visible: fill.visible !== false,
        opacity: fill.opacity ?? 1,
        blendMode: fill.blendMode || 'NORMAL',
        color: {
            r: fill.color?.r ?? 1,
            g: fill.color?.g ?? 1,
            b: fill.color?.b ?? 1,
            a: fill.opacity ?? 1
        }
    }));
}

/**
 * Generate unique node ID
 */
let nodeIdCounter = 1000;
function generateNodeId() {
    return nodeIdCounter++;
}

// ============================================
// Template-Based Approach (MVP)
// ============================================

/**
 * Store for captured Figma templates
 * Templates are captured from real Figma elements
 */
const TEMPLATES = {
    // Will be populated from captured data
    FRAME: null,
    TEXT: null,
    RECTANGLE: null,
    BUTTON: null
};

/**
 * Store a captured template
 * @param {string} type - Template type (FRAME, TEXT, etc.)
 * @param {Uint8Array} buffer - Captured Figma binary buffer
 * @param {object} meta - Captured metadata
 */
export function storeTemplate(type, buffer, meta) {
    TEMPLATES[type] = { buffer, meta };
    console.log(`📦 Stored template: ${type}`);
}

/**
 * Get a stored template
 * @param {string} type 
 * @returns {{ buffer: Uint8Array, meta: object } | null}
 */
export function getTemplate(type) {
    return TEMPLATES[type];
}

/**
 * Check if templates are available
 * @returns {boolean}
 */
export function hasTemplates() {
    return Object.values(TEMPLATES).some(t => t !== null);
}

// ============================================
// Main Export: Copy to Figma Clipboard
// ============================================

/**
 * Create Figma-native clipboard data from AI-generated design
 * This is the main function called from popup.js
 * 
 * @param {object} designJSON - AI generated design JSON
 * @returns {Promise<{ html: string, fallbackJSON: string }>}
 */
export async function createFigmaClipboardData(designJSON) {
    // For MVP: We'll create the HTML structure with placeholder data
    // Full implementation will use fig-kiwi to encode proper Kiwi binary

    const meta = {
        fileKey: 'generated',
        pasteID: Date.now(),
        dataType: 'scene'
    };

    // Currently, we use JSON fallback until full Kiwi encoding is implemented
    // The template approach will be used when templates are captured

    const fallbackJSON = JSON.stringify(designJSON, null, 2);

    // Check if we have templates to use
    if (hasTemplates()) {
        // Use template-based approach
        console.log('📋 Using template-based paste');
        const frameTemplate = getTemplate('FRAME');
        if (frameTemplate) {
            const html = composeFigmaClipboard(meta, frameTemplate.buffer);
            return { html, fallbackJSON, method: 'template' };
        }
    }

    // Fallback to JSON for Seek/Stitch plugin
    console.log('📋 Using JSON fallback (capture templates first)');
    return {
        html: null,
        fallbackJSON,
        method: 'json',
        message: 'To enable native Figma paste, capture templates first using schema-capture.html'
    };
}

/**
 * Copy design to clipboard in Figma-native format
 * @param {object} designJSON 
 * @returns {Promise<boolean>} Success status
 */
export async function copyToFigmaClipboard(designJSON) {
    const { html, fallbackJSON, method, message } = await createFigmaClipboardData(designJSON);

    if (method === 'template' && html) {
        // Use native Figma format
        try {
            const blob = new Blob([html], { type: 'text/html' });
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': blob,
                    'text/plain': new Blob([fallbackJSON], { type: 'text/plain' })
                })
            ]);
            console.log('✅ Copied to clipboard in native Figma format!');
            return { success: true, method: 'native' };
        } catch (error) {
            console.error('Native clipboard failed, falling back to JSON:', error);
        }
    }

    // Fallback to JSON
    await navigator.clipboard.writeText(fallbackJSON);
    console.log('📋 Copied as JSON (for Seek/Stitch plugin)');
    return {
        success: true,
        method: 'json',
        message: message || 'Use Seek Design or Stitch plugin in Figma'
    };
}
