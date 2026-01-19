'use client'

import React, { useState, useEffect } from 'react'
import { createFigmaClipboardHTML, AINode } from '@/lib/figma-encoder'

// Stitch Blobs (Base64)
const STITCH_BLOBS_B64 = [
    "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"
]

// To log in the browser: window.logMessage = ...
declare global {
    interface Window {
        logToKiwiTest?: (msg: any) => void;
    }
}

export default function KiwiTestPage() {
    const [log, setLog] = useState<string[]>(['Ready to test...'])

    const addLog = (msg: string) => {
        console.log(msg)
        setLog(prev => [...prev, msg])
    }

    const clearLog = () => setLog([])

    // Expose log to window for figma-encoder to use
    useEffect(() => {
        window.logToKiwiTest = addLog
        return () => { window.logToKiwiTest = undefined }
    }, [])

    // ... Helper to reduce code duplication ...
    const runClipboardTest = async (design: AINode) => {
        try {
            const result = await createFigmaClipboardHTML(design)
            addLog(`📦 Result: success=${result.success}, htmlLength=${result.html?.length}`)

            if (result.success && result.html) {
                const blob = new Blob([result.html], { type: 'text/html' })
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': blob,
                        'text/plain': new Blob([''], { type: 'text/plain' })
                    })
                ])
                addLog('✅ Copied to clipboard! Paste in Figma now.')
                addLog(`📋 HTML Preview: ${result.html.substring(0, 150)}...`)
            } else {
                addLog(`❌ Error: ${result.error}`)
            }
        } catch (err: any) {
            addLog(`❌ Exception: ${err.message}`)
            console.error(err)
        }
    }

    const testSimpleFrame = async () => {
        clearLog()
        addLog('🔄 Testing simple frame...')

        const design: AINode = {
            type: 'FRAME',
            name: 'Test Frame',
            x: 0,
            y: 0,
            width: 390,
            height: 200,
            fills: [{ type: 'SOLID', color: { r: 0.06, g: 0.73, b: 0.51 }, visible: true }]
        }
        runClipboardTest(design)
    }

    const testFrameWithText = async () => {
        clearLog()
        addLog('🔄 Testing frame with text...')

        const design: AINode = {
            type: 'FRAME',
            name: 'Card',
            x: 0,
            y: 0,
            width: 320,
            height: 180,
            fills: [{ type: 'SOLID', color: { r: 0.15, g: 0.15, b: 0.15 }, visible: true }],
            cornerRadius: 16,
            layoutMode: 'VERTICAL',
            paddingTop: 24,
            paddingBottom: 24,
            paddingLeft: 24,
            paddingRight: 24,
            itemSpacing: 12,
            children: [
                {
                    type: 'TEXT',
                    name: 'Title',
                    characters: 'Hello Figma!',
                    fontSize: 24,
                    fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }]
                },
                {
                    type: 'TEXT',
                    name: 'Description',
                    characters: 'This is a test from Time AI',
                    fontSize: 14,
                    fills: [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 }, visible: true }]
                }
            ]
        }
        runClipboardTest(design)
    }

    const testNestedFrames = async () => {
        clearLog()
        addLog('🔄 Testing nested frames...')

        const design: AINode = {
            type: 'FRAME',
            name: 'Container',
            width: 390,
            height: 300,
            fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 }, visible: true }],
            layoutMode: 'VERTICAL',
            itemSpacing: 16,
            children: [
                {
                    type: 'FRAME',
                    name: 'Header',
                    width: 390,
                    height: 60,
                    fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 }, visible: true }]
                },
                {
                    type: 'FRAME',
                    name: 'Content',
                    width: 390,
                    height: 200,
                    fills: [{ type: 'SOLID', color: { r: 0.15, g: 0.15, b: 0.15 }, visible: true }]
                }
            ]
        }
        runClipboardTest(design)
    }

    const testGradientAndShadow = async () => {
        clearLog()
        addLog('🔄 Testing gradient + drop shadow...')

        const design: AINode = {
            type: 'FRAME',
            name: 'Gradient Card',
            width: 300,
            height: 200,
            cornerRadius: 24,
            cornerSmoothing: 0.6,
            fills: [{
                type: 'GRADIENT_LINEAR',
                gradientStops: [
                    { position: 0, color: { r: 0.4, g: 0.2, b: 1, a: 1 } },
                    { position: 1, color: { r: 0.1, g: 0.5, b: 1, a: 1 } }
                ],
                gradientHandlePositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 }
                ]
            }],
            effects: [{
                type: 'DROP_SHADOW',
                color: { r: 0, g: 0, b: 0, a: 0.3 },
                offset: { x: 0, y: 10 },
                radius: 30,
                visible: true
            }]
        }
        runClipboardTest(design)
    }

    const testStrokesAndEffects = async () => {
        clearLog()
        addLog('🔄 Testing strokes + blur...')

        const design: AINode = {
            type: 'FRAME',
            name: 'Stroked Frame',
            width: 250,
            height: 150,
            cornerRadius: 12,
            fills: [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 }, visible: true }],
            strokes: [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 1 }, visible: true }],
            strokeWeight: 3,
            strokeAlign: 'INSIDE',
            dashPattern: [10, 5],
            effects: [{
                type: 'INNER_SHADOW',
                color: { r: 0, g: 0, b: 0, a: 0.15 },
                offset: { x: 0, y: 2 },
                radius: 4,
                visible: true
            }]
        }
        runClipboardTest(design)
    }

    // TEST 6: Isolated TEXT only - no parent frame
    const testTextOnly = async () => {
        clearLog()
        addLog('🔄 Testing TEXT only (no parent frame)...')

        // Simple TEXT node at root level
        const design: AINode = {
            type: 'TEXT',
            name: 'Standalone Text',
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            characters: 'Hello Figma!',
            fontSize: 24,
            fontName: { family: 'Inter', style: 'Regular' },
            fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, visible: true }]
        }
        runClipboardTest(design)
    }

    // TEST 7: Text User Layout Version 0
    const testTextVersion0 = async () => {
        clearLog()
        addLog('🔄 Testing TEXT with textUserLayoutVersion = 0...')

        const design: AINode = {
            type: 'TEXT',
            name: 'Text V0',
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            characters: 'Hello V0',
            fontSize: 24,
            fontName: { family: 'Inter', style: 'Regular' },
            fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, visible: true }],
            textUserLayoutVersion: 0 // FORCE VERSION 0
        }
        runClipboardTest(design)
    }

    // TEST 8: Text with Mock Derived Data (from Stitch)
    const testTextWithDerived = async () => {
        clearLog()
        addLog('🔄 Testing TEXT with Mock Derived Data...')

        const design: AINode = {
            type: 'TEXT',
            name: 'Text with Derived',
            x: 100,
            y: 100,
            width: 123,
            height: 30,
            characters: '2 years', // Matches Stitch dump
            fontSize: 24,
            fontName: { family: 'Inter', style: 'Bold' },
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: 5,

            // Mock Derived Data (from Stitch dump)
            derivedTextData: {
                layoutSize: { x: 123, y: 30 },
                baselines: [{
                    position: { x: 0, y: 23.727272 },
                    width: 85.875,
                    lineY: 0,
                    lineHeight: 30,
                    lineAscent: 23,
                    firstCharacter: 0,
                    endCharacter: 7
                }],
                glyphs: [
                    // Minimal glyphs mock since full list is long
                    {
                        commandsBlob: 0,
                        position: { x: 0, y: 23.727272 },
                        fontSize: 24,
                        firstCharacter: 0,
                        advance: 0.6299,
                        rotation: 0
                    }
                ],
                fontMetaData: [{
                    key: { family: 'Inter', style: 'Bold', postscript: '' },
                    fontLineHeight: 1.21,
                    fontDigest: {}, // Empty digest might fail if stricter check exists
                    fontStyle: 'NORMAL',
                    fontWeight: 700
                }],
                truncationStartIndex: -1,
                truncatedHeight: -1,
                logicalIndexToCharacterOffsetMap: [0, 15, 20, 34, 48, 62, 72],
                derivedLines: [{ directionality: 'LTR' }]
            }
        }
        runClipboardTest(design)
    }


    // TEST 9: No Layout Version
    const testTextNoVersion = async () => {
        clearLog()
        addLog('🔄 Testing TEXT with NO layout version...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text No Ver',
            characters: 'Hello No Version',
            fontSize: 24,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: 1
        }
        runClipboardTest(design)
    }

    // TEST 10: V0 + WIDTH_AND_HEIGHT
    const testTextV0_WH = async () => {
        clearLog()
        addLog('🔄 Testing V0 + WIDTH_AND_HEIGHT...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text V0 W&H',
            characters: 'Hello V0 W&H',
            fontSize: 24,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: 0,
            textAutoResize: 'WIDTH_AND_HEIGHT'
        }
        runClipboardTest(design)
    }

    // TEST 11: Version 2
    const testTextV1 = async () => {
        clearLog()
        addLog('🔄 Testing Version 2...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text V2',
            characters: 'Hello V2',
            fontSize: 24,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: 2
        }
        runClipboardTest(design)
    }

    const testTextV5_NoLines = async () => {
        clearLog()
        addLog('🔄 Testing V5 + Bidi=1 + FontVer=2...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text Full Meta',
            characters: 'Hello Full Meta',
            fontSize: 24,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: 5,
            textBidiVersion: 1,
            fontVersion: "2"
        }
        runClipboardTest(design)
    }

    // TEST 13: V0 + No Character Style IDs
    const testTextV0_NoStyleIDs = async () => {
        clearLog()
        addLog('🔄 Testing V0 + No Style IDs...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text V0 No Style',
            characters: 'Hello V0 No Styles',
            fontSize: 24,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: 0,
            debugOmitCharacterStyleIDs: true
        }
        runClipboardTest(design)
    }

    // TEST 14: V0 + No Lines + No Style IDs (Minimal)
    const testTextV0_Minimal = async () => {
        clearLog()
        addLog('🔄 Testing V0 MINIMAL (No Lines/StyleIDs)...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text V0 Minimal',
            textUserLayoutVersion: 0,
            debugOmitCharacterStyleIDs: true,
            // debugBlobs: STITCH_BLOBS_B64 // Optional: can test blob presence here too if needed
        }
        runClipboardTest(design)
    }

    // TEST 15: Omit textUserLayoutVersion entirely
    const testTextNoLayoutProp = async () => {
        clearLog()
        addLog('🔄 Testing OMIT textUserLayoutVersion...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text No Layout Prop',
            characters: 'Hello Omitted',
            fontSize: 24,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: -1 // Special flag to omit property
        }
        runClipboardTest(design)
    }

    // TEST 16: FULL Perfect Clone of Stitch "2 years"
    const testTextPerfectClone = async () => {
        clearLog()
        addLog('🔄 Testing PERFECT Stitch Clone ("2 years")...')

        const design: AINode = {
            type: 'TEXT',
            name: '2 years',
            x: 0,
            y: 0,
            width: 123,
            height: 30,
            characters: '2 years',
            fontSize: 24,
            fontName: { family: 'Inter', style: 'Bold' },
            // MATCH STITCH BLOB: LineHeight 30px (not 36px/150%)
            lineHeight: { value: 30, unit: 'PIXELS' },
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: 5,
            textAutoResize: 'HEIGHT',
            textBidiVersion: 1,
            fontVersion: "2",

            // EXACT Derived Data from Stitch Dump
            derivedTextData: {
                layoutSize: { x: 123, y: 30 },
                baselines: [{
                    position: { x: 0, y: 23.727272033691406 },
                    width: 85.875,
                    lineY: -6.935813416930614e-7,
                    lineHeight: 30,
                    lineAscent: 23,
                    firstCharacter: 0,
                    endCharacter: 7
                }],
                glyphs: [
                    { commandsBlob: 0, position: { x: 0, y: 23.727272033691406 }, fontSize: 24, firstCharacter: 0, advance: 0.6299716234207153, rotation: 0 },
                    { commandsBlob: 1, position: { x: 15.1171875, y: 23.727272033691406 }, fontSize: 24, firstCharacter: 1, advance: 0.23188921809196472, rotation: 0 },
                    { commandsBlob: 2, position: { x: 20.671875, y: 23.727272033691406 }, fontSize: 24, firstCharacter: 2, advance: 0.5859375, rotation: 0 },
                    { commandsBlob: 3, position: { x: 34.3125, y: 23.727272033691406 }, fontSize: 24, firstCharacter: 3, advance: 0.59765625, rotation: 0 },
                    { commandsBlob: 4, position: { x: 48.65625, y: 23.727272033691406 }, fontSize: 24, firstCharacter: 4, advance: 0.5802556872367859, rotation: 0 },
                    { commandsBlob: 5, position: { x: 62.578125, y: 23.727272033691406 }, fontSize: 24, firstCharacter: 5, advance: 0.40873581171035767, rotation: 0 },
                    { commandsBlob: 6, position: { x: 72.3984375, y: 23.727272033691406 }, fontSize: 24, firstCharacter: 6, advance: 0.5617898106575012, rotation: 0 }
                ],
                fontMetaData: [{
                    key: { family: 'Inter', style: 'Bold', postscript: '' },
                    fontLineHeight: 1.2102272510528564,
                    fontDigest: { "0": 212, "1": 131, "2": 226, "3": 199, "4": 248, "5": 3, "6": 44, "7": 102, "8": 56, "9": 208, "10": 71, "11": 22, "12": 126, "13": 251, "14": 235, "15": 160, "16": 3, "17": 15, "18": 6, "19": 73 },
                    fontStyle: 'NORMAL',
                    fontWeight: 700
                }],
                truncationStartIndex: -1,
                truncatedHeight: -1,
                logicalIndexToCharacterOffsetMap: [0, 15.1171875, 20.671875, 34.3125, 48.65625, 62.578125, 72.3984375],
                derivedLines: [{ directionality: 'LTR' }]
            },

            // Blobs from Stitch Dump (Using Constant)
            debugBlobs: STITCH_BLOBS_B64
        }
        runClipboardTest(design)
    }

    // TEST 18: Fallback Version - WIDTH_AND_HEIGHT + V0 + No Derived
    const testTextFallback = async () => {
        clearLog()
        addLog('🔄 Testing FALLBACK (V0 + W&H + No Derived)...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text Fallback',
            characters: 'Hello Fallback',
            fontSize: 24,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
            textUserLayoutVersion: 0,
            textAutoResize: 'WIDTH_AND_HEIGHT'
        }
        runClipboardTest(design)
    }

    // TEST 19: Blob Debug (1 byte)
    const testTextBlobDebug = async () => {
        clearLog()
        addLog('🔄 Testing Text with Dummy Blob (1 byte)...')
        const design: AINode = {
            type: 'TEXT',
            name: 'Text Blob Debug',
            characters: 'Hello Blob',
            fontSize: 24,
            fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 1 }, visible: true }],
            textUserLayoutVersion: 5,
            debugBlobs: ['AA=='] // 1 byte: 0x00
        }
        runClipboardTest(design)
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-10">
            <h1 className="text-3xl font-bold mb-4">🎯 Kiwi Encoder Direct Test</h1>
            <p className="text-zinc-400 mb-8">ทดสอบ Copy to Figma โดยตรง ไม่ผ่าน AI generation</p>

            <div className="flex flex-wrap gap-4 mb-8">
                <button onClick={testSimpleFrame} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium">Test 1: Simple Frame</button>
                <button onClick={testFrameWithText} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium">Test 2: Frame + Text</button>
                <button onClick={testNestedFrames} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium">Test 3: Nested Frames</button>
                <button onClick={testGradientAndShadow} className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium">Test 4: Gradient + Shadow</button>
                <button onClick={testStrokesAndEffects} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium">Test 5: Strokes + Effects</button>
                <button onClick={testTextOnly} className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-medium">Test 6: TEXT Only</button>
                <button onClick={testTextVersion0} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium">Test 7: Text (Ver 0)</button>
                <button onClick={testTextWithDerived} className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-medium">Test 8: Text (With Derived)</button>
                <div className="w-full h-px bg-zinc-700 my-2"></div>
                <button onClick={testTextNoVersion} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-medium">Test 9: Text (No Ver)</button>
                <button onClick={testTextV0_WH} className="px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-medium">Test 10: V0 + W&H</button>
                <button onClick={testTextV1} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium">Test 11: Text V1</button>
                <button onClick={testTextV5_NoLines} className="px-6 py-3 bg-lime-500 hover:bg-lime-600 rounded-lg font-medium">Test 12: V5 (Full Meta)</button>
                <div className="w-full h-px bg-zinc-700 my-2"></div>
                <button onClick={testTextV0_NoStyleIDs} className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-medium">Test 13: V0 No Styles</button>
                <button onClick={testTextV0_Minimal} className="px-6 py-3 bg-rose-500 hover:bg-rose-600 rounded-lg font-medium">Test 14: V0 Minimal</button>
                <button onClick={testTextNoLayoutProp} className="px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-lg font-medium">Test 15: No Layout Prop</button>
                <button onClick={testTextPerfectClone} className="px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-600 rounded-lg font-medium">Test 16: Stitch Perfect Clone</button>
                <button onClick={testTextBlobDebug} className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-medium">Test 19: Blob Debug</button>
                <button onClick={testTextFallback} className="px-6 py-3 bg-gray-500 hover:bg-gray-600 rounded-lg font-medium">Test 18: Fallback Force</button>
            </div>

            <div className="bg-zinc-800 rounded-lg p-6 font-mono text-sm">
                <h2 className="text-lg font-bold mb-4">Console Log:</h2>
                {log.map((line, i) => (
                    <div key={i} className="py-1">{line}</div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                <h3 className="font-bold text-yellow-400">วิธีทดสอบ:</h3>
                <ol className="list-decimal list-inside mt-2 text-yellow-200 space-y-1">
                    <li>กดปุ่ม Test ด้านบน</li>
                    <li>เปิด Figma (web หรือ desktop)</li>
                    <li>กด Cmd+V (หรือ Ctrl+V)</li>
                    <li>ดูว่าได้ Frame/Text ที่แก้ไขได้หรือไม่</li>
                </ol>
            </div>
        </div>
    )
}
