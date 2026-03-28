import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'relative w-full card border-white/10 animate-fade-in overflow-hidden',
          sizes[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon min-h-11 min-w-11 border-0 bg-white/[0.06] hover:bg-white/10"
              aria-label="Закрыть"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        )}
        <div className="p-6 sm:p-7">{children}</div>
      </div>
    </div>
  )
}
