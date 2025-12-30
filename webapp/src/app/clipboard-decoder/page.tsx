'use client'

import { useState } from 'react';
import { decodeFigmaClipboard } from '@/lib/figma-encoder';

export default function ClipboardDecoderPage() {
    const [rawHtml, setRawHtml] = useState<string>('')
    const [figmaMeta, setFigmaMeta] = useState<any>(null)
    const [figmaData, setFigmaData] = useState<any>(null)
    const [decodedMessage, setDecodedMessage] = useState<any>(null)
    const [error, setError] = useState<string>('')
    const [log, setLog] = useState<string[]>([])

    const addLog = (msg: string) => setLog((prev: string[]) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])

    const handlePaste = async (e: React.ClipboardEvent) => {
        e.preventDefault()
        setError('')
        setFigmaMeta(null)
        setFigmaData(null)
        setDecodedMessage(null)
        setLog([])

        try {
            // Get HTML from clipboard
            const html = e.clipboardData.getData('text/html')
            setRawHtml(html)
            addLog(`📋 Got HTML: ${html.length} chars`)

            if (!html) {
                setError('No HTML in clipboard. Make sure to copy from Stitch/Figma!')
                return
            }

            // Extract figmeta
            const metaMatch = html.match(/<!--\(figmeta\)([\s\S]*?)\(\/figmeta\)-->/)
            if (metaMatch) {
                addLog('✅ Found figmeta block')
                try {
                    const metaJson = atob(metaMatch[1])
                    const meta = JSON.parse(metaJson)
                    setFigmaMeta(meta)
                    addLog(`📦 figmeta: fileKey=${meta.fileKey}, pasteID=${meta.pasteID}, dataType=${meta.dataType}`)
                } catch (err: any) {
                    addLog(`⚠️ Failed to decode figmeta: ${err.message}`)
                }
            } else {
                addLog('❌ No figmeta found')
            }

            // Extract figma data
            const figmaMatch = html.match(/<!--\(figma\)([\s\S]*?)\(\/figma\)-->/)
            if (figmaMatch) {
                addLog('✅ Found figma block')
                const base64Data = figmaMatch[1]
                addLog(`📦 figma base64: ${base64Data.length} chars`)

                // Decode base64 to bytes
                const binaryString = atob(base64Data)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                }
                addLog(`📦 Binary data: ${bytes.length} bytes`)

                // Check header
                const prelude = new TextDecoder().decode(bytes.slice(0, 8))
                addLog(`📦 Prelude: "${prelude}"`)

                // Store raw data
                setFigmaData({
                    base64Length: base64Data.length,
                    binaryLength: bytes.length,
                    prelude: prelude,
                    firstBytes: Array.from(bytes.slice(0, 32)).map((b: number) => b.toString(16).padStart(2, '0')).join(' '),
                    // Store raw for download
                    rawBase64: base64Data
                })

                // Attempt deep decode
                addLog('🔍 Attempting deep decode...')
                const result = decodeFigmaClipboard(base64Data);
                if (result.success) {
                    addLog('✅ Deep decode SUCCESS!')
                    setDecodedMessage(result.data)
                } else {
                    addLog(`❌ Deep decode FAILED: ${result.error}`)
                    if (result.error?.includes('ZIP')) {
                        addLog('💡 This might be a raw message (not a .fig ZIP). Try decoding raw?')
                    }
                }

            } else {
                addLog('❌ No figma data block found')
            }

        } catch (err: any) {
            setError(`Error: ${err.message}`)
            console.error(err)
        }
    }

    const downloadFigmaData = () => {
        if (!figmaData?.rawBase64) return
        const blob = new Blob([figmaData.rawBase64], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'figma-clipboard-data.txt'
        a.click()
        URL.revokeObjectURL(url)
    }

    const downloadRawHtml = () => {
        if (!rawHtml) return
        const blob = new Blob([rawHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'clipboard-raw.html'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div
            className="min-h-screen bg-zinc-900 text-white p-10"
            onPaste={handlePaste}
        >
            <h1 className="text-3xl font-bold mb-4">🔍 Clipboard Decoder</h1>
            <p className="text-zinc-400 mb-8">
                วาง (Cmd+V) clipboard จาก Stitch หรือ Figma ที่นี่เพื่อ decode และเปรียบเทียบ
            </p>

            {/* Paste target area */}
            <div className="mb-8 p-8 border-2 border-dashed border-zinc-600 rounded-lg bg-zinc-800/50 text-center">
                <p className="text-xl text-zinc-300">📋 คลิกที่นี่แล้วกด Cmd+V เพื่อวาง</p>
                <p className="text-sm text-zinc-500 mt-2">Copy TEXT layer จาก Stitch แล้ววางที่นี่</p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-900/50 border border-red-600 rounded-lg text-red-300">
                    {error}
                </div>
            )}

            {/* Download buttons */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={downloadRawHtml}
                    disabled={!rawHtml}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg"
                >
                    📥 Download Raw HTML
                </button>
                <button
                    onClick={downloadFigmaData}
                    disabled={!figmaData?.rawBase64}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg"
                >
                    📥 Download Figma Base64
                </button>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Log */}
                <div className="bg-zinc-800 rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">📝 Log</h2>
                    <div className="font-mono text-sm space-y-1 max-h-64 overflow-auto">
                        {log.map((line, i) => (
                            <div key={i} className="text-zinc-300">{line}</div>
                        ))}
                        {log.length === 0 && <div className="text-zinc-500">Waiting for paste...</div>}
                    </div>
                </div>

                {/* figmeta */}
                <div className="bg-zinc-800 rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">🏷️ figmeta</h2>
                    {figmaMeta ? (
                        <pre className="font-mono text-xs text-green-400 overflow-auto max-h-64">
                            {JSON.stringify(figmaMeta, null, 2)}
                        </pre>
                    ) : (
                        <div className="text-zinc-500">No figmeta decoded yet</div>
                    )}
                </div>

                {/* figma data info */}
                <div className="bg-zinc-800 rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">📦 Figma Binary Data</h2>
                    {figmaData ? (
                        <div className="font-mono text-xs space-y-2">
                            <div><span className="text-zinc-400">Base64 Length:</span> <span className="text-yellow-400">{figmaData.base64Length}</span></div>
                            <div><span className="text-zinc-400">Binary Length:</span> <span className="text-yellow-400">{figmaData.binaryLength} bytes</span></div>
                            <div><span className="text-zinc-400">Prelude:</span> <span className="text-cyan-400">"{figmaData.prelude}"</span></div>
                            <div className="mt-4">
                                <span className="text-zinc-400">First 32 bytes (hex):</span>
                                <div className="text-purple-400 break-all mt-1">{figmaData.firstBytes}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-zinc-500">No figma data decoded yet</div>
                    )}
                </div>

                {/* Raw HTML preview */}
                <div className="bg-zinc-800 rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">🔤 Raw HTML (ย่อ)</h2>
                    {rawHtml ? (
                        <pre className="font-mono text-xs text-zinc-400 overflow-auto max-h-64 break-all">
                            {rawHtml.substring(0, 2000)}
                            {rawHtml.length > 2000 && '...'}
                        </pre>
                    ) : (
                        <div className="text-zinc-500">No HTML captured yet</div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-6 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                <h3 className="font-bold text-yellow-400 mb-2">📌 วิธีใช้:</h3>
                <ol className="list-decimal list-inside text-yellow-200 space-y-2">
                    <li>ไปที่ <strong>Stitch</strong> สร้าง design ที่มี TEXT layer</li>
                    <li>คลิก <strong>"Copy to Figma"</strong> ใน Stitch</li>
                    <li>กลับมาที่หน้านี้ กด <strong>Cmd+V</strong> (หรือ Ctrl+V)</li>
                    <li>ดู decoded data และเปรียบเทียบกับ Time AI</li>
                    <li>Download ไฟล์เพื่อวิเคราะห์เพิ่มเติม</li>
                </ol>
            </div>
        </div>
    )
}
