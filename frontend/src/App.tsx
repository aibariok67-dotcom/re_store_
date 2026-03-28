import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Navbar } from './components/Navbar'
import { useAuth } from './hooks/useAuth'
import { applyTheme } from './utils/theme'

const CatalogPage = lazy(() => import('./pages/CatalogPage'))
const GameDetailPage = lazy(() => import('./pages/GameDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PremiumPage = lazy(() => import('./pages/PremiumPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    if (user?.is_premium) {
      applyTheme(user.premium_theme)
    } else {
      applyTheme(null)
    }
  }, [user?.is_premium, user?.premium_theme])

  return <>{children}</>
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/games/:id" element={<GameDetailPage />} />
      <Route
        path="/profile"
        element={isAuthenticated ? <ProfilePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/premium"
        element={isAuthenticated ? <PremiumPage /> : <Navigate to="/" replace />}
      />
      <Route path="/users/:id" element={<UserProfilePage />} />
      <Route
        path="/admin/*"
        element={
          user?.is_admin ? <AdminPage /> : <Navigate to="/" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppShell() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col relative">
        <Navbar />
        <main className="flex-1 relative z-0">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh]">
                <div className="w-11 h-11 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin" />
                <p className="text-sm font-medium text-gray-500">Загрузка…</p>
              </div>
            }
          >
            <AppRoutes />
          </Suspense>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AppShell />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                'card !border-white/10 !bg-surface/95 !text-gray-100 !shadow-2xl !rounded-xl',
              title: '!font-semibold',
              description: '!text-gray-400',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
