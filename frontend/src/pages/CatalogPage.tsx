import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal, MessagesSquare } from 'lucide-react'
import { getGames } from '../api/games'
import { getCategories } from '../api/categories'
import { getPlatforms } from '../api/platforms'
import { getFavorites } from '../api/favorites'
import { GameCard } from '../components/GameCard'
import { useDebounce } from '../hooks/useDebounce'
import { useAuth } from '../hooks/useAuth'
import type { GamesListParams } from '../types'
import { cn } from '../utils/cn'

function NoGamesIcon() {
  return (
    <svg className="mx-auto w-16 h-16 opacity-15" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="20" width="48" height="32" rx="6" stroke="currentColor" strokeWidth="3" />
      <path d="M20 36h8M24 32v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="35" r="2.5" fill="currentColor" />
      <circle cx="46" cy="41" r="2.5" fill="currentColor" />
      <path d="M26 12c0-4 12-4 12 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

const SORT_OPTIONS = [
  { value: '', label: 'По умолчанию' },
  { value: 'rating_desc', label: 'Рейтинг (выс.)' },
  { value: 'rating_asc', label: 'Рейтинг (низ.)' },
  { value: 'date_desc', label: 'Новые' },
  { value: 'date_asc', label: 'Старые' },
]

export default function CatalogPage() {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([])
  const [sort, setSort] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minRating, setMinRating] = useState('')
  const [developer, setDeveloper] = useState('')
  const [publisher, setPublisher] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(search, 350)

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

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated,
  })

  const favoriteIds = new Set(favorites.map((g) => g.id))

  const params: GamesListParams = {
    search: debouncedSearch || undefined,
    category_ids: selectedCategories.length ? selectedCategories : undefined,
    platform_ids: selectedPlatforms.length ? selectedPlatforms : undefined,
    min_rating: minRating ? Number(minRating) : undefined,
    developer: developer || undefined,
    publisher: publisher || undefined,
    release_date_from: dateFrom || undefined,
    release_date_to: dateTo || undefined,
    page,
    limit: 20,
  }

  if (sort) {
    const [field, order] = sort.split('_')
    params.sort_by = field === 'rating' ? 'rating' : 'release_date'
    params.order = order as 'asc' | 'desc'
  }

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games', params],
    queryFn: () => getGames(params),
  })

  const { data: suggestions = [] } = useQuery({
    queryKey: ['games-suggest', debouncedSearch],
    queryFn: () => getGames({ search: debouncedSearch, limit: 6 }),
    enabled: debouncedSearch.length >= 2,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleCategory = (id: number) => {
    setPage(1)
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const togglePlatform = (id: number) => {
    setPage(1)
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategories([])
    setSelectedPlatforms([])
    setSort('')
    setMinRating('')
    setDeveloper('')
    setPublisher('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasFilters =
    search || selectedCategories.length || selectedPlatforms.length ||
    sort || minRating || developer || publisher || dateFrom || dateTo

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-5 rounded-2xl border border-white/[0.07] bg-surface/35 backdrop-blur-sm px-4 py-3.5 sm:px-5 sm:py-3.5 flex gap-3 sm:gap-3.5 items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/25 text-primary-light">
          <MessagesSquare size={18} strokeWidth={2} />
        </div>
        <p className="text-sm font-semibold text-gray-200 sm:text-[15px] leading-snug">
          Отзывы игроков и рейтинг на странице игры — главный ориентир, что поиграть дальше.
        </p>
      </div>

      <div ref={searchRef} className="relative mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center min-h-[3.25rem] bg-surface/90 border border-white/[0.08] rounded-xl focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-primary/15 transition-all shadow-lg shadow-black/20">
            <Search size={20} className="ml-4 text-gray-500 flex-shrink-0" strokeWidth={2} />
            <input
              className="flex-1 bg-transparent px-3 py-3 text-[15px] text-white placeholder-gray-500 focus:outline-none"
              placeholder="     Поиск по названию..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
                setShowAutocomplete(true)
              }}
              onFocus={() => search.length >= 2 && setShowAutocomplete(true)}
            />
            {search && (
              <button
                type="button"
                className="mr-2 btn-icon min-h-10 min-w-10 border-0 bg-transparent hover:bg-white/10"
                onClick={() => { setSearch(''); setPage(1) }}
                aria-label="Очистить поиск"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}
          </div>
          <div className="flex gap-2 sm:flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                'btn-secondary flex-1 sm:flex-initial min-h-[3.25rem] px-5',
                showAdvanced && 'border-primary/45 text-primary-light bg-primary/10'
              )}
            >
              <SlidersHorizontal size={18} strokeWidth={2} />
              <span className="hidden sm:inline">Фильтры</span>
              {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-icon min-h-[3.25rem] min-w-[3.25rem] text-red-400 hover:text-red-300 hover:bg-red-500/15 border-red-500/20"
                aria-label="Сбросить фильтры"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Autocomplete dropdown */}
        {showAutocomplete && suggestions.length > 0 && debouncedSearch.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 card !p-0 z-30 overflow-hidden animate-slide-down border-white/10">
            {suggestions.map((g) => (
              <a
                key={g.id}
                href={`/games/${g.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors"
                onClick={() => setShowAutocomplete(false)}
              >
                <span className="text-sm text-white font-semibold">{g.title}</span>
                {g.categories.length > 0 && (
                  <span className="text-xs text-gray-500">{g.categories[0].name}</span>
                )}
                {g.rating !== undefined && g.rating !== null && (
                  <span className="ml-auto text-xs font-bold text-yellow-400 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>
                    {g.rating}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Filter panel */}
      {showAdvanced && (
        <div className="card p-5 mb-5 animate-slide-down space-y-5">
          {/* Categories */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Жанр</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleCategory(c.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all border min-h-10',
                    selectedCategories.includes(c.id)
                      ? 'bg-primary/20 border-primary/40 text-primary-light'
                      : 'border-white/[0.08] text-gray-400 hover:border-primary/30 hover:text-white'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Платформа</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all border min-h-10',
                    selectedPlatforms.includes(p.id)
                      ? 'bg-primary/20 border-primary/40 text-primary-light'
                      : 'border-white/[0.08] text-gray-400 hover:border-primary/30 hover:text-white'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced filters row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Мин. рейтинг</label>
              <input
                type="number"
                className="input"
                placeholder="1-10"
                min={1}
                max={10}
                step={0.1}
                value={minRating}
                onChange={(e) => { setMinRating(e.target.value); setPage(1) }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Разработчик</label>
              <input
                className="input"
                placeholder="Capcom..."
                value={developer}
                onChange={(e) => { setDeveloper(e.target.value); setPage(1) }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Дата от</label>
              <input
                type="date"
                className="input"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Дата до</label>
              <input
                type="date"
                className="input"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400 font-medium">Сортировка:</label>
            <div className="flex gap-1.5 flex-wrap">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setPage(1) }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold border transition-all min-h-10',
                    sort === opt.value
                      ? 'bg-primary/20 border-primary/40 text-primary-light'
                      : 'border-white/[0.08] text-gray-400 hover:text-white'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {(selectedCategories.length > 0 || selectedPlatforms.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {selectedCategories.map((id) => {
            const cat = categories.find((c) => c.id === id)
            return cat ? (
              <span
                key={id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/15 border border-primary/25 text-primary-light rounded-lg text-xs font-semibold"
              >
                {cat.name}
                <button onClick={() => toggleCategory(id)} className="hover:text-white transition-colors">
                  <X size={11} />
                </button>
              </span>
            ) : null
          })}
          {selectedPlatforms.map((id) => {
            const pl = platforms.find((p) => p.id === id)
            return pl ? (
              <span
                key={id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-2 border border-border text-gray-300 rounded-lg text-xs font-semibold"
              >
                {pl.name}
                <button onClick={() => togglePlatform(id)} className="hover:text-white transition-colors">
                  <X size={11} />
                </button>
              </span>
            ) : null
          })}
        </div>
      )}

      {/* Games grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card rounded-2xl overflow-hidden !p-0">
              <div className="aspect-[3/4] bg-surface-2 animate-pulse" />
              <div className="p-3.5 space-y-2.5">
                <div className="h-4 bg-surface-2 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-surface-2 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-28 text-gray-500">
          <NoGamesIcon />
          <p className="text-xl font-bold text-gray-400 mt-5">Ничего не найдено</p>
          <p className="text-sm mt-1.5 text-gray-600">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorite={favoriteIds.has(game.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {games.length === 20 || page > 1 ? (
        <div className="flex justify-center items-center gap-3 mt-10">
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Назад
          </button>
          <span className="text-sm text-gray-500 font-medium px-3">Стр. {page}</span>
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={games.length < 20}
          >
            Вперед
          </button>
        </div>
      ) : null}
    </div>
  )
}
