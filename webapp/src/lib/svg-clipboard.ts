/**
 * SVG Clipboard Export for Figma
 * 
 * Alternative approach to Kiwi binary encoding:
 * Converts DOM → SVG → Clipboard, which Figma can paste as vector graphics
 */

import { documentToSVG, elementToSVG, inlineResources } from 'dom-to-svg';

export interface SvgCopyResult {
    ok: boolean;
    mode: 'async-svg' | 'execCommand-svg' | 'failed';
    svgText?: string;
    error?: string;
}

/**
 * Simplify SVG to avoid mask groups in Figma
 * Removes clipPaths, masks, and other complex elements that Figma converts to mask groups
 */
function simplifySvgForFigma(svgText: string): string {
    console.log('🔧 Simplifying SVG for Figma...');

    let simplified = svgText;

    // Remove all clipPath definitions and references
    simplified = simplified.replace(/<clipPath[^>]*>[\s\S]*?<\/clipPath>/gi, '');
    simplified = simplified.replace(/clip-path="[^"]*"/gi, '');
    simplified = simplified.replace(/clip-path:[^;"]*/gi, '');

    // Remove mask definitions and references  
    simplified = simplified.replace(/<mask[^>]*>[\s\S]*?<\/mask>/gi, '');
    simplified = simplified.replace(/mask="[^"]*"/gi, '');
    simplified = simplified.replace(/mask:[^;"]*/gi, '');

    // Remove filter definitions (can cause issues)
    simplified = simplified.replace(/<filter[^>]*>[\s\S]*?<\/filter>/gi, '');
    simplified = simplified.replace(/filter="[^"]*"/gi, '');

    // Remove empty g elements
    simplified = simplified.replace(/<g[^>]*>\s*<\/g>/gi, '');

    // Remove use elements (can cause reference issues)
    simplified = simplified.replace(/<use[^>]*\/>/gi, '');
    simplified = simplified.replace(/<use[^>]*>[\s\S]*?<\/use>/gi, '');

    // Clean up empty style attributes
    simplified = simplified.replace(/style=""/gi, '');

    // Remove data- attributes
    simplified = simplified.replace(/data-[a-z-]+="[^"]*"/gi, '');

    console.log(`✅ SVG simplified: ${svgText.length} → ${simplified.length} chars`);

    return simplified;
}

/**
 * Generate FLAT SVG from DOM elements
 * Strategy: Flatten all elements to absolute positions, no groups, no nesting
 */
async function generateFlatSvgFromDom(container: HTMLElement, width: number, height: number): Promise<string> {
    const svgParts: string[] = [];

    // Header
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`);

    // Defs for gradients/fonts if needed (simplified for now)
    svgParts.push(`<defs><style>text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }</style></defs>`);

    // Get container rect for relative positioning
    const containerRect = container.getBoundingClientRect();

    // Strategy: Traverse all visible elements and render them as flat SVG primitives
    // We walk the tree to respect z-index/order, but output flat SVG

    const maxDepth = 20; // Prevent infinite recursion

    function traverse(element: Element, depth: number) {
        if (depth > maxDepth) return;

        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

        const rect = element.getBoundingClientRect();

        // Calculate relative position to container
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top;

        // Skip elements outside bounds or with 0 size
        if (rect.width === 0 || rect.height === 0) return;

        // 1. Render Background/Rectangle
        // Only if it has background color/image or border
        const hasBg = style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
        const hasBorder = style.borderWidth && parseFloat(style.borderWidth) > 0 && style.borderColor !== 'transparent';
        const hasShadow = style.boxShadow && style.boxShadow !== 'none';

        if (hasBg || hasBorder || hasShadow) {
            const rx = parseFloat(style.borderRadius) || 0;
            const fill = style.backgroundColor;
            const stroke = hasBorder ? `stroke="${style.borderColor}" stroke-width="${parseFloat(style.borderWidth)}"` : '';

            // Note: SVG doesn't support CSS box-shadow directly, simplified to just rect for now
            svgParts.push(`<rect x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" rx="${rx}" fill="${fill}" ${stroke} />`);
        }

        // 2. Render Text
        // Only if direct text content exists
        if (element.childNodes.length > 0) {
            let hasText = false;
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                    hasText = true;
                }
            });

            if (hasText) {
                // Approximate text position
                // SVG text baseline is different from DOM
                const fontSize = parseFloat(style.fontSize);
                const fontWeight = style.fontWeight;
                const color = style.color;
                const textAlign = style.textAlign;

                // Simple text extraction - getting just the text content
                // For perfect positioning, we might need range rects, but this is a "good enough" flat approximation
                const text = element.textContent?.trim();

                if (text) {
                    // Adjust Y for baseline (approximate)
                    const textY = y + (rect.height / 2) + (fontSize / 3);

                    // X adjustment based on alignment
                    let textX = x;
                    let anchor = 'start';

                    if (textAlign === 'center') {
                        textX = x + (rect.width / 2);
                        anchor = 'middle';
                    } else if (textAlign === 'right') {
                        textX = x + rect.width;
                        anchor = 'end';
                    } else {
                        textX = x + parseFloat(style.paddingLeft || '0');
                    }

                    // Escape special chars < > &
                    const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                    svgParts.push(`<text x="${textX}" y="${textY}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}" text-anchor="${anchor}">${escapedText}</text>`);
                }
            }
        }

        // 3. Render Images (REPLACED WITH PLACEHOLDER)
        if (element.tagName.toLowerCase() === 'img') {
            const rx = parseFloat(style.borderRadius) || 4; // Default slight radius

            // 3.1 Background Rect (Placeholder area)
            svgParts.push(`<rect x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" rx="${rx}" fill="#E1E1E1" stroke="#CCCCCC" stroke-width="1"/>`);

            // 3.2 Icon Circle (Center)
            const cx = x + (rect.width / 2);
            const cy = y + (rect.height / 2);
            const r = Math.min(rect.width, rect.height) * 0.15; // 15% size

            if (r > 5) { // Only draw if big enough
                svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" fill-opacity="0.8"/>`);

                // 3.3 Emoji
                // Determine emoji based on alt text or random? Let's use generic image emoji
                const emoji = '🖼️';
                const emojiSize = r * 1.2;
                svgParts.push(`<text x="${cx}" y="${cy + (emojiSize * 0.35)}" font-size="${emojiSize}" text-anchor="middle">${emoji}</text>`);
            }
        }

        // 4. Handle SVG icons (simplified)
        // If we encounter an SVG in DOM, we should ideally inline it. 
        // For flat mode, this is tricky. We might just skip complex inner SVGs or try to grab their path data if simple.
        if (element.tagName.toLowerCase() === 'svg') {
            // Basic support: grab the first path d if available and render it
            const path = element.querySelector('path');
            if (path) {
                // Try to render icon roughly
                // NOTE: Path coordinates are usually relative to viewBox, not absolute page
                // This is very hard to flatten correctly without parsing viewBox transforms.
                // BETTER: Render a placeholder for icons too? Or try to copy path if simple.
                // Let's use a small placeholder circle for icons to indicate position
                const cx = x + (rect.width / 2);
                const cy = y + (rect.height / 2);
                const r = Math.min(rect.width, rect.height) / 2;
                // svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${style.color || '#000'}" opacity="0.2"/>`);
            }
        }

        // Recurse
        Array.from(element.children).forEach(child => traverse(child, depth + 1));
    }

    // Start traversal
    traverse(container, 0);

    svgParts.push('</svg>');
    return svgParts.join('\n');
}

/**
 * Convert HTML string to SVG and copy to clipboard
 * Uses FLAT SVG strategy
 */
export async function copyHtmlAsSvg(htmlString: string, width = 390, height = 844): Promise<SvgCopyResult> {
    try {
        console.log('🔄 Creating temporary container for HTML...');

        // Create temporary container
        const container = document.createElement('div');
        container.innerHTML = htmlString;
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        container.style.overflow = 'visible'; // Important!

        document.body.appendChild(container);

        // Wait for styles/images
        await new Promise(resolve => setTimeout(resolve, 200)); // Slightly longer wait

        try {
            console.log('🔄 Generating FLAT SVG...');
            const svgText = await generateFlatSvgFromDom(container, width, height);

            console.log('✅ SVG generated:', svgText.length, 'characters');
            console.log('📋 SVG starts with:', svgText.substring(0, 200));

            // Copy logic (Keep existing robust logic)
            try {
                await navigator.clipboard.writeText(svgText);
                console.log('✅ Copied via writeText (FLAT SVG)');
                return { ok: true, mode: 'async-svg', svgText };
            } catch (err: any) {
                console.warn('writeText failed:', err);
            }

            // Fallback blob
            try {
                const blob = new Blob([svgText], { type: 'text/plain' });
                await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
                console.log('✅ Copied via text/plain blob');
                return { ok: true, mode: 'async-svg', svgText };
            } catch (err) { }

            // Legacy fallback
            const success = await copyWithExecCommand(svgText);
            if (success) {
                return { ok: true, mode: 'execCommand-svg', svgText };
            }

            return { ok: false, mode: 'failed' };

        } finally {
            document.body.removeChild(container);
        }

    } catch (error: any) {
        console.error('❌ HTML to SVG error:', error);
        return { ok: false, mode: 'failed', error: error.message };
    }
}


/**
 * Simple SVG copy - copies raw SVG string to clipboard
 */
export async function copySvgToClipboard(svgText: string): Promise<SvgCopyResult> {
    try {
        // Try Async Clipboard API first
        try {
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            const item = new ClipboardItem({ 'image/svg+xml': blob });
            await navigator.clipboard.write([item]);
            return { ok: true, mode: 'async-svg', svgText };
        } catch (asyncError) {
            console.warn('⚠️ Async SVG clipboard failed, using fallback...');
        }

        // Fallback
        const success = await copyWithExecCommand(svgText);
        if (success) {
            return { ok: true, mode: 'execCommand-svg', svgText };
        }

        return { ok: false, mode: 'failed', error: 'Clipboard write failed' };

    } catch (error: any) {
        return { ok: false, mode: 'failed', error: error.message };
    }
}

/**
 * Fallback copy method using textarea + execCommand
 */
function copyWithExecCommand(text: string): Promise<boolean> {
    return new Promise((resolve) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const success = document.execCommand('copy');
            resolve(success);
        } catch (e) {
            resolve(false);
        } finally {
            document.body.removeChild(textarea);
        }
    });
}
