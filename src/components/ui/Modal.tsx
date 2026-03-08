// Reusable modal — centered dialog on desktop, bottom sheet on mobile
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../../hooks/useIsMobile'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
}

export function Modal({ isOpen, onClose, title, children, width = '480px' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 6, 15, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        // Mobile: slide up from bottom; Desktop: center
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '0' : '24px',
      }}
    >
      <div
        style={{
          background: '#0c0c1e',
          border: '1px solid #18183a',
          // Mobile: full-width bottom sheet with rounded top corners
          // Desktop: centered card
          borderRadius: isMobile ? '16px 16px 0 0' : '12px',
          width: isMobile ? '100%' : width,
          maxWidth: '100%',
          maxHeight: isMobile ? '92dvh' : '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          // Mobile: slide-in animation
          animation: isMobile ? 'slideUp 0.22s ease-out' : undefined,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #18183a',
          flexShrink: 0,
        }}>
          {/* Mobile: drag handle indicator */}
          {isMobile && (
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '36px',
              height: '4px',
              background: '#18183a',
              borderRadius: '9999px',
            }} />
          )}
          <h2 style={{
            margin: 0,
            fontSize: '16px',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            color: '#eeeef8',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              color: '#6b6b9e',
              fontSize: '20px',
              lineHeight: 1,
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeeef8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
