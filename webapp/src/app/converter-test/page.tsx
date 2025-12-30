'use client';

import React, { useRef, useState } from 'react';
import { processDomSelection } from '../../lib/html-to-figma';
import { decodeFigmaClipboard } from '../../lib/figma-encoder'; // Import decoder

// Sample Stitch Data for Comparison (truncated for initial load, user can paste full)
const STITCH_SAMPLE = "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";

export default function ConverterTestPage() {
    const testAreaRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<string>('Ready');
    const [debugInput, setDebugInput] = useState<string>('');
    const [debugOutput, setDebugOutput] = useState<any>(null);

    const handleCopyToFigma = async () => {
        if (!testAreaRef.current) return;
        setStatus('Processing...');

        try {
            // 1. Run Converter
            const html = await processDomSelection(testAreaRef.current);

            // 2. Write to Clipboard
            // We need to write the specific Figma HTML format
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob(['Figma Copy Test'], { type: 'text/plain' })
            });
            await navigator.clipboard.write([clipboardItem]);

            setStatus('Copied to Clipboard! Paste in Figma.');
        } catch (error: any) {
            console.error(error);
            setStatus('Error: ' + error.message);
        }
    };

    const handleDecode = () => {
        if (!debugInput) return;
        try {
            const result = decodeFigmaClipboard(debugInput);
            if (result.success) {
                setDebugOutput(result.data);
            } else {
                setDebugOutput({ error: result.error });
            }
        } catch (e: any) {
            setDebugOutput({ error: e.message });
        }
    };

    const loadStitchSample = () => {
        setDebugInput(STITCH_SAMPLE);
    };

    return (
        <div className="p-8 font-sans bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">HTML to Figma Converter Test</h1>

            <div className="mb-6 space-x-4">
                <button
                    onClick={handleCopyToFigma}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                    Copy Test Area to Figma
                </button>
                <span className="font-mono text-sm text-gray-600">{status}</span>
            </div>

            {/* TEST AREA - This is what we will copy */}
            <div
                id="test-root"
                ref={testAreaRef}
                className="bg-card p-8 rounded-xl shadow-lg border border-border inline-block"
                style={{ width: '500px' }} // Fixed width to verify layout
            >
                {/* Header Section */}
                <div className="flex flex-row justify-between items-center mb-6 border-b pb-4 border-border">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-foreground m-0">Dashboard Overview</h2>
                        <span className="text-sm text-muted-foreground">Last updated: Today</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        AI
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-row gap-4 mb-6">
                    {/* Card 1 */}
                    <div className="flex-1 p-4 rounded-lg bg-background border border-border flex flex-col gap-2">
                        <span className="text-xs uppercase font-semibold text-primary">Total Revenue</span>
                        <span className="text-2xl font-bold text-foreground">$45,231</span>
                        <span className="text-sm text-primary flex items-center">
                            +20.1% <span className="text-muted-foreground ml-1">vs last month</span>
                        </span>
                    </div>

                    {/* Card 2 */}
                    <div className="flex-1 p-4 rounded-lg bg-background border border-border flex flex-col gap-2">
                        <span className="text-xs uppercase font-semibold text-primary">Active Users</span>
                        <span className="text-2xl font-bold text-foreground">2,345</span>
                        <span className="text-sm text-primary flex items-center">
                            +5.4% <span className="text-muted-foreground ml-1">vs last month</span>
                        </span>
                    </div>
                </div>

                {/* List Section */}
                <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-foreground">Recent Activity</h3>

                    {/* List Item 1 */}
                    <div className="flex flex-row items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            $
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium text-foreground">Payment received</span>
                            <span className="text-xs text-muted-foreground">From Google Inc.</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">+$120.00</span>
                    </div>

                    {/* List Item 2 */}
                    <div className="flex flex-row items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border">
                        <div className="w-8 h-8 rounded bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold">
                            ?
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium text-foreground">Support Ticket</span>
                            <span className="text-xs text-muted-foreground">Opened by User #123</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Pending</span>
                    </div>
                </div>

                {/* --- DEBUGGER / DECODER SECTION --- */}
                <div className="mt-12 border-t pt-8">
                    <h2 className="text-xl font-bold mb-4">Clipboard Decoder (Debug)</h2>
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={loadStitchSample}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                        >
                            Load Stitch Sample
                        </button>
                        <button
                            onClick={handleDecode}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                            Decode
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1">Base64 Input (fig-kiwi):</label>
                            <textarea
                                className="w-full h-64 p-2 text-xs font-mono border rounded"
                                value={debugInput}
                                onChange={(e) => setDebugInput(e.target.value)}
                                placeholder="Paste Base64 here..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1">JSON Output:</label>
                            <div className="w-full h-64 p-2 text-xs font-mono border rounded bg-white overflow-auto">
                                {debugOutput ? (
                                    <pre>{JSON.stringify(debugOutput, null, 2)}</pre>
                                ) : (
                                    <span className="text-gray-400">Result will appear here...</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
