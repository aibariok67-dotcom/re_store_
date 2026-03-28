import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, X, Shield, Ban, UserCheck, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getAdminUsers, banUser, banUserTemp, unbanUser } from '../../api/admin'
import { UserAvatar } from '../UserAvatar'
import { Modal } from '../Modal'
import { useDebounce } from '../../hooks/useDebounce'
import type { User } from '../../types'
import { cn } from '../../utils/cn'

export function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [banModal, setBanModal] = useState<{ user: User; type: 'perm' | 'temp' } | null>(null)
  const [tempDate, setTempDate] = useState('')
  const [tempTime, setTempTime] = useState('23:59')
  const debouncedSearch = useDebounce(search, 300)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () => getAdminUsers(debouncedSearch || undefined),
  })

  const banMut = useMutation({
    mutationFn: (userId: number) => banUser(userId),
    onSuccess: () => {
      toast.success('Пользователь заблокирован')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setBanModal(null)
    },
    onError: () => toast.error('Ошибка'),
  })

  const banTempMut = useMutation({
    mutationFn: ({ userId, until }: { userId: number; until: string }) =>
      banUserTemp(userId, until),
    onSuccess: () => {
      toast.success('Временный бан установлен')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setBanModal(null)
    },
    onError: () => toast.error('Ошибка'),
  })

  const unbanMut = useMutation({
    mutationFn: (userId: number) => unbanUser(userId),
    onSuccess: () => {
      toast.success('Бан снят')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Ошибка'),
  })

  const isBanned = (user: User) => {
    if (user.is_banned) return true
    if (user.banned_until && new Date(user.banned_until) > new Date()) return true
    return false
  }

  const banStatus = (user: User) => {
    if (user.is_banned) return 'Постоянный бан'
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      return `До ${format(new Date(user.banned_until), 'd MMM yyyy HH:mm', { locale: ru })}`
    }
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Пользователи</h2>
        <span className="text-sm text-gray-500">{users.length} польз.</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="    Поиск по нику или email..."
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

      {/* Users list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-3 animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-2" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-surface-2 rounded w-1/4" />
                <div className="h-2.5 bg-surface-2 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {users.map((u) => {
            const banned = isBanned(u)
            const banInfo = banStatus(u)

            return (
              <div
                key={u.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors',
                  banned
                    ? 'bg-red-950/20 border-red-800/30'
                    : 'bg-surface-2 border-border'
                )}
              >
                <Link to={`/users/${u.id}`}>
                  <UserAvatar user={u} size={40} />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/users/${u.id}`}
                      className="text-sm font-medium text-white hover:text-primary-light transition-colors"
                    >
                      {u.username}
                    </Link>
                    {u.is_admin && (
                      <span className="badge-admin">
                        <Shield size={9} className="mr-0.5" />
                        ADMIN
                      </span>
                    )}
                    {u.is_premium && !u.is_admin && (
                      <span className="badge-premium text-xs">PREM</span>
                    )}
                    {banned && (
                      <span className="badge-banned">
                        <Ban size={9} className="mr-0.5" />
                        БАН
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  {banInfo && (
                    <p className="text-xs text-red-400/80 mt-0.5">{banInfo}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
                  {!u.is_admin && (
                    <>
                      {banned ? (
                        <button
                          type="button"
                          className="btn-primary min-h-10 px-4 py-2 text-sm font-bold gap-2 shadow-md shadow-primary/15"
                          onClick={() => unbanMut.mutate(u.id)}
                          title="Разбанить"
                          disabled={unbanMut.isPending}
                        >
                          <UserCheck size={16} strokeWidth={2} />
                          Разбанить
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn-secondary min-h-10 px-4 py-2 text-sm font-bold gap-2 border-amber-500/30 text-amber-200 hover:border-amber-400/50 hover:bg-amber-500/10"
                            title="Бан на время"
                            onClick={() => { setBanModal({ user: u, type: 'temp' }); setTempDate('') }}
                          >
                            <Clock size={16} strokeWidth={2} />
                            На время
                          </button>
                          <button
                            type="button"
                            className="btn-danger min-h-10 px-4 py-2 text-sm font-bold gap-2"
                            title="Постоянный бан"
                            onClick={() => setBanModal({ user: u, type: 'perm' })}
                          >
                            <Ban size={16} strokeWidth={2} />
                            Забанить
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">Пользователи не найдены</div>
          )}
        </div>
      )}

      {/* Ban modal */}
      <Modal
        open={!!banModal}
        onClose={() => setBanModal(null)}
        title={banModal?.type === 'perm' ? 'Постоянный бан' : 'Бан на время'}
        size="sm"
      >
        {banModal && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Пользователь: <strong className="text-white">{banModal.user.username}</strong>
            </p>

            {banModal.type === 'temp' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Дата окончания</label>
                  <input
                    type="date"
                    className="input"
                    value={tempDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setTempDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Время</label>
                  <input
                    type="time"
                    className="input"
                    value={tempTime}
                    onChange={(e) => setTempTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {banModal.type === 'perm' && (
              <p className="text-sm text-red-400 bg-red-950/20 border border-red-800/30 rounded-lg px-3 py-2">
                Пользователь будет заблокирован навсегда. Это можно отменить вручную.
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setBanModal(null)}>
                Отмена
              </button>
              <button
                className="btn-danger"
                disabled={banModal.type === 'temp' ? !tempDate : false}
                onClick={() => {
                  if (banModal.type === 'perm') {
                    banMut.mutate(banModal.user.id)
                  } else {
                    const dt = `${tempDate}T${tempTime}:00`
                    banTempMut.mutate({ userId: banModal.user.id, until: dt })
                  }
                }}
              >
                {banModal.type === 'perm' ? 'Забанить навсегда' : 'Применить бан'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
