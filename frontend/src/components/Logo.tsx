import { cn } from '../utils/cn'

/** Марка: два «кейса» + треугольник — читается как витрина / запуск, подстраивается под тему (currentColor). */
export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={cn('shrink-0 text-primary', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="4" y="12" width="22" height="26" rx="7" className="fill-current opacity-[0.35]" />
      <rect x="14" y="2" width="22" height="26" rx="7" className="fill-current" />
      <path
        d="M22 11.5v17l9.5-8.5L22 11.5z"
        className="fill-white/30"
      />
    </svg>
  )
}

interface LogoFullProps {
  className?: string
  /** Только иконка на узких экранах */
  compact?: boolean
  size?: number
}

export function LogoFull({ className, compact = false, size = 42 }: LogoFullProps) {
  return (
    <span className={cn('flex items-center gap-2.5 sm:gap-3', className)}>
      <span className="relative flex items-center justify-center rounded-[14px] bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-1.5 ring-1 ring-white/10 shadow-lg shadow-black/30">
        <LogoMark size={size - 6} className="text-primary-light drop-shadow-sm" />
      </span>
      <span className={cn('flex flex-col leading-none', compact && 'hidden sm:flex')}>
        <span className="font-black text-[1.15rem] sm:text-xl tracking-tight text-white">
          Re<span className="text-primary-light">Store</span>
        </span>
        <span className="text-[0.65rem] uppercase tracking-[0.22em] text-gray-500 font-bold mt-1 hidden sm:block">
          Каталог игр
        </span>
      </span>
    </span>
  )
}
