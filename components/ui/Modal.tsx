'use client'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        className={['w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] card-shadow', sizes[size]].join(' ')}
        style={{ animation: 'modalIn .15s ease-out' }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="font-bold text-[var(--text)]">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-2)] transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
    </div>
  )
}
