import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '../Modal'

interface TagManagerProps {
  title: string
  items: { id: number; name: string }[]
  onCreate: (name: string) => Promise<unknown>
  onUpdate: (id: number, name: string) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
  queryKey: string[]
}

export function TagManager({ title, items, onCreate, onUpdate, onDelete, queryKey }: TagManagerProps) {
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null)

  const createMut = useMutation({
    mutationFn: () => onCreate(newName.trim()),
    onSuccess: () => {
      setNewName('')
      qc.invalidateQueries({ queryKey })
      toast.success('Создано')
    },
    onError: () => toast.error('Ошибка'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => onUpdate(id, name),
    onSuccess: () => {
      setEditId(null)
      qc.invalidateQueries({ queryKey })
      toast.success('Обновлено')
    },
    onError: () => toast.error('Ошибка'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => onDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      toast.success('Удалено')
      setPendingDelete(null)
    },
    onError: () => toast.error('Ошибка'),
  })

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">{title}</h2>

      {/* Add form */}
      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMut.mutate() }}
      >
        <input
          className="input flex-1"
          placeholder={`Новые ${title.toLowerCase()}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary min-h-11 px-6 text-[15px] font-bold shrink-0"
          disabled={!newName.trim() || createMut.isPending}
        >
          <Plus size={18} strokeWidth={2} />
          Создать
        </button>
      </form>

      {/* List */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-3 bg-surface-2 rounded-xl border border-border"
          >
            {editId === item.id ? (
              <>
                <input
                  className="input flex-1 py-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') updateMut.mutate({ id: item.id, name: editName })
                    if (e.key === 'Escape') setEditId(null)
                  }}
                />
                <button
                  type="button"
                  className="btn-primary min-h-10 px-4 py-2 text-sm"
                  onClick={() => updateMut.mutate({ id: item.id, name: editName })}
                >
                  <Check size={16} strokeWidth={2} />
                  Сохранить
                </button>
                <button
                  type="button"
                  className="btn-secondary min-h-10 px-4 py-2 text-sm"
                  onClick={() => setEditId(null)}
                >
                  <X size={16} strokeWidth={2} />
                  Отмена
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-white font-medium">{item.name}</span>
                <button
                  type="button"
                  className="btn-secondary min-h-10 px-4 py-2 text-sm font-semibold gap-2"
                  onClick={() => { setEditId(item.id); setEditName(item.name) }}
                >
                  <Pencil size={16} strokeWidth={2} />
                  Изменить
                </button>
                <button
                  type="button"
                  className="btn-danger min-h-10 px-4 py-2 text-sm font-semibold gap-2"
                  onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                  disabled={deleteMut.isPending}
                >
                  <Trash2 size={16} strokeWidth={2} />
                  Удалить
                </button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center py-6 text-gray-600 text-sm">Список пуст</p>
        )}
      </div>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Вы уверены?"
        size="sm"
      >
        {pendingDelete && (
          <>
            <p className="text-gray-300 text-sm mb-5">
              Удалить «{pendingDelete.name}»? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setPendingDelete(null)}>
                Отмена
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(pendingDelete.id)}
              >
                {deleteMut.isPending ? 'Удаляю…' : 'Удалить'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
