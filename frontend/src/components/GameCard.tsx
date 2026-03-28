import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Heart, MessagesSquare } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getUploadUrl } from '../api/client'
import { addFavorite, removeFavorite } from '../api/favorites'
import { useAuth } from '../hooks/useAuth'
import type { Game } from '../types'
import { cn } from '../utils/cn'

interface GameCardProps {
  game: Game
  isFavorite?: boolean
  /** Узкая карточка для плотных сеток (например, избранное в профиле) */
  compact?: boolean
}

function GamePlaceholder() {
  return (
    <svg
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-14 h-14 opacity-[0.12]"
    >
      <rect x="10" y="8" width="80" height="44" rx="8" stroke="currentColor" strokeWidth="3" />
      <path d="M28 30h8M32 26v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="65" cy="29" r="4" fill="currentColor" />
      <circle cx="72" cy="36" r="4" fill="currentColor" />
      <path d="M42 4c0-3.5 16-3.5 16 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function GameCard({ game, isFavorite = false, compact = false }: GameCardProps) {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()
  const [imgError, setImgError] = useState(false)

  const toggleFav = useMutation({
    mutationFn: () => (isFavorite ? removeFavorite(game.id) : addFavorite(game.id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      qc.invalidateQueries({ queryKey: ['games'] })
    },
    onError: () => toast.error('Ошибка'),
  })

  const imageUrl = getUploadUrl(game.image_url)
  const showImage = imageUrl && !imgError

  return (
    <Link
      to={`/games/${game.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden card border-white/[0.07] hover:border-primary/35 transition-all duration-300 hover:shadow-glow-sm',
        compact
          ? 'rounded-xl hover:-translate-y-0.5'
          : 'rounded-2xl hover:-translate-y-1.5'
      )}
    >
      <div
        className={cn(
          'bg-surface-2 relative overflow-hidden flex-shrink-0',
          compact ? 'aspect-[5/7]' : 'aspect-[3/4]'
        )}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-b from-surface-2 to-surface">
            <GamePlaceholder />
          </div>
        )}

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface via-surface/55 to-transparent pointer-events-none',
            compact ? 'h-16' : 'h-28'
          )}
        />

        {(game.rating != null || game.reviews_rating_avg != null) && (
          <div
            className={cn(
              'absolute left-2 top-2 sm:left-3 sm:top-3 flex max-w-[calc(100%-3.25rem)] flex-col gap-1 pointer-events-none',
              compact && 'left-1.5 top-1.5 sm:left-2 sm:top-2 max-w-[calc(100%-2.75rem)]'
            )}
          >
            {game.rating != null && (
              <div
                className={cn(
                  'flex flex-col gap-0.5 rounded-lg bg-black/60 backdrop-blur-md ring-1 ring-white/10',
                  compact ? 'px-1.5 py-1' : 'px-2 py-1.5 sm:rounded-xl sm:px-2.5 sm:py-1.5'
                )}
              >
                <div className={cn('flex items-center gap-1', compact ? 'gap-0.5' : 'gap-1.5')}>
                  <Star
                    size={compact ? 10 : 12}
                    className="shrink-0 text-amber-400 fill-amber-400"
                    strokeWidth={2}
                  />
                  <span
                    className={cn(
                      'font-bold text-white tabular-nums leading-none',
                      compact ? 'text-[10px]' : 'text-xs sm:text-sm'
                    )}
                  >
                    {game.rating}
                  </span>
                </div>
                <span
                  className={cn(
                    'font-semibold uppercase tracking-wide text-amber-200/80',
                    compact ? 'text-[7px] leading-tight' : 'text-[8px] sm:text-[9px]'
                  )}
                >
                  IMDb
                </span>
              </div>
            )}
            {game.reviews_rating_avg != null && (
              <div
                className={cn(
                  'flex flex-col gap-0.5 rounded-lg bg-black/60 backdrop-blur-md ring-1 ring-emerald-500/25',
                  compact ? 'px-1.5 py-1' : 'px-2 py-1.5 sm:rounded-xl sm:px-2.5 sm:py-1.5'
                )}
              >
                <div className={cn('flex items-center gap-1', compact ? 'gap-0.5' : 'gap-1.5')}>
                  <MessagesSquare
                    size={compact ? 10 : 12}
                    className="shrink-0 text-emerald-400"
                    strokeWidth={2}
                  />
                  <span
                    className={cn(
                      'font-bold text-white tabular-nums leading-none',
                      compact ? 'text-[10px]' : 'text-xs sm:text-sm'
                    )}
                  >
                    {game.reviews_rating_avg}
                  </span>
                </div>
                <span
                  className={cn(
                    'font-semibold text-emerald-200/80',
                    compact ? 'text-[7px] leading-tight' : 'text-[8px] sm:text-[9px]'
                  )}
                >
                  на сайте
                </span>
              </div>
            )}
          </div>
        )}

        {isAuthenticated && (
          <button
            type="button"
            className={cn(
              'absolute flex items-center justify-center transition-all duration-200 ring-1 ring-white/10 touch-manipulation z-[1]',
              compact
                ? 'top-2 right-2 min-h-8 min-w-8 rounded-lg'
                : 'top-3 right-3 min-h-11 min-w-11 rounded-xl',
              isFavorite
                ? 'bg-red-500/25 backdrop-blur-md text-red-400'
                : 'bg-black/45 backdrop-blur-md text-white/70 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            )}
            onClick={(e) => {
              e.preventDefault()
              toggleFav.mutate()
            }}
            aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          >
            <Heart size={compact ? 15 : 18} strokeWidth={2} className={cn(isFavorite && 'fill-red-400')} />
          </button>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col relative',
          compact ? 'px-2.5 py-2 gap-1' : 'px-4 py-3.5 gap-1.5'
        )}
      >
        <h3
          className={cn(
            'font-bold text-white leading-snug line-clamp-2 group-hover:text-primary-light transition-colors',
            compact ? 'text-[0.8rem] sm:text-[0.85rem]' : 'text-[0.95rem] sm:text-base'
          )}
        >
          {game.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          {game.categories.length > 0 ? (
            <span
              className={cn(
                'text-gray-500 truncate font-semibold',
                compact ? 'text-[10px]' : 'text-xs'
              )}
            >
              {game.categories[0].name}
              {game.categories.length > 1 && ` +${game.categories.length - 1}`}
            </span>
          ) : (
            <span />
          )}
          {game.release_date && (
            <span
              className={cn(
                'text-gray-600 font-bold tabular-nums flex-shrink-0',
                compact ? 'text-[10px]' : 'text-xs'
              )}
            >
              {game.release_date.slice(0, 4)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
