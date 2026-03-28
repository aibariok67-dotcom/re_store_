import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, User, ChevronDown, Home, Crown, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { AuthModal } from './AuthModal'
import { UserAvatar } from './UserAvatar'
import { LogoFull } from './Logo'
import { cn } from '../utils/cn'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isHome = location.pathname === '/'

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const navPill =
    'inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-[15px] font-semibold transition-all duration-200'

  return (
    <>
      <nav className="sticky top-0 z-40 nav-shell">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 min-h-[4.25rem] flex items-center justify-between py-2">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <Link
              to="/"
              className="flex items-center min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <LogoFull compact size={40} />
            </Link>

            {!isHome && !isAuthenticated && (
              <Link
                to="/"
                className={cn(navPill, 'text-gray-400 hover:text-white hover:bg-white/[0.06] ml-1')}
              >
                <Home size={18} strokeWidth={2} />
                <span className="hidden sm:inline">Главная</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {isAuthenticated && user ? (
              <>
                {!isHome && (
                  <Link
                    to="/"
                    className={cn(navPill, 'text-gray-400 hover:text-white hover:bg-white/[0.06]')}
                  >
                    <Home size={18} strokeWidth={2} />
                    <span className="hidden sm:inline">Главная</span>
                  </Link>
                )}

                {user.is_admin && (
                  <Link
                    to="/admin"
                    className={cn(
                      navPill,
                      'border',
                      user.is_premium
                        ? 'bg-primary/12 border-primary/30 text-primary-light hover:bg-primary/18'
                        : 'bg-white/[0.04] border-white/[0.08] text-gray-200 hover:border-white/15'
                    )}
                  >
                    <Shield size={17} strokeWidth={2} />
                    <span className="hidden sm:inline">Панель</span>
                  </Link>
                )}

                {user.is_premium && (
                  <Link
                    to="/premium"
                    className={cn(
                      navPill,
                      'bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-primary-light hover:from-primary/28 hover:to-primary/15'
                    )}
                  >
                    <Crown size={17} strokeWidth={2} />
                    <span className="hidden sm:inline">Premium</span>
                  </Link>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={cn(
                      navPill,
                      'pl-2 pr-3 hover:bg-white/[0.06] max-w-[200px] sm:max-w-[240px]'
                    )}
                  >
                    <UserAvatar user={user} size={36} />
                    <span className="text-gray-100 truncate hidden sm:inline font-semibold">
                      {user.username}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        'text-gray-500 shrink-0 transition-transform duration-200',
                        menuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-60 card py-2 animate-slide-down z-50 !rounded-2xl !p-0 overflow-hidden border-white/10">
                        <div className="px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                          <p className="text-[15px] font-bold text-white truncate">{user.username}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-[15px] text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        >
                          <User size={18} strokeWidth={2} />
                          Мой профиль
                        </Link>

                        <hr className="border-white/[0.06]" />

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-[15px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut size={18} strokeWidth={2} />
                          Выйти
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="btn-ghost min-h-11 px-4 text-[15px]"
                >
                  Войти
                </button>
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="btn-primary min-h-11 px-5"
                >
                  Регистрация
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
