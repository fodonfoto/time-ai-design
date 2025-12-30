import { AINode, KiwiNodeType } from '../figma-encoder';
// We'll need some helper types from figma-encoder or define them here if not exported
// For now, assuming AINode is sufficient and we might need to cast or expand it.

// Helper to parse pixel values (e.g. "10px" -> 10)
function parsePx(value: string): number {
    if (!value) return 0;
    const float = parseFloat(value);
    return isNaN(float) ? 0 : float;
}

// Helper to convert RGB/RGBA string to Figma color {r, g, b, a}
// Uses a temporary DOM element to normalize any CSS color string (hsl, oklch, named) to rgb/rgba
function parseColor(colorStr: string) {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    try {
        // Create a temporary element to let the browser normalize the color
        const temp = document.createElement('div');
        temp.style.color = colorStr;
        temp.style.display = 'none'; // Ensure it doesn't affect layout
        document.body.appendChild(temp);
        const computedColor = window.getComputedStyle(temp).color;
        document.body.removeChild(temp);

        // Computed style is ALWAYS rgb(...) or rgba(...) in modern browsers
        const match = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            let r = parseInt(match[1]) / 255;
            let g = parseInt(match[2]) / 255;
            let b = parseInt(match[3]) / 255;
            let a = match[4] ? parseFloat(match[4]) : 1;
            return { r, g, b, a };
        }
    } catch (e) {
        console.error('Error parsing color:', colorStr, e);
    }

    return { r: 0, g: 0, b: 0, a: 0 };
}

export async function elementToFigma(element: HTMLElement, parentRect?: DOMRect): Promise<AINode | null> {
    if (!element) return null;

    // 1. Get Computed Style (The Source of Truth)
    const style = window.getComputedStyle(element);

    // Filter invisible elements
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        // Exception: If it has children that might be visible? Use caution.
        // For now, simple filter.
        return null;
    }

    const rect = element.getBoundingClientRect();
    const parentBounds = parentRect || rect;
    if (rect.width === 0 && rect.height === 0) {
        // Skip zero-size elements unless they have overflow?
        // return null; 
        // Actually, keep them as they might be logical wrappers.
    }

    // 2. Initial Node Skeleton
    const node: Partial<AINode> = {
        name: element.id || element.className.split(' ')[0] || element.tagName.toLowerCase(),
        visible: true,
        opacity: parseFloat(style.opacity),
        blendMode: 'PASS_THROUGH',
        // isMask: false, // Not in AINode type definition
    };

    // 3. Determine Node Type & Specific Logic
    // Valid children processing
    const childrenNodes: AINode[] = [];

    // Check if it's a text node context (leaf with text)
    const isText = element.childNodes.length === 1 &&
        element.childNodes[0].nodeType === Node.TEXT_NODE &&
        element.childNodes[0].textContent?.trim().length! > 0;

    if (isText) {
        // --- TEXT NODE MAPPING ---
        const textContent = element.childNodes[0].textContent!;

        node.type = 'TEXT' as any; // Using encoded STRING 'TEXT' directly if allowed or enum
        // Actually AINode.type expects KiwiNodeType enum values (which are strings 'TEXT', etc)

        // Font Props
        const fontWeightMap: { [key: string]: number } = {
            'normal': 400, 'bold': 700, '100': 100, '200': 200, '300': 300,
            '400': 400, '500': 500, '600': 600, '700': 700, '800': 800, '900': 900
        };
        const weight = fontWeightMap[style.fontWeight] || 400;

        // Determine style (Italic)
        const fontStyle = style.fontStyle === 'italic' ? 'Italic' : 'Regular';
        // Simple mapping: Roboto-Bold, Roboto-Regular. 
        // Real implementation needs robust font matching.
        let family = style.fontFamily.split(',')[0].replace(/['"]/g, '');

        // AUTO-MAP generic fonts to Roboto (requested by user)
        const genericFonts = ['sans-serif', 'system-ui', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Helvetica Neue', 'Arial'];
        if (genericFonts.some(f => family.toLowerCase().includes(f.toLowerCase())) || family === '') {
            family = 'Roboto';
        }

        // Construction fontName
        let figmaStyle = 'Regular';
        if (weight === 700) figmaStyle = 'Bold';
        if (weight === 500) figmaStyle = 'Medium';
        if (weight === 600) figmaStyle = 'SemiBold';
        if (style.fontStyle === 'italic') figmaStyle = (figmaStyle === 'Regular' ? 'Italic' : figmaStyle + ' Italic');

        node.fontName = {
            family: family,
            style: figmaStyle
        };
        node.fontSize = parseFloat(style.fontSize);
        node.characters = textContent;

        // Line Height
        if (style.lineHeight !== 'normal') {
            node.lineHeight = {
                value: parsePx(style.lineHeight),
                unit: 'PIXELS' // Mapped from 'units' in previous type
            };
        } else {
            node.lineHeight = { value: 100, unit: 'PERCENT' }; // or AUTO
        }

        // Color (Fills)
        const color = parseColor(style.color);
        node.fills = [{
            type: 'SOLID',
            visible: true,
            opacity: color.a,
            blendMode: 'NORMAL',
            color: { r: color.r, g: color.g, b: color.b }
        }];

        // Text Auto Resize - STITCH-LIKE LOGIC
        // Stitch uses 'HEIGHT' to let Figma calculate the bounding box based on width and font metrics.
        // We fundamentally do NOT want to set 'height' manually for text nodes.
        node.textAutoResize = 'WIDTH_AND_HEIGHT';
        // node.height = undefined; // Ensure we don't set this later from rect!

    } else {
        // --- FRAME / CONTAINER MAPPING ---
        node.type = 'FRAME' as any;

        // Auto Layout Logic
        const display = style.display;
        if (display === 'flex' || display === 'inline-flex') {
            node.layoutMode = style.flexDirection === 'row' ? 'HORIZONTAL' : 'VERTICAL';
            node.itemSpacing = parsePx(style.gap);

            // Map Alignments
            const justify = style.justifyContent;
            const align = style.alignItems;

            // Primary Axis (Justify)
            if (justify === 'center') node.primaryAxisAlignItems = 'CENTER';
            else if (justify === 'flex-end') node.primaryAxisAlignItems = 'MAX';
            else if (justify === 'space-between') node.primaryAxisAlignItems = 'SPACE_BETWEEN';
            else node.primaryAxisAlignItems = 'MIN'; // flex-start

            // Counter Axis (Align Items)
            if (align === 'center') node.counterAxisAlignItems = 'CENTER';
            else if (align === 'flex-end') node.counterAxisAlignItems = 'MAX';
            else node.counterAxisAlignItems = 'MIN'; // flex-start

            // Padding
            node.paddingLeft = parsePx(style.paddingLeft);
            node.paddingRight = parsePx(style.paddingRight);
            node.paddingTop = parsePx(style.paddingTop);
            node.paddingBottom = parsePx(style.paddingBottom);
        } else {
            // Block layout... pretend it's vertical auto layout? 
            // Or just a fixed frame. For "Code to Figma" usually Auto Layout is preferred.
            // Let's default to basic Frame without Auto Layout for normal Blocks, 
            // UNLESS it has children, then maybe VERTICAL is safer?
            // For now: NONE (Fixed frame)
        }

        // --- BACKGROUND & BORDERS ---

        // Background Color
        const bgColor = parseColor(style.backgroundColor);
        if (bgColor.a > 0) {
            node.fills = [{
                type: 'SOLID',
                visible: true,
                opacity: bgColor.a,
                blendMode: 'NORMAL',
                color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }
            }];
        } else {
            node.fills = [];
        }

        // Borders -> Strokes
        const borderW = parsePx(style.borderWidth);
        if (borderW > 0) {
            const borderColor = parseColor(style.borderColor);
            node.strokes = [{
                type: 'SOLID',
                visible: true,
                opacity: borderColor.a,
                blendMode: 'NORMAL',
                color: { r: borderColor.r, g: borderColor.g, b: borderColor.b }
            }];
            node.strokeWeight = borderW;
            node.strokeAlign = 'INSIDE'; // HTML borders are usually inside/part of box model
        }

        // Corner Radius
        const radius = parsePx(style.borderRadius);
        if (radius > 0) {
            node.cornerRadius = radius;
        }

        // 4. Recursion for Children
        // We need to iterate over DOM children
        const children = Array.from(element.children) as HTMLElement[];
        for (const child of children) {
            const childNode = await elementToFigma(child, rect);
            if (childNode) {
                childrenNodes.push(childNode as AINode);
            }
        }

        // If it's a Text Node Mixed (text + elements), this logic is too simple.
        // Assuming clean separation for now (like React).
    }

    // Set Children
    if (childrenNodes.length > 0) {
        node.children = childrenNodes;
    }

    // Size (Calculated from Bounding Box)
    // Important: For Auto Layout, Figma ignores Width/Height usually, but good to set it.
    node.width = rect.width;

    // STITCH COMPLIANCE: Do not set height for TEXT nodes!
    if (node.type !== 'TEXT') {
        node.height = rect.height;
    }

    // Position: relative to parent bounds
    node.x = rect.left - parentBounds.left;
    node.y = rect.top - parentBounds.top;

    return node as AINode;
}
