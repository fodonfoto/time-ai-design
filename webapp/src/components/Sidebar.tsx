'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DesignProject } from '@/types'
import { Plus, ChevronRight, Clock, LayoutGrid, Layers, Trash2, X, AlertTriangle, Settings } from 'lucide-react'

interface SidebarProps {
    projects: DesignProject[]
    activeProjectId: string | null
    onSelectProject: (id: string) => void
    onNew: () => void
    onDelete?: (id: string) => void
    userEmail?: string
}

// Delete Confirmation Modal Component
interface DeleteModalProps {
    isOpen: boolean
    projectTitle: string
    onConfirm: () => void
    onCancel: () => void
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, projectTitle, onConfirm, onCancel }) => {
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
                <h3 className="text-lg font-semibold text-foreground mb-2">Delete Project?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Are you sure you want to delete <span className="font-medium text-foreground">&quot;{projectTitle}&quot;</span>?
                    This action cannot be undone.
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
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

// User Avatar Component
const UserAvatar: React.FC<{ email: string }> = ({ email }) => {
    const initials = email
        .split('@')[0]
        .split('.')
        .map(part => part[0]?.toUpperCase() || '')
        .join('')
        .slice(0, 2) || 'U'

    return (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
            {initials}
        </div>
    )
}

const Sidebar: React.FC<SidebarProps> = ({
    projects, activeProjectId, onSelectProject, onNew, onDelete,
    userEmail = 'user@example.com'
}) => {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<DesignProject | null>(null)

    const handleDeleteClick = (e: React.MouseEvent, project: DesignProject) => {
        e.stopPropagation()
        setProjectToDelete(project)
        setDeleteModalOpen(true)
    }

    const handleConfirmDelete = () => {
        if (projectToDelete && onDelete) {
            onDelete(projectToDelete.id)
        }
        setDeleteModalOpen(false)
        setProjectToDelete(null)
    }

    const handleCancelDelete = () => {
        setDeleteModalOpen(false)
        setProjectToDelete(null)
    }

    return (
        <>
            <div className="w-[280px] min-w-[280px] max-w-[280px] flex-shrink-0 h-full bg-background border-r border-border flex flex-col z-20">
                {/* Header - TIME AI Branding */}
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Image
                                src="/assets/time_logo.svg"
                                alt="TIME AI Logo"
                                width={32}
                                height={32}
                            />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-foreground">
                            TIME AI
                        </span>
                    </div>
                </div>

                {/* New Design Button */}
                <div className="px-4 mb-6">
                    <button
                        onClick={onNew}
                        className="w-full flex items-center gap-2 bg-card hover:bg-secondary border border-border text-foreground px-4 py-2.5 rounded-xl transition-all font-medium text-sm group"
                    >
                        <Plus size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>New Design</span>
                    </button>
                </div>

                {/* Recent Projects */}
                <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
                    <div className="flex items-center gap-2 px-2 mb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <Clock size={12} />
                        <span>Recent Projects</span>
                    </div>

                    <div className="space-y-1">
                        {projects.length === 0 ? (
                            <div className="px-3 py-8 text-center">
                                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-card flex items-center justify-center">
                                    <LayoutGrid size={18} className="text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground text-xs">No projects yet.</p>
                                <p className="text-muted-foreground/60 text-[10px] mt-1">Enter a prompt to start creating.</p>
                            </div>
                        ) : (
                            projects.map((project) => (
                                <div
                                    key={project.id}
                                    className={`relative group flex items-center rounded-lg transition-all border border-transparent ${activeProjectId === project.id
                                        ? 'bg-card text-foreground border-border'
                                        : 'text-muted-foreground hover:bg-card hover:text-foreground'
                                        }`}
                                >
                                    <button
                                        onClick={() => onSelectProject(project.id)}
                                        className="flex-1 text-left flex items-center justify-between px-3 py-2.5"
                                    >
                                        <div className="flex flex-col min-w-0 pr-6">
                                            <span className="text-[13px] font-medium truncate w-full">{project.title}</span>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                                <span>{new Date(project.timestamp).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-0.5">
                                                    <Layers size={9} />
                                                    {project.frames.length} frame{project.frames.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        {activeProjectId === project.id && (
                                            <ChevronRight size={12} className="text-primary flex-shrink-0" />
                                        )}
                                    </button>

                                    {/* Delete button - shows on hover */}
                                    <button
                                        onClick={(e) => handleDeleteClick(e, project)}
                                        className="absolute right-8 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all rounded-md hover:bg-destructive/10"
                                        title="Delete project"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* User Footer with Settings Link */}
                <div className="p-4 border-t border-border">
                    <Link
                        href="/settings"
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-card transition-colors group"
                    >
                        <UserAvatar email={userEmail} />
                        <span className="flex-1 text-left text-sm text-foreground truncate">
                            {userEmail}
                        </span>
                        <Settings size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={deleteModalOpen}
                projectTitle={projectToDelete?.title || ''}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    )
}

export default Sidebar
