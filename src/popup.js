// popup.js
// Popup Logic
import { createFigmaClipboardHTML } from './kiwi-encoder.js';
document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const homeView = document.getElementById('homeView');
    const settingsView = document.getElementById('settingsView');
    const settingsBtn = document.getElementById('settingsBtn');
    const backBtn = document.getElementById('backBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const promptInput = document.getElementById('promptInput');
    const platformSelect = document.getElementById('platform');
    const generateBtn = document.getElementById('generateBtn');
    const outputArea = document.getElementById('outputArea');
    const outputContent = document.getElementById('outputContent');
    const copyBtn = document.getElementById('copyBtn');
    const settingsStatus = document.getElementById('settingsStatus');
    const statusEl = document.getElementById('status');

    // State
    let OPENROUTER_API_KEY = '';

    // Load Settings
    chrome.storage.local.get(['openrouter_api_key'], (result) => {
        if (result.openrouter_api_key) {
            OPENROUTER_API_KEY = result.openrouter_api_key;
            if (apiKeyInput) apiKeyInput.value = OPENROUTER_API_KEY;
        }
    });

    // Navigation
    if (settingsBtn) {
        console.log("Settings button found");
        settingsBtn.addEventListener('click', () => {
            console.log("Settings button clicked");
            homeView.classList.add('hidden');
            settingsView.classList.remove('hidden');
        });
    } else {
        console.error("Settings button NOT found");
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            settingsView.classList.add('hidden');
            homeView.classList.remove('hidden');
            if (settingsStatus) settingsStatus.textContent = '';
        });
    }

    // Save API Key
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            if (key.startsWith('sk-or-')) {
                chrome.storage.local.set({ openrouter_api_key: key }, () => {
                    OPENROUTER_API_KEY = key;
                    if (settingsStatus) {
                        settingsStatus.textContent = 'API Key Verified & Saved! ✅';
                        settingsStatus.classList.add('status-success');
                        settingsStatus.style.display = 'block';
                    }
                    setTimeout(() => {
                        settingsView.classList.add('hidden');
                        homeView.classList.remove('hidden');
                        if (settingsStatus) settingsStatus.textContent = '';
                    }, 1000);
                });
            } else {
                if (settingsStatus) {
                    settingsStatus.textContent = 'Invalid API Key (must start with sk-or-)';
                    settingsStatus.classList.add('status-error');
                    settingsStatus.style.display = 'block';
                }
            }
        });
    }

    // Generate Logic Setup
    const platformValue = document.getElementById('platformValue');
    if (platformSelect && platformValue) {
        platformSelect.addEventListener('change', () => {
            const temp = platformSelect.options[platformSelect.selectedIndex].text;
            platformValue.textContent = temp;
        });
    }

    if (promptInput && generateBtn) {
        promptInput.addEventListener('input', () => {
            const hasText = promptInput.value.trim().length > 0;
            generateBtn.disabled = !hasText;
            generateBtn.classList.toggle('btn-primary', hasText);
            generateBtn.classList.toggle('btn-secondary', !hasText);
        });
    }

    // Main Generate Action
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const prompt = promptInput.value.trim();
            const platform = platformSelect.value;

            if (!OPENROUTER_API_KEY) {
                showStatus('Please set API Key first', 'error');
                homeView.classList.add('hidden');
                settingsView.classList.remove('hidden');
                return;
            }

            if (!prompt) {
                showStatus('Please enter a design description', 'error');
                return;
            }

            generateBtn.disabled = true;
            generateBtn.innerHTML = `Generating...`;

            if (outputArea) {
                outputArea.style.display = 'block';
                outputContent.innerHTML = '<div style="text-align:center; padding: 20px; color: #666;">Generating UI...</div>';
            }

            try {
                // 1. Generate JSON from AI
                const designJSON = await generateDesignJSON(prompt, platform);

                // 2. Render Preview (SVG)
                const svgContent = jsonToSVG(designJSON);
                outputContent.innerHTML = svgContent;
                outputArea.style.display = 'block';

                // -- Preview Scaling Fix --
                setTimeout(() => {
                    const previewBox = outputArea.querySelector('.preview-box');
                    if (previewBox) {
                        const containerW = previewBox.clientWidth - 32;
                        const svg = outputContent.querySelector('svg');
                        if (svg) {
                            const designW = parseFloat(svg.getAttribute('width')) || 375;
                            const scale = Math.min(1, containerW / designW);

                            outputContent.style.width = `${designW}px`;
                            outputContent.style.transform = `scale(${scale})`;
                            outputContent.style.transformOrigin = 'top center';
                        }
                    }
                }, 0);

                // 3. Handle Copy - Native Figma Paste (with JSON fallback)
                // Uses template-based approach for native paste
                // Falls back to Seek/Stitch JSON if templates not captured
                if (copyBtn) {
                    copyBtn.onclick = async () => {
                        const originalText = copyBtn.textContent;
                        try {
                            copyBtn.textContent = 'Copying... ⏳';
                            copyBtn.disabled = true;

                            let success = false;
                            let errorMessage = '';

                            // Try Phase 2: Full Kiwi Encoding first
                            const kiwiResult = await tryKiwiEncoding(designJSON);

                            if (kiwiResult.success) {
                                // Kiwi encoding worked!
                                success = true;
                                console.log('✅ Phase 2: Kiwi encoding successful!');
                            } else {
                                console.warn('Kiwi encoding failed, trying template...');

                                // Fallback: Get templates from chrome.storage.local
                                const templates = await getTemplatesFromStorage();
                                const hasTemplates = templates && Object.keys(templates).length > 0;

                                if (hasTemplates && templates['FRAME']) {
                                    // Use native Figma paste with template
                                    const result = await copyNativeFigma(designJSON, templates);
                                    if (result.success) {
                                        success = true;
                                        console.log('✅ Template-based native Figma paste ready!');
                                    } else {
                                        errorMessage = result.message || 'Template paste failed';
                                    }
                                } else {
                                    errorMessage = 'No templates found. Please capture templates first.';
                                }
                            }

                            // Result handling - Native paste only, no JSON fallback
                            if (success) {
                                copyBtn.textContent = 'Copied to Figma! ✨';
                                copyBtn.style.background = '#10b981';
                                console.log('📌 Just press Cmd+V in Figma');
                                setTimeout(() => {
                                    copyBtn.textContent = originalText;
                                    copyBtn.style.background = '';
                                    copyBtn.disabled = false;
                                }, 2000);
                            } else {
                                // Error - show retry option
                                copyBtn.textContent = '❌ Failed - Tap to Retry';
                                copyBtn.style.background = '#ef4444';
                                console.error('Copy failed:', errorMessage);
                                alert(`Copy to Figma failed!\n\n${errorMessage}\n\nPlease try again or capture templates using schema-capture-v2.html`);
                                setTimeout(() => {
                                    copyBtn.textContent = originalText;
                                    copyBtn.style.background = '';
                                    copyBtn.disabled = false;
                                }, 3000);
                            }

                        } catch (err) {
                            console.error('Copy error:', err);
                            copyBtn.textContent = '❌ Error - Tap to Retry';
                            copyBtn.style.background = '#ef4444';
                            alert(`Copy to Figma error!\n\n${err.message}\n\nPlease try again.`);
                            setTimeout(() => {
                                copyBtn.textContent = copyBtn.dataset.originalText || 'Copy to Figma';
                                copyBtn.style.background = '';
                                copyBtn.disabled = false;
                            }, 3000);
                        }
                    };
                }

                showStatus('', '');
            } catch (error) {
                console.error(error);
                if (outputContent) outputContent.innerHTML = `<div style="color:red; padding:10px;">Error: ${error.message}</div>`;
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Design';
            }
        });
    }

    function showStatus(msg, type) {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.className = '';
        if (type === 'error') statusEl.classList.add('status-error');
        statusEl.style.display = msg ? 'block' : 'none';
    }

    async function generateDesignJSON(prompt, platform) {
        // OPTIMIZED PROMPT: Minimal, focused, generates compact JSON
        const systemPrompt = `You are an expert UI designer. Generate a Figma-compatible JSON design.

RULES (MUST FOLLOW):
- Output: JSON ARRAY only, no markdown
- Types: FRAME, TEXT, RECTANGLE, ELLIPSE only (NO VECTOR/SVG)
- Colors: RGB 0-1 scale (e.g., 0.95 not 255)
- Keep it SIMPLE: Max 3 nesting levels, max 10 children per frame
- OMIT these fields: strokes, effects, corners, strokeWeight, strokeAlign, lineHeight, vectorPaths

REQUIRED FIELDS PER NODE:
- name, type, width, height
- fills: [{ type:"SOLID", color:{r,g,b}, opacity:1 }]
- For FRAME: layoutMode, itemSpacing, paddingTop/Bottom/Left/Right, children
- For TEXT: characters, fontSize, fontName:{family,style}

EXAMPLE:
[{"name":"App","type":"FRAME","width":375,"height":812,"layoutMode":"VERTICAL","itemSpacing":16,"paddingTop":40,"paddingBottom":20,"paddingLeft":20,"paddingRight":20,"fills":[{"type":"SOLID","color":{"r":0.98,"g":0.98,"b":1},"opacity":1}],"children":[{"name":"Title","type":"TEXT","characters":"Hello","fontSize":24,"fontName":{"family":"Inter","style":"Bold"},"fills":[{"type":"SOLID","color":{"r":0.1,"g":0.1,"b":0.1},"opacity":1}]}]}]

Generate a clean, modern ${platform} UI. Be concise.`;

        const width = platform === 'desktop' ? 1440 : 375;
        const height = platform === 'desktop' ? 900 : 812;
        const userPrompt = `Design a ${platform} screen (${width}x${height}) for: "${prompt}". Keep it minimal with max 8-10 elements total.`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "model": "google/gemini-2.5-flash",
                    "max_tokens": 8192,
                    "temperature": 0.7,
                    "response_format": { "type": "json_object" },
                    "messages": [
                        { "role": "system", "content": systemPrompt },
                        { "role": "user", "content": userPrompt }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} `);
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            // Debug Logging
            console.log("Raw AI Response:", content);

            // 1. Remove Markdown Code Blocks (Robust)
            const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
            const match = jsonRegex.exec(content);
            if (match && match[1]) {
                content = match[1].trim();
            } else {
                // Fallback: If no code blocks, look for raw JSON structure
                content = content.replace(/```/g, '').trim();
            }

            // 2. Find JSON Array/Object (Scanning for first [ or { and last ] or })
            const firstOpen = content.search(/[\[\{]/);
            let lastClose = -1;

            // Scan from end to find the valid closing bracket matching the type
            if (firstOpen !== -1) {
                const openChar = content[firstOpen];
                const closeChar = openChar === '[' ? ']' : '}';
                lastClose = content.lastIndexOf(closeChar);
            }

            if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                content = content.substring(firstOpen, lastClose + 1);
            } else {
                // If rigorous extraction fails, try parsing the whole thing (maybe it was clean)
                console.warn("Could not find distinct JSON brackets, attempting raw parse");
            }

            let designJSON;
            try {
                designJSON = JSON.parse(content);
            } catch (e) {
                console.warn("Initial JSON Parse failed, attempting sanitization...", e.message);
                try {
                    // LLMs often output unescaped newlines inside strings (e.g. "text": "Line 1\nLine 2"), which breaks JSON.parse.
                    // We must custom parse/escape ONLY the newlines that are inside quotes.
                    const sanitized = sanitizeJSON(content);
                    designJSON = JSON.parse(sanitized);
                } catch (e2) {
                    console.error("JSON Parse Error. Content:", content);
                    throw new Error(`Failed to parse AI response: ${e2.message}. The AI generated invalid JSON.`);
                }
            }

            if (Array.isArray(designJSON) && designJSON.length === 1) designJSON = designJSON[0];

            return designJSON;
        } catch (error) {
            console.error("Design Generation Error:", error);
            throw error;
        }
    }

    /**
     * Copy design to Figma using native clipboard format
     * Uses captured templates for native paste
     * @param {object} designJSON - AI generated design
     * @param {object} templates - Captured Figma templates from localStorage
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async function copyNativeFigma(designJSON, templates) {
        try {
            // Get the FRAME template
            const frameTemplate = templates['FRAME'];
            if (!frameTemplate || !frameTemplate.buffer) {
                return { success: false, message: 'No FRAME template found' };
            }

            // Decode the stored base64 buffer
            const bufferB64 = frameTemplate.buffer;
            const meta = frameTemplate.meta;

            // Create new meta with unique pasteID
            const newMeta = {
                fileKey: meta.fileKey || 'generated',
                pasteID: Date.now(),
                dataType: 'scene'
            };

            // Compose the Figma HTML clipboard format
            const metaJSON = JSON.stringify(newMeta) + '\n';
            const metaB64 = btoa(unescape(encodeURIComponent(metaJSON)));

            const html = `<meta charset="utf-8" /><span
  data-metadata="<!--(figmeta)${metaB64}(/figmeta)-->"
></span
><span
  data-buffer="<!--(figma)${bufferB64}(/figma)-->"
></span
><span style="white-space: pre-wrap"></span>`;

            // Also prepare fallback JSON
            const fallbackJSON = JSON.stringify(transformToSeekFormat(designJSON), null, 2);

            // Copy to clipboard with both formats
            const htmlBlob = new Blob([html], { type: 'text/html' });
            const textBlob = new Blob([fallbackJSON], { type: 'text/plain' });

            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]);

            return { success: true };
        } catch (error) {
            console.error('Native Figma copy error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Try Phase 2: Full Kiwi Encoding
     * Uses kiwi-encoder.js to create Figma clipboard from AI JSON
     * @param {object} designJSON - AI generated design
     * @returns {Promise<{success: boolean}>}
     */
    async function tryKiwiEncoding(designJSON) {
        try {
            // Use static imported createFigmaClipboardHTML (from kiwi-encoder.js)

            // Create Figma clipboard HTML
            const result = createFigmaClipboardHTML(designJSON);

            if (!result.success) {
                console.warn('Kiwi encoding failed:', result.error);
                return { success: false };
            }

            // Also prepare fallback JSON
            const fallbackJSON = JSON.stringify(transformToSeekFormat(designJSON), null, 2);

            // Copy to clipboard with both formats
            const htmlBlob = new Blob([result.html], { type: 'text/html' });
            const textBlob = new Blob([fallbackJSON], { type: 'text/plain' });

            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]);

            console.log('✅ Kiwi encoding complete');
            return { success: true };
        } catch (error) {
            console.warn('Kiwi encoding error (falling back):', error.message);
            return { success: false };
        }
    }

    /**
     * Get templates from chrome.storage.local
     * @returns {Promise<object>} Templates object
     */
    async function getTemplatesFromStorage() {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['figma_templates'], (result) => {
                    resolve(result.figma_templates || {});
                });
            } else {
                // Fallback to localStorage for development
                const data = localStorage.getItem('figma_templates');
                resolve(data ? JSON.parse(data) : {});
            }
        });
    }

    /**
     * Save templates to chrome.storage.local
     * @param {object} templates Templates object
     * @returns {Promise<void>}
     */
    async function saveTemplatesToStorage(templates) {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ figma_templates: templates }, resolve);
            } else {
                localStorage.setItem('figma_templates', JSON.stringify(templates));
                resolve();
            }
        });
    }

    /**
     * Import templates from JSON string (used by import feature)
     * @param {string} jsonString JSON string of templates
     * @returns {Promise<{success: boolean, count: number}>}
     */
    async function importTemplatesFromJSON(jsonString) {
        try {
            const templates = JSON.parse(jsonString);
            await saveTemplatesToStorage(templates);
            const count = Object.keys(templates).length;
            console.log(`✅ Imported ${count} templates`);
            return { success: true, count };
        } catch (error) {
            console.error('Import error:', error);
            return { success: false, count: 0 };
        }
    }

    // Expose import function globally for settings panel
    window.importFigmaTemplates = importTemplatesFromJSON;
    window.getTemplatesFromStorage = getTemplatesFromStorage;
});

function sanitizeJSON(str) {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (inString) {
            if (char === '\\') {
                escaped = !escaped; // Toggle escaped state for double backslashes
                result += char;
            } else if (char === '"' && !escaped) {
                inString = false;
                result += char;
            } else if (char === '\n' || char === '\r') {
                // Escape newline inside string
                result += '\\n';
                escaped = false; // Reset escape state after newline substitution
            } else if (char === '\t') {
                result += '\\t';
                escaped = false;
            } else {
                result += char;
                escaped = false;
            }
        } else {
            // Outside string
            if (char === '"') {
                inString = true;
            }
            result += char;
        }
    }
    return result;
}

// Helper Functions
function jsonToSVG(nodeOrNodes) {
    const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];
    let totalW = 0, totalH = 0;
    nodes.forEach(n => {
        const w = n.width || 0;
        const h = n.height || 0;
        const x = n.x || 0;
        const y = n.y || 0;
        totalW = Math.max(totalW, x + w);
        totalH = Math.max(totalH, y + h);
    });
    totalW = totalW || 375;
    totalH = totalH || 812;

    const defs = [];
    let svgBody = '';
    nodes.forEach(node => {
        svgBody += renderFigmaNode(node, defs);
    });
    const defsHTML = defs.length > 0 ? `<defs>${defs.join('')}</defs>` : '';
    return `<svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;700&display=swap');</style>
            ${defsHTML}
            ${svgBody}
        </svg>`;
}

function renderFigmaNode(node, defs) {
    if (!node) return '';
    const { type, name, x = 0, y = 0, width: w = 0, height: h = 0, fills, strokes, children, characters } = node;

    const parseColor = (c, alpha = 1) => {
        if (!c) return 'transparent';
        if (typeof c === 'object' && 'r' in c) {
            return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
        }
        if (typeof c === 'string') return c;
        return 'transparent';
    };

    const getFill = (fillList) => {
        if (!fillList || !Array.isArray(fillList) || !fillList[0]) return 'transparent';
        const f = fillList[0];
        if (f.visible === false) return 'transparent';
        if (f.type === 'SOLID') return parseColor(f.color, f.opacity ?? 1);
        if (f.type === 'GRADIENT_LINEAR') {
            const gradId = `g_${Math.random().toString(36).substr(2, 9)}`;
            const stops = (f.gradientStops || []).map(s =>
                `<stop offset="${s.position}" stop-color="${parseColor(s.color, s.color.a ?? 1)}"/>`
            ).join('');
            defs.push(`<linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">${stops}</linearGradient>`);
            return `url(#${gradId})`;
        }
        return 'transparent';
    };

    const bg = getFill(fills);
    let strokeColor = 'none';
    let strokeWidth = 0;
    if (strokes && strokes.length > 0 && strokes[0].type === 'SOLID') {
        strokeColor = parseColor(strokes[0].color, strokes[0].opacity ?? 1);
        strokeWidth = strokes[0].weight || node.strokeWeight || 1;
    }

    const radius = node.cornerRadius || 0;
    const transform = `translate(${x}, ${y})`;
    const safeName = (name || 'node').replace(/[^\w\s-]/g, '');
    const commonAttrs = `data-name="${safeName}" transform="${transform}"`;

    if (type === 'TEXT') {
        const fontSize = node.fontSize || 16;
        const fontFamily = node.fontName?.family || 'Inter';
        const fontWeight = (node.fontName?.style || 'Regular').includes('Bold') ? 700 : 400;
        const align = node.textAlignHorizontal || 'LEFT';
        let anchor = 'start';
        let txtX = 0;
        if (align === 'CENTER') { anchor = 'middle'; txtX = w / 2; }
        if (align === 'RIGHT') { anchor = 'end'; txtX = w; }
        const txtColor = fills ? getFill(fills) : '#000000';

        return `<g ${commonAttrs}><text x="${txtX}" y="0" fill="${txtColor}" font-family="${fontFamily}, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${anchor}" dominant-baseline="hanging">${characters || ''}</text></g>`;
    }

    if (type === 'ELLIPSE') {
        return `<g ${commonAttrs}><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${bg}" stroke="${strokeColor}" stroke-width="${strokeWidth}" /></g>`;
    }

    let box = '';
    if (bg !== 'transparent' || strokeColor !== 'none') {
        box = `<rect width="${w}" height="${h}" rx="${radius}" fill="${bg}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    }

    let childSVG = '';
    if (children && Array.isArray(children)) {
        children.forEach(c => { childSVG += renderFigmaNode(c, defs); });
    }

    return `<g ${commonAttrs}>${box}${childSVG}</g>`;
}

function jsonToHTML(nodeOrNodes) {
    const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];
    // Wrap in a root container to ensure Figma creates a Frame
    return `<div style="display: flex; flex-direction: column; width: fit-content; height: fit-content;">${nodes.map(renderHTMLNode).join('')}</div>`;
}

function renderHTMLNode(node) {
    if (!node) return '';
    const { type, name, width: w, height: h, fills, strokes, children, characters, layoutMode, itemSpacing, paddingLeft, paddingRight, paddingTop, paddingBottom, primaryAxisAlignItems, counterAxisAlignItems, tailwind } = node;

    const parseColor = (c, alpha = 1) => {
        if (!c) return 'transparent';
        if (typeof c === 'object' && 'r' in c) {
            return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
        }
        return 'transparent';
    };

    const getFill = (fillList) => {
        if (!fillList || !Array.isArray(fillList) || !fillList[0]) return 'transparent';
        const f = fillList[0];
        if (f.visible === false) return 'transparent';
        if (f.type === 'SOLID') return parseColor(f.color, f.opacity ?? 1);
        return 'transparent';
    };

    const styleMap = {
        'box-sizing': 'border-box',
        'position': 'relative',
        'display': 'flex',        // Default to flex for Figma compatibility
        'flex-direction': 'column', // Default to column
    };

    if (w) styleMap['width'] = `${w}px`;
    if (h) styleMap['height'] = `${h}px`;

    const bg = getFill(fills);
    if (bg !== 'transparent') styleMap['background-color'] = bg;

    if (node.cornerRadius) styleMap['border-radius'] = `${node.cornerRadius}px`;

    if (strokes && strokes[0] && strokes[0].visible !== false) {
        const sColor = parseColor(strokes[0].color, strokes[0].opacity ?? 1);
        const sWidth = strokes[0].weight || 1;
        styleMap['border'] = `${sWidth}px solid ${sColor}`;
    }

    if (layoutMode === 'HORIZONTAL') {
        styleMap['flex-direction'] = 'row';
    } else if (layoutMode === 'VERTICAL') {
        styleMap['flex-direction'] = 'column';
    }

    if (itemSpacing) styleMap['gap'] = `${itemSpacing}px`;
    if (paddingTop) styleMap['padding-top'] = `${paddingTop}px`;
    if (paddingBottom) styleMap['padding-bottom'] = `${paddingBottom}px`;
    if (paddingLeft) styleMap['padding-left'] = `${paddingLeft}px`;
    if (paddingRight) styleMap['padding-right'] = `${paddingRight}px`;

    if (layoutMode !== 'NONE') {
        let justify = 'flex-start';
        if (primaryAxisAlignItems === 'MAX') justify = 'flex-end';
        if (primaryAxisAlignItems === 'CENTER') justify = 'center';
        if (primaryAxisAlignItems === 'SPACE_BETWEEN') justify = 'space-between';
        styleMap['justify-content'] = justify;

        let align = 'flex-start';
        if (counterAxisAlignItems === 'MAX') align = 'flex-end';
        if (counterAxisAlignItems === 'CENTER') align = 'center';
        styleMap['align-items'] = align;
    }

    const attrs = [`data-name="${name || type}"`];
    const styleString = Object.entries(styleMap).map(([k, v]) => `${k}:${v}`).join(';');

    if (type === 'TEXT') {
        const fontSize = node.fontSize || 16;
        const fontFamily = node.fontName?.family || 'Inter';
        const fontWeight = (node.fontName?.style || 'Regular').includes('Bold') ? 700 : 400;
        const color = getFill(fills);

        // Wrap text in a block element with styles
        return `<div style="font-family: '${fontFamily}', sans-serif; font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; white-space: pre-wrap; ${styleString}" ${attrs.join(' ')}>${characters}</div>`;
    }

    let childrenHTML = '';
    if (children && Array.isArray(children)) {
        childrenHTML = children.map(c => renderHTMLNode(c)).join('');
    }

    return `<div style="${styleString}" ${attrs.join(' ')}>${childrenHTML}</div>`;
}

// ============================================
// Seek/Stitch Plugin Format Functions
// ============================================

/**
 * Transform AI-generated JSON to Seek/Stitch plugin compatible format
 * Matches the exact structure from seek-design-example/mobile.json
 */
function transformToSeekFormat(aiJSON) {
    if (!aiJSON) return [];

    // Handle array or single object input
    const nodes = Array.isArray(aiJSON) ? aiJSON : [aiJSON];

    // Transform each node recursively
    return nodes.map(node => transformNodeToSeekFormat(node));
}

/**
 * Recursively transform a node to Seek-compatible format
 */
function transformNodeToSeekFormat(node) {
    if (!node) return null;

    const seekNode = {
        name: node.name || "Layer",
        type: node.type || "FRAME",
        x: node.x || 0,
        y: node.y || 0,
        width: node.width || 100,
        height: node.height || 100
    };

    // Transform fills to Seek format (with visible, opacity, blendMode, boundVariables)
    if (node.fills && Array.isArray(node.fills)) {
        seekNode.fills = node.fills.map(fill => ({
            type: fill.type || "SOLID",
            visible: true,
            opacity: fill.opacity ?? 1,
            blendMode: "NORMAL",
            color: {
                r: fill.color?.r ?? 1,
                g: fill.color?.g ?? 1,
                b: fill.color?.b ?? 1
            },
            boundVariables: {}
        }));
    }

    // Add strokes if present (empty array is fine)
    seekNode.strokes = node.strokes || [];

    // Auto Layout properties
    if (node.layoutMode) {
        seekNode.layoutMode = node.layoutMode;
        seekNode.primaryAxisSizingMode = node.primaryAxisSizingMode || "AUTO";
        seekNode.counterAxisSizingMode = node.counterAxisSizingMode || "FIXED";
        seekNode.primaryAxisAlignItems = node.primaryAxisAlignItems || "MIN";
        seekNode.counterAxisAlignItems = node.counterAxisAlignItems || "MIN";
        seekNode.itemSpacing = node.itemSpacing || 0;
        seekNode.paddingTop = node.paddingTop || 0;
        seekNode.paddingRight = node.paddingRight || 0;
        seekNode.paddingBottom = node.paddingBottom || 0;
        seekNode.paddingLeft = node.paddingLeft || 0;
    }

    // Corner radius
    if (node.cornerRadius) {
        seekNode.cornerRadius = node.cornerRadius;
    }

    // Text properties
    if (node.type === "TEXT") {
        seekNode.characters = node.characters || "";
        seekNode.fontSize = node.fontSize || 14;
        seekNode.fontName = {
            family: node.fontName?.family || "Inter",
            style: node.fontName?.style || "Regular"
        };
        seekNode.textAlignHorizontal = node.textAlignHorizontal || "LEFT";
        seekNode.textAlignVertical = node.textAlignVertical || "TOP";
        seekNode.lineHeight = node.lineHeight || { unit: "AUTO" };
    }

    // Tailwind mapping (generate based on properties)
    seekNode.tailwind = generateTailwindClasses(seekNode);

    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
        seekNode.children = node.children
            .map(child => transformNodeToSeekFormat(child))
            .filter(child => child !== null);
    }

    return seekNode;
}

/**
 * Generate Tailwind classes based on node properties
 */
function generateTailwindClasses(node) {
    const tw = {};

    if (node.width) tw.width = `w-${Math.round(node.width)}`;
    if (node.height) tw.height = `h-${Math.round(node.height)}`;

    if (node.layoutMode === "HORIZONTAL") tw.flex = "flex";
    if (node.layoutMode === "VERTICAL") tw.flex = "flex-col";

    if (node.fontSize) tw['font-size'] = `text-${node.fontSize}`;

    return tw;
}

// ============================================
// Legacy Figma Clipboard Functions (kept for reference)
// ============================================

/**
 * Generate unique ID for Figma nodes
 */
function generateFigmaId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Transform AI-generated JSON to proper Figma node structure
 * Adds required fields: id, proper type mapping, layoutMode, etc.
 */
function transformToFigmaFormat(aiJSON) {
    if (!aiJSON) return null;

    // Handle array input
    const nodes = Array.isArray(aiJSON) ? aiJSON : [aiJSON];

    // Create document structure
    const document = {
        document: {
            id: "0:0",
            name: "Document",
            type: "DOCUMENT",
            children: [
                {
                    id: "0:1",
                    name: "Page 1",
                    type: "PAGE",
                    children: nodes.map(node => transformNode(node))
                }
            ]
        },
        schemaVersion: 1
    };

    return document;
}

/**
 * Recursively transform each node to Figma format
 */
function transformNode(node, depth = 0) {
    if (!node) return null;

    const figmaNode = {
        id: node.id || generateFigmaId(),
        name: node.name || "Layer",
        type: node.type || "FRAME",

        // Geometry
        x: node.x || 0,
        y: node.y || 0,
        width: node.width || 100,
        height: node.height || 100,

        // Colors - ensure correct format
        fills: transformFills(node.fills),

        // Auto Layout properties
        layoutMode: node.layoutMode || "NONE",
        itemSpacing: node.itemSpacing || 0,
        paddingTop: node.paddingTop || 0,
        paddingBottom: node.paddingBottom || 0,
        paddingLeft: node.paddingLeft || 0,
        paddingRight: node.paddingRight || 0,
        primaryAxisAlignItems: node.primaryAxisAlignItems || "MIN",
        counterAxisAlignItems: node.counterAxisAlignItems || "MIN",
        primaryAxisSizingMode: node.primaryAxisSizingMode || "AUTO",
        counterAxisSizingMode: node.counterAxisSizingMode || "AUTO"
    };

    // Handle TEXT type
    if (node.type === "TEXT") {
        figmaNode.characters = node.characters || "";
        figmaNode.fontSize = node.fontSize || 14;
        figmaNode.fontFamily = node.fontName?.family || "Inter";
        figmaNode.fontWeight = getFontWeight(node.fontName?.style);
    }

    // Handle ELLIPSE/RECTANGLE corner radius
    if (node.cornerRadius) {
        figmaNode.cornerRadius = node.cornerRadius;
    }

    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
        figmaNode.children = node.children.map(child => transformNode(child, depth + 1));
    }

    return figmaNode;
}

/**
 * Transform fills to proper Figma format
 */
function transformFills(fills) {
    if (!fills || !Array.isArray(fills) || fills.length === 0) {
        return [];
    }

    return fills.map(fill => ({
        type: fill.type || "SOLID",
        color: {
            r: fill.color?.r ?? 1,
            g: fill.color?.g ?? 1,
            b: fill.color?.b ?? 1,
            a: fill.opacity ?? 1
        }
    }));
}

/**
 * Get numeric font weight from style string
 */
function getFontWeight(style) {
    if (!style) return 400;
    const s = style.toLowerCase();
    if (s.includes('bold')) return 700;
    if (s.includes('semi') || s.includes('medium')) return 500;
    if (s.includes('light')) return 300;
    return 400;
}

/**
 * LEGACY: Create Figma clipboard HTML with figmeta tag
 * Deprecated - use kiwi-encoder.createFigmaClipboardHTML instead
 */
function _legacyCreateFigmaClipboardHTML(figmaData) {
    // Base64 encode the design data
    const jsonString = JSON.stringify(figmaData);
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

    // Create the HTML structure that Figma recognizes
    // Format: <meta> + <table> with appState cells containing figmeta
    const html = `<meta charset="UTF-8"><img src="" /><table><tr><td id="appState">${base64Data}</td><td id="appState"><figmeta id="appState" data-kiwi="${base64Data}"></figmeta></td></tr></table>`;

    return html;
}
