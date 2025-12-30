import { elementToFigma } from './mapper';
import { createFigmaClipboardHTML } from '../figma-encoder';
// Import AINode if needed for typing result

export async function processDomSelection(element: HTMLElement): Promise<string> {
    if (!element) throw new Error("No element provided for conversion");

    // 1. Convert DOM Tree to Figma Node Tree (AINode)
    const aiNode = await elementToFigma(element);

    if (!aiNode) {
        throw new Error("Failed to convert element to Figma node");
    }

    // 2. Wrap in Array (Encoder expects array of nodes)
    const designNodes = [aiNode];

    // 3. Encode to Kiwi/HTML Clipboard Format
    // This function returns object { html: string, success: boolean }
    const result = await createFigmaClipboardHTML(designNodes);

    if (!result.success || !result.html) {
        throw new Error("Failed to encode Figma clipboard data: " + result.error);
    }

    return result.html;
}
