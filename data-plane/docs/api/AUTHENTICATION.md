# NetSentinel Authentication System

This document describes the comprehensive authentication and authorization implementation in the NetSentinel system, including both frontend and backend components.

## Overview

The NetSentinel system uses a modern JWT-based authentication architecture with automatic token refresh capabilities. The implementation includes:

- **NextAuth.js Integration**: Secure session management with JWT tokens
- **Automatic Token Refresh**: Seamless token renewal without user interruption
- **API Client with Retry Logic**: Automatic retry of failed requests after token refresh
- **Role-Based Access Control**: Support for different user roles and permissions
- **Secure Token Storage**: Tokens stored in NextAuth sessions, not localStorage
- **Backend JWT Integration**: Django REST Framework with SimpleJWT

## Architecture

### 1. Frontend Authentication (`lib/auth.ts`)
- **NextAuth Configuration**: JWT-based authentication with credentials provider
- **Automatic Token Refresh**: Built-in refresh logic in JWT callback
- **Session Management**: Secure session handling with token expiration tracking
- **User Data Integration**: Extended user model with custom fields

### 2. API Client (`lib/api-client.ts`)
- **Automatic Token Refresh**: Handles expired tokens transparently
- **Request Retry Logic**: Automatically retries failed requests after token refresh
- **Concurrent Request Handling**: Prevents multiple simultaneous refresh attempts
- **Error Handling**: Graceful fallback to sign-out on refresh failure

### 3. Server-Side API Client (`lib/server-api.ts`)
- **Server Session Integration**: Works with NextAuth server sessions
- **Automatic Token Refresh**: Same refresh logic as client-side
- **Server Actions Support**: Designed for Next.js server actions

### 4. Utility Functions (`lib/utils.ts`)
- **Simplified API Interface**: Easy-to-use wrapper functions
- **Response Handling**: Helper functions for success/error handling
- **Type Safety**: Full TypeScript support

### 5. Protected Routes (`components/protected-route.tsx`)
- **Route Protection**: Component-based authentication checks
- **Role-Based Access**: Support for different user roles
- **Loading States**: Proper loading indicators during auth checks

### 6. Backend Authentication (Django)
- **SimpleJWT Integration**: Secure JWT token generation and validation
- **Djoser Integration**: Complete user management system
- **Custom User Model**: Extended user model with additional fields
- **Token Rotation**: Automatic refresh token rotation for security

## API Integration

### Backend Endpoints

The system integrates with these Django REST Framework endpoints:

- `POST /api/v1/auth/jwt/create/` - Login (obtain access and refresh tokens)
- `POST /api/v1/auth/jwt/refresh/` - Refresh access token
- `POST /api/v1/auth/jwt/verify/` - Verify token validity
- `GET /api/v1/auth/users/me/` - Get current user information
- `POST /api/v1/auth/users/` - User registration
- `PUT /api/v1/auth/users/me/` - Update user profile
- `POST /api/v1/auth/users/set_password/` - Change password

### Token Configuration

The backend is configured with the following JWT settings:

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),      # 1 hour
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),         # 7 days
    "ROTATE_REFRESH_TOKENS": True,                       # Rotate refresh tokens
    "BLACKLIST_AFTER_ROTATION": True,                   # Blacklist old refresh tokens
    "UPDATE_LAST_LOGIN": True,                           # Update last login timestamp
    "AUTH_HEADER_TYPES": ("Bearer",),                    # Authorization header type
}
```

## Refresh Token Implementation

### How It Works

The refresh token system operates at multiple levels to ensure seamless user experience:

#### 1. NextAuth JWT Callback
```typescript
async jwt({ token, user }) {
  // Initial sign in
  if (user) {
    token.accessToken = user.accessToken
    token.refreshToken = user.refreshToken
    token.accessTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour
    return token
  }

  // Check if token is still valid
  if (Date.now() < token.accessTokenExpires) {
    return token
  }

  // Token expired, refresh it
  return await refreshAccessToken(token)
}
```

#### 2. API Client Automatic Refresh
```typescript
// When a request fails with 401 status
if (response.status === 401 && requireAuth && !skipRefresh) {
  console.log('Access token expired, attempting refresh...')
  
  const newAccessToken = await this.refreshAccessToken()
  
  if (newAccessToken) {
    // Retry the original request with new token
    const retryResponse = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${newAccessToken}`,
      },
    })
    // Return successful response
  }
}
```

#### 3. Concurrent Request Handling
The system prevents multiple simultaneous refresh attempts:

```typescript
private async refreshAccessToken(): Promise<string | null> {
  if (this.isRefreshing && this.refreshPromise) {
    return this.refreshPromise  // Wait for existing refresh
  }

  this.isRefreshing = true
  this.refreshPromise = this.performTokenRefresh()
  
  try {
    return await this.refreshPromise
  } finally {
    this.isRefreshing = false
    this.refreshPromise = null
  }
}
```

### Token Refresh Flow

1. **User makes API request** with potentially expired access token
2. **Backend returns 401** if token is expired
3. **API client detects 401** and triggers refresh process
4. **Refresh token is sent** to `/auth/jwt/refresh/` endpoint
5. **Backend validates refresh token** and returns new access token
6. **Original request is retried** with new access token
7. **User receives response** without knowing token was refreshed

### Error Handling

#### Refresh Token Expired
When refresh token expires:
- User is automatically signed out
- Redirected to login page
- All pending requests fail gracefully

#### Network Errors During Refresh
- Retry logic with exponential backoff
- Graceful fallback to error messages
- User notification of authentication issues

#### Concurrent Refresh Attempts
- Only one refresh request is made
- All pending requests wait for refresh completion
- Prevents race conditions and duplicate requests

## Environment Configuration

### Frontend Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### Backend Environment Variables

Create a `.env` file in the backend directory:

```env
# Django Configuration
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=sqlite:///db.sqlite3

# JWT Configuration
JWT_ACCESS_TOKEN_LIFETIME=3600  # 1 hour in seconds
JWT_REFRESH_TOKEN_LIFETIME=604800  # 7 days in seconds

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Security Features

### Token Security
- **JWT Tokens**: Secure, stateless authentication tokens
- **Token Rotation**: Refresh tokens are rotated on each use
- **Token Blacklisting**: Old refresh tokens are blacklisted after rotation
- **Secure Storage**: Tokens stored in NextAuth sessions, not localStorage
- **HTTPS Only**: All token transmission over HTTPS in production

### Authentication Security
- **Automatic Refresh**: Seamless token renewal without user interruption
- **Session Management**: Secure session handling with proper expiration
- **CSRF Protection**: Built-in CSRF protection via NextAuth
- **Role-Based Access**: Granular permission system with user roles

### API Security
- **Request Retry Logic**: Automatic retry of failed requests after token refresh
- **Concurrent Request Handling**: Prevents race conditions during token refresh
- **Error Handling**: Graceful fallback to sign-out on authentication failure
- **Input Validation**: Backend validation of all authentication requests

## File Structure

```
frontend/
├── lib/
│   ├── auth.ts                    # NextAuth configuration and JWT handling
│   ├── api-client.ts              # Client-side API client with refresh logic
│   ├── server-api.ts              # Server-side API client
│   └── utils.ts                   # Utility functions and API helpers
├── components/
│   ├── auth-provider.tsx          # NextAuth session provider
│   └── protected-route.tsx        # Route protection component
├── app/
│   ├── (auth)/
│   │   ├── login/                 # Login page
│   │   └── logout/                # Logout page
│   └── (app)/
│       ├── dashboard/             # Protected dashboard
│       └── unauthorized/          # 403 error page
└── middleware.ts                  # Next.js middleware for route protection

backend/
├── users/
│   ├── models.py                  # Custom User model
│   ├── serializers.py             # User serializers
│   ├── views.py                   # User views and endpoints
│   └── urls.py                    # User URL patterns
├── core/
│   └── settings.py                # Django settings with JWT configuration
└── requirements.txt               # Python dependencies
```

## Backend Requirements

The Django backend includes:

### Dependencies
- **Django**: Web framework
- **Django REST Framework**: API framework
- **djangorestframework-simplejwt**: JWT authentication
- **djoser**: User management and authentication
- **django-cors-headers**: CORS handling
- **drf-yasg**: API documentation

### Configuration
- **Custom User Model**: Extended user model with additional fields
- **JWT Settings**: Configured for 1-hour access tokens, 7-day refresh tokens
- **CORS Configuration**: Proper CORS settings for frontend integration
- **Token Rotation**: Automatic refresh token rotation enabled

## Testing

### Manual Testing

1. **Start the backend**:
   ```bash
   cd data-plane/src/backend
   python manage.py runserver
   ```

2. **Start the frontend**:
   ```bash
   cd data-plane/src/frontend
   npm run dev
   ```

3. **Test authentication flow**:
   - Navigate to `http://localhost:3000`
   - Should redirect to login page
   - Create a user via Django admin or registration
   - Login with credentials
   - Should redirect to dashboard
   - Test logout functionality

4. **Test token refresh**:
   - Login and wait for access token to expire (or manually expire it)
   - Make an API request - should automatically refresh and succeed
   - Check browser console for refresh logs

### Automated Testing

```typescript
// Example test for API client
import { apiClient } from '@/lib/api-client'

describe('API Client', () => {
  it('should automatically refresh expired tokens', async () => {
    // Mock expired token response
    // Mock successful refresh response
    // Verify original request is retried with new token
  })
})
```

## Troubleshooting

### Common Issues

1. **Token Refresh Fails**
   - Check if refresh token is valid and not expired
   - Verify backend JWT configuration
   - Check network connectivity

2. **CORS Issues**
   - Ensure `CORS_ALLOWED_ORIGINS` includes frontend URL
   - Check `CORS_ALLOW_CREDENTIALS` is set to `True`

3. **Session Not Persisting**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches frontend URL
   - Ensure cookies are enabled

4. **API Requests Failing**
   - Check `NEXT_PUBLIC_API_URL` is correct
   - Verify backend is running and accessible
   - Check authentication headers in network tab

### Debug Mode

Enable debug logging by checking the browser console for:
- "Access token expired, attempting refresh..."
- "Token refresh failed: [status]"
- "Token refresh error: [error]"

## Future Enhancements

Potential improvements for the authentication system:

1. **Multi-Factor Authentication**: Add MFA support
2. **Social Login**: Integrate OAuth providers (Google, GitHub, etc.)
3. **Session Management**: Add device management and session revocation
4. **Audit Logging**: Track authentication events and security events
5. **Rate Limiting**: Implement rate limiting for authentication endpoints
6. **Password Policies**: Enforce strong password requirements
7. **Account Lockout**: Implement account lockout after failed attempts
8. **Single Sign-On**: Integrate with enterprise SSO solutions
