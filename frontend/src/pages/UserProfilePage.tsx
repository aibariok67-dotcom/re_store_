import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, ArrowLeft, Shield, Crown, Calendar, Gamepad2, ChevronRight, Heart } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getUserById } from '../api/auth'
import { getUserReviews } from '../api/reviews'
import { getFavorites, getUserFavorites } from '../api/favorites'
import { getUploadUrl } from '../api/client'
import { UserAvatar } from '../components/UserAvatar'
import { GameCard } from '../components/GameCard'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../utils/cn'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const { isAuthenticated } = useAuth()
  const [tab, setTab] = useState<'favorites' | 'reviews'>('favorites')

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: () => getUserReviews(userId),
    enabled: !!userId,
  })

  const { data: userFavorites = [] } = useQuery({
    queryKey: ['user-favorites', userId],
    queryFn: () => getUserFavorites(userId),
    enabled: !!userId,
  })

  const { data: myFavorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated,
  })
  const myFavoriteIds = new Set(myFavorites.map((g) => g.id))

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-8 animate-pulse">
        <div className="card overflow-hidden max-w-4xl mx-auto !p-0">
          <div className="h-[clamp(9.5rem,24vw,17rem)] sm:h-[clamp(11rem,28vw,19rem)] bg-surface-2" />
          <div className="px-4 sm:px-8 pb-6 flex flex-row items-start gap-3 -mt-12 sm:-mt-14 relative">
            <div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-2xl bg-surface-2 ring-[3px] sm:ring-4 ring-surface shrink-0" />
            <div className="flex-1 min-w-0 space-y-2 pt-0.5">
              <div className="h-6 bg-surface-2 rounded w-2/5 max-w-[12rem]" />
              <div className="h-4 bg-surface-2 rounded w-24" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-24 text-gray-500">
        <p className="text-lg font-semibold text-gray-400">Пользователь не найден</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">На главную</Link>
      </div>
    )
  }

  const bannerUrl = getUploadUrl(user.banner_url)
  const joinDate = format(new Date(user.created_at), 'd MMMM yyyy', { locale: ru })

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 min-h-11 px-4 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all text-[15px] font-semibold mb-8"
      >
        <ArrowLeft size={18} strokeWidth={2} />
        Назад
      </Link>

      <div className="card mb-8 overflow-hidden border-white/[0.08] !p-0 max-w-4xl mx-auto">
        {/* Banner */}
        <div className="relative w-full h-[clamp(9.5rem,24vw,17rem)] sm:h-[clamp(11rem,28vw,19rem)] overflow-hidden">
          {user.is_premium && bannerUrl ? (
            <>
              <img
                src={bannerUrl}
                alt=""
                className="block w-full h-full object-cover object-center"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/45 to-transparent pointer-events-none" />
            </>
          ) : user.is_premium ? (
            <>
              <div className="w-full h-full bg-premium-gradient opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/45 to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface-2 via-surface to-surface-2" />
          )}
        </div>

        {/* На телефоне — строка «аватар | текст», иначе ник и ADMIN уезжают к краю карточки */}
        <div
          className={cn(
            'px-4 sm:px-8 pb-6 sm:pb-8 flex flex-row items-start sm:items-end gap-3 sm:gap-6 -mt-12 sm:-mt-14 relative'
          )}
        >
          <UserAvatar
            user={user}
            size={72}
            className="ring-[3px] sm:ring-4 ring-surface shadow-lg shrink-0"
          />

          <div className="flex-1 min-w-0 sm:pb-1 pt-0.5 sm:pt-0">
            <h1 className="text-lg sm:text-2xl font-black text-white break-words leading-tight">
              {user.username}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 max-w-full">
              {user.is_admin && (
                <span className="badge-admin flex items-center gap-1 shrink-0">
                  <Shield size={10} />
                  ADMIN
                </span>
              )}
              {user.is_premium && (
                <span className="badge-premium flex items-center gap-1 shrink-0">
                  <Crown size={10} />
                  PREMIUM
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
              <Calendar size={11} />
              На сайте с {joinDate}
            </div>
          </div>

          <div className="hidden sm:flex items-end gap-5 shrink-0">
            <div className="text-center px-1">
              <div className="text-2xl font-extrabold text-white">{userFavorites.length}</div>
              <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5 font-medium">Избранное</div>
            </div>
            <div className="w-px h-8 bg-border mb-1" />
            <div className="text-center px-1">
              <div className="text-2xl font-extrabold text-white">{reviews.length}</div>
              <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5 font-medium">Отзывы</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap gap-1.5 mb-5 bg-surface-2/90 rounded-xl p-1.5 w-full sm:w-fit border border-white/[0.08] max-w-full">
          <button
            type="button"
            className={cn(
              'px-5 min-h-10 rounded-lg text-sm font-bold transition-all',
              tab === 'favorites'
                ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            )}
            onClick={() => setTab('favorites')}
          >
            Избранное
            {userFavorites.length > 0 && (
              <span
                className={cn(
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-md',
                  tab === 'favorites' ? 'bg-white/20' : 'bg-surface text-gray-500'
                )}
              >
                {userFavorites.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={cn(
              'px-5 min-h-10 rounded-lg text-sm font-bold transition-all',
              tab === 'reviews'
                ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            )}
            onClick={() => setTab('reviews')}
          >
            Отзывы
            {reviews.length > 0 && (
              <span
                className={cn(
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-md',
                  tab === 'reviews' ? 'bg-white/20' : 'bg-surface text-gray-500'
                )}
              >
                {reviews.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'favorites' && (
          userFavorites.length === 0 ? (
            <div className="text-center py-14 text-gray-600">
              <Heart size={32} className="mx-auto mb-3 opacity-15" />
              <p className="text-sm font-medium text-gray-500">В избранном пусто</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 md:hidden">
                {userFavorites.map((game) => (
                  <GameCard
                    key={`uf-sm-${game.id}`}
                    game={game}
                    isFavorite={myFavoriteIds.has(game.id)}
                    compact
                  />
                ))}
              </div>
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {userFavorites.map((game) => (
                  <GameCard
                    key={`uf-lg-${game.id}`}
                    game={game}
                    isFavorite={myFavoriteIds.has(game.id)}
                  />
                ))}
              </div>
            </>
          )
        )}

        {tab === 'reviews' && (
          reviews.length === 0 ? (
            <div className="text-center py-14 text-gray-600">
              <Star size={32} className="mx-auto mb-3 opacity-15" />
              <p className="text-sm font-medium text-gray-500">Пользователь еще не оставлял отзывов</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="card p-3.5 sm:p-4">
                  <div className="flex items-start gap-3 mb-2.5">
                    <Link
                      to={`/games/${r.game_id}`}
                      className="shrink-0 touch-manipulation rounded-lg overflow-hidden ring-1 ring-white/[0.08] bg-surface-2 w-[3.25rem] h-[4.05rem] sm:w-14 sm:h-[4.375rem]"
                    >
                      {r.game_image_url ? (
                        <img
                          src={getUploadUrl(r.game_image_url)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Gamepad2 size={20} strokeWidth={1.5} />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <Link
                        to={`/games/${r.game_id}`}
                        className="group inline-flex min-w-0 max-w-[min(100%,18rem)] touch-manipulation items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.08] px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm shadow-black/20 transition-colors hover:border-primary/50 hover:bg-primary/15 sm:max-w-md"
                      >
                        <span className="min-w-0 truncate">
                          {r.game_title?.trim() || `Игра #${r.game_id}`}
                        </span>
                        <ChevronRight
                          size={14}
                          strokeWidth={2}
                          className="shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-light sm:w-4 sm:h-4"
                        />
                      </Link>
                      <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold shrink-0">
                        <Star size={12} className="fill-yellow-400" />
                        {r.rating}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{r.text}</p>
                  <p className="text-xs text-gray-600 mt-2.5 font-medium">
                    {format(new Date(r.created_at), 'd MMM yyyy', { locale: ru })}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
