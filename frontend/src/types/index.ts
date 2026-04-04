export interface Category {
  id: number
  name: string
}

export interface Platform {
  id: number
  name: string
}

export interface Game {
  id: number
  title: string
  description?: string
  publisher?: string
  developer?: string
  series?: string
  release_date?: string
  nominations?: string
  rating?: number
  /** Средняя оценка по отзывам пользователей сайта (1–10) */
  reviews_rating_avg?: number | null
  image_url?: string
  aliases?: string
  categories: Category[]
  platforms: Platform[]
}

export interface GameCreate {
  title: string
  description?: string
  publisher?: string
  developer?: string
  series?: string
  release_date?: string
  nominations?: string
  rating?: number
  image_url?: string
  aliases?: string
  category_ids?: number[]
  platform_ids?: number[]
}

export interface GamesListParams {
  search?: string
  category_ids?: number[]
  platform_ids?: number[]
  min_rating?: number
  developer?: string
  publisher?: string
  release_date_from?: string
  release_date_to?: string
  page?: number
  limit?: number
  sort_by?: string
  order?: 'asc' | 'desc'
}

export type PremiumTheme =
  | 'indigo'
  | 'sky'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'violet'
  | 'cyan'
  | 'black'
  | 'white'

export interface User {
  id: number
  username: string
  email: string
  avatar_url?: string
  is_admin: boolean
  is_banned: boolean
  banned_until?: string
  created_at: string
  is_premium: boolean
  premium_theme: PremiumTheme
  premium_until?: string
  banner_url?: string
}

export interface Review {
  id: number
  user_id: number
  username?: string
  avatar_url?: string
  game_id: number
  /** Подставляется в списках отзывов пользователя (мой профиль / профиль другого юзера) */
  game_title?: string | null
  /** Обложка игры (только в списках отзывов по пользователю) */
  game_image_url?: string | null
  rating: number
  text: string
  image_url?: string
  created_at: string
  is_premium?: boolean
  premium_theme?: PremiumTheme
}

export interface ReviewCreate {
  game_id: number
  rating: number
  text: string
  image_url?: string
}

/** Ответ AI-сводки по отзывам игры */
export interface GameReviewsAISummary {
  game_id: number
  summary: string
  positives: string[]
  negatives: string[]
  conclusion: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface PremiumStatus {
  is_premium: boolean
  premium_until?: string
  premium_theme: PremiumTheme
  banner_url?: string
}

export interface PremiumProfileUpdate {
  premium_theme?: PremiumTheme
  banner_url?: string
}

export interface AdminBanTemp {
  banned_until: string
}
