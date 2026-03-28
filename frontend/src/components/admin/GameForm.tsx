import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ImageIcon, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { getCategories } from '../../api/categories'
import { getPlatforms } from '../../api/platforms'
import { createGame, updateGame } from '../../api/games'
import { uploadImage } from '../../api/uploads'
import { getUploadUrl } from '../../api/client'
import { ImageCropperModal } from '../ImageCropperModal'
import type { Game, GameCreate } from '../../types'
import { cn } from '../../utils/cn'

interface GameFormProps {
  game?: Game
  onSuccess?: () => void
}

export function GameForm({ game, onSuccess }: GameFormProps) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const isEdit = !!game

  const [title, setTitle] = useState(game?.title ?? '')
  const [description, setDescription] = useState(game?.description ?? '')
  const [developer, setDeveloper] = useState(game?.developer ?? '')
  const [publisher, setPublisher] = useState(game?.publisher ?? '')
  const [series, setSeries] = useState(game?.series ?? '')
  const [releaseDate, setReleaseDate] = useState(game?.release_date ?? '')
  const [aliases, setAliases] = useState(game?.aliases ?? '')
  const [rating, setRating] = useState(game?.rating?.toString() ?? '')
  const [imageUrl, setImageUrl] = useState(game?.image_url ?? '')
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    game?.categories.map((c) => c.id) ?? []
  )
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>(
    game?.platforms.map((p) => p.id) ?? []
  )
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  })

  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
    staleTime: Infinity,
  })

  const saveMut = useMutation({
    mutationFn: () => {
      const data: GameCreate = {
        title: title.trim(),
        description: description.trim() || undefined,
        developer: developer.trim() || undefined,
        publisher: publisher.trim() || undefined,
        series: series.trim() || undefined,
        release_date: releaseDate || undefined,
        aliases: aliases.trim() || undefined,
        rating: rating ? Number(rating) : undefined,
        image_url: imageUrl || undefined,
        category_ids: selectedCategories,
        platform_ids: selectedPlatforms,
      }
      return isEdit ? updateGame(game.id, data) : createGame(data)
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? 'Игра обновлена' : 'Игра создана')
      qc.invalidateQueries({ queryKey: ['games'] })
      if (onSuccess) {
        onSuccess()
      } else {
        navigate(`/games/${saved.id}`)
      }
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      toast.error((detail as string) || 'Ошибка сохранения')
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFile(file)
    setCropOpen(true)
    e.target.value = ''
  }

  const handleCropDone = async (blob: Blob) => {
    try {
      const url = await uploadImage(blob, 'game-cover.jpg')
      setImageUrl(url)
      toast.success('Обложка загружена')
    } catch {
      toast.error('Ошибка загрузки')
    }
  }

  const toggleCat = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const togglePl = (id: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-6">
        {isEdit ? `Редактировать: ${game.title}` : 'Создать игру'}
      </h2>

      <form
        onSubmit={(e) => { e.preventDefault(); saveMut.mutate() }}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left column */}
          <div className="space-y-4 order-2 lg:order-1">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Название *</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Resident Evil 4 Remake"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Псевдонимы (через запятую)</label>
              <input
                className="input"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="RE4, Biohazard 4"
              />
              <p className="text-xs text-gray-600 mt-1">Используются в поиске</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Разработчик</label>
              <input className="input" value={developer} onChange={(e) => setDeveloper(e.target.value)} placeholder="Capcom" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Издатель</label>
              <input className="input" value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Capcom" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Серия</label>
              <input className="input" value={series} onChange={(e) => setSeries(e.target.value)} placeholder="Resident Evil" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Дата выхода</label>
              <input type="date" className="input" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Рейтинг IMDb (0–10)</label>
              <input
                type="number"
                className="input"
                placeholder="8.5"
                min={0}
                max={10}
                step={0.1}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Официальный или справочный рейтинг с IMDb. Оценки игроков на сайте считаются отдельно и показываются на странице игры.
              </p>
            </div>
          </div>

          {/* Right column: крупная обложка как в каталоге */}
          <div className="space-y-4 order-1 lg:order-2">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Обложка</label>
              <div className="relative group max-w-md mx-auto lg:max-w-none lg:mx-0">
                {imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/5] w-full max-w-[420px] lg:max-w-none mx-auto lg:mx-0 border border-white/[0.08] shadow-xl shadow-black/40 ring-1 ring-white/[0.06]">
                    <img
                      src={getUploadUrl(imageUrl)}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                      <label className="cursor-pointer btn-secondary min-h-11 px-4 gap-2">
                        <ImageIcon size={18} strokeWidth={2} />
                        Заменить
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                      </label>
                      <button
                        type="button"
                        className="btn-danger min-h-11 px-4 gap-2"
                        onClick={() => setImageUrl('')}
                      >
                        <X size={18} strokeWidth={2} />
                        Убрать
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-[4/5] max-w-[420px] lg:max-w-none min-h-[260px] mx-auto lg:mx-0 rounded-2xl border-2 border-dashed border-border hover:border-primary/45 cursor-pointer transition-colors bg-surface-2/80">
                    <ImageIcon size={40} strokeWidth={1.5} className="text-gray-500 mb-3" />
                    <span className="text-sm font-semibold text-gray-400">Загрузить обложку</span>
                    <span className="text-xs text-gray-600 mt-1">Формат обложки 4:5 (чуть шире, чем классическое 3:4)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Описание</label>
              <textarea
                className="input min-h-28 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание игры..."
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Жанры</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCat(c.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border transition-all',
                  selectedCategories.includes(c.id)
                    ? 'bg-primary border-primary text-white'
                    : 'border-border text-gray-400 hover:border-primary/50 hover:text-white'
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Platforms */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Платформы</label>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePl(p.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border transition-all',
                  selectedPlatforms.includes(p.id)
                    ? 'bg-primary border-primary text-white'
                    : 'border-border text-gray-400 hover:border-primary/50 hover:text-white'
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            className="btn-primary min-h-12 px-8 text-[15px] font-bold shadow-lg shadow-primary/25"
            disabled={saveMut.isPending || !title.trim()}
          >
            {saveMut.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Сохраняю...</>
            ) : (
              isEdit ? 'Сохранить изменения' : 'Создать игру'
            )}
          </button>
          {onSuccess && (
            <button type="button" className="btn-secondary" onClick={onSuccess}>
              Отмена
            </button>
          )}
        </div>
      </form>

      {cropFile && (
        <ImageCropperModal
          open={cropOpen}
          file={cropFile}
          onClose={() => { setCropOpen(false); setCropFile(null) }}
          onDone={handleCropDone}
          aspect={4 / 5}
        />
      )}
    </div>
  )
}
