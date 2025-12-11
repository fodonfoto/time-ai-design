'use client'

import React, { useState, KeyboardEvent, useRef, useImperativeHandle, forwardRef } from 'react'
import { DeviceType } from '@/types'
import { Smartphone, Monitor, Sparkles, Loader2, ArrowUp } from 'lucide-react'

interface PromptBarProps {
    onSubmit: (prompt: string, device: DeviceType, createNewFrame?: boolean) => void
    isGenerating: boolean
    hasActiveDesign?: boolean
}

export interface PromptBarRef {
    focus: () => void
}

const PromptBar = forwardRef<PromptBarRef, PromptBarProps>(({ onSubmit, isGenerating, hasActiveDesign }, ref) => {
    const [prompt, setPrompt] = useState('')
    const [device, setDevice] = useState<DeviceType>('mobile')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ({
        focus: () => {
            textareaRef.current?.focus()
        }
    }))

    const handleSubmit = () => {
        if (!prompt.trim() || isGenerating) return

        // Check for @new_frame command
        const newFramePattern = /^@new_frame\s+/i
        const isNewFrame = newFramePattern.test(prompt.trim())

        // Extract the actual prompt (remove @new_frame if present)
        const actualPrompt = isNewFrame
            ? prompt.trim().replace(newFramePattern, '')
            : prompt.trim()

        if (!actualPrompt) return

        onSubmit(actualPrompt, device, isNewFrame)
        setPrompt('')
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

                        {/* Submit Button - TIME AI Brand Gradient */}
                        <button
                            onClick={handleSubmit}
                            disabled={!prompt.trim() || isGenerating}
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
            <div className="text-center mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                <Sparkles size={10} className="text-primary" />
                <span>Powered by TIME AI 2025 V.1.0.0</span>
            </div>
        </div>
    )
})

PromptBar.displayName = 'PromptBar'

export default PromptBar
