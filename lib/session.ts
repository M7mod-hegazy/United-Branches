import type { SessionOptions } from 'iron-session'

export interface SessionData {
  isLoggedIn?: boolean
  username?: string
}

export const sessionOptions: SessionOptions = {
  cookieName: 'united-branches-session',
  password:
    process.env.SESSION_SECRET ||
    'development-only-session-secret-change-before-production',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}
