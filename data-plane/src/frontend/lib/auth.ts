import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { apiConfig, authConfig } from "@/lib/config"

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
      /** Django permission codenames (e.g. assets.view_asset) for RBAC */
      permissions?: string[]
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
    permissions?: string[]
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
    /** Django permission codenames for RBAC */
    permissions?: string[]
  }
}

// API URLs are now centralized in lib/config.ts

/** In-flight refresh promise so concurrent callers share one refresh request */
let inFlightRefresh: Promise<JWT> | null = null


/**
 * Refresh the access token using the refresh token
 * Returns token with error flag if refresh fails (backend unavailable, refresh token expired, etc.)
 * Concurrent callers await the same in-flight refresh to avoid duplicate requests.
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

  if (inFlightRefresh) {
    return inFlightRefresh
  }

  const doRefresh = async (): Promise<JWT> => {
    try {
      // Set a timeout for the fetch request to handle backend unavailability
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      // Use server-side API URL for token refresh
      const response = await fetch(`${apiConfig.serverBaseUrl}/auth/jwt/refresh/`, {
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

  inFlightRefresh = doRefresh()
  try {
    return await inFlightRefresh
  } finally {
    inFlightRefresh = null
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
          // Authenticate with backend - use server-side API URL
          // console.log('[auth.authorize] Using API URL:', apiConfig.serverBaseUrl)
          const response = await fetch(`${apiConfig.serverBaseUrl}/auth/jwt/create/`, {
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
            try {
              const _errorJson = JSON.parse(errorText)
            } catch (_e) {
              console.error('Error response is not JSON:', errorText)
            }
            return null
          }

          const data = await response.json()
          const userResponse = await fetch(`${apiConfig.serverBaseUrl}/auth/users/me/`, {
            headers: {
              'Authorization': `Bearer ${data.access}`,
              'Content-Type': 'application/json',
            },
          })

          if (!userResponse.ok) {
            return null
          }

          const userData = await userResponse.json()

          // Fetch current user permissions for RBAC (Django + bundle permissions)
          let permissions: string[] = []
          try {
            const permResponse = await fetch(`${apiConfig.serverBaseUrl}/users/current-permissions/`, {
              headers: {
                Authorization: `Bearer ${data.access}`,
                "Content-Type": "application/json",
              },
            })
            if (permResponse.ok) {
              const permData = await permResponse.json()
              permissions = Array.isArray(permData.permissions) ? permData.permissions : []
            }
          } catch (_e) {
            // Non-fatal; user still logs in, permissions will be empty
          }

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
            permissions,
          }
        } catch (_error) {
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
        token.permissions = user.permissions
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
      session.user.permissions = token.permissions ?? []
      return session
    }
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  // Use secure cookies: NEXTAUTH_USE_SECURE_COOKIES=true forces secure; otherwise derive from URL (https => secure).
  // In Docker dev we may run with NODE_ENV=production over HTTP (localhost); secure cookies are not sent over HTTP.
  cookies: (() => {
    const url = authConfig.url
    const useSecureCookies =
      authConfig.useSecureCookies ||
      (typeof url === 'string' && url.length > 0 && url.toLowerCase().startsWith('https://'))
    return {
      sessionToken: {
        name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: useSecureCookies,
        },
      },
      callbackUrl: {
        name: `${useSecureCookies ? '__Secure-' : ''}next-auth.callback-url`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: useSecureCookies,
        },
      },
      csrfToken: {
        name: `${useSecureCookies ? '__Host-' : ''}next-auth.csrf-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: useSecureCookies,
        },
      },
    }
  })(),
  secret: authConfig.secret,
  // Set the base URL for NextAuth in production
  url: authConfig.url,
}

export default NextAuth(authOptions)