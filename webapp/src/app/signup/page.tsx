'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AnimatedBranding from '@/components/AnimatedBranding'

export default function SignUpPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setIsLoading(true)

        // Mock sign up - in real app, this would call auth API
        setTimeout(() => {
            // Store mock user data
            localStorage.setItem('time-ai-user', JSON.stringify({ email }))
            router.push('/')
        }, 1000)
    }

    const handleGoogleSignUp = () => {
        // Mock Google sign up
        setIsLoading(true)
        setTimeout(() => {
            localStorage.setItem('time-ai-user', JSON.stringify({ email: 'niwat.yahuadong@gmail.com' }))
            router.push('/')
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Side - Sign Up Form */}
            <div className="flex-1 flex items-center justify-center px-8 py-12">
                <div className="w-full max-w-[384px] flex flex-col items-center gap-6">
                    {/* Logo */}
                    <div className="w-16 h-16">
                        <Image
                            src="/assets/time_logo.svg"
                            alt="TIME AI Logo"
                            width={64}
                            height={64}
                        />
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">
                            Create an account
                        </h1>
                        <p className="text-base text-muted-foreground">
                            Enter your email below to create your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSignUp} className="w-full space-y-4">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="m@example.com"
                                className="w-full h-10 px-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-10 px-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                required
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-10 px-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                required
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-10 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-medium rounded-lg hover:from-emerald-400 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="w-full flex items-center gap-4">
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Or continue with
                        </span>
                        <div className="flex-1 h-px bg-border"></div>
                    </div>

                    {/* Google Sign Up */}
                    <button
                        onClick={handleGoogleSignUp}
                        disabled={isLoading}
                        className="w-full h-10 flex items-center justify-center gap-2 bg-card border border-border rounded-lg text-foreground font-medium hover:bg-secondary transition-all disabled:opacity-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>

                    {/* Sign In Link */}
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/signin" className="text-foreground hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>

                    {/* Terms */}
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        By clicking continue, you agree to our{' '}
                        <Link href="#" className="text-foreground hover:underline">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="#" className="text-foreground hover:underline">Privacy Policy</Link>.
                    </p>
                </div>
            </div>

            {/* Right Side - Animated Branding */}
            <div className="hidden lg:flex flex-1">
                <AnimatedBranding>
                    <div className="text-center space-y-4">
                        <h2 className="text-5xl font-bold text-white tracking-[12px]">
                            TIME AI
                        </h2>
                        <p className="text-lg text-white/90 font-light">
                            More time for what matters with your TIME AI.
                        </p>
                    </div>
                </AnimatedBranding>
            </div>
        </div>
    )
}
