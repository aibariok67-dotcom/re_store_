import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Gamepad2, Plus, Tag, Monitor, Users, ArrowLeft } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import { getPlatforms, createPlatform, updatePlatform, deletePlatform } from '../api/platforms'
import { AdminGames } from '../components/admin/AdminGames'
import { AdminUsers } from '../components/admin/AdminUsers'
import { GameForm } from '../components/admin/GameForm'
import { TagManager } from '../components/admin/TagManager'
import { cn } from '../utils/cn'

type Tab = 'games' | 'create' | 'categories' | 'platforms' | 'users'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'games', label: 'Игры', icon: <Gamepad2 size={18} strokeWidth={2} /> },
  { id: 'create', label: 'Создать игру', icon: <Plus size={18} strokeWidth={2} /> },
  { id: 'categories', label: 'Жанры', icon: <Tag size={18} strokeWidth={2} /> },
  { id: 'platforms', label: 'Платформы', icon: <Monitor size={18} strokeWidth={2} /> },
  { id: 'users', label: 'Пользователи', icon: <Users size={18} strokeWidth={2} /> },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('games')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  })

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Панель управления</h1>
          <p className="text-gray-500 text-sm mt-0.5">Управление контентом и пользователями</p>
        </div>
        <Link
          to="/"
          className="btn-secondary min-h-11 w-full sm:w-auto justify-center shrink-0"
        >
          <ArrowLeft size={18} strokeWidth={2} />
          На сайт
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1.5 bg-surface-2/90 rounded-xl p-1.5 mb-6 overflow-x-auto border border-white/[0.08]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 min-h-11 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap',
              tab === t.id
                ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card p-4 sm:p-6 md:p-8 border-white/[0.08] max-sm:!backdrop-blur-none">
        {tab === 'games' && <AdminGames />}

        {tab === 'create' && (
          <GameForm onSuccess={() => setTab('games')} />
        )}

        {tab === 'categories' && (
          <TagManager
            title="Жанры"
            items={categories}
            onCreate={createCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
            queryKey={['categories']}
          />
        )}

        {tab === 'platforms' && (
          <TagManager
            title="Платформы"
            items={platforms}
            onCreate={createPlatform}
            onUpdate={updatePlatform}
            onDelete={deletePlatform}
            queryKey={['platforms']}
          />
        )}

        {tab === 'users' && <AdminUsers />}
      </div>
    </div>
  )
}
