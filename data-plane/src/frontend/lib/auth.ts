import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

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
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/jwt/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: token.refreshToken,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Token refresh failed:', response.status, errorData)
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const refreshedTokens = await response.json()
    console.log('Token refresh successful')

    return {
      ...token,
      accessToken: refreshedTokens.access,
      accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour from now
      refreshToken: refreshedTokens.refresh ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)

    return {
      ...token,
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
          // Authenticate with backend
          const response = await fetch(`${API_BASE_URL}/auth/jwt/create/`, {
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
            return null
          }

          const data = await response.json()

          // Get user details
          const userResponse = await fetch(`${API_BASE_URL}/auth/users/me/`, {
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
    async jwt({ token, user }: { token: any; user: any }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.username = user.username
        token.isStaff = user.isStaff
        token.isActive = user.isActive
        token.isSuperuser = user.isSuperuser
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour from now
        return token
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token)
    },
    async session({ session, token }: { session: any; token: any }) {
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