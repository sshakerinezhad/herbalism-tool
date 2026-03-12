'use client'

import { ReactNode, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
}

export function Modal({ open, onClose, children, title, className = '' }: ModalProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEsc)
        document.body.style.overflow = ''
      }
    }
  }, [open, handleEsc])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Content */}
      <div
        className={`
          relative elevation-floating top-edge-highlight rounded-lg
          animate-modal-in max-w-lg w-full mx-4
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-sepia-700/40">
            <h2 className="font-heading text-lg text-vellum-50">{title}</h2>
            <button
              onClick={onClose}
              className="text-vellum-400 hover:text-vellum-200 transition-colors"
              aria-label="Close"
            >
              &#10005;
            </button>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
