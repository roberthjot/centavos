// Reusable modal — centered dialog on desktop, bottom sheet on mobile.
// Redesigned 2026: dark surface, hairline border, ✕ close chip.
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

export function Modal({ isOpen, onClose, title, children, width = '420px' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
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
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '0' : '20px',
      }}
    >
      <div
        style={{
          background: '#0e0e10',
          border: '1px solid #26262b',
          borderRadius: isMobile ? '16px 16px 0 0' : '16px',
          width: isMobile ? '100%' : width,
          maxWidth: '100%',
          maxHeight: isMobile ? '92dvh' : '90vh',
          display: 'flex', flexDirection: 'column',
          animation: isMobile ? 'slideUp 0.22s ease-out' : 'cnt-fade .15s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 24px 0', flexShrink: 0,
        }}>
          {isMobile && (
            <div style={{
              position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
              width: '36px', height: '4px', background: '#26262b', borderRadius: '9999px',
            }} />
          )}
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fafafa' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '7px', background: '#161619', color: '#a1a1aa', transition: 'all .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1f1f23'; e.currentTarget.style.color = '#fafafa' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#161619'; e.currentTarget.style.color = '#a1a1aa' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
