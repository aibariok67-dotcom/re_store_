import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Edit2, Star, Heart, Trash2, Eye, EyeOff,
  Calendar, Crown, Shield, Camera, Gamepad2, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMe, updateMe } from '../api/auth'
import { getMyReviews, deleteReview } from '../api/reviews'
import { getFavorites } from '../api/favorites'
import { uploadImage } from '../api/uploads'
import { getUploadUrl } from '../api/client'
import { UserAvatar } from '../components/UserAvatar'
import { ImageCropperModal } from '../components/ImageCropperModal'
import { GameCard } from '../components/GameCard'
import { Modal } from '../components/Modal'
import { cn } from '../utils/cn'

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center px-2 sm:px-3">
      <div className="text-xl font-extrabold text-white">{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  )
}

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const qc = useQueryClient()

  const [tab, setTab] = useState<'favorites' | 'reviews'>('favorites')
  const [editOpen, setEditOpen] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null)

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!authUser,
  })

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: getMyReviews,
  })

  const deleteReviewMut = useMutation({
    mutationFn: (id: number) => deleteReview(id),
    onSuccess: () => {
      toast.success('Отзыв удален')
      qc.invalidateQueries({ queryKey: ['my-reviews'] })
      setReviewToDelete(null)
    },
    onError: () => toast.error('Ошибка'),
  })

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFile(file)
    setCropOpen(true)
    e.target.value = ''
  }

  const handleCropDone = async (blob: Blob) => {
    try {
      const url = await uploadImage(blob, 'avatar.jpg')
      const updated = await updateMe({ avatar_url: url })
      qc.setQueryData(['me'], updated)
      toast.success('Аватар обновлен')
    } catch {
      toast.error('Ошибка загрузки')
    }
  }

  if (!user) return null

  const bannerUrl = getUploadUrl(user.banner_url)
  const joinDate = format(new Date(user.created_at), 'd MMMM yyyy', { locale: ru })

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-7 sm:py-9">
      <div className="max-w-4xl mx-auto w-full space-y-7">

      <div className="card overflow-hidden border-white/[0.08] !p-0">
        {/* Обложка: внутренний «кадр», не полоса на всю ширину лейаута */}
        <div className="relative px-3 pt-3 sm:px-4 sm:pt-4 group">
          <div className="relative h-[9.25rem] sm:h-[10.5rem] md:h-44 overflow-hidden rounded-2xl ring-1 ring-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {user.is_premium && bannerUrl ? (
              <>
                <img
                  src={bannerUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-[center_32%] scale-[1.01]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div
                  className="absolute inset-0 opacity-45 mix-blend-overlay bg-gradient-to-br from-surface/80 via-transparent to-transparent pointer-events-none"
                  aria-hidden
                />
              </>
            ) : user.is_premium ? (
              <div className="h-full w-full bg-premium-gradient opacity-85" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-surface-2 via-surface to-surface-2" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/55 to-surface/5 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />

            {user.is_premium && (
              <Link
                to="/premium"
                className="absolute bottom-3 right-3 z-[2] flex items-center gap-2 min-h-10 px-3.5 rounded-xl bg-black/50 backdrop-blur-md text-sm font-semibold text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/65 ring-1 ring-white/10"
              >
                <Camera size={16} strokeWidth={2} />
                Баннер
              </Link>
            )}
          </div>
        </div>

        {/* Avatar + info row */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 -mt-10 sm:-mt-11 relative z-[1]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            {/* Верхняя строка на телефоне: аватар + ник; счётчики — отдельной строкой на всю ширину */}
            <div className="flex flex-row items-start gap-3 min-w-0 flex-1 sm:items-end">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <UserAvatar user={user} size={64} className="ring-2 ring-surface shadow-lg" />
                <label className="absolute inset-0 rounded-2xl cursor-pointer opacity-0 group-hover:opacity-100 bg-black/50 flex items-center justify-center transition-opacity">
                  <Camera size={18} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                </label>
              </div>

              {/* Name + badges + meta */}
              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="min-w-0 mb-1.5">
                  <h1 className="text-xl sm:text-[1.6875rem] font-black text-white tracking-tight break-words">
                    {user.username}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {user.is_admin && (
                      <span className="badge-admin flex items-center gap-1 shrink-0">
                        <Shield size={11} />
                        ADMIN
                      </span>
                    )}
                    {user.is_premium && (
                      <span className="badge-premium flex items-center gap-1 shrink-0">
                        <Crown size={11} />
                        PREMIUM
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={12} />
                  На сайте с {joinDate}
                </div>
              </div>
            </div>

            {/* Stats + actions: на телефоне отдельная строка — не наезжают на ник */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 sm:pb-1 justify-start w-full sm:w-auto sm:shrink-0">
              <StatCard value={favorites.length} label="Избранное" />
              <div className="w-px h-8 bg-border shrink-0" />
              <StatCard value={reviews.length} label="Отзывы" />
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="btn-secondary shrink-0 w-fit touch-manipulation"
              >
                <Edit2 size={16} strokeWidth={2} />
                Изменить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content tabs ── */}
      <div>
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
            {favorites.length > 0 && (
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-md',
                tab === 'favorites' ? 'bg-white/20' : 'bg-surface text-gray-500'
              )}>
                {favorites.length}
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
            Мои отзывы
            {reviews.length > 0 && (
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-md',
                tab === 'reviews' ? 'bg-white/20' : 'bg-surface text-gray-500'
              )}>
                {reviews.length}
              </span>
            )}
          </button>
        </div>

        {/* Favorites grid */}
        {tab === 'favorites' && (
          favorites.length === 0 ? (
            <div className="text-center py-[4.5rem] text-gray-600">
              <Heart size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-[0.95rem] font-semibold text-gray-400">В избранном пусто</p>
              <p className="text-sm mt-1 text-gray-600">Добавляйте игры из каталога</p>
            </div>
          ) : (
            <>
              {/* Телефон: как раньше — плотная сетка и compact */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 md:hidden">
                {favorites.map((game) => (
                  <GameCard key={`fav-sm-${game.id}`} game={game} isFavorite compact />
                ))}
              </div>
              {/* Монитор (md+): крупные карточки */}
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {favorites.map((game) => (
                  <GameCard key={`fav-lg-${game.id}`} game={game} isFavorite />
                ))}
              </div>
            </>
          )
        )}

        {/* Reviews list */}
        {tab === 'reviews' && (
          reviews.length === 0 ? (
            <div className="text-center py-[4.5rem] text-gray-600">
              <Star size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-[0.95rem] font-semibold text-gray-400">Вы еще не писали отзывов</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="card p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
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
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/games/${r.game_id}`}
                          className="group inline-flex min-w-0 max-w-full touch-manipulation items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.08] px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm shadow-black/20 transition-colors hover:border-primary/50 hover:bg-primary/15"
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
                        <button
                          type="button"
                          onClick={() => setReviewToDelete(r.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-red-950/30"
                          aria-label="Удалить отзыв"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={cn(
                              i < Math.round(r.rating / 2)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-700'
                            )}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-1.5 font-medium">{r.rating}/10</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mt-2.5 leading-relaxed">{r.text}</p>
                  {r.image_url && (
                    <img
                      src={getUploadUrl(r.image_url)}
                      alt=""
                      className="mt-3 rounded-lg max-h-44 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <p className="text-xs text-gray-600 mt-2.5 font-medium">
                    {format(new Date(r.created_at), 'd MMM yyyy', { locale: ru })}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Premium upsell -- only when NOT premium, at the very bottom ── */}
      {!user.is_premium && (
        <Link
          to="/premium"
          className="card p-4 flex items-center justify-between hover:border-primary/40 transition-all group w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/20">
              <Crown size={16} className="text-primary-light" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Получить Premium</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Тема, баннер профиля, значок -- бесплатно
              </p>
            </div>
          </div>
          <span className="text-gray-600 group-hover:text-primary-light group-hover:translate-x-0.5 transition-all text-lg">
            &rarr;
          </span>
        </Link>
      )}

      </div>

      {/* ── Modals ── */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        currentUsername={user.username}
      />

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
            disabled={deleteReviewMut.isPending}
            onClick={() => reviewToDelete !== null && deleteReviewMut.mutate(reviewToDelete)}
          >
            {deleteReviewMut.isPending ? 'Удаляю…' : 'Удалить'}
          </button>
        </div>
      </Modal>

      {cropFile && (
        <ImageCropperModal
          open={cropOpen}
          file={cropFile}
          onClose={() => { setCropOpen(false); setCropFile(null) }}
          onDone={handleCropDone}
          aspect={1}
        />
      )}
    </div>
  )
}

function PasswordField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className="input pr-11"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function EditProfileModal({
  open,
  onClose,
  currentUsername,
}: {
  open: boolean
  onClose: () => void
  currentUsername: string
}) {
  const qc = useQueryClient()
  const [username, setUsername] = useState(currentUsername)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const mut = useMutation({
    mutationFn: () =>
      updateMe({
        username: username !== currentUsername ? username : undefined,
        password: password || undefined,
      }),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data)
      toast.success('Профиль обновлен')
      onClose()
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail.map((d: { msg: string }) => d.msg).join(', '))
      } else {
        toast.error((detail as string) || 'Ошибка')
      }
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Редактировать профиль">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (password && password !== confirm) {
            toast.error('Пароли не совпадают')
            return
          }
          mut.mutate()
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
            Никнейм
          </label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
            Новый пароль
          </label>
          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder="Оставьте пустым, чтобы не менять"
          />
        </div>
        {password && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Подтверждение пароля
            </label>
            <PasswordField
              value={confirm}
              onChange={setConfirm}
              placeholder="Повторите пароль"
            />
          </div>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Сохраняю...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
