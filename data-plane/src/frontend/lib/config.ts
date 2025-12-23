/**
 * Centralized application configuration
 * 
 * This file consolidates all environment variables and configuration values
 * used throughout the application. It provides type safety, validation, and
 * default values where appropriate.
 */

/**
 * API Configuration
 */
export const apiConfig = {
  /**
   * Client-side API base URL (for browser requests)
   * Uses NEXT_PUBLIC_API_URL environment variable
   * Default: http://localhost:8000/api/v1
   */
  clientBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',

  /**
   * Server-side API base URL (for server-side requests in Docker containers)
   * Uses SERVER_API_URL environment variable
   * Default: http://backend:8000/api/v1
   */
  serverBaseUrl: process.env.SERVER_API_URL || 'http://backend:8000/api/v1',
} as const

/**
 * NextAuth Configuration
 */
export const authConfig = {
  /**
   * NextAuth secret for JWT encryption
   * Required in production
   */
  secret: process.env.NEXTAUTH_SECRET,

  /**
   * NextAuth base URL for OAuth callbacks
   * Required in production
   */
  url: process.env.NEXTAUTH_URL,
} as const

/**
 * Application Configuration
 */
export const appConfig = {
  /**
   * Node environment (development, production, test)
   */
  nodeEnv: process.env.NODE_ENV || 'development',

  /**
   * Whether the application is running in production
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Whether the application is running in development
   */
  isDevelopment: process.env.NODE_ENV === 'development',
} as const

/**
 * Validate required configuration values
 * Throws an error if required values are missing in production
 */
export function validateConfig(): void {
  if (appConfig.isProduction) {
    if (!authConfig.secret) {
      throw new Error('NEXTAUTH_SECRET is required in production')
    }
    if (!authConfig.url) {
      throw new Error('NEXTAUTH_URL is required in production')
    }
  }
}

/**
 * Get all configuration values (for debugging)
 * Note: Sensitive values are masked
 */
export function getConfigSummary() {
  return {
    api: {
      clientBaseUrl: apiConfig.clientBaseUrl,
      serverBaseUrl: apiConfig.serverBaseUrl,
    },
    auth: {
      secret: authConfig.secret ? '***SET***' : 'Not set',
      url: authConfig.url || 'Not set',
    },
    app: {
      nodeEnv: appConfig.nodeEnv,
      isProduction: appConfig.isProduction,
      isDevelopment: appConfig.isDevelopment,
    },
  }
}

