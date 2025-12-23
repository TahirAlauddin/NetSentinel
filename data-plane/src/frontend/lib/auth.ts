import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    error?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string
      isStaff?: boolean
      isActive?: boolean
      isSuperuser?: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    username: string
    accessToken: string
    refreshToken: string
    isStaff: boolean
    isActive: boolean
    isSuperuser: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    username?: string
    isStaff?: boolean
    isActive?: boolean
    isSuperuser?: boolean
    accessTokenExpires?: number
    error?: string
  }
}

// For client-side requests (browser) - uses NEXT_PUBLIC_API_URL
// For server-side requests (container) - uses SERVER_API_URL (Docker service name)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const SERVER_API_BASE_URL = process.env.SERVER_API_URL || 'http://backend:8000/api/v1'
console.log('[auth] API_BASE_URL (client):', API_BASE_URL)
console.log('[auth] SERVER_API_BASE_URL (server):', SERVER_API_BASE_URL)
/**
 * Refresh the access token using the refresh token
 * Returns token with error flag if refresh fails (backend unavailable, refresh token expired, etc.)
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  // If no refresh token, mark as error
  if (!token.refreshToken) {
    console.warn('No refresh token available for refresh')
    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      error: 'RefreshAccessTokenError',
    }
  }

  try {
    // Set a timeout for the fetch request to handle backend unavailability
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    // Use SERVER_API_BASE_URL for server-side token refresh
    console.log('[refreshAccessToken] Using API URL:', SERVER_API_BASE_URL)
    const response = await fetch(`${SERVER_API_BASE_URL}/auth/jwt/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: token.refreshToken,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Token refresh failed:', response.status, errorData)
      
      // If refresh token is invalid/expired (401 or 403), clear tokens
      if (response.status === 401 || response.status === 403) {
        return {
          ...token,
          accessToken: undefined,
          refreshToken: undefined,
          error: 'RefreshAccessTokenError',
        }
      }
      
      // For other errors (like 500), still mark as error but keep refresh token
      // in case it's a temporary backend issue
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const refreshedTokens = await response.json()
    console.log('Token refresh successful')

    return {
      ...token,
      accessToken: refreshedTokens.access,
      accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour from now
      refreshToken: refreshedTokens.refresh ?? token.refreshToken, // Fall back to old refresh token
      error: undefined, // Clear any previous error
    }
  } catch (error: unknown) {
    // Handle network errors, timeouts, and other fetch failures
    const err = error instanceof Error ? error : new Error(String(error))
    if (err.name === 'AbortError') {
      console.error('Token refresh timeout: Backend may be unavailable')
    } else if (err.message?.includes('fetch')) {
      console.error('Token refresh network error: Backend may be unavailable', err)
    } else {
      console.error('Error refreshing access token:', err)
    }

    // Return token with error flag - the session error handler will sign out the user
    // We keep the refresh token in case it's a temporary network issue
    // but clear the access token since it's definitely expired
    return {
      ...token,
      accessToken: undefined,
      error: 'RefreshAccessTokenError',
    }
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Authenticate with backend - use SERVER_API_BASE_URL for server-side requests
          console.log('[auth.authorize] Using API URL:', SERVER_API_BASE_URL)
          const response = await fetch(`${SERVER_API_BASE_URL}/auth/jwt/create/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              username: credentials.username, 
              password: credentials.password 
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.log('Response not ok', response.status, response.statusText)
            console.log('Error response body:', errorText)
            try {
              const errorJson = JSON.parse(errorText)
              console.log('Error response JSON:', errorJson)
            } catch (e) {
              console.log('Error response is not JSON')
            }
            return null
          }

          const data = await response.json()
          console.log('Data', data)
          // Get user details
          const userResponse = await fetch(`${SERVER_API_BASE_URL}/auth/users/me/`, {
            headers: {
              'Authorization': `Bearer ${data.access}`,
              'Content-Type': 'application/json',
            },
          })

          if (!userResponse.ok) {
            return null
          }

          const userData = await userResponse.json()

          return {
            id: userData.id.toString(),
            email: userData.email,
            name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
            username: userData.username,
            accessToken: data.access,
            refreshToken: data.refresh,
            isStaff: userData.is_staff,
            isActive: userData.is_active,
            isSuperuser: userData.is_superuser,
          }
        } catch (error) {
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.username = user.username
        token.isStaff = user.isStaff
        token.isActive = user.isActive
        token.isSuperuser = user.isSuperuser
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour from now
        token.error = undefined // Clear any previous errors
        return token
      }

      // If token already has an error, don't try to refresh again
      // This prevents infinite refresh attempts when backend is down
      if (token.error === 'RefreshAccessTokenError') {
        return token
      }

      // If access token is missing, try to refresh if we have a refresh token
      if (!token.accessToken && token.refreshToken) {
        return await refreshAccessToken(token)
      }

      // If access token expiration is missing, treat as expired
      if (!token.accessTokenExpires) {
        if (token.refreshToken) {
          return await refreshAccessToken(token)
        } else {
          // No refresh token and no expiration info - mark as error
          return {
            ...token,
            error: 'RefreshAccessTokenError',
          }
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token)
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // If there's an error refreshing the token, return the session with error flag
      if (token.error === 'RefreshAccessTokenError') {
        return {
          ...session,
          error: 'RefreshAccessTokenError'
        }
      }

      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.user.username = token.username
      session.user.isStaff = token.isStaff
      session.user.isActive = token.isActive
      session.user.isSuperuser = token.isSuperuser
      return session
    }
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Set the base URL for NextAuth in production
  url: process.env.NEXTAUTH_URL,
}

export default NextAuth(authOptions)