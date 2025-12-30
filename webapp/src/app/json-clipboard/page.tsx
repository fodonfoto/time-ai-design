"use client";

import React, { useState, useEffect } from 'react';
import { createFigmaClipboardHTML, createFigmaClipboardHTMLFromNodeChanges, decodeFigmaClipboard } from '../../lib/figma-encoder';

// --- Helper Functions ---

function hexToColorObj(hex: string) {
    const cleaned = hex.replace('#', '');
    if (![3, 6].includes(cleaned.length)) return null;
    const full = cleaned.length === 3
        ? cleaned.split('').map(c => c + c).join('')
        : cleaned;
    const num = parseInt(full, 16);
    if (isNaN(num)) return null;
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    return { r, g, b, a: 1 };
}

function normalizeColors(node: any): any {
    if (!node || typeof node !== 'object') return node;
    // Fills
    if (Array.isArray(node.fills)) {
        node.fills = node.fills.map((f: any) => {
            if (f && typeof f.color === 'string' && f.color.startsWith('#')) {
                const c = hexToColorObj(f.color);
                if (c) f.color = c;
            }
            return f;
        });
    }
    // Strokes
    if (Array.isArray(node.strokes)) {
        node.strokes = node.strokes.map((s: any) => {
            if (s && typeof s.color === 'string' && s.color.startsWith('#')) {
                const c = hexToColorObj(s.color);
                if (c) s.color = c;
            }
            return s;
        });
    }
    // Recurse children
    if (Array.isArray(node.children)) {
        node.children = node.children.map((ch: any) => normalizeColors(ch));
    }
    return node;
}

function validateColor(color: any, path: string, errors: string[]) {
    if (!color || typeof color !== 'object') {
        errors.push(`${path}: color ต้องเป็น object`);
        return;
    }
    ['r', 'g', 'b'].forEach((k) => {
        // @ts-ignore
        if (typeof color[k] !== 'number' || color[k] < 0 || color[k] > 1) {
            errors.push(`${path}: color.${k} ควรเป็นตัวเลข 0-1`);
        }
    });
}

function validateNode(node: any, path = 'node'): string[] {
    const errors: string[] = [];

    if (!node || typeof node !== 'object') {
        errors.push(`${path}: ไม่ใช่ object`);
        return errors;
    }

    // Check for raw NodeChanges format
    if (node.type === 'DOCUMENT' || node.phase === 'CREATED' || node.guid) {
        // This looks like a raw node change, skip standard validation for now
        return [];
    }

    if (!node.type || typeof node.type !== 'string') {
        errors.push(`${path}: ต้องมี type (FRAME/RECTANGLE/TEXT/...)`);
    }
    if (!node.name || typeof node.name !== 'string') {
        errors.push(`${path}: ควรมี name (string)`);
    }

    const type = node.type;

    // Common size check for non-TEXT shapes
    if (type !== 'TEXT') {
        if (typeof node.width !== 'number') {
            errors.push(`${path}: ${type} ควรมี width (number)`);
        }
        if (typeof node.height !== 'number') {
            errors.push(`${path}: ${type} ควรมี height (number)`);
        }
    }

    // Type-specific checks
    if (type === 'TEXT') {
        if (typeof node.characters !== 'string') {
            if (node.characters === undefined) errors.push(`${path}: TEXT ต้องมี characters`);
        }
        if (typeof node.fontSize !== 'number') {
            errors.push(`${path}: TEXT ต้องมี fontSize (number)`);
        }
        if (node.fontName && (typeof node.fontName.family !== 'string' || typeof node.fontName.style !== 'string')) {
            errors.push(`${path}: TEXT fontName ต้องมี family และ style`);
        }
    } else {
        if (Array.isArray(node.fills)) {
            node.fills.forEach((f: any, idx: number) => {
                if (f.type === 'SOLID') validateColor(f.color, `${path}.fills[${idx}]`, errors);
            });
        }
    }

    // Children
    if (Array.isArray(node.children)) {
        node.children.forEach((child: any, i: number) => {
            errors.push(...validateNode(child, `${path}.children[${i}]`));
        });
    }

    return errors;
}

function normalizePayload(value: any) {
    if (Array.isArray(value)) return value;
    return [value];
}

export default function JsonClipboardPage() {
    const [inputJson, setInputJson] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultHtml, setResultHtml] = useState('');

    // Default Value
    useEffect(() => {
        setInputJson(JSON.stringify({
            type: 'TEXT',
            name: 'Sample',
            characters: 'Hello from JSON → Figma',
            fontSize: 18,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }]
        }, null, 2));

        addLog('Ready. Paste your JSON and click "Create & Copy".');
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
        console.log(msg);
    };

    const processResult = async (result: { html: string | null, success: boolean, error?: string }) => {
        if (!result.success || !result.html) {
            addLog('❌ Conversion failed: ' + (result.error || 'unknown error'));
            setIsProcessing(false);
            return;
        }

        const blob = new Blob([result.html], { type: 'text/html' });
        let copied = false;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': blob,
                    'text/plain': new Blob([''], { type: 'text/plain' })
                })
            ]);
            copied = true;
        } catch (err) {
            try {
                await navigator.clipboard.writeText(result.html);
                addLog('⚠️ Copied as text/plain (meta lost) because browser denied HTML clipboard.');
                copied = true;
            } catch (err2: any) {
                addLog('⚠️ Auto-copy failed: ' + err2.message);
            }
        }

        const preview = result.html.slice(0, 220).replace(/\s+/g, ' ');
        if (copied) {
            addLog(`✅ Success! Copied to clipboard.\n📦 Length: ${result.html.length}\n🔍 Preview: ${preview}...`);
        }
        setResultHtml(result.html);
        setIsProcessing(false);
    };

    const handleRun = async () => {
        setIsProcessing(true);
        addLog('🔄 Converting...');
        setResultHtml('');

        let data;
        try {
            data = JSON.parse(inputJson);
        } catch (err: any) {
            addLog('❌ Invalid JSON: ' + err.message);
            setIsProcessing(false);
            return;
        }

        // Check for "Raw Decoded" format (NODE_CHANGES)
        if (data && (data.nodeChanges || data.type === 'NODE_CHANGES')) {
            addLog('💡 Detected raw "NODE_CHANGES" format.');
            const nodeChanges = data.nodeChanges || (Array.isArray(data) ? data : []);

            if (!Array.isArray(nodeChanges) || nodeChanges.length === 0) {
                addLog('❌ Invalid NODE_CHANGES: Missing "nodeChanges" array.');
                setIsProcessing(false);
                return;
            }

            try {
                const result = await createFigmaClipboardHTMLFromNodeChanges(nodeChanges);
                processResult(result);
            } catch (err: any) {
                addLog('❌ Error processing raw nodes: ' + err.message);
                setIsProcessing(false);
            }
            return;
        }

        // Parsing Standard AINode
        const payload = normalizePayload(data).map((n: any) => normalizeColors(n));

        // Validation
        const validationErrors: string[] = [];
        payload.forEach((n: any, idx: number) => {
            validationErrors.push(...validateNode(n, `root[${idx}]`));
        });

        if (validationErrors.length > 0) {
            addLog('⚠️ Validation Warnings:\n- ' + validationErrors.join('\n- '));
        } else {
            addLog('✅ Structure looks good. Encoding...');
        }

        try {
            const result = await createFigmaClipboardHTML(payload);
            processResult(result);
        } catch (err: any) {
            addLog('❌ Error: ' + err.message);
            console.error(err);
            setIsProcessing(false);
        }
    };

    // --- Decoder Logic ---
    const [decodeInput, setDecodeInput] = useState('');
    const [decodedJson, setDecodedJson] = useState('');

    const handleDecode = async () => {
        setIsProcessing(true);
        addLog('🔍 Decoding...');
        setDecodedJson('');

        try {
            let base64 = decodeInput.trim();
            // Try to extract from HTML if it looks like HTML
            if (base64.includes('<meta')) {
                addLog('📄 HTML detected. Attempting to extract Base64...');

                // 1. Standard Figma "data-figma-kiwi"
                let match = base64.match(/data-figma-kiwi="([^"]+)"/);

                // 2. Wrapper "data-metadata" (Common in some tools)
                if (!match) match = base64.match(/data-metadata="([^"]+)"/);

                // 3. Wrapper "data-buffer"
                if (!match) match = base64.match(/data-buffer="([^"]+)"/);

                if (match && match[1]) {
                    base64 = match[1];
                    addLog('✅ Found Base64 data in HTML attribute.');
                } else {
                    // 4. Fallback: Look for the longest contiguous base64-like string
                    // This is risky but often works for "raw" clipboard dumps content
                    // Exclude common HTML tags/attrs keywords
                    const potentialB64s = base64.match(/[A-Za-z0-9+/=]{100,}/g);
                    if (potentialB64s && potentialB64s.length > 0) {
                        // Pick the longest one, usually the payload
                        base64 = potentialB64s.reduce((a, b) => a.length > b.length ? a : b);
                        addLog('⚠️ Extracted likely Base64 string from text content.');
                    } else {
                        addLog('❌ Could not identify Figma data in HTML. Try pasting ONLY the Base64 string.');
                        setIsProcessing(false);
                        return;
                    }
                }
            }

            // Clean cleanup known prefixes data:image/png;base64, etc if user pasted wrong thing
            if (base64.startsWith('data:')) {
                base64 = base64.split(',')[1];
            }

            const result = decodeFigmaClipboard(base64);
            if (result.success) {
                const jsonStr = JSON.stringify(result.data, null, 2);
                setDecodedJson(jsonStr);
                addLog(`✅ Decoded successfully! (${jsonStr.length} chars)`);
            } else {
                addLog('❌ Decode failed: ' + result.error);
            }

        } catch (err: any) {
            addLog('❌ Decode Error: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Smart Paste Logic ---
    const handleSmartPaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        addLog('📋 Paste Detected! Analyzing...');

        for (let i = 0; i < items.length; i++) {
            if (items[i].type === 'text/html') {
                items[i].getAsString((s) => processPastedHTML(s));
                return;
            }
        }
        // Fallback to text
        for (let i = 0; i < items.length; i++) {
            if (items[i].type === 'text/plain') {
                items[i].getAsString((s) => processPastedHTML(s));
                return;
            }
        }
    };

    const processPastedHTML = async (html: string) => {
        setIsProcessing(true);
        addLog('🔍 Processing content...');

        let base64 = '';

        // 1. Try Standard Figma
        let match = html.match(/data-figma-kiwi="([^"]+)"/);
        if (match) base64 = match[1];

        // 2. Try Stitch/Other Metadata
        if (!base64) { match = html.match(/data-metadata="([^"]+)"/); if (match) base64 = match[1]; }
        if (!base64) { match = html.match(/data-buffer="([^"]+)"/); if (match) base64 = match[1]; }

        // 3. Raw Base64 Fallback
        if (!base64) {
            const potential = html.match(/[A-Za-z0-9+/=]{100,}/g);
            if (potential && potential.length > 0) {
                base64 = potential.reduce((a, b) => a.length > b.length ? a : b);
            }
        }

        if (!base64) {
            addLog('❌ No Figma data found.');
            setIsProcessing(false);
            return;
        }

        if (base64.startsWith('data:')) base64 = base64.split(',')[1];

        try {
            const result = decodeFigmaClipboard(base64);
            if (result.success) {
                addLog('✅ Decoded! Auto-populating Encoder...');
                const jsonStr = JSON.stringify(result.data, null, 2);
                setDecodedJson(jsonStr);
                setInputJson(jsonStr);

                // Auto Re-Encode
                if (result.data.nodeChanges) {
                    addLog('🔄 Re-Encoding NodeChanges...');
                    const reResult = await createFigmaClipboardHTMLFromNodeChanges(result.data.nodeChanges);
                    processResult(reResult);
                } else if (Array.isArray(result.data)) {
                    const reResult = await createFigmaClipboardHTMLFromNodeChanges(result.data);
                    processResult(reResult);
                }
            } else {
                addLog('❌ Decode failed: ' + result.error);
            }
        } catch (err: any) {
            addLog('❌ Error: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1115] text-[#e6e7eb] font-sans p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <header>
                    <h1 className="text-2xl font-bold mb-2">JSON ↔ Figma Clipboard Inspector</h1>
                    <p className="text-[#9aa0ad]">
                        <strong>Paste!</strong> Paste any Figma content anywhere on this page to Inspect & Re-encode.
                    </p>
                </header>

                <div
                    className="border-2 border-dashed border-[#222837] rounded-xl p-8 text-center bg-[#131720]/50 hover:bg-[#131720] transition-colors cursor-text group"
                    onPaste={handleSmartPaste}
                >
                    <p className="text-gray-400 font-medium group-hover:text-blue-400 transition-colors">
                        📋 Click here & Press Cmd+V to Inspect Stitch/Figma Content
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                        Detects HTML, extracts `data-metadata`/`figma-kiwi`, Decodes, and Re-Encodes automatically.
                    </p>
                </div>

                {/* Legacy Manual Input */}
                <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between">
                        <label className="text-sm text-[#768099]">Manual JSON Input</label>
                        <button onClick={handleRun} className="text-xs bg-blue-600 px-3 py-1 rounded text-white font-bold">Manual Encode</button>
                    </div>
                    <textarea
                        className="w-full h-32 bg-[#131720] border border-[#222837] rounded-lg p-3 font-mono text-xs text-gray-400 resize-y"
                        value={inputJson}
                        onChange={(e) => setInputJson(e.target.value)}
                    />
                </div>

                {/* Decoded Output */}
                {decodedJson && (
                    <div className="space-y-2 animate-in fade-in">
                        <div className="flex justify-between items-center bg-[#1e232e] p-2 rounded-t-lg border border-[#222837] border-b-0">
                            <span className="text-xs font-bold text-green-400">✅ DECODED JSON (Source)</span>
                            <span className="text-xs text-gray-500">From Clipboard</span>
                        </div>
                        <textarea
                            className="w-full h-48 bg-[#0c0f17] border border-[#1e2433] rounded-b-lg p-4 font-mono text-xs text-green-400 resize-y focus:outline-none"
                            readOnly
                            value={decodedJson}
                        />
                    </div>
                )}

                {/* LOGS */}
                <div className="bg-[#0c0f17] border border-[#1e2433] rounded-lg p-4 h-48 overflow-auto font-mono text-xs whitespace-pre-wrap">
                    {logs.length === 0 ? <span className="text-gray-600">Waiting for interaction...</span> : logs.join('\n')}
                </div>

                {/* Final HTML Result */}
                {resultHtml && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center bg-blue-900/20 p-2 rounded-t-lg border border-blue-900/50 border-b-0">
                            <span className="text-xs font-bold text-blue-400">📦 RE-ENCODED RESULT (Auto-Generated)</span>
                            <button
                                onClick={() => processResult({ success: true, html: resultHtml })}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
                            >
                                Copy to Clipboard
                            </button>
                        </div>
                        <textarea
                            className="w-full h-32 bg-[#131720] border border-blue-900/50 rounded-b-lg p-3 font-mono text-xs text-blue-300"
                            readOnly
                            value={resultHtml}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
