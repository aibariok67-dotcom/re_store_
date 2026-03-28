import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, ExternalLink, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { getGames, deleteGame } from '../../api/games'
import { getUploadUrl } from '../../api/client'
import { GameForm } from './GameForm'
import type { Game } from '../../types'
import { Modal } from '../Modal'
import { useDebounce } from '../../hooks/useDebounce'

export function AdminGames() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editGame, setEditGame] = useState<Game | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Game | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['admin-games', debouncedSearch],
    queryFn: () => getGames({ search: debouncedSearch || undefined, limit: 100 }),
    staleTime: 0,
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteGame(id),
    onSuccess: () => {
      toast.success('Игра удалена')
      qc.invalidateQueries({ queryKey: ['admin-games'] })
      qc.invalidateQueries({ queryKey: ['games'] })
      setConfirmDelete(null)
    },
    onError: () => toast.error('Ошибка удаления'),
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-bold text-white">Игры</h2>
        <span className="text-sm text-gray-500">{games.length} игр</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            onClick={() => setSearch('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Games list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-3 animate-pulse flex gap-3">
              <div className="w-10 h-14 bg-surface-2 rounded" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-surface-2 rounded w-1/3" />
                <div className="h-2.5 bg-surface-2 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {games.map((game) => {
            const imgUrl = getUploadUrl(game.image_url)
            return (
              <div
                key={game.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center px-3 py-3 sm:py-2.5 bg-surface-2 rounded-xl border border-border hover:border-border/80 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-10 h-14 rounded overflow-hidden bg-surface flex-shrink-0">
                  {imgUrl ? (
                    <img src={imgUrl} alt={game.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{game.title}</p>
                  <p className="text-xs text-gray-500">
                    {game.developer && `${game.developer} · `}
                    {game.release_date?.slice(0, 4)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-stretch sm:items-center justify-stretch sm:justify-end gap-2">
                  <Link
                    to={`/games/${game.id}`}
                    className="btn-secondary min-h-10 flex-1 sm:flex-initial px-3 py-2 text-sm font-semibold gap-2 justify-center"
                    title="Открыть"
                  >
                    <ExternalLink size={16} strokeWidth={2} />
                    Открыть
                  </Link>
                  <button
                    type="button"
                    className="btn-primary min-h-10 flex-1 sm:flex-initial px-4 py-2 text-sm font-bold gap-2 shadow-md shadow-primary/20 justify-center"
                    title="Редактировать"
                    onClick={() => setEditGame(game)}
                  >
                    <Pencil size={16} strokeWidth={2} />
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="btn-danger min-h-10 flex-1 sm:flex-initial px-4 py-2 text-sm font-bold gap-2 justify-center"
                    title="Удалить"
                    onClick={() => setConfirmDelete(game)}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                    Удалить
                  </button>
                </div>
              </div>
            )
          })}
          {games.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">Игры не найдены</div>
          )}
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={!!editGame}
        onClose={() => setEditGame(null)}
        size="xl"
        title="Редактировать игру"
      >
        {editGame && (
          <GameForm
            game={editGame}
            onSuccess={() => {
              setEditGame(null)
              qc.invalidateQueries({ queryKey: ['games'] })
            }}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Вы уверены?"
        size="sm"
      >
        {confirmDelete && (
          <div>
            <p className="text-gray-300 text-sm mb-5">
              Удалить игру <strong className="text-white">{confirmDelete.title}</strong>? Действие нельзя отменить.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>
                Отмена
              </button>
              <button
                className="btn-danger"
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? 'Удаляю...' : 'Удалить'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
