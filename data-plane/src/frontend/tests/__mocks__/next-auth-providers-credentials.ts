/**
 * Mock for next-auth/providers/credentials
 * Provides test implementation for CredentialsProvider
 */

interface CredentialsProviderOptions {
  name?: string;
  [key: string]: unknown;
}

// CredentialsProvider is a default export function
export default function CredentialsProvider(options: CredentialsProviderOptions) {
  return {
    id: options?.name || 'credentials',
    name: options?.name || 'Credentials',
    type: 'credentials',
    ...options,
  }
}

