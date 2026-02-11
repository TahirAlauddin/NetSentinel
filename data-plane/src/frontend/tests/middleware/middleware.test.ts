/**
 * Tests for middleware.ts
 *
 * Tests middleware logic including:
 * - Route protection
 * - Authentication checks
 * - Redirects
 * - Token error handling
 */

import { NextRequest, NextResponse } from "next/server";

jest.mock("next/server", () => {
  // Response-like objects must have headers.set so middleware setCspOnResponse() does not throw
  const createMockResponse = (type: "next" | "redirect", url?: URL | string) => ({
    type,
    url: url ? (url instanceof URL ? url.toString() : url) : undefined,
    headers: {
      set: jest.fn(),
      get: jest.fn(),
    },
  });
  const mockNextFn = jest.fn(() => createMockResponse("next"));
  const mockRedirectFn = jest.fn((url: URL | string, _init?: ResponseInit) =>
    createMockResponse("redirect", url)
  );

  // Store references globally so tests can access them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).__mockNext = mockNextFn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).__mockRedirect = mockRedirectFn;

  return {
    NextResponse: {
      next: mockNextFn,
      redirect: (url: URL | string, init?: ResponseInit) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return mockRedirectFn(url, init) as any;
      },
    },
    NextRequest: jest.fn(),
  };
});

// Mock withAuth to return a function that calls our middleware with the token
jest.mock('next-auth/middleware', () => {
  // Define authState inside the factory to avoid hoisting issues
  const authState = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorizedCallback: null as ((params: { token: any; req: any }) => boolean) | null,
  };
  
  // Store on global so tests can access it if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).__authState = authState;
  
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withAuth: jest.fn((fn: any, options: any) => {
      authState.authorizedCallback = options.callbacks.authorized;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (req: any) => {
        const pathname = req.nextUrl.pathname;
        const authRoutes = ['/login', '/register'];
        const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
        
        // For auth routes, always let the middleware function run so it can handle redirects
        // This allows the middleware to redirect authenticated users away from auth routes
        if (isAuthRoute) {
          return fn(req);
        }
        
        // For non-auth routes, check authorization
        const token = req.nextauth?.token || null;
        const isAuthorized =
          authState.authorizedCallback?.({ token, req }) ?? false;

        if (!isAuthorized) {
          return NextResponse.redirect(
            new URL(options.pages.signIn, req.url)
          );
        }

        return fn(req);
      };
    }),
  };
})

// Import middleware after mocks are set up
import middleware from "@/middleware";

describe("Middleware", () => {
  const createMockRequest = (
    pathname: string,
    searchParams: Record<string, string> = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    token: any = null
  ): NextRequest => {
    const url = new URL(`http://localhost:3000${pathname}`);
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const req = {
      nextUrl: url,
      url: url.toString(),
      nextauth: { token },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    return req as NextRequest;
  };

  // Get references to the mocked functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMockNext = () => (global as any).__mockNext as jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMockRedirect = () => (global as any).__mockRedirect as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the global mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((global as any).__mockNext) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).__mockNext.mockClear();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((global as any).__mockRedirect) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).__mockRedirect.mockClear();
    }
  });

  it("should redirect to login for protected routes without auth", async () => {
    const req = createMockRequest("/dashboard", {}, null);

    // @ts-expect-error - TypeScript type definition issue with NextResponse.redirect
    const response = await middleware(req);

    expect(response).toBeDefined();
    // withAuth should redirect to login when not authorized
    const mockRedirectFn = getMockRedirect();
    expect(mockRedirectFn).toHaveBeenCalled();
    const redirectCall = mockRedirectFn.mock.calls[0];
    expect(redirectCall[0].toString()).toContain("/login");
  });

  it("should allow access to protected routes with valid token", async () => {
    const validToken = {
      accessToken: "valid-token",
      refreshToken: "valid-refresh-token",
      error: undefined,
    };

    const req = createMockRequest("/dashboard", {}, validToken);

    // @ts-expect-error - TypeScript type definition issue with NextResponse.redirect
    const response = await middleware(req);

    expect(response).toBeDefined();
    // With valid token, should call NextResponse.next (allow access)
    const mockNextFn = getMockNext();
    expect(mockNextFn).toHaveBeenCalled();
  });

  it("should redirect to dashboard for auth routes when authenticated", async () => {
    const validToken = {
      accessToken: "valid-token",
      refreshToken: "valid-refresh-token",
      error: undefined,
    };

    const req = createMockRequest("/login", {}, validToken);

    // @ts-expect-error - TypeScript type definition issue with NextResponse.redirect
    const response = await middleware(req);

    expect(response).toBeDefined();
    // Should redirect authenticated users away from auth routes to dashboard
    const mockRedirectFn = getMockRedirect();
    expect(mockRedirectFn).toHaveBeenCalled();
    // Check all redirect calls - the middleware should redirect to dashboard
    const redirectCalls = mockRedirectFn.mock.calls;
    const hasDashboardRedirect = redirectCalls.some(call => 
      call[0].toString().includes("/dashboard")
    );
    expect(hasDashboardRedirect).toBe(true);
  });

  it("should handle token refresh errors", async () => {
    const errorToken = {
      accessToken: undefined,
      refreshToken: undefined,
      error: "RefreshAccessTokenError",
    };

    const req = createMockRequest("/dashboard", {}, errorToken);

    // @ts-expect-error - TypeScript type definition issue with NextResponse.redirect
    const response = await middleware(req);

    expect(response).toBeDefined();
    // Should redirect to login when token has error
    const mockRedirectFn = getMockRedirect();
    expect(mockRedirectFn).toHaveBeenCalled();
    const redirectCall = mockRedirectFn.mock.calls[0];
    expect(redirectCall[0].toString()).toContain("/login");
  });

  it("should prevent redirect loops", async () => {
    const errorToken = {
      accessToken: undefined,
      refreshToken: undefined,
      error: "RefreshAccessTokenError",
    };

    // Simulate being on login page with nested callbackUrl containing /login
    const req = createMockRequest(
      "/login",
      { callbackUrl: "/login?callbackUrl=/dashboard" },
      errorToken
    );

    // @ts-expect-error - TypeScript type definition issue with NextResponse.redirect
    const response = await middleware(req);

    expect(response).toBeDefined();
    // Should redirect to clean login URL without nested callbackUrl
    const mockRedirectFn = getMockRedirect();
    expect(mockRedirectFn).toHaveBeenCalled();
    const redirectCall = mockRedirectFn.mock.calls[0];
    const redirectUrl = redirectCall[0];
    // Ensure redirectUrl is a URL object
    const url = redirectUrl instanceof URL ? redirectUrl : new URL(redirectUrl);
    expect(url.toString()).toContain("/login");
    // Should not have nested callbackUrl in the redirect (should be null or not contain /login)
    const callbackUrl = url.searchParams.get("callbackUrl");
    // The middleware should remove the nested callbackUrl, so it should be null
    expect(callbackUrl).toBeNull();
  });

  it("should redirect root path to dashboard when authenticated", async () => {
    const validToken = {
      accessToken: "valid-token",
      refreshToken: "valid-refresh-token",
      error: undefined,
    };

    const req = createMockRequest("/", {}, validToken);

    // @ts-expect-error - TypeScript type definition issue with NextResponse.redirect
    const response = await middleware(req);

    expect(response).toBeDefined();
    const mockRedirectFn = getMockRedirect();
    expect(mockRedirectFn).toHaveBeenCalled();
    const redirectCall = mockRedirectFn.mock.calls[0];
    expect(redirectCall[0].toString()).toContain("/dashboard");
  });

  it("should redirect root path to login when not authenticated", async () => {
    const req = createMockRequest("/", {}, null);

    // @ts-expect-error - TypeScript type definition issue with NextResponse.redirect
    const response = await middleware(req);

    expect(response).toBeDefined();
    const mockRedirectFn = getMockRedirect();
    expect(mockRedirectFn).toHaveBeenCalled();
    const redirectCall = mockRedirectFn.mock.calls[0];
    expect(redirectCall[0].toString()).toContain("/login");
  });
});
