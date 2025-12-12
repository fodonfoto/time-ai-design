'use client'

import React, { useState, KeyboardEvent, useRef, useImperativeHandle, forwardRef } from 'react'
import { DeviceType } from '@/types'
import { Smartphone, Monitor, Sparkles, Loader2, ArrowUp, Image as ImageIcon, X } from 'lucide-react'

interface PromptBarProps {
    onSubmit: (prompt: string, device: DeviceType, createNewFrame?: boolean, image?: string) => void
    isGenerating: boolean
    hasActiveDesign?: boolean
}

export interface PromptBarRef {
    focus: () => void
}

const PromptBar = forwardRef<PromptBarRef, PromptBarProps>(({ onSubmit, isGenerating, hasActiveDesign }, ref) => {
    const [prompt, setPrompt] = useState('')
    const [device, setDevice] = useState<DeviceType>('mobile')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
        focus: () => {
            textareaRef.current?.focus()
        }
    }))

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setSelectedImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const clearImage = () => {
        setSelectedImage(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSubmit = () => {
        if (!prompt.trim() && !selectedImage || isGenerating) return

        // Check for @new_frame command
        const newFramePattern = /^@new_frame\s+/i
        const isNewFrame = newFramePattern.test(prompt.trim())

        // Extract the actual prompt (remove @new_frame if present)
        const actualPrompt = isNewFrame
            ? prompt.trim().replace(newFramePattern, '')
            : prompt.trim()

        if (!actualPrompt && !selectedImage) return

        onSubmit(actualPrompt, device, isNewFrame, selectedImage || undefined)
        setPrompt('')
        clearImage()
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-40 px-4">
            {/* Main Container */}
            <div className="relative group">
                {/* Glow Effect - TIME AI Green */}
                <div className="absolute -inset-0.5 bg-primary rounded-3xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                <div className="relative bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                    {/* Image Preview */}
                    {selectedImage && (
                        <div className="px-5 pt-4 pb-0 relative">
                            <div className="relative inline-block">
                                <img src={selectedImage} alt="Reference" className="h-16 w-auto rounded-lg border border-border/50 object-cover" />
                                <button
                                    onClick={clearImage}
                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90 transition-colors shadow-sm"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={hasActiveDesign
                                ? "Continue or type @new_frame [prompt] for new design..."
                                : "Describe your UI design..."}
                            className="w-full bg-transparent text-foreground placeholder-muted-foreground px-5 py-4 text-[15px] focus:outline-none resize-none h-[60px] custom-scrollbar"
                            disabled={isGenerating}
                        />
                    </div>

                    {/* Controls Bar */}
                    <div className="flex justify-between items-center px-3 pb-3 pt-1">
                        <div className="flex items-center gap-2">
                            {/* Device Toggles */}
                            <div className="flex items-center p-1 bg-background rounded-full border border-border">
                                <button
                                    onClick={() => setDevice('mobile')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${device === 'mobile'
                                        ? 'bg-brand-gradient text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Smartphone size={14} />
                                    <span>Mobile</span>
                                </button>
                                <button
                                    onClick={() => setDevice('desktop')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${device === 'desktop'
                                        ? 'bg-brand-gradient text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Monitor size={14} />
                                    <span>Desktop</span>
                                </button>
                            </div>

                            {/* Image Upload Button */}
                            <div className="flex items-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-2 rounded-full transition-all ${selectedImage
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                    title="Attach Image"
                                >
                                    <ImageIcon size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Submit Button - TIME AI Brand Gradient */}
                        <button
                            onClick={handleSubmit}
                            disabled={(!prompt.trim() && !selectedImage) || isGenerating}
                            className={`
                w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
                ${!prompt.trim() || isGenerating
                                    ? 'bg-secondary text-muted-foreground'
                                    : 'bg-brand-gradient text-primary-foreground hover:opacity-90'}
              `}
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={3} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            {/* Footer Branding */}
            <div
                suppressHydrationWarning
                className="text-center mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60"
            >
                <Sparkles size={10} className="text-primary" />
                <span>Powered by TIME AI 2025 V.1.0.0</span>
            </div>
        </div>
    )
})

PromptBar.displayName = 'PromptBar'

export default PromptBar
