import type { PremiumTheme } from '../types'

export function applyTheme(theme: PremiumTheme | null | undefined) {
  const root = document.documentElement
  if (theme && theme !== 'indigo') {
    root.setAttribute('data-theme', theme)
  } else {
    root.removeAttribute('data-theme')
  }
}

export const THEME_LABELS: Record<PremiumTheme, string> = {
  indigo: 'Индиго',
  sky: 'Небо',
  emerald: 'Изумруд',
  rose: 'Роза',
}

export const THEME_COLORS: Record<PremiumTheme, string> = {
  indigo: '#6366f1',
  sky: '#0ea5e9',
  emerald: '#10b981',
  rose: '#f43f5e',
}
