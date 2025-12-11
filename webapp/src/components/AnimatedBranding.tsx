'use client'

import React, { useEffect, useRef } from 'react'

interface AnimatedBrandingProps {
    children?: React.ReactNode
}

const AnimatedBranding: React.FC<AnimatedBrandingProps> = ({ children }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        // Animation state - multiple floating orbs
        const orbs: Array<{
            x: number
            y: number
            radius: number
            vx: number
            vy: number
            targetX: number
            targetY: number
            color: string
            alpha: number
            alphaDir: number
        }> = []

        // Color palette from Figma design
        const colors = [
            'rgba(5, 150, 105, 0.6)',    // emerald-600
            'rgba(6, 114, 82, 0.5)',     // emerald-700
            'rgba(6, 78, 59, 0.4)',      // emerald-800
            'rgba(16, 163, 127, 0.5)',   // primary green
            'rgba(2, 44, 34, 0.3)',      // emerald-950
        ]

        // Initialize orbs
        const numOrbs = 5
        for (let i = 0; i < numOrbs; i++) {
            orbs.push({
                x: Math.random() * canvas.offsetWidth,
                y: Math.random() * canvas.offsetHeight,
                radius: 200 + Math.random() * 300,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                targetX: Math.random() * canvas.offsetWidth,
                targetY: Math.random() * canvas.offsetHeight,
                color: colors[i % colors.length],
                alpha: 0.3 + Math.random() * 0.4,
                alphaDir: Math.random() > 0.5 ? 0.001 : -0.001
            })
        }

        // Animation loop
        let animationId: number
        let lastTargetUpdate = Date.now()

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            // Guard: skip if canvas has no size yet
            if (width === 0 || height === 0) {
                animationId = requestAnimationFrame(animate)
                return
            }

            // Clear with dark background
            ctx.fillStyle = 'rgba(0, 0, 0, 1)'
            ctx.fillRect(0, 0, width, height)

            // Randomly update target positions every 3-6 seconds
            const now = Date.now()
            if (now - lastTargetUpdate > 3000 + Math.random() * 3000) {
                const orbIndex = Math.floor(Math.random() * orbs.length)
                orbs[orbIndex].targetX = Math.random() * width
                orbs[orbIndex].targetY = Math.random() * height
                lastTargetUpdate = now
            }

            // Update and draw orbs
            orbs.forEach((orb) => {
                // Smoothly move towards target
                const dx = orb.targetX - orb.x
                const dy = orb.targetY - orb.y
                orb.x += dx * 0.002 + orb.vx
                orb.y += dy * 0.002 + orb.vy

                // Add slight random drift
                orb.vx += (Math.random() - 0.5) * 0.02
                orb.vy += (Math.random() - 0.5) * 0.02

                // Dampen velocity
                orb.vx *= 0.99
                orb.vy *= 0.99

                // Bounce off edges softly
                if (orb.x < -orb.radius) orb.x = width + orb.radius
                if (orb.x > width + orb.radius) orb.x = -orb.radius
                if (orb.y < -orb.radius) orb.y = height + orb.radius
                if (orb.y > height + orb.radius) orb.y = -orb.radius

                // Animate alpha
                orb.alpha += orb.alphaDir
                if (orb.alpha > 0.7 || orb.alpha < 0.2) {
                    orb.alphaDir *= -1
                }

                // Draw radial gradient
                const gradient = ctx.createRadialGradient(
                    orb.x, orb.y, 0,
                    orb.x, orb.y, orb.radius
                )
                gradient.addColorStop(0, orb.color.replace(/[\d.]+\)$/, `${orb.alpha})`))
                gradient.addColorStop(0.5, orb.color.replace(/[\d.]+\)$/, `${orb.alpha * 0.5})`))
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

                ctx.fillStyle = gradient
                ctx.fillRect(0, 0, width, height)
            })

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            cancelAnimationFrame(animationId)
        }
    }, [])

    return (
        <div className="relative w-full h-full overflow-hidden">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ opacity: 0.96 }}
            />
            <div className="absolute inset-0 flex items-center justify-center z-10">
                {children}
            </div>
        </div>
    )
}

export default AnimatedBranding
