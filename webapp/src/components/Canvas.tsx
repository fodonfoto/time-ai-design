'use client'

import React, { useRef, useState, useEffect } from 'react'
import { toPng } from 'html-to-image'
import { DesignProject, DesignFrame } from '@/types'
import { ZoomIn, ZoomOut, Move, Smartphone, Monitor, Copy, Check, Loader2, LayoutGrid, Download } from 'lucide-react'

interface CanvasProps {
    project: DesignProject | null
    onSelectFrame: (frameId: string) => void
    onCopyToFigma?: (frame: DesignFrame) => Promise<void>
}

const Canvas: React.FC<CanvasProps> = ({ project, onSelectFrame, onCopyToFigma }) => {
    const [scale, setScale] = useState(0.4)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [isCopying, setIsCopying] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [savedId, setSavedId] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dragStart = useRef({ x: 0, y: 0 })
    const frameRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    // Reset view when project changes & auto-calculate scale based on content
    useEffect(() => {
        if (project && project.frames.length > 0) {
            // Calculate content width based on frames
            const hasDesktop = project.frames.some(f => f.device === 'desktop')
            const frameCount = project.frames.length

            // Adjust initial scale based on content
            let newScale = 0.5
            if (hasDesktop) {
                newScale = frameCount > 1 ? 0.25 : 0.4
            } else {
                newScale = frameCount > 2 ? 0.4 : 0.5
            }

            setScale(newScale)
            setPan({ x: 0, y: 0 })
        }
    }, [project?.id, project?.frames.length])

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.1))
    const handleReset = () => {
        if (project && project.frames.length > 0) {
            const hasDesktop = project.frames.some(f => f.device === 'desktop')
            const frameCount = project.frames.length
            let newScale = 0.5
            if (hasDesktop) {
                newScale = frameCount > 1 ? 0.25 : 0.4
            } else {
                newScale = frameCount > 2 ? 0.4 : 0.5
            }
            setScale(newScale)
        } else {
            setScale(0.5)
        }
        setPan({ x: 0, y: 0 })
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsDragging(true)
            dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            })
        }
    }

    const handleMouseUp = () => setIsDragging(false)
    const handleMouseLeave = () => setIsDragging(false)

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()

        if (e.ctrlKey || e.metaKey) {
            const delta = e.deltaY > 0 ? -0.05 : 0.05
            setScale(prev => Math.min(Math.max(prev + delta, 0.2), 2))
        } else {
            if (e.shiftKey) {
                setPan(prev => ({
                    ...prev,
                    x: prev.x - e.deltaY
                }))
            } else {
                setPan(prev => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }))
            }
        }
    }

    const handleCopy = async (frame: DesignFrame) => {
        if (isCopying || !onCopyToFigma) return
        setIsCopying(true)
        try {
            await onCopyToFigma(frame)
            setCopiedId(frame.id)
            setTimeout(() => setCopiedId(null), 2000)
        } finally {
            setIsCopying(false)
        }
    }

    const handleSavePng = async (frame: DesignFrame) => {
        if (isSaving) return
        const element = frameRefs.current[frame.id]
        if (!element) return

        setIsSaving(true)
        try {
            const dataUrl = await toPng(element, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#1a1a1a'
            })

            const link = document.createElement('a')
            link.download = `${frame.name.replace(/[^a-z0-9]/gi, '_')}_${frame.device}.png`
            link.href = dataUrl
            link.click()

            setSavedId(frame.id)
            setTimeout(() => setSavedId(null), 2000)
        } catch (err) {
            console.error('Failed to save PNG:', err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex-1 relative flex flex-col bg-background overflow-hidden">
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-card/80 backdrop-blur-md rounded-xl p-1 border border-border">
                <button
                    onClick={handleZoomOut}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut size={16} />
                </button>
                <div className="px-3 text-xs font-medium text-foreground min-w-[50px] text-center">
                    {Math.round(scale * 100)}%
                </div>
                <button
                    onClick={handleZoomIn}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn size={16} />
                </button>
                <div className="w-px h-5 bg-border mx-1" />
                <button
                    onClick={handleReset}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    title="Reset View"
                >
                    <Move size={16} />
                </button>
            </div>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                className={`flex-1 relative overflow-hidden canvas-grid ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
            >
                {!project ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-3xl bg-card border border-border flex items-center justify-center mb-6">
                            <LayoutGrid size={32} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">Ready to design</h3>
                        <p className="text-sm text-muted-foreground max-w-[300px] text-center">
                            Describe your UI and watch the magic happen. Your designs will appear here.
                        </p>
                    </div>
                ) : (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                    >
                        <div className="flex items-start gap-8 p-8">
                            {/* Render ALL frames in the project */}
                            {project.frames.map((frame) => (
                                <div
                                    key={frame.id}
                                    onClick={() => onSelectFrame(frame.id)}
                                    className="relative cursor-pointer group flex-shrink-0"
                                >
                                    {/* Frame Header */}
                                    <div className="absolute -top-10 left-0 right-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2">
                                            {frame.device === 'mobile' ?
                                                <Smartphone size={14} className="text-muted-foreground" /> :
                                                <Monitor size={14} className="text-muted-foreground" />
                                            }
                                            <span className="text-xs text-muted-foreground font-medium truncate max-w-[150px]">
                                                {frame.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/* Save PNG Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSavePng(frame)
                                                }}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${savedId === frame.id
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-card text-foreground hover:bg-secondary'
                                                    }`}
                                            >
                                                {isSaving ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : savedId === frame.id ? (
                                                    <>
                                                        <Check size={12} />
                                                        <span>Saved!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download size={12} />
                                                        <span>PNG</span>
                                                    </>
                                                )}
                                            </button>
                                            {/* Copy Figma Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleCopy(frame)
                                                }}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${copiedId === frame.id
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-card text-foreground hover:bg-secondary'
                                                    }`}
                                            >
                                                {isCopying ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : copiedId === frame.id ? (
                                                    <>
                                                        <Check size={12} />
                                                        <span>Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={12} />
                                                        <span>Figma</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Device Frame */}
                                    <div
                                        ref={(el) => { frameRefs.current[frame.id] = el }}
                                        className={`
                      relative bg-background overflow-hidden shadow-2xl transition-all duration-300
                      ${project.activeFrameId === frame.id
                                                ? 'ring-2 ring-primary/50'
                                                : 'border border-border'}
                    `}
                                        style={{
                                            width: frame.device === 'mobile' ? '375px' : '1440px',
                                            height: frame.device === 'mobile' ? '812px' : '900px',
                                            borderRadius: frame.device === 'mobile' ? '40px' : '12px',
                                        }}
                                    >
                                        <div className={`w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar ${isDragging ? 'pointer-events-none' : ''}`}>
                                            {frame.status === 'pending' ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 size={32} className="animate-spin text-primary" />
                                                        <span className="text-xs text-muted-foreground">Generating...</span>
                                                    </div>
                                                </div>
                                            ) : frame.status === 'error' ? (
                                                <div className="flex items-center justify-center h-full text-destructive text-sm">
                                                    Failed to generate. Try again.
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-full h-full"
                                                    dangerouslySetInnerHTML={{ __html: frame.html }}
                                                />
                                            )}
                                        </div>

                                        {/* Mobile Notch */}
                                        {frame.device === 'mobile' && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-background rounded-b-3xl pointer-events-none z-50 border-b border-border" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Canvas
