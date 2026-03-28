import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from './Modal'
import { LogoFull } from './Logo'
import { login, register } from '../api/auth'
import { useAuthStore } from '../store/auth'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
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
        autoComplete={autoComplete}
        required={required}
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

export function AuthModal({ open, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [loginField, setLoginField] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const { setToken } = useAuthStore()
  const qc = useQueryClient()

  const loginMut = useMutation({
    mutationFn: () => login(loginField, password),
    onSuccess: (data) => {
      setToken(data.access_token)
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Добро пожаловать!')
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Ошибка входа')
    },
  })

  const registerMut = useMutation({
    mutationFn: () => register(username, email, regPassword),
    onSuccess: () => {
      toast.success('Аккаунт создан! Войдите.')
      setTab('login')
      setLoginField(email)
      setPassword('')
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail.map((d: { msg: string }) => d.msg).join(', '))
      } else {
        toast.error((detail as string) || 'Ошибка регистрации')
      }
    },
  })

  return (
    <Modal open={open} onClose={onClose} size="sm" className="!max-w-md">
      <div className="flex flex-col items-center mb-7 -mt-1">
        <LogoFull size={46} compact />
      </div>

      <div className="flex gap-1.5 p-1.5 bg-surface-2/80 rounded-xl mb-7 border border-white/[0.06]">
        <button
          type="button"
          className={`flex-1 min-h-11 rounded-lg text-[15px] font-bold transition-all ${
            tab === 'login'
              ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          onClick={() => setTab('login')}
        >
          Войти
        </button>
        <button
          type="button"
          className={`flex-1 min-h-11 rounded-lg text-[15px] font-bold transition-all ${
            tab === 'register'
              ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          onClick={() => setTab('register')}
        >
          Регистрация
        </button>
      </div>

      {tab === 'login' ? (
        <form
          onSubmit={(e) => { e.preventDefault(); loginMut.mutate() }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Ник или Email
            </label>
            <input
              className="input"
              placeholder="username или email..."
              value={loginField}
              onChange={(e) => setLoginField(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Пароль
            </label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Ваш пароль"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loginMut.isPending}
          >
            {loginMut.isPending ? 'Вхожу...' : 'Войти'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Нет аккаунта?{' '}
            <button
              type="button"
              className="text-primary-light hover:underline font-semibold"
              onClick={() => setTab('register')}
            >
              Зарегистрироваться
            </button>
          </p>
        </form>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); registerMut.mutate() }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Никнейм
            </label>
            <input
              className="input"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Пароль
            </label>
            <PasswordInput
              value={regPassword}
              onChange={setRegPassword}
              placeholder="минимум 6 символов"
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={registerMut.isPending}
          >
            {registerMut.isPending ? 'Создаю...' : 'Создать аккаунт'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Есть аккаунт?{' '}
            <button
              type="button"
              className="text-primary-light hover:underline font-semibold"
              onClick={() => setTab('login')}
            >
              Войти
            </button>
          </p>
        </form>
      )}
    </Modal>
  )
}
