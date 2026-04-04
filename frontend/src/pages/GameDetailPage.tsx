import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star, Calendar, Building2, BookOpen, Heart, ArrowLeft, Trash2, Image as ImageIcon, MessagesSquare,
  ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { getGame } from '../api/games'
import { getGameReviews, createReview, deleteReview } from '../api/reviews'
import { addFavorite, removeFavorite, getFavorites } from '../api/favorites'
import { uploadImage } from '../api/uploads'
import { getUploadUrl } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { UserAvatar } from '../components/UserAvatar'
import { ImageCropperModal } from '../components/ImageCropperModal'
import { Modal } from '../components/Modal'
import { postGameReviewsAISummary } from '../api/ai'
import type { GameReviewsAISummary, Review } from '../types'
import { cn } from '../utils/cn'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

/** Совпадает с AI_REVIEWS_MIN_COUNT на бэкенде по умолчанию */
const MIN_REVIEWS_FOR_AI = 3

const THEME_RING: Record<string, string> = {
  indigo: 'ring-indigo-500/40',
  sky: 'ring-sky-500/40',
  emerald: 'ring-emerald-500/40',
  rose: 'ring-rose-500/40',
  amber: 'ring-amber-500/40',
  violet: 'ring-violet-500/40',
  cyan: 'ring-cyan-500/40',
  black: 'ring-zinc-400/40',
  white: 'ring-slate-200/45',
}

function reviewsCountLabel(n: number): string {
  if (n <= 0) return ''
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return ` · ${n} отзывов`
  if (mod10 === 1) return ` · ${n} отзыв`
  if (mod10 >= 2 && mod10 <= 4) return ` · ${n} отзыва`
  return ` · ${n} отзывов`
}

function CloseIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const gameId = Number(id)
  const { user, isAuthenticated } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [rating, setRating] = useState('')
  const [text, setText] = useState('')
  const [reviewImageUrl, setReviewImageUrl] = useState<string>('')
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [imgError, setImgError] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null)
  const [reviewFormOpen, setReviewFormOpen] = useState(true)
  const [aiSummary, setAiSummary] = useState<GameReviewsAISummary | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => getGame(gameId),
    enabled: !!gameId,
  })

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', gameId],
    queryFn: () => getGameReviews(gameId),
    enabled: !!gameId,
  })

  useEffect(() => {
    setAiSummary(null)
    setAiError(null)
    setAiLoading(false)
  }, [gameId])

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated,
  })

  const isFavorite = favorites.some((g) => g.id === gameId)

  const toggleFav = useMutation({
    mutationFn: () => isFavorite ? removeFavorite(gameId) : addFavorite(gameId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
    onError: () => toast.error('Ошибка'),
  })

  const submitReview = useMutation({
    mutationFn: () =>
      createReview({
        game_id: gameId,
        rating: Number(rating),
        text,
        image_url: reviewImageUrl || undefined,
      }),
    onSuccess: () => {
      toast.success('Отзыв добавлен')
      setRating('')
      setText('')
      setReviewImageUrl('')
      qc.invalidateQueries({ queryKey: ['reviews', gameId] })
      qc.invalidateQueries({ queryKey: ['game', gameId] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Ошибка отправки отзыва')
    },
  })

  const removeReview = useMutation({
    mutationFn: (rid: number) => deleteReview(rid),
    onSuccess: () => {
      toast.success('Отзыв удален')
      qc.invalidateQueries({ queryKey: ['reviews', gameId] })
      qc.invalidateQueries({ queryKey: ['game', gameId] })
      setReviewToDelete(null)
    },
    onError: () => toast.error('Ошибка'),
  })

  async function runAiReviewsSummary() {
    if (!isAuthenticated) {
      toast.error('Войдите в аккаунт, чтобы запустить AI-анализ отзывов')
      return
    }
    if (reviews.length < MIN_REVIEWS_FOR_AI) {
      toast.error(`Нужно минимум ${MIN_REVIEWS_FOR_AI} отзыва для анализа`)
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const data = await postGameReviewsAISummary(gameId)
      setAiSummary(data)
      toast.success('AI-анализ готов')
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? 'Не удалось получить AI-анализ'
      setAiError(msg)
      toast.error(msg)
    } finally {
      setAiLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFile(file)
    setCropOpen(true)
    e.target.value = ''
  }

  const handleCropDone = async (blob: Blob) => {
    try {
      const url = await uploadImage(blob, 'review.jpg')
      setReviewImageUrl(url)
      toast.success('Изображение загружено')
    } catch {
      toast.error('Ошибка загрузки изображения')
    }
  }

  if (gameLoading) {
    return (
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-5 bg-surface rounded w-24 mb-6" />
        <div className="flex gap-8 lg:gap-12">
          <div className="w-52 lg:w-72 xl:w-80 aspect-[4/5] bg-surface rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-surface rounded w-2/3" />
            <div className="h-4 bg-surface rounded w-1/3" />
            <div className="h-24 bg-surface rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="text-center py-24 text-gray-500">
        <p className="text-lg font-semibold text-gray-400">Игра не найдена</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">На главную</button>
      </div>
    )
  }

  const imageUrl = getUploadUrl(game.image_url)
  const showImage = imageUrl && !imgError
  const userHasReview = reviews.some((r) => r.user_id === user?.id)

  return (
    <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 min-h-11 px-3 sm:px-4 -ml-1 sm:-ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all text-[15px] lg:text-base font-semibold mb-6 sm:mb-8 touch-manipulation"
      >
        <ArrowLeft size={18} strokeWidth={2} />
        Все игры
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 lg:gap-12 xl:gap-14 mb-10 sm:mb-12 lg:mb-14">
        <div className="w-full max-w-[min(100%,260px)] mx-auto sm:mx-0 sm:max-w-none sm:w-64 lg:w-72 xl:w-80 flex-shrink-0">
          <div className="rounded-2xl lg:rounded-3xl overflow-hidden card aspect-[4/5] !p-0 border-white/[0.08] shadow-glow-sm">
            {showImage ? (
              <img
                src={imageUrl}
                alt={game.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white opacity-10">
                <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="22" width="64" height="42" rx="8" stroke="currentColor" strokeWidth="3.5" />
                  <path d="M25 43h10M30 38v10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="52" cy="42" r="3.5" fill="currentColor" />
                  <circle cx="60" cy="50" r="3.5" fill="currentColor" />
                  <path d="M32 14c0-6 16-6 16 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-4">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-[2.75rem] font-black text-white leading-tight tracking-tight min-w-0 order-1">
              {game.title}
            </h1>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => toggleFav.mutate()}
                className={cn(
                  'flex items-center justify-center gap-2 min-h-11 lg:min-h-12 px-5 lg:px-6 rounded-xl border transition-all w-full sm:w-auto sm:flex-shrink-0 text-[15px] lg:text-base font-semibold touch-manipulation order-2',
                  isFavorite
                    ? 'bg-red-500/15 border-red-500/35 text-red-400'
                    : 'border-white/[0.1] text-gray-300 hover:border-red-500/35 hover:text-red-400 hover:bg-red-500/5'
                )}
              >
                <Heart size={18} strokeWidth={2} className={cn('lg:w-5 lg:h-5', isFavorite && 'fill-red-400')} />
                {isFavorite ? 'В избранном' : 'В избранное'}
              </button>
            )}
          </div>

          {/* Рейтинги: IMDb (админка) и средняя по отзывам на сайте */}
          {(game.rating != null || game.reviews_rating_avg != null) && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-5">
              {game.rating != null && (
                <div className="flex flex-col gap-1 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-5 lg:py-3.5 bg-amber-500/10 border border-amber-400/25 min-w-0 sm:min-w-[11rem]">
                  <div className="flex items-center gap-2.5">
                    <Star size={18} className="lg:w-5 lg:h-5 text-amber-400 fill-amber-400 shrink-0" strokeWidth={2} />
                    <span className="text-xl lg:text-2xl font-extrabold text-white tabular-nums">{game.rating}</span>
                    <span className="text-sm lg:text-base text-gray-500 font-medium">/ 10</span>
                  </div>
                  <span className="text-xs lg:text-sm text-amber-200/75 font-medium leading-snug">Рейтинг IMDb</span>
                </div>
              )}
              {game.reviews_rating_avg != null && (
                <div className="flex flex-col gap-1 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-5 lg:py-3.5 bg-emerald-500/10 border border-emerald-400/25 min-w-0 sm:min-w-[11rem]">
                  <div className="flex items-center gap-2.5">
                    <MessagesSquare size={18} className="lg:w-5 lg:h-5 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span className="text-xl lg:text-2xl font-extrabold text-white tabular-nums">{game.reviews_rating_avg}</span>
                    <span className="text-sm lg:text-base text-gray-500 font-medium">/ 10</span>
                  </div>
                  <span className="text-xs lg:text-sm text-emerald-200/75 font-medium leading-snug">
                    Средняя оценка на сайте
                    {reviewsCountLabel(reviews.length)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Genres & platforms */}
          {game.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {game.categories.map((c) => (
                <span key={c.id} className="badge-primary">{c.name}</span>
              ))}
            </div>
          )}
          {game.platforms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {game.platforms.map((p) => (
                <span key={p.id} className="badge bg-surface-2 border border-border text-gray-400">{p.name}</span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm lg:text-base mb-5">
            {game.developer && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Building2 size={14} className="text-gray-600 flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
                <span className="text-gray-500 shrink-0">Разработчик</span>
                <span className="text-white font-medium min-w-0 break-words">{game.developer}</span>
              </div>
            )}
            {game.publisher && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Building2 size={14} className="text-gray-600 flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
                <span className="text-gray-500 shrink-0">Издатель</span>
                <span className="text-white font-medium min-w-0 break-words">{game.publisher}</span>
              </div>
            )}
            {game.release_date && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Calendar size={14} className="text-gray-600 flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
                <span className="text-gray-500 shrink-0">Дата выхода</span>
                <span className="text-white font-medium tabular-nums">{game.release_date}</span>
              </div>
            )}
            {game.series && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <BookOpen size={14} className="text-gray-600 flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
                <span className="text-gray-500 shrink-0">Серия</span>
                <span className="text-white font-medium min-w-0 break-words">{game.series}</span>
              </div>
            )}
          </div>

          {game.description && (
            <p className="text-gray-400 text-sm lg:text-[15px] lg:leading-relaxed leading-relaxed max-w-4xl">{game.description}</p>
          )}
        </div>
      </div>

      {/* Reviews section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 lg:mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl lg:text-2xl font-extrabold text-white">Отзывы</h2>
            <span className="text-xs lg:text-sm font-semibold text-gray-500 bg-surface-2 px-2.5 py-1 lg:px-3 rounded-lg border border-border">
              {reviews.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void runAiReviewsSummary()}
            disabled={
              reviewsLoading
              || aiLoading
              || reviews.length < MIN_REVIEWS_FOR_AI
            }
            title={
              reviews.length < MIN_REVIEWS_FOR_AI
                ? `Нужно минимум ${MIN_REVIEWS_FOR_AI} отзыва`
                : !isAuthenticated
                  ? 'Войдите в аккаунт'
                  : undefined
            }
            className={cn(
              'inline-flex items-center justify-center gap-2 min-h-11 px-4 lg:px-5 rounded-xl border text-[15px] font-semibold transition-all touch-manipulation',
              'border-violet-500/35 text-violet-200 hover:bg-violet-500/10 hover:border-violet-400/45',
              'disabled:opacity-40 disabled:pointer-events-none'
            )}
          >
            <Sparkles size={18} strokeWidth={2} className="shrink-0 text-violet-300" />
            {aiLoading ? 'Анализ…' : 'AI-анализ отзывов'}
          </button>
        </div>

        {!isAuthenticated && reviews.length >= MIN_REVIEWS_FOR_AI && (
          <p className="text-xs text-gray-500 mb-4 -mt-2">
            Войдите, чтобы запросить AI-сводку (нужен аккаунт).
          </p>
        )}

        {aiSummary && (
          <div className="card p-5 sm:p-6 lg:p-7 mb-8 border-violet-500/20 bg-violet-950/[0.12]">
            <h3 className="text-base lg:text-lg font-bold text-violet-200 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" strokeWidth={2} />
              AI-сводка по отзывам
            </h3>
            <p className="text-sm lg:text-[15px] text-gray-200 leading-relaxed mb-4">{aiSummary.summary}</p>
            {aiSummary.positives.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wide mb-1.5">Плюсы</p>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-0.5">
                  {aiSummary.positives.map((p, i) => (
                    <li key={`${i}-${p}`}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSummary.negatives.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-rose-400/90 uppercase tracking-wide mb-1.5">Минусы</p>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-0.5">
                  {aiSummary.negatives.map((n, i) => (
                    <li key={`${i}-${n}`}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-gray-400 border-t border-white/[0.06] pt-3 mt-2 leading-relaxed">
              <span className="text-gray-500 font-medium">Вывод: </span>
              {aiSummary.conclusion}
            </p>
          </div>
        )}

        {aiError && !aiSummary && (
          <p className="text-sm text-rose-400/90 mb-6">{aiError}</p>
        )}

        {/* Review form */}
        {isAuthenticated && !userHasReview && (
          <div className="card p-6 sm:p-7 lg:p-8 mb-8 border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 lg:mb-5">
              <h3 className="text-base lg:text-lg font-bold text-white">Написать отзыв</h3>
              <button
                type="button"
                onClick={() => setReviewFormOpen((o) => !o)}
                className="btn-ghost min-h-10 px-3 text-sm font-semibold text-gray-400 hover:text-white"
              >
                {reviewFormOpen ? (
                  <>
                    <ChevronUp size={18} strokeWidth={2} />
                    Свернуть
                  </>
                ) : (
                  <>
                    <ChevronDown size={18} strokeWidth={2} />
                    Развернуть
                  </>
                )}
              </button>
            </div>
            {reviewFormOpen && (
            <form
              onSubmit={(e) => { e.preventDefault(); submitReview.mutate() }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs lg:text-sm text-gray-400 mb-1.5 font-medium">Оценка (1-10)</label>
                <input
                  type="number"
                  className="input w-28"
                  min={1}
                  max={10}
                  step={0.1}
                  placeholder="8.5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs lg:text-sm text-gray-400 mb-1.5 font-medium">Ваш отзыв</label>
                <textarea
                  className="input min-h-24 lg:min-h-32 resize-none"
                  placeholder="Поделитесь впечатлениями..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
              </div>

              {/* Image upload */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs lg:text-sm text-gray-500 hover:text-primary-light cursor-pointer transition-colors font-medium">
                  <ImageIcon size={14} className="lg:w-[18px] lg:h-[18px]" />
                  Прикрепить картинку (широкий формат 2:1)
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
                {reviewImageUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={getUploadUrl(reviewImageUrl)}
                      className="h-8 w-8 rounded object-cover"
                      alt=""
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-300 text-xs"
                      onClick={() => setReviewImageUrl('')}
                    >
                      <CloseIcon size={13} />
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={submitReview.isPending}>
                {submitReview.isPending ? 'Отправляю...' : 'Отправить'}
              </button>
            </form>
            )}
          </div>
        )}

        {userHasReview && (
          <div className="text-sm text-gray-500 mb-5 font-medium">Вы уже оставили отзыв на эту игру</div>
        )}

        {/* Reviews list */}
        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card p-4 animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-2xl bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-2 rounded w-1/4" />
                  <div className="h-3 bg-surface-2 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-14 text-gray-600">
            <p className="font-medium">Отзывов пока нет. Будьте первым!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={user?.id}
                isAdmin={user?.is_admin}
                onRequestDelete={setReviewToDelete}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={reviewToDelete !== null}
        onClose={() => setReviewToDelete(null)}
        title="Вы уверены?"
        size="sm"
      >
        <p className="text-gray-300 text-sm mb-5">
          Удалить этот отзыв? Действие нельзя отменить.
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => setReviewToDelete(null)}>
            Отмена
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={removeReview.isPending}
            onClick={() => reviewToDelete !== null && removeReview.mutate(reviewToDelete)}
          >
            {removeReview.isPending ? 'Удаляю…' : 'Удалить'}
          </button>
        </div>
      </Modal>

      {/* Image cropper for review */}
      {cropFile && (
        <ImageCropperModal
          open={cropOpen}
          file={cropFile}
          onClose={() => { setCropOpen(false); setCropFile(null) }}
          onDone={handleCropDone}
          aspect={2}
        />
      )}
    </div>
  )
}

function ReviewCard({
  review,
  currentUserId,
  isAdmin,
  onRequestDelete,
}: {
  review: Review
  currentUserId?: number
  isAdmin?: boolean
  onRequestDelete: (id: number) => void
}) {
  const themeRing = review.is_premium && review.premium_theme
    ? THEME_RING[review.premium_theme] || THEME_RING.indigo
    : ''

  return (
    <div
      className={cn(
        'card p-4 lg:p-5 flex gap-3.5 lg:gap-4',
        review.is_premium && `ring-1 ${themeRing}`
      )}
    >
      <Link to={`/users/${review.user_id}`} className="flex-shrink-0">
        <UserAvatar
          user={{
            username: review.username ?? '—',
            avatar_url: review.avatar_url,
            is_premium: review.is_premium ?? false,
            premium_theme: review.premium_theme ?? 'indigo',
          }}
          size={44}
          className="hover:ring-2 hover:ring-primary/40 transition-all"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <Link
              to={`/users/${review.user_id}`}
              className="text-sm lg:text-[15px] font-semibold text-white hover:text-primary-light transition-colors"
            >
              {review.username ?? 'Пользователь'}
            </Link>
            {review.is_premium && (
              <span className="badge-premium text-[10px]">PREMIUM</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-sm font-bold text-yellow-400">
              <Star size={12} className="fill-yellow-400" />
              {review.rating}
            </span>
            {(currentUserId === review.user_id || isAdmin) && (
              <button
                type="button"
                onClick={() => onRequestDelete(review.id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-950/30"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm lg:text-[15px] text-gray-300 leading-relaxed">{review.text}</p>
        {review.image_url && (
          <img
            src={getUploadUrl(review.image_url)}
            alt=""
            className="mt-3 rounded-lg lg:rounded-xl w-full max-w-3xl max-h-52 lg:max-h-80 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <p className="text-xs text-gray-600 mt-2.5 font-medium">
          {format(new Date(review.created_at), 'd MMM yyyy', { locale: ru })}
        </p>
      </div>
    </div>
  )
}
