'use client'

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

  const handleGenerate = async (prompt: string, device: DeviceType, createNewFrame?: boolean) => {
    setIsGenerating(true)

    // If no active project, create new project with first frame
    if (!activeProjectId) {
      const projectId = generateId()
      const frameId = generateId()

      const newFrame: DesignFrame = {
        id: frameId,
        name: prompt.slice(0, 25) + (prompt.length > 25 ? '...' : ''),
        html: '',
        device,
        x: 0,
        y: 0,
        status: 'pending',
        timestamp: Date.now()
      }

      const newProject: DesignProject = {
        id: projectId,
        title: prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
        description: prompt,
        frames: [newFrame],
        timestamp: Date.now(),
        activeFrameId: frameId
      }

      setProjects(prev => [newProject, ...prev])
      setActiveProjectId(projectId)

      // Simulate AI generation
      setTimeout(() => {
        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              frames: p.frames.map(f => {
                if (f.id === frameId) {
                  return { ...f, html: generateMockHtml(prompt), status: 'completed' as const }
                }
                return f
              })
            }
          }
          return p
        }))
        setIsGenerating(false)
      }, 2000)

    } else if (createNewFrame) {
      // Add new frame to existing project
      const frameId = generateId()
      const existingFrameCount = activeProject?.frames.length || 0

      const newFrame: DesignFrame = {
        id: frameId,
        name: prompt.slice(0, 25) + (prompt.length > 25 ? '...' : ''),
        html: '',
        device,
        x: existingFrameCount * 420, // Position next to existing frames
        y: 0,
        status: 'pending',
        timestamp: Date.now()
      }

      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            frames: [...p.frames, newFrame],
            activeFrameId: frameId
          }
        }
        return p
      }))

      // Simulate AI generation
      setTimeout(() => {
        setProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
            return {
              ...p,
              frames: p.frames.map(f => {
                if (f.id === frameId) {
                  return { ...f, html: generateMockHtml(prompt), status: 'completed' as const }
                }
                return f
              })
            }
          }
          return p
        }))
        setIsGenerating(false)
      }, 2000)

    } else {
      // Update current frame (edit mode)
      const currentFrameId = activeProject?.activeFrameId

      // Update to pending status
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            frames: p.frames.map(f => {
              if (f.id === currentFrameId) {
                return {
                  ...f,
                  name: prompt.slice(0, 25) + (prompt.length > 25 ? '...' : ''),
                  status: 'pending' as const
                }
              }
              return f
            })
          }
        }
        return p
      }))

      // Simulate AI generation
      setTimeout(() => {
        setProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
            return {
              ...p,
              title: prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
              frames: p.frames.map(f => {
                if (f.id === currentFrameId) {
                  return {
                    ...f,
                    html: generateMockHtml(prompt),
                    timestamp: Date.now(),
                    status: 'completed' as const
                  }
                }
                return f
              })
            }
          }
          return p
        }))
        setIsGenerating(false)
      }, 2000)
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

  const handleCopyToFigma = async (frame: DesignFrame) => {
    console.log('Copy to Figma:', frame)
    try {
      await navigator.clipboard.writeText(frame.html)
      console.log('HTML copied to clipboard')
    } catch (err) {
      console.error('Copy failed:', err)
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
