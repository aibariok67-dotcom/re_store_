import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Crown, Loader2, ImageIcon, Palette, X } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { getMe } from '../api/auth'
import { buyPremium, updatePremiumProfile, disablePremium } from '../api/premium'
import { uploadImage } from '../api/uploads'
import { getUploadUrl } from '../api/client'
import { ImageCropperModal } from '../components/ImageCropperModal'
import { Modal } from '../components/Modal'
import { useState } from 'react'
import type { PremiumTheme } from '../types'
import { THEME_LABELS, THEME_COLORS } from '../utils/theme'
import { cn } from '../utils/cn'
import { useAuth } from '../hooks/useAuth'

const THEMES: PremiumTheme[] = [
  'indigo',
  'sky',
  'emerald',
  'rose',
  'amber',
  'violet',
  'cyan',
  'black',
  'white',
]

const FEATURES = [
  { icon: Palette, title: 'Цветовая тема', desc: 'Выберите цветовую тему для всего интерфейса' },
  { icon: ImageIcon, title: 'Баннер профиля', desc: 'Загрузите уникальный баннер на страницу профиля' },
  { icon: Crown, title: 'Значок Premium', desc: 'Особый значок рядом с вашим именем везде на сайте' },
]

export default function PremiumPage() {
  const { user: authUser } = useAuth()
  const qc = useQueryClient()
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [confirmBannerDelete, setConfirmBannerDelete] = useState(false)
  const [confirmDisablePremium, setConfirmDisablePremium] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!authUser,
  })

  const buyPremiumMut = useMutation({
    mutationFn: buyPremium,
    onSuccess: (data) => {
      toast.success('Премиум активирован!')
      qc.setQueryData(['me'], data)
    },
    onError: () => toast.error('Ошибка активации'),
  })

  const disablePremiumMut = useMutation({
    mutationFn: disablePremium,
    onSuccess: (data) => {
      toast.success('Премиум отключен')
      qc.setQueryData(['me'], data)
      setConfirmDisablePremium(false)
    },
    onError: () => toast.error('Ошибка'),
  })

  const changeThemeMut = useMutation({
    mutationFn: (theme: PremiumTheme) => updatePremiumProfile({ premium_theme: theme }),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data)
      toast.success('Тема изменена')
    },
    onError: () => toast.error('Ошибка'),
  })

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFile(file)
    setCropOpen(true)
    e.target.value = ''
  }

  const handleCropDone = async (blob: Blob) => {
    try {
      const url = await uploadImage(blob, 'banner.jpg')
      const updated = await updatePremiumProfile({ banner_url: url })
      qc.setQueryData(['me'], updated)
      toast.success('Баннер обновлен')
    } catch {
      toast.error('Ошибка загрузки баннера')
    }
  }

  if (!user) return null

  const bannerUrl = getUploadUrl(user.banner_url)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12">

      <div className="text-center mb-12 rounded-3xl border border-white/[0.07] bg-surface/35 backdrop-blur-sm px-6 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 mb-5 shadow-glow">
          <Crown size={32} strokeWidth={2} className="text-primary-light" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Premium</h1>
        <p className="text-gray-400 font-medium text-base max-w-md mx-auto">Персонализация профиля и интерфейса</p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/15">
              <Icon size={18} className="text-primary-light" />
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA / Settings block */}
      {!user.is_premium ? (
        <div className="card p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
          <Crown size={40} className="text-primary-light mx-auto mb-4 opacity-70" />
          <h2 className="text-xl font-extrabold text-white mb-2">Получить Premium</h2>
          <p className="text-gray-400 text-sm mb-6 font-medium">Все это -- абсолютно бесплатно</p>
          <button
            type="button"
            className="btn-primary min-h-12 px-10 text-base font-bold"
            onClick={() => buyPremiumMut.mutate()}
            disabled={buyPremiumMut.isPending}
          >
            {buyPremiumMut.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Crown size={18} />
            )}
            Активировать бесплатно
          </button>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Theme picker */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Palette size={16} className="text-primary-light" />
              <h2 className="font-bold text-white">Цветовая тема</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  onClick={() => changeThemeMut.mutate(theme)}
                  className={cn(
                    'flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all',
                    user.premium_theme === theme
                      ? 'border-white/20 bg-white/5 shadow-sm'
                      : 'border-border hover:border-white/10 hover:bg-white/[0.02]'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ background: THEME_COLORS[theme] }}
                  />
                  <span className={cn(
                    'text-sm font-semibold',
                    user.premium_theme === theme ? 'text-white' : 'text-gray-400'
                  )}>
                    {THEME_LABELS[theme]}
                  </span>
                  {user.premium_theme === theme && (
                    <Check size={14} className="text-primary-light -mt-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Banner */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <ImageIcon size={16} className="text-primary-light" />
              <h2 className="font-bold text-white">Баннер профиля</h2>
            </div>

            {bannerUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden h-48 sm:h-56 md:h-64 border border-border">
                  <img
                    src={bannerUrl}
                    alt="Баннер"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="btn-secondary cursor-pointer min-h-11 px-5">
                    <ImageIcon size={18} strokeWidth={2} />
                    Изменить
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerSelect} />
                  </label>
                  <button
                    type="button"
                    className="btn-danger min-h-11 px-5"
                    onClick={() => setConfirmBannerDelete(true)}
                  >
                    <X size={18} strokeWidth={2} />
                    Удалить
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 sm:h-56 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-surface-2/50">
                <ImageIcon size={24} className="text-gray-600 mb-2" />
                <span className="text-sm text-gray-500 font-medium">Загрузить баннер</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerSelect} />
              </label>
            )}
          </div>

          {/* Danger zone */}
          <div className="card p-5 border-red-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Отключить Premium</p>
                <p className="text-xs text-gray-500 mt-0.5">Тема и баннер будут сброшены</p>
              </div>
              <button
                type="button"
                className="btn-danger min-h-11 px-6 text-[15px] font-bold"
                onClick={() => setConfirmDisablePremium(true)}
                disabled={disablePremiumMut.isPending}
              >
                {disablePremiumMut.isPending ? 'Отключение...' : 'Отключить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/profile" className="text-sm text-gray-500 hover:text-gray-300 transition-colors font-medium">
          &larr; Вернуться в профиль
        </Link>
      </div>

      <Modal
        open={confirmBannerDelete}
        onClose={() => setConfirmBannerDelete(false)}
        title="Вы уверены?"
        size="sm"
      >
        <p className="text-gray-300 text-sm mb-5">Удалить баннер профиля?</p>
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => setConfirmBannerDelete(false)}>
            Отмена
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={async () => {
              try {
                const u = await updatePremiumProfile({ banner_url: '' })
                qc.setQueryData(['me'], u)
                toast.success('Баннер удален')
                setConfirmBannerDelete(false)
              } catch {
                toast.error('Ошибка')
              }
            }}
          >
            Удалить
          </button>
        </div>
      </Modal>

      <Modal
        open={confirmDisablePremium}
        onClose={() => setConfirmDisablePremium(false)}
        title="Вы уверены?"
        size="sm"
      >
        <p className="text-gray-300 text-sm mb-5">
          Отключить Premium? Тема и баннер будут сброшены.
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => setConfirmDisablePremium(false)}>
            Отмена
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={disablePremiumMut.isPending}
            onClick={() => disablePremiumMut.mutate()}
          >
            {disablePremiumMut.isPending ? 'Отключаю…' : 'Отключить'}
          </button>
        </div>
      </Modal>

      {cropFile && (
        <ImageCropperModal
          open={cropOpen}
          file={cropFile}
          onClose={() => { setCropOpen(false); setCropFile(null) }}
          onDone={handleCropDone}
          aspect={3}
        />
      )}
    </div>
  )
}
