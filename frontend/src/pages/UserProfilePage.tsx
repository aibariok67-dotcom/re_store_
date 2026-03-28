import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, ArrowLeft, Shield, Crown, Calendar, Gamepad2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getUserById } from '../api/auth'
import { getUserReviews } from '../api/reviews'
import { getUploadUrl } from '../api/client'
import { UserAvatar } from '../components/UserAvatar'
import { cn } from '../utils/cn'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)

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

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-8 animate-pulse">
        <div className="card overflow-hidden max-w-4xl mx-auto">
          <div className="h-[clamp(7.5rem,20vw,15rem)] sm:h-[clamp(8.5rem,22vw,17rem)] bg-surface-2" />
          <div className="p-6 flex gap-4 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 ring-4 ring-surface" />
            <div className="flex-1 space-y-3 pt-6">
              <div className="h-6 bg-surface-2 rounded w-1/3" />
              <div className="h-4 bg-surface-2 rounded w-1/4" />
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
        <div className="relative w-full h-[clamp(7.5rem,20vw,15rem)] sm:h-[clamp(8.5rem,22vw,17rem)] overflow-hidden">
          {user.is_premium && bannerUrl ? (
            <>
              <img
                src={bannerUrl}
                alt=""
                className="w-full h-full object-cover object-[76%_42%] sm:object-[74%_40%]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/70" />
            </>
          ) : user.is_premium ? (
            <>
              <div className="w-full h-full bg-premium-gradient opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/70" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface-2 via-surface to-surface-2" />
          )}
        </div>

        <div className={cn('p-6 sm:p-8 flex items-center gap-4 sm:gap-6 -mt-12 sm:-mt-14 relative')}>
          <UserAvatar user={user} size={80} className="ring-4 ring-surface shadow-lg" />

          <div className="flex-1 min-w-0 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user.username}</h1>
              {user.is_admin && (
                <span className="badge-admin flex items-center gap-1">
                  <Shield size={10} />
                  ADMIN
                </span>
              )}
              {!user.is_admin && user.is_premium && (
                <span className="badge-premium flex items-center gap-1">
                  <Crown size={10} />
                  PREMIUM
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar size={11} />
              На сайте с {joinDate}
            </div>
          </div>

          <div className="text-center hidden sm:block">
            <div className="text-2xl font-extrabold text-white">{reviews.length}</div>
            <div className="text-xs text-gray-500 font-medium">Отзывы</div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-4xl mx-auto flex items-center gap-3 mb-4">
        <h2 className="text-lg font-extrabold text-white">Отзывы</h2>
        <span className="text-xs font-semibold text-gray-500 bg-surface-2 px-2.5 py-1 rounded-lg border border-border">
          {reviews.length}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="max-w-4xl mx-auto text-center py-14 text-gray-600">
          <Star size={32} className="mx-auto mb-3 opacity-15" />
          <p className="text-sm font-medium text-gray-500">Пользователь еще не оставлял отзывов</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <Link
                  to={`/games/${r.game_id}`}
                  className="group inline-flex min-w-0 max-w-[min(100%,20rem)] touch-manipulation items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.08] px-3 py-2 text-sm font-bold text-white shadow-sm shadow-black/20 transition-colors hover:border-primary/50 hover:bg-primary/15 sm:max-w-md"
                >
                  <Gamepad2 size={16} strokeWidth={2} className="shrink-0 text-primary-light" />
                  <span className="min-w-0 truncate">
                    {r.game_title?.trim() || `Игра #${r.game_id}`}
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    className="shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-light"
                  />
                </Link>
                <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                  <Star size={12} className="fill-yellow-400" />
                  {r.rating}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{r.text}</p>
              <p className="text-xs text-gray-600 mt-2.5 font-medium">
                {format(new Date(r.created_at), 'd MMM yyyy', { locale: ru })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
