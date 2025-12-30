'use client'

import * as geminiService from '@/services/geminiService'
import React, { useState, useEffect, useRef } from 'react'
import { DeviceType, DesignProject, DesignFrame } from '../types'
import Sidebar from '../components/Sidebar'
import Canvas from '../components/Canvas'
import PromptBar, { PromptBarRef } from '../components/PromptBar'

const generateId = () => Math.random().toString(36).substr(2, 9)

export default function Home() {
  const [projects, setProjects] = useState<DesignProject[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const promptBarRef = useRef<PromptBarRef>(null)

  // Get active project
  const activeProject = projects.find(p => p.id === activeProjectId) || null

  // Load from localStorage on client only
  useEffect(() => {
    try {
      const saved = localStorage.getItem('time-ai-projects-v2')
      if (saved) {
        const parsed = JSON.parse(saved) as DesignProject[]
        setProjects(parsed)
      }
    } catch (e) {
      console.error('Failed to load projects:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('time-ai-projects-v2', JSON.stringify(projects))
    }
  }, [projects, isLoaded])

  // Helper to generate a single frame's content and update state
  const generateSingleFrame = async (projectId: string, frameId: string, fullPrompt: string, device: DeviceType, image?: string) => {
    try {
      const design = await geminiService.generateDesign(fullPrompt, device, image);

      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            frames: p.frames.map(f => {
              if (f.id === frameId) {
                return {
                  ...f,
                  name: design.title || f.name,
                  html: design.html,
                  status: 'completed',
                  figmaJson: design.figmaJson
                }
              }
              return f
            })
          }
        }
        return p
      }))
    } catch (e) {
      console.error(`Failed to generate frame ${frameId}`, e);
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            frames: p.frames.map(f => {
              if (f.id === frameId) {
                return { ...f, status: 'error' }
              }
              return f
            })
          }
        }
        return p
      }))
    }
  }

  const handleGenerate = async (prompt: string, device: DeviceType, createNewFrame?: boolean, image?: string) => {
    setIsGenerating(true)
    let targetProjectId = activeProjectId

    try {
      // 1. Plan the Flow (Product Manager Step)
      console.log("Planning flow for:", prompt);
      const plan = await geminiService.planUserFlow(prompt);
      console.log("Flow Plan:", plan);

      // 2. Create Project & Pending Frames
      const timestamp = Date.now();

      if (!targetProjectId) {
        // Create New Project with ALL Planned Frames
        const projectId = generateId();
        targetProjectId = projectId;

        const newFrames: DesignFrame[] = plan.map((screen, index) => ({
          id: generateId(),
          name: screen.title,
          html: '', // Pending state
          device,
          x: index * 420, // Offset each frame horizontally
          y: 0,
          status: 'pending',
          timestamp: timestamp + index
        }));

        const newProject: DesignProject = {
          id: projectId,
          title: prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
          description: prompt,
          frames: newFrames,
          timestamp: timestamp,
          activeFrameId: newFrames[0].id
        }

        setProjects(prev => [newProject, ...prev])
        setActiveProjectId(projectId)

        // Start Generation for each frame
        for (let i = 0; i < plan.length; i++) {
          const screen = plan[i];
          const frameId = newFrames[i].id;
          await generateSingleFrame(targetProjectId, frameId, screen.title + ": " + screen.description, device, image);
        }

      } else {
        // Add to existing project
        const existingFrameCount = activeProject?.frames.length || 0;

        const newFrames: DesignFrame[] = plan.map((screen, index) => ({
          id: generateId(),
          name: screen.title,
          html: '',
          device,
          x: (existingFrameCount + index) * 420,
          y: 0,
          status: 'pending',
          timestamp: timestamp + index
        }));

        // Update Project with new pending frames
        setProjects(prev => prev.map(p => {
          if (p.id === targetProjectId) {
            return {
              ...p,
              frames: [...p.frames, ...newFrames],
              activeFrameId: newFrames[0].id
            }
          }
          return p
        }));

        // Generate each
        for (let i = 0; i < plan.length; i++) {
          const screen = plan[i];
          const frameId = newFrames[i].id;
          await generateSingleFrame(targetProjectId, frameId, screen.title + ": " + screen.description, device, image);
        }
      }

    } catch (error) {
      console.error('Error generating design:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper function for mock HTML generation
  const generateMockHtml = (prompt: string) => `
    <div style="min-height: 100%; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 24px;">
      <div style="max-width: 400px; margin: 0 auto;">
        <div style="text-align: center; padding: 32px 0;">
          <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">✨ Design Generated!</h1>
          <p style="color: #b3b3b3; font-size: 14px;">${prompt}</p>
        </div>
        <div style="background: rgba(16, 163, 127, 0.1); border: 1px solid rgba(16, 163, 127, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 16px;">
          <div style="height: 120px; background: linear-gradient(135deg, rgba(16, 163, 127, 0.2) 0%, rgba(16, 163, 127, 0.1) 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="font-size: 48px;">🎨</span>
          </div>
          <p style="color: #b3b3b3; font-size: 14px; text-align: center;">
            Integrate AI API for real designs
          </p>
        </div>
        <button style="width: 100%; height: 48px; background: #10a37f; border: none; border-radius: 12px; color: white; font-weight: 500; font-size: 14px; cursor: pointer;">
          Primary Action
        </button>
      </div>
    </div>
  `

  // Helper function for mock Figma JSON generation
  const generateMockJson = (prompt: string) => ({
    type: 'FRAME',
    name: prompt.substring(0, 20),
    width: 375,
    height: 812,
    fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }],
    children: [
      {
        type: 'TEXT',
        name: 'Title',
        characters: '✨ Design Generated!',
        x: 24,
        y: 60,
        fontSize: 24,
        fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
        fontName: { family: 'Inter', style: 'Bold' }
      },
      {
        type: 'TEXT',
        name: 'Subtitle',
        characters: prompt,
        x: 24,
        y: 100,
        fontSize: 14,
        fills: [{ type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.7 } }]
      },
      {
        type: 'RECTANGLE',
        name: 'Card',
        x: 24,
        y: 150,
        width: 327,
        height: 200,
        cornerRadius: 16,
        fills: [{ type: 'SOLID', color: { r: 0.06, g: 0.64, b: 0.5 }, opacity: 0.1 }],
        strokes: [{ type: 'SOLID', color: { r: 0.06, g: 0.64, b: 0.5 } }],
        strokeWeight: 1
      },
      {
        type: 'RECTANGLE',
        name: 'Button',
        x: 24,
        y: 370,
        width: 327,
        height: 48,
        cornerRadius: 12,
        fills: [{ type: 'SOLID', color: { r: 0.06, g: 0.64, b: 0.5 } }]
      },
      {
        type: 'TEXT',
        name: 'Button Text',
        characters: 'Primary Action',
        x: 135,
        y: 385,
        fontSize: 14,
        fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
        fontName: { family: 'Inter', style: 'Medium' }
      }
    ]
  })

  const handleCopyToFigma = async (frame: DesignFrame) => {
    console.log('🎯 Copy to Figma (Native Kiwi mode):', frame.id)

    if (!frame.html) {
      console.warn('No HTML available for this frame')
      alert('No design to copy. Generate a design first.')
      return
    }

    try {
      // PRIMARY: Use Kiwi binary encoder for native Figma layers
      console.log('🔄 Step 1: Converting HTML to Figma nodes...')

      // Convert HTML to Figma nodes structure
      let figmaData = frame.figmaJson
      console.log('📦 frame.figmaJson:', figmaData ? 'exists' : 'null')

      if (!figmaData && frame.html && geminiService.htmlToFigmaNodes) {
        console.log('🔄 Step 2: Using htmlToFigmaNodes...')
        figmaData = geminiService.htmlToFigmaNodes(frame.html)
        console.log('📦 htmlToFigmaNodes result:', figmaData ? JSON.stringify(figmaData).substring(0, 200) : 'null')
      }

      if (figmaData) {
        console.log('🔄 Step 3: Calling createFigmaClipboardHTML...')
        const { createFigmaClipboardHTML } = await import('../lib/figma-encoder')
        const result = await createFigmaClipboardHTML(figmaData)

        console.log('📦 Encoder result:', { success: result.success, htmlLength: result.html?.length, error: result.error })

        if (result.success && result.html) {
          // Write to clipboard as text/html with Figma format
          console.log('✅ Step 4: Writing to clipboard...')
          const blob = new Blob([result.html], { type: 'text/html' })
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': blob,
              'text/plain': new Blob([''], { type: 'text/plain' })
            })
          ])
          console.log('✅ Copied via Kiwi native format')
          alert('✅ Copied to Figma (native format)!\nPaste (Cmd+V) into Figma canvas.')
          return
        }
      }

      // If no figmaData, fall through to SVG fallback
      throw new Error('Could not convert to Figma nodes')

    } catch (err) {
      console.warn('Kiwi encoder failed, trying SVG fallback...', err)

      // FALLBACK: Use SVG clipboard mode
      try {
        const { copyHtmlAsSvg } = await import('../lib/svg-clipboard')
        console.log('🔄 Converting HTML to SVG (fallback)...')
        const result = await copyHtmlAsSvg(frame.html, 390, 844)

        if (result.ok) {
          console.log(`✅ Copied as SVG fallback (${result.mode})`)
          alert(`⚠️ Copied as SVG (fallback mode).\nPaste (Cmd+V) into Figma.\nNote: May not be fully editable.`)
          return
        }
      } catch (svgErr) {
        console.error('SVG fallback also failed:', svgErr)
      }

      // Final fallback: copy raw HTML
      try {
        await navigator.clipboard.writeText(frame.html)
        alert('Copied raw HTML. Native and SVG modes failed.')
      } catch (e) {
        console.error('All copy methods failed')
        alert('Failed to copy to clipboard. Check console.')
      }
    }
  }


  const handleNewProject = () => {
    setActiveProjectId(null)
    // Focus the prompt input
    setTimeout(() => {
      promptBarRef.current?.focus()
    }, 100)
  }

  const handleSelectFrame = (frameId: string) => {
    if (activeProject) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, activeFrameId: frameId }
        }
        return p
      }))
    }
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    // If the deleted project was active, clear selection
    if (activeProjectId === projectId) {
      setActiveProjectId(null)
    }
  }

  return (
    <div className="flex h-screen w-screen text-foreground bg-background font-sans">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onNew={handleNewProject}
        onDelete={handleDeleteProject}
        userEmail="niwat.yahuadong@gmail.com"
      />

      <main className="flex-1 relative flex flex-col h-full">
        <Canvas
          project={activeProject}
          onSelectFrame={handleSelectFrame}
          onCopyToFigma={handleCopyToFigma}
        />

        <PromptBar
          ref={promptBarRef}
          onSubmit={handleGenerate}
          isGenerating={isGenerating}
          hasActiveDesign={!!activeProjectId}
        />
      </main>
    </div>
  )
}
