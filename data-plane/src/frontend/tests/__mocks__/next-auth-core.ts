/**
 * Mock for next-auth (core module)
 * Provides test implementation for NextAuth function
 */

// NextAuth is a default export function
const NextAuth = jest.fn((_options: unknown) => {
  return {
    handlers: {
      GET: jest.fn(),
      POST: jest.fn(),
    },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  }
})

export default NextAuth

