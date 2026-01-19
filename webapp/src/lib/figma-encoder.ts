/**
 * Figma Native Encoder Module (Web App Version)
 * 
 * Uses Grida's working implementation as reference:
 * https://github.com/gridaco/grida/tree/main/packages/grida-canvas-io-figma/fig-kiwi
 * 
 * KEY FIXES from Grida:
 * 1. Use fflate's deflateSync (NOT pako's deflateRaw)
 * 2. Use single meta charset in HTML format
 * 3. Use same schema version (which we already have)
 */

import { deflateSync } from 'fflate';
import { compileSchema, encodeBinarySchema } from 'kiwi-schema';
import { fromByteArray } from 'base64-js';
import { defaultSchema } from './figma-schema';

// Removed global compiledSchema to avoid initialization order issues
// const compiledSchema = compileSchema(defaultSchema);

// ============================================
// Constants (same as Grida)
// ============================================

const FIG_KIWI_PRELUDE = 'fig-kiwi';
const FIG_KIWI_VERSION = 15;

const HTML_MARKERS = {
    metaStart: '<!--(figmeta)',
    metaEnd: '(/figmeta)-->',
    figmaStart: '<!--(figma)',
    figmaEnd: '(/figma)-->'
};

// ============================================
// Kiwi Enum Constants
// NOTE: kiwi-schema library expects STRING values that it converts to numbers!
// ============================================

// These are STRING values - kiwi-schema handles conversion to numbers
// Based on Grida's TypeScript types which all use strings
export const KiwiNodeType = {
    NONE: 'NONE',
    DOCUMENT: 'DOCUMENT',
    CANVAS: 'CANVAS',
    GROUP: 'GROUP',
    FRAME: 'FRAME',
    ELLIPSE: 'ELLIPSE',
    RECTANGLE: 'RECTANGLE',
    TEXT: 'TEXT',
};

const KiwiBlendMode = {
    PASS_THROUGH: 'PASS_THROUGH',
    NORMAL: 'NORMAL',
};

const KiwiPaintType = {
    SOLID: 'SOLID',
    GRADIENT_LINEAR: 'GRADIENT_LINEAR',
};

// Mapped from fig.kiwi (Enum numeric values)
export const KiwiEffectType = {
    INNER_SHADOW: 0,
    DROP_SHADOW: 1,
    FOREGROUND_BLUR: 2, // Corresponds to LAYER_BLUR
    BACKGROUND_BLUR: 3,
};

const KiwiNodePhase = {
    CREATED: 'CREATED',
};


const KiwiMessageType = {
    NODE_CHANGES: 'NODE_CHANGES',
};

const KiwiEditorType = {
    DESIGN: 'DESIGN',
};

// ============================================
// Types
// ============================================

export interface AINode {
    type: string;
    name?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    children?: AINode[];

    // Fills (solid, gradient, image)
    fills?: any[];

    // Strokes (enhanced)
    strokes?: any[];
    strokeWeight?: number;
    strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
    strokeCap?: 'NONE' | 'ROUND' | 'SQUARE';
    strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND';
    dashPattern?: number[];

    // Effects (shadows, blur)
    effects?: Array<{
        type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'BACKGROUND_BLUR' | 'FOREGROUND_BLUR';
        color?: { r: number; g: number; b: number; a: number };
        offset?: { x: number; y: number };
        radius?: number;
        spread?: number;
        visible?: boolean;
    }>;

    // Text properties
    characters?: string;
    fontSize?: number;
    fontName?: { family: string; style: string };
    fontWeight?: number;
    lineHeight?: number | { value: number; unit: 'PIXELS' | 'PERCENT' | 'AUTO' };
    letterSpacing?: number;
    textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
    textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
    textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
    toggledOnOTFeatures?: string[];
    toggledOffOTFeatures?: string[];

    // Visual properties
    visible?: boolean;
    opacity?: number;
    blendMode?: 'PASS_THROUGH' | 'NORMAL' | 'DARKEN' | 'MULTIPLY' | 'SCREEN' | 'OVERLAY';

    // Auto Layout
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
    counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
    itemSpacing?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
    layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';

    // Corner radius
    cornerRadius?: number;
    topLeftRadius?: number;
    topRightRadius?: number;
    bottomLeftRadius?: number;
    bottomRightRadius?: number;
    cornerSmoothing?: number; // iOS smoothing 0-1

    // Other
    clipsContent?: boolean;
    imageHash?: string;

    // Advanced / Debugging
    textUserLayoutVersion?: number;
    derivedTextData?: any;
    fontVersion?: string;
    textBidiVersion?: number;
    // Debug: Force omit lines or styleIDs to test minimal format
    debugOmitLines?: boolean;
    debugOmitCharacterStyleIDs?: boolean;
    debugTextAutoResize?: 'NONE' | 'MAX_WIDTH' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
    debugBlobs?: string[]; // Base64 encoded blobs for testing
}


export interface FigmaMeta {
    fileKey: string;
    pasteID: number;
    dataType: 'scene';
}

// ============================================
// Archive Writer (same as Grida)
// ============================================

class FigmaArchiveWriter {
    header = { prelude: FIG_KIWI_PRELUDE, version: FIG_KIWI_VERSION };
    files: Uint8Array[] = [];

    write(): Uint8Array {
        const headerSize = FIG_KIWI_PRELUDE.length + 4;
        const totalSize = this.files.reduce((sz, f) => sz + 4 + f.byteLength, headerSize);

        const buffer = new Uint8Array(totalSize);
        const view = new DataView(buffer.buffer);
        const enc = new TextEncoder();

        let offset = enc.encodeInto(FIG_KIWI_PRELUDE, buffer).written!;
        view.setUint32(offset, this.header.version, true);
        offset += 4;

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
// GUID Generator
// ============================================

let localIDCounter = 1; // Start at 2 (after CANVAS which is 1)

function resetIdCounter() { localIDCounter = 1; }

function generateGUID() {
    localIDCounter++;
    // Grida uses sessionID: 13 for design nodes!
    return { sessionID: 13, localID: localIDCounter };
}

// ============================================
// Node Transformation
// ============================================

export function transformToNodeChange(node: AINode, parentIndex: { guid: { sessionID: number; localID: number }; position: string } | null = null) {
    const guid = generateGUID();

    // Base node structure
    const baseChange: any = {
        guid,
        phase: KiwiNodePhase.CREATED,
        parentIndex,
        type: KiwiNodeType.FRAME,
        name: node.name || 'Layer',
        visible: node.visible !== false,
        locked: false,
        opacity: node.opacity ?? 1,
        // NOTE: Do NOT set blendMode here - Figma defaults to PASS_THROUGH
        size: { x: node.width || 100, y: node.height || 100 },
        // CRITICAL: Transform matrix for position
        transform: {
            m00: 1, m01: 0, m02: node.x || 0,
            m10: 0, m11: 1, m12: node.y || 0
        },
        // Defaults closer to Stitch
        mask: false,
        maskType: 'ALPHA',
        proportionsConstrained: false,
        horizontalConstraint: 'MIN',
        verticalConstraint: 'MIN',
        stackChildAlignSelf: 'STRETCH',
        miterLimit: 4,
        textTracking: 0,
        handleMirroring: 'NONE',
        strokeWeight: 1,
        strokeAlign: 'OUTSIDE',
        strokeCap: 'NONE',
        strokeJoin: 'MITER',
        strokePaints: []
    };

    switch (node.type) {
        case 'FRAME':
            baseChange.type = KiwiNodeType.FRAME;
            baseChange.resizeToFit = false;
            baseChange.frameMaskDisabled = true;
            if (node.clipsContent !== undefined) {
                baseChange.frameMaskDisabled = !node.clipsContent;
            }

            // Auto Layout support
            if (node.layoutMode && node.layoutMode !== 'NONE') {
                baseChange.stackMode = node.layoutMode === 'VERTICAL' ? 'VERTICAL' : 'HORIZONTAL';
                baseChange.stackSpacing = node.itemSpacing || 0;

                // Individual padding
                if (node.paddingTop !== undefined || node.paddingBottom !== undefined ||
                    node.paddingLeft !== undefined || node.paddingRight !== undefined) {
                    baseChange.stackPaddingTop = node.paddingTop || 0;
                    baseChange.stackPaddingBottom = node.paddingBottom || 0;
                    baseChange.stackPaddingLeft = node.paddingLeft || 0;
                    baseChange.stackPaddingRight = node.paddingRight || 0;
                }

                // Alignment
                if (node.primaryAxisAlignItems) {
                    baseChange.stackPrimaryAlignItems = node.primaryAxisAlignItems;
                }
                if (node.counterAxisAlignItems) {
                    baseChange.stackCounterAlignItems = node.counterAxisAlignItems;
                }
            }

            // Corner radius (individual or uniform)
            if (node.topLeftRadius !== undefined || node.topRightRadius !== undefined ||
                node.bottomLeftRadius !== undefined || node.bottomRightRadius !== undefined) {
                baseChange.rectangleTopLeftCornerRadius = node.topLeftRadius || 0;
                baseChange.rectangleTopRightCornerRadius = node.topRightRadius || 0;
                baseChange.rectangleBottomLeftCornerRadius = node.bottomLeftRadius || 0;
                baseChange.rectangleBottomRightCornerRadius = node.bottomRightRadius || 0;
            } else if (node.cornerRadius) {
                baseChange.cornerRadius = node.cornerRadius;
            }
            break;

        case 'TEXT':
            baseChange.type = KiwiNodeType.TEXT;

            // TEXT MUST always have all font properties set
            const textFontSize = node.fontSize || 14;
            const textLineHeight = node.lineHeight
                ? (typeof node.lineHeight === 'number' ? node.lineHeight : node.lineHeight.value)
                : Math.round(textFontSize * 1.5);

            const chars = node.characters || '';
            baseChange.textData = {
                characters: chars,
                layoutVersion: 9 // Stitch sample uses version 9 in derivedTextData, but safe default here
            };

            if (!node.debugOmitCharacterStyleIDs) {
                baseChange.textData.characterStyleIDs = new Array(chars.length).fill(0);
            }

            if (!node.debugOmitLines) {
                // Generate lines structure (simple approximation: one line per newline or just one block)
                const textLines = chars.split('\n').map(() => ({
                    lineType: 'PLAIN',
                    styleId: 0,
                    indentationLevel: 0,
                    sourceDirectionality: 'AUTO',
                    listStartOffset: 0,
                    isFirstLineOfList: false
                }));
                if (textLines.length === 0) {
                    textLines.push({
                        lineType: 'PLAIN',
                        styleId: 0,
                        indentationLevel: 0,
                        sourceDirectionality: 'AUTO',
                        listStartOffset: 0,
                        isFirstLineOfList: false
                    });
                }
                baseChange.textData.lines = textLines;
            }

            // STRATEGY: Do NOT set textUserLayoutVersion.
            // This forces Figma to treat the text as "needs layout" and calculate baselines/bounds itself.
            if (node.textUserLayoutVersion !== undefined && node.textUserLayoutVersion !== -1) {
                baseChange.textUserLayoutVersion = node.textUserLayoutVersion;
            }
            // ELSE: Leave undefined.

            if (node.derivedTextData) {
                // Sanitize derivedTextData for Kiwi (specifically byte[] fields like fontDigest)
                // Kiwi requires Uint8Array for byte[], but Stitch dump might provide Object map.
                const derived = { ...node.derivedTextData };

                if (derived.fontMetaData && Array.isArray(derived.fontMetaData)) {
                    derived.fontMetaData = derived.fontMetaData.map((meta: any) => {
                        const newMeta = { ...meta };
                        if (newMeta.fontDigest && typeof newMeta.fontDigest === 'object' && !(newMeta.fontDigest instanceof Uint8Array)) {
                            const digestObj = newMeta.fontDigest;
                            const keys = Object.keys(digestObj);
                            const count = keys.length;
                            const arr = new Uint8Array(count);
                            for (let i = 0; i < count; i++) {
                                arr[i] = digestObj[i] || digestObj[i.toString()] || 0;
                            }
                            newMeta.fontDigest = arr;
                        }
                        // STITCH MATCH: postscript in fontMetaData is often empty string!
                        if (newMeta.key && !newMeta.key.postscript) {
                            newMeta.key.postscript = "";
                        }
                        return newMeta;
                    });
                }

                // STITCH MATCH: Ensure derivedLines matches simple Stitch default if missing
                if (!derived.derivedLines || derived.derivedLines.length === 0) {
                    derived.derivedLines = [{ directionality: 'LTR' }];
                }

                baseChange.derivedTextData = derived;
            }

            baseChange.fontVersion = node.fontVersion || '2';
            baseChange.textBidiVersion = node.textBidiVersion || 1;

            // REQUIRED: All font properties at node level
            baseChange.fontName = {
                family: node.fontName?.family || 'Inter',
                style: node.fontName?.style || 'Regular',
                postscript: node.fontName?.family && node.fontName?.style
                    ? `${node.fontName.family}-${node.fontName.style}`.replace(/\s+/g, '')
                    : 'Inter-Regular'
            };
            baseChange.fontSize = textFontSize;
            baseChange.fontWeight = node.fontWeight || 400;

            // Stitch uses units: PIXELS for everything
            baseChange.lineHeight = {
                value: textLineHeight,
                units: 'PIXELS'
            };
            baseChange.letterSpacing = {
                value: node.letterSpacing ?? 0,
                units: 'PIXELS'
            };

            // Text alignment (always set)
            baseChange.textAlignHorizontal = node.textAlignHorizontal || 'LEFT';
            baseChange.textAlignVertical = node.textAlignVertical || 'TOP';

            // Text auto resize - Stitch uses WIDTH_AND_HEIGHT (Auto Width).
            // We initially thought HEIGHT (Auto Height), but Stitch dump confirms WIDTH_AND_HEIGHT.
            // Requirement: Must provide valid textData.lines and layoutSize for this to work without 0-width collapse.
            baseChange.textAutoResize = node.textAutoResize || 'WIDTH_AND_HEIGHT';

            // STITCH MATCH: Add OpenType features found in Stitch data
            // This enables Discretionary Ligatures (dlig)
            baseChange.toggledOnOTFeatures = node.toggledOnOTFeatures || [];
            baseChange.toggledOffOTFeatures = node.toggledOffOTFeatures || [];
            baseChange.fontVariantCommonLigatures = true;
            baseChange.fontVariantContextualLigatures = true;
            baseChange.fontVariantDiscretionaryLigatures = true;
            baseChange.fontVariantHistoricalLigatures = false;
            baseChange.fontVariantOrdinal = false;
            baseChange.fontVariantSlashedZero = false;
            baseChange.fontVariantNumericFigure = 'NORMAL';
            baseChange.fontVariantNumericSpacing = 'NORMAL';
            baseChange.fontVariantNumericFraction = 'NORMAL';
            baseChange.fontVariantCaps = 'NORMAL';
            baseChange.fontVariantPosition = 'NORMAL';

            // Explicitly set autoRename
            baseChange.autoRename = true;

            // Ensure TEXT has a fill (default to White if not provided)
            if (!node.fills || node.fills.length === 0) {
                baseChange.fillPaints = [{
                    type: KiwiPaintType.SOLID,
                    color: { r: 1, g: 1, b: 1, a: 1 },
                    opacity: 1,
                    visible: true,
                    blendMode: 'NORMAL',
                    transform: { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 }
                }];
            }

            break;

        case 'RECTANGLE':
            baseChange.type = KiwiNodeType.RECTANGLE;
            if (node.topLeftRadius !== undefined || node.topRightRadius !== undefined ||
                node.bottomLeftRadius !== undefined || node.bottomRightRadius !== undefined) {
                baseChange.rectangleTopLeftCornerRadius = node.topLeftRadius || 0;
                baseChange.rectangleTopRightCornerRadius = node.topRightRadius || 0;
                baseChange.rectangleBottomLeftCornerRadius = node.bottomLeftRadius || 0;
                baseChange.rectangleBottomRightCornerRadius = node.bottomRightRadius || 0;
            } else if (node.cornerRadius) {
                baseChange.cornerRadius = node.cornerRadius;
            }
            break;

        case 'ELLIPSE':
            baseChange.type = KiwiNodeType.ELLIPSE;
            break;

        case 'GROUP':
            baseChange.type = KiwiNodeType.GROUP;
            break;

        default:
            baseChange.type = KiwiNodeType.FRAME;
    }

    // Fill paints - support SOLID, gradients, and images
    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
        baseChange.fillPaints = node.fills.map((fill: any) => {
            // Handle gradient fills - use Kiwi schema field names
            if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' ||
                fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND') {
                // Ensure minimum 2 gradient stops
                let inputStops = fill.gradientStops || fill.stops || [];
                if (inputStops.length < 2) {
                    inputStops = [
                        { position: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
                        { position: 1, color: { r: 1, g: 1, b: 1, a: 1 } }
                    ];
                }

                // Convert to Kiwi schema format: stops (not gradientStops)
                const stops = inputStops.map((stop: any) => ({
                    position: stop.position ?? 0,
                    color: {
                        r: stop.color?.r ?? 0,
                        g: stop.color?.g ?? 0,
                        b: stop.color?.b ?? 0,
                        a: stop.color?.a ?? 1
                    }
                }));

                // Transform matrix for gradient direction
                // Default: left to right gradient
                const transform = {
                    m00: 1, m01: 0, m02: 0,
                    m10: 0, m11: 1, m12: 0
                };

                return {
                    type: fill.type,
                    visible: fill.visible !== false,
                    opacity: fill.opacity ?? 1,
                    blendMode: 'NORMAL',
                    stops: stops,
                    transform: transform,
                    boundVariables: {}
                };
            }
            // Handle image fills
            if (fill.type === 'IMAGE' && fill.imageHash) {
                return {
                    type: 'IMAGE',
                    visible: fill.visible !== false,
                    opacity: fill.opacity ?? 1,
                    imageHash: fill.imageHash,
                    imageScaleMode: fill.scaleMode || 'FILL'
                };
            }
            // Default: SOLID fill - include blendMode and boundVariables for TEXT compatibility
            return {
                type: KiwiPaintType.SOLID,
                visible: fill.visible !== false,
                opacity: fill.opacity ?? 1,
                blendMode: 'NORMAL',
                color: {
                    r: fill.color?.r ?? 0.5,
                    g: fill.color?.g ?? 0.5,
                    b: fill.color?.b ?? 0.5,
                    a: 1
                },
                transform: {
                    m00: 1, m01: 0, m02: 0,
                    m10: 0, m11: 1, m12: 0
                },
                boundVariables: {}
            };
        });
    }


    // Stroke paints with enhanced properties
    if (node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
        baseChange.strokePaints = node.strokes.map(stroke => ({
            type: KiwiPaintType.SOLID,
            visible: stroke.visible !== false,
            opacity: stroke.opacity ?? 1,
            color: {
                r: stroke.color?.r ?? 0,
                g: stroke.color?.g ?? 0,
                b: stroke.color?.b ?? 0,
                a: 1
            }
        }));
        baseChange.strokeWeight = node.strokeWeight || 1;

        // Stroke alignment
        if (node.strokeAlign) {
            baseChange.strokeAlign = node.strokeAlign;
        }
        // Stroke caps and joins
        if (node.strokeCap) {
            baseChange.strokeCap = node.strokeCap;
        }
        if (node.strokeJoin) {
            baseChange.strokeJoin = node.strokeJoin;
        }
        // Dashed strokes
        if (node.dashPattern && node.dashPattern.length > 0) {
            baseChange.dashPattern = node.dashPattern;
        }
    }

    // Effects (shadows, blur)
    if (node.effects && Array.isArray(node.effects) && node.effects.length > 0) {
        baseChange.effects = node.effects.map(effect => {
            let effectType = KiwiEffectType.DROP_SHADOW; // Default fallback

            // Map string types to Integer Enum
            if (effect.type === 'DROP_SHADOW') effectType = KiwiEffectType.DROP_SHADOW;
            else if (effect.type === 'INNER_SHADOW') effectType = KiwiEffectType.INNER_SHADOW;
            else if (effect.type === 'BACKGROUND_BLUR') effectType = KiwiEffectType.BACKGROUND_BLUR;
            else if (effect.type === 'FOREGROUND_BLUR' || effect.type === 'LAYER_BLUR') effectType = KiwiEffectType.FOREGROUND_BLUR;

            const baseEffect: any = {
                type: effectType,
                visible: effect.visible !== false
            };

            if (effectType === KiwiEffectType.DROP_SHADOW || effectType === KiwiEffectType.INNER_SHADOW) {
                baseEffect.color = {
                    r: effect.color?.r ?? 0,
                    g: effect.color?.g ?? 0,
                    b: effect.color?.b ?? 0,
                    a: effect.color?.a ?? 0.25
                };
                baseEffect.offset = {
                    x: effect.offset?.x ?? 0,
                    y: effect.offset?.y ?? 4
                };
                baseEffect.radius = effect.radius ?? 4;
                if (effect.spread !== undefined) {
                    baseEffect.spread = effect.spread;
                }
            } else if (effectType === KiwiEffectType.BACKGROUND_BLUR || effectType === KiwiEffectType.FOREGROUND_BLUR) {
                baseEffect.radius = effect.radius ?? 10;
            }

            return baseEffect;
        });
    }

    // Corner smoothing (iOS-style corners)
    if (node.cornerSmoothing !== undefined) {
        baseChange.cornerSmoothing = node.cornerSmoothing;
    }

    return { change: baseChange, guid };
}

export function transformToNodeChanges(designRoot: AINode | AINode[], canvasLocalID: number = 1) {
    resetIdCounter();
    const changes: any[] = [];

    // CANVAS node's GUID (root nodes will reference this as parent)
    const canvasGuid = { sessionID: 0, localID: canvasLocalID };

    // Position characters for Figma layer ordering
    // '!' is first, then 'A', 'B', 'C', etc.
    function getPosition(index: number): string {
        if (index === 0) return '!';
        // Use incrementing positions: A, B, C, D, ...
        return String.fromCharCode(65 + index - 1); // 65 = 'A'
    }

    function processNode(node: AINode, parentGuid: { sessionID: number; localID: number } | null = null, siblingIndex: number = 0) {
        // Root nodes reference CANVAS; child nodes reference their parent
        const position = getPosition(siblingIndex);
        const parentIndex = parentGuid
            ? { guid: parentGuid, position }
            : { guid: canvasGuid, position: '!' };

        const { change, guid } = transformToNodeChange(node, parentIndex);
        changes.push(change);

        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child, index) => processNode(child, guid, index));
        }
    }

    const nodes = Array.isArray(designRoot) ? designRoot : [designRoot];
    nodes.forEach((node, index) => processNode(node, null, index));
    return changes;
}

// ============================================
// HTML Composition (GRIDA's FORMAT - CRITICAL!)
// ============================================

/**
 * Compose HTML string using Grida's EXACT format
 * Key difference: Single meta charset, all on one line
 */
function composeHTMLString(data: { meta: FigmaMeta; figma: Uint8Array }): string {
    const metaStr = btoa(JSON.stringify(data.meta) + '\n');
    const figStr = fromByteArray(data.figma);

    // EXACT format from Grida's working implementation
    return `<meta charset="utf-8" /><span data-metadata="${HTML_MARKERS.metaStart}${metaStr}${HTML_MARKERS.metaEnd}"></span><span data-buffer="${HTML_MARKERS.figmaStart}${figStr}${HTML_MARKERS.figmaEnd}"></span><span style="white-space: pre-wrap"></span>`;
}

// ============================================
// Core Write Function (GRIDA's APPROACH)
// ============================================

function writeFigFile(settings: { schema?: any; message: any; encodedMessage?: Uint8Array }): Uint8Array {
    const { schema = defaultSchema, message, encodedMessage } = settings;
    const compiledSchema = compileSchema(schema);
    const binSchema = encodeBinarySchema(schema);

    const writer = new FigmaArchiveWriter();

    // CRITICAL: Use fflate's deflateSync (same as Grida)
    writer.files = [
        deflateSync(binSchema),
        deflateSync(encodedMessage || (compiledSchema as any).encodeMessage(message))
    ];

    return writer.write();
}

// ============================================
// Main Export Function
// ============================================

// Helper to log to browser console and KiwiTest UI
function logDebug(msg: string) {
    console.log(msg)
    if (typeof window !== 'undefined' && (window as any).logToKiwiTest) {
        (window as any).logToKiwiTest(msg)
    }
}

export async function createFigmaClipboardHTML(aiDesign: AINode | AINode[]) {
    try {
        logDebug('🔄 Transforming AI design to Figma nodes...');
        const compiledSchema = compileSchema(defaultSchema);

        // Reset ID counter for fresh generation
        resetIdCounter();

        // Generate unique paste ID
        const pasteID = Math.floor(Math.random() * 2000000000);

        // DOCUMENT node (Root)
        const documentNode = {
            guid: { sessionID: 0, localID: 0 },
            phase: KiwiNodePhase.CREATED,
            type: KiwiNodeType.DOCUMENT,
            name: 'Document',
            visible: true,
            opacity: 1,
            blendMode: KiwiBlendMode.PASS_THROUGH,
            mask: false,
            maskType: 'ALPHA'
        };

        // CANVAS node (Page)
        // CRITICAL: Use numeric enum values!
        const canvasNode = {
            guid: { sessionID: 0, localID: 1 },
            phase: KiwiNodePhase.CREATED,
            parentIndex: {
                guid: { sessionID: 0, localID: 0 },
                position: '!'
            },
            type: KiwiNodeType.CANVAS,
            name: 'Stitch Design',
            visible: true,
            opacity: 1,
            blendMode: KiwiBlendMode.PASS_THROUGH,
            transform: { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 },
            backgroundEnabled: true,
            mask: false,
            maskIsOutline: false,
            backgroundOpacity: 1,
            backgroundColor: { r: 0.12, g: 0.12, b: 0.12, a: 1 },
            exportBackgroundDisabled: false
        };

        // Transform AI design to Figma node changes
        // Pass canvasLocalID = 1 so design nodes reference CANVAS correctly
        const designNodes = transformToNodeChanges(aiDesign, 1);

        logDebug(`📝 Transformed ${designNodes.length} design nodes`);

        // Build complete message with CANVAS first, then design nodes
        // CRITICAL: Use numeric enum values for type and pasteEditorType!
        const message: any = {
            type: KiwiMessageType.NODE_CHANGES,  // Must be 1, not 'NODE_CHANGES'
            sessionID: 0,
            ackID: 0,
            pasteID,
            pasteFileKey: 'IAMA_DUMMY_FILE_KEY_AMA',
            pasteIsPartiallyOutsideEnclosingFrame: false,
            pastePageId: { sessionID: 0, localID: 1 },
            isCut: false,
            pasteEditorType: KiwiEditorType.DESIGN,  // Must be 0, not 'DESIGN'
            blobBaseIndex: 0,
            nodeChanges: [documentNode, canvasNode, ...designNodes],
        };

        // Collect all debug blobs from the input AI design
        let allDebugBlobs: string[] = [];
        if (Array.isArray(aiDesign)) {
            aiDesign.forEach(node => {
                if (node.debugBlobs) {
                    allDebugBlobs = allDebugBlobs.concat(node.debugBlobs);
                }
            });
        } else if (aiDesign.debugBlobs) {
            allDebugBlobs = aiDesign.debugBlobs;
        }

        // Pre-process blobs for Manual Appending
        let blobsToAppend: Uint8Array[] = [];
        if (allDebugBlobs && allDebugBlobs.length > 0) {
            logDebug(`📦 Processing ${allDebugBlobs.length} debug blobs for MANUAL append...`);
            blobsToAppend = allDebugBlobs.map((b64, i) => {
                const cleanB64 = b64.replace(/\s/g, '');
                const byteArray = toByteArray(cleanB64);
                if (i === 0) {
                    logDebug('📦 Blob[0] Hex: ' + Array.from(byteArray).slice(0, 20).map(b => b.toString(16).padStart(2, '0')).join(' '));
                }
                return byteArray;
            });
            // Ensure message has NO blobs initially so Kiwi doesn't try to encode them
            message.blobs = [];
        } else {
            message.blobs = [];
        }

        logDebug(`📦 Total nodeChanges: ${message.nodeChanges.length}`);

        const meta: FigmaMeta = {
            fileKey: 'IAMA_DUMMY_FILE_KEY_AMA',
            pasteID: pasteID % 10000,
            dataType: 'scene'
        };

        logDebug('🔄 Encoding Kiwi Message (Base)...');
        // Encode message (blobs are empty)
        let encodedMessage = (compiledSchema as any).encodeMessage(message);
        logDebug(`📦 Encoded Base Size: ${encodedMessage.length}`);

        if (blobsToAppend.length > 0) {
            logDebug('📦 Appending Blobs Manually...');
            encodedMessage = appendBlobsManually(encodedMessage, blobsToAppend);
            logDebug(`📦 Final Encoded Size: ${encodedMessage.length}`);
        }

        console.log('🔄 Writing Figma Kiwi archive...');
        const figmaData = writeFigFile({ message, encodedMessage });
        console.log('✅ Archive created:', figmaData.length, 'bytes');

        const html = composeHTMLString({ meta, figma: figmaData });
        console.log('✅ HTML clipboard ready, length:', html.length);

        return { html, success: true };
    } catch (error: any) {
        console.error('❌ Encoding error:', error);
        return { html: null, success: false, error: error.message };
    }
}

// ============================================
// Decoder for Debugging
// ============================================

import { decodeBinarySchema } from 'kiwi-schema';
import { inflateSync, unzipSync } from 'fflate';
import { toByteArray } from 'base64-js';

export function decodeFigmaClipboard(base64Data: string) {
    try {
        console.log('🔍 Decoding Figma clipboard data...');
        const binary = toByteArray(base64Data);
        const compiledSchema = compileSchema(defaultSchema);

        // 1. Check if it's a ZIP (Standard .fig file or some exports)
        const zipSig = [0x50, 0x4b, 0x03, 0x04];
        let zipOffset = -1;

        for (let i = 0; i < binary.length - 4; i++) {
            if (binary[i] === zipSig[0] && binary[i + 1] === zipSig[1] && binary[i + 2] === zipSig[2] && binary[i + 3] === zipSig[3]) {
                zipOffset = i;
                break;
            }
        }

        if (zipOffset > -1) {
            console.log(`✅ ZIP found at offset ${zipOffset}`);
            const zipData = binary.slice(zipOffset);
            const unzipped = unzipSync(zipData);
            const figFileKey = Object.keys(unzipped).find(k => k.endsWith('.fig'));

            if (figFileKey) {
                const figData = unzipped[figFileKey];
                // Decode Message from .fig (Skip 'fig-kiwi' (8) + version (4) + schemaLen (4) + schema + msgLen (4))
                // This assumes standard fig structure inside zip
                let offset = 12;
                const view = new DataView(figData.buffer, figData.byteOffset, figData.byteLength);
                const schemaLen = view.getUint32(offset, true);
                offset += 4 + schemaLen;
                const msgLen = view.getUint32(offset, true);
                offset += 4;
                const msgData = figData.slice(offset, offset + msgLen);

                try {
                    const decoded = (compiledSchema as any).decodeMessage(msgData);
                    return { success: true, data: decoded };
                } catch (e: any) {
                    return { error: `Message decode failed: ${e.message}` };
                }
            }
        }

        // 2. Try Chunk Parsing (Stitch / Raw Format)
        // Header: fig-kiwi (8) + version (4)
        const prelude = new TextDecoder().decode(binary.slice(0, 8));
        if (prelude === 'fig-kiwi') {
            console.log('✅ Found fig-kiwi prelude');
            let offset = 8;
            const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);

            const version = view.getUint32(offset, true);
            offset += 4;

            // Chunk 1 (Schema)
            if (offset + 4 > binary.length) return { error: "Unexpected EOF" };
            const len1 = view.getUint32(offset, true);
            offset += 4;
            offset += len1; // Skip schema

            // Chunk 2 (Message)
            if (offset + 4 <= binary.length) {
                const len2 = view.getUint32(offset, true);
                offset += 4;
                const chunk2Ctx = binary.slice(offset, offset + len2);

                // Try Inflate first (most common)
                try {
                    const inflated = inflateSync(chunk2Ctx);
                    const decoded = (compiledSchema as any).decodeMessage(inflated);
                    return { success: true, data: decoded };
                } catch (e) {
                    // Try Raw
                    try {
                        const decoded = (compiledSchema as any).decodeMessage(chunk2Ctx);
                        return { success: true, data: decoded };
                    } catch (e2: any) {
                        return { error: `Chunk decode failed: ${e2.message}` };
                    }
                }
            }
        }

        return { error: "Unknown format or decoding failed" };

    } catch (error: any) {
        return { error: error.message };
    }
}

// Helpers for Manual Blob Appending
function appendBlobsManually(baseBuffer: Uint8Array, blobs: Uint8Array[]): Uint8Array {
    let totalSize = baseBuffer.length;
    // Calculate size
    for (const b of blobs) {
        // Inner Struct: Tag(0x0A) + Varint(Len) + Bytes
        const innerLen = 1 + varintSize(b.length) + b.length;

        // Outer Field: Tag(0x32) + Varint(InnerLen) + InnerStruct
        const wrapperLen = 1 + varintSize(innerLen) + innerLen;
        totalSize += wrapperLen;
    }

    const result = new Uint8Array(totalSize);
    result.set(baseBuffer);

    let offset = baseBuffer.length;
    for (const b of blobs) {
        // 1. Tag for Message.blobs (Field 6, WireType 2) = 0x32
        result[offset++] = 0x32;

        // 2. Length of the Blob struct
        const innerLen = 1 + varintSize(b.length) + b.length;
        offset = writeVarint(result, offset, innerLen);

        // 3. Tag for Blob.bytes (Field 1, WireType 2) = 0x0A
        // CRITICAL: This was missing! Figma saw empty blobs without this.
        result[offset++] = 0x0A;

        // 4. Length of the bytes
        offset = writeVarint(result, offset, b.length);

        // 5. The actual data
        result.set(b, offset);
        offset += b.length;
    }
    return result;
}

function varintSize(v: number) {
    let size = 0;
    let val = v;
    do {
        size++;
        val >>>= 7;
    } while (val > 0);
    return size;
}

function writeVarint(buf: Uint8Array, offset: number, v: number) {
    let val = v;
    while (val > 127) {
        buf[offset++] = (val & 127) | 128;
        val >>>= 7;
    }
    buf[offset++] = val & 127;
    return offset;
}

// Helper to repair common issues in raw NodeChanges (especially TEXT nodes)
function repairNodeChanges(nodes: any[]) {
    return nodes.map((node: any) => {
        // --- TEXT Node Repair (Type 14 in schema, or "TEXT" string if decoded) ---
        if (node.type === 'TEXT' || node.type === 14) {
            // 1. If derivedTextData is missing, we MUST NOT inject empty glyphs/lines.
            // Empty glyphs causes "invisible text" until re-edit.
            // CAUTION: Removing derivedTextData means we rely on Figma to layout.
            // To ensure it respects our width/height, we should switch to FIXED SIZE ('NONE').

            if (!node.derivedTextData) {
                // Force FIXED SIZE ('NONE').
                // This is the safest fallback when we don't have layout data.
                // It ensures the text box has the dimensions we calculated.
                node.textAutoResize = 'NONE';
            }

            // 2. Ensure layoutSize in textData matches node size (if missing)
            if (node.textData && !node.textData.layoutSize && node.size) {
                node.textData.layoutSize = node.size;
            }

            // 3. Ensure size exists
            if (!node.size) {
                // Try to guess from textData or default
                if (node.textData?.layoutSize) node.size = node.textData.layoutSize;
                else node.size = { x: 100, y: 20 };
            }
        }
        return node;
    });
}

export async function createFigmaClipboardHTMLFromNodeChanges(nodeChanges: any[]) {
    try {
        console.log('📦 Encoding raw NodeChanges:', nodeChanges.length, 'items');

        const compiledSchema = compileSchema(defaultSchema);

        // --- REPAIR STEP --- 
        // Automatically fix missing data that might cause Figma copy/paste issues
        const repairedNodes = repairNodeChanges(nodeChanges);

        // 1. Create the Message object directly
        const message = {
            type: KiwiMessageType.NODE_CHANGES,
            sessionID: 0,
            ackID: 0,
            nodeChanges: repairedNodes,
            blobs: [], // If user has blobs, we might need a way to pass them, but keeping it simple for now
            blobBaseIndex: 0,
            pasteID: Math.floor(Math.random() * 1000000000),
            pasteFileKey: 'IAMA_DUMMY_FILE_KEY_AMA',
            pasteIsPartiallyOutsideEnclosingFrame: false,
            pastePageId: { sessionID: 0, localID: 1 },
            isCut: false,
            pasteEditorType: KiwiEditorType.DESIGN
        };

        // 2. Encode Message
        const messageData = (compiledSchema as any).encodeMessage(message);
        const compressedMessage = deflateSync(messageData);

        // 3. Encode Schema
        const schemaData = encodeBinarySchema(defaultSchema);
        const compressedSchema = deflateSync(schemaData);

        // 4. Construct Binary
        // Header (8) + Version (4)
        // Schema Len (4) + Schema Bytes
        // Message Len (4) + Message Bytes
        const headerLen = 8 + 4;
        const schemaBlockLen = 4 + compressedSchema.length;
        const msgBlockLen = 4 + compressedMessage.length;

        const totalLen = headerLen + schemaBlockLen + msgBlockLen;
        const result = new Uint8Array(totalLen);
        const view = new DataView(result.buffer);
        let offset = 0;

        // Header
        result.set(new TextEncoder().encode(FIG_KIWI_PRELUDE), offset);
        offset += 8;
        view.setUint32(offset, FIG_KIWI_VERSION, true); // Little Endian
        offset += 4;

        // Schema Chunk
        view.setUint32(offset, compressedSchema.length, true);
        offset += 4;
        result.set(compressedSchema, offset);
        offset += compressedSchema.length;

        // Message Chunk
        view.setUint32(offset, compressedMessage.length, true);
        offset += 4;
        result.set(compressedMessage, offset);
        offset += compressedMessage.length;

        // 5. Convert to Base64
        const b64 = fromByteArray(result);

        // 6. Wrap in HTML
        const html = `
<meta charset="utf-8">
${HTML_MARKERS.metaStart}${b64}${HTML_MARKERS.metaEnd}
${HTML_MARKERS.figmaStart}${b64}${HTML_MARKERS.figmaEnd}
`;

        return { html, success: true };

    } catch (error: any) {
        console.error('❌ Encoding raw changes error:', error);
        return { html: null, success: false, error: error.message };
    }
}
