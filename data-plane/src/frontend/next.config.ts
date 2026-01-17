import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Restrict image domains to prevent SSRF
    remotePatterns: [],
    // Disable dangerous image optimization features
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },
  
  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Extract origin from API URL for CSP
    // NEXT_PUBLIC_API_URL might be "http://localhost:8000/api/v1"
    // but CSP needs just the origin "http://localhost:8000"
    let apiOrigin = 'http://localhost:8000';
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        const url = new URL(process.env.NEXT_PUBLIC_API_URL);
        apiOrigin = url.origin;
      } catch {
        // If URL parsing fails, use default
        apiOrigin = 'http://localhost:8000';
      }
    }
    
    // Content Security Policy to prevent code injection
    // In development, allow connections to the API server
    // In production, only allow same-origin (API should be proxied or same domain)
    const connectSrc = isDevelopment 
      ? `'self' ${apiOrigin} ws://localhost:* http://localhost:*`
      : "'self'";
    
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for Next.js
      "style-src 'self' 'unsafe-inline'", // Required for CSS-in-JS
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      // Only upgrade insecure requests in production
      ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
