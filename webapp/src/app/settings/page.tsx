'use client'

import React, { useState } from 'react'
import { ArrowLeft, User, LogOut, X, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Logout Confirmation Modal
interface LogoutModalProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-[360px] w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertTriangle size={48} className="text-destructive" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">Sign Out?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Are you sure you want to sign out of your account?
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-xl font-medium text-sm hover:bg-secondary/80 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-xl font-medium text-sm hover:bg-destructive/90 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}

// User Avatar Component
const UserAvatar: React.FC<{ email: string; size?: 'sm' | 'md' | 'lg' }> = ({ email, size = 'md' }) => {
    const initials = email
        .split('@')[0]
        .split('.')
        .map(part => part[0]?.toUpperCase() || '')
        .join('')
        .slice(0, 2) || 'U'

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-primary flex items-center justify-center text-white font-semibold`}>
            {initials}
        </div>
    )
}

export default function SettingsPage() {
    const router = useRouter()
    const [logoutModalOpen, setLogoutModalOpen] = useState(false)

    // Mock user email - in real app, this would come from auth context
    const userEmail = 'niwat.yahuadong@gmail.com'

    const handleLogout = () => {
        // Clear local storage and redirect to sign in
        localStorage.removeItem('time-ai-projects-v2')
        localStorage.removeItem('time-ai-user')
        router.push('/signin')
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-border">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-semibold">Settings</h1>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto p-6">
                {/* User Profile Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <UserAvatar email={userEmail} size="lg" />
                        <span className="text-lg font-medium">{userEmail}</span>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <User size={20} className="text-muted-foreground" />
                        <span className="font-semibold text-foreground text-lg">Account</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                        Manage your account settings and preferences.
                    </p>

                    {/* Sign Out Button */}
                    <button
                        onClick={() => setLogoutModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-destructive text-white rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <LogoutModal
                isOpen={logoutModalOpen}
                onConfirm={handleLogout}
                onCancel={() => setLogoutModalOpen(false)}
            />
        </div>
    )
}
