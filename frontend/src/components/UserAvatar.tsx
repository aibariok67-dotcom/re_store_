import { useState } from 'react'
import { getUploadUrl } from '../api/client'
import type { User } from '../types'
import { cn } from '../utils/cn'

interface UserAvatarProps {
  user: Pick<User, 'username' | 'avatar_url' | 'is_premium' | 'premium_theme'>
  size?: number
  className?: string
}

const themeGradients: Record<string, string> = {
  indigo: 'from-indigo-500 to-violet-600',
  sky: 'from-sky-400 to-blue-600',
  emerald: 'from-emerald-400 to-teal-600',
  rose: 'from-rose-400 to-pink-600',
  amber: 'from-amber-400 to-orange-600',
  violet: 'from-violet-400 to-purple-700',
  cyan: 'from-cyan-400 to-blue-600',
}

export function UserAvatar({ user, size = 40, className }: UserAvatarProps) {
  const avatarUrl = getUploadUrl(user.avatar_url)
  const [imgError, setImgError] = useState(false)
  const initial = user.username.charAt(0).toUpperCase()
  const gradient = user.is_premium
    ? themeGradients[user.premium_theme] || themeGradients.indigo
    : 'from-gray-600 to-gray-700'

  const showImage = avatarUrl && !imgError

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 font-bold text-white select-none',
        !showImage && `bg-gradient-to-br ${gradient}`,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={user.username}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initial
      )}
    </div>
  )
}
