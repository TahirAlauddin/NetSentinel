/**
 * Mock for next-auth/providers/credentials
 * Provides test implementation for CredentialsProvider
 */

// CredentialsProvider is a default export function
export default function CredentialsProvider(options: any) {
  return {
    id: options?.name || 'credentials',
    name: options?.name || 'Credentials',
    type: 'credentials',
    ...options,
  }
}

