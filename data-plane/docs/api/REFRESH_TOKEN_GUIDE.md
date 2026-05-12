# Refresh Token Implementation

This document explains the automatic refresh token functionality implemented in the NetSentinel frontend application.

## Overview

The application now includes automatic token refresh logic that handles expired access tokens seamlessly. When any API request fails due to an invalid or expired access token, the system automatically attempts to refresh the token and retry the original request.

## Architecture

### 1. Client-Side API Client (`lib/api-client.ts`)

The `ApiClient` class provides a centralized way to make authenticated API requests with automatic token refresh:

- **Automatic Token Refresh**: When a request fails with 401 status, it automatically refreshes the token
- **Request Retry**: After successful token refresh, the original request is retried
- **Error Handling**: If token refresh fails, the user is automatically signed out
- **Concurrent Request Handling**: Prevents multiple simultaneous refresh attempts

### 2. Server-Side API Client (`lib/server-api-client.ts`)

Similar functionality for server-side operations (server actions):

- **Server Session Integration**: Works with NextAuth server sessions
- **Automatic Token Refresh**: Same refresh logic as client-side
- **Error Handling**: Proper error handling for server-side operations

### 3. NextAuth Configuration Updates (`lib/auth.ts`)

Enhanced NextAuth configuration with automatic token refresh:

- **JWT Callback**: Automatically refreshes tokens when they expire
- **Token Expiration Tracking**: Tracks access token expiration times
- **Error Handling**: Signs out users when refresh fails

### 4. Utility Functions (`lib/utils.ts`)

Convenient helper functions for making API requests:

- **api object**: Simple interface for common HTTP methods
- **handleApiResponse**: Throws errors for failed requests
- **safeApiResponse**: Returns success/error objects without throwing

## Usage Examples

### Client-Side Usage

```typescript
import { api, handleApiResponse, safeApiResponse } from "@/lib/utils"

// Method 1: Using handleApiResponse (throws on error)
try {
  const users = handleApiResponse(await api.get('/auth/users/'))
  console.log(users)
} catch (error) {
  console.error('Request failed:', error.message)
}

// Method 2: Using safeApiResponse (doesn't throw)
const response = await api.get('/auth/users/')
const result = safeApiResponse(response)

if (result.success) {
  console.log(result.data)
} else {
  console.error('Request failed:', result.error)
}

// Method 3: Direct API client usage
import { apiClient } from "@/lib/api-client"

const response = await apiClient.get('/auth/users/')
if (response.error) {
  console.error('Request failed:', response.error)
} else {
  console.log(response.data)
}
```

### Server-Side Usage (Server Actions)

```typescript
import { serverApiClient } from "@/lib/server-api-client"

export async function myServerAction() {
  const response = await serverApiClient.get('/auth/users/')
  
  if (response.error) {
    throw new Error(response.error)
  }
  
  return response.data
}
```

### Custom Request Options

```typescript
// Make a request without authentication
const response = await api.get('/public/endpoint', { requireAuth: false })

// Make a request with custom headers
const response = await api.post('/endpoint', data, {
  headers: {
    'Custom-Header': 'value'
  }
})

// Skip automatic token refresh for a specific request
const response = await apiClient.request('/endpoint', { skipRefresh: true })
```

## How It Works

### 1. Initial Request

When you make an API request, the client:
1. Gets the current session and access token
2. Adds the `Authorization: Bearer <token>` header
3. Makes the request to the API

### 2. Token Expiration Detection

If the API returns a 401 status code:
1. The client detects this as a token expiration
2. It attempts to refresh the token using the refresh token
3. If refresh succeeds, it retries the original request with the new token
4. If refresh fails, it signs out the user

### 3. Concurrent Request Handling

If multiple requests fail simultaneously:
1. Only one refresh attempt is made
2. All pending requests wait for the refresh to complete
3. All requests are retried with the new token

### 4. NextAuth Integration

The NextAuth JWT callback:
1. Checks if the access token is expired
2. If expired, automatically refreshes it
3. Updates the token with the new access token and expiration time
4. If refresh fails, marks the token with an error

## Configuration

### Environment Variables

Make sure these environment variables are set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXTAUTH_SECRET=your-secret-key
```

### Token Expiration Times

The system is configured with these default expiration times:
- **Access Token**: 60 minutes
- **Refresh Token**: 7 days

These can be modified in the Django backend settings.

## Error Handling

### Client-Side Errors

- **Network Errors**: Handled gracefully with user-friendly messages
- **Authentication Errors**: Automatic token refresh or sign-out
- **API Errors**: Proper error messages from the backend

### Server-Side Errors

- **Session Errors**: Proper error handling for missing sessions
- **Token Refresh Errors**: Graceful fallback to error responses
- **Network Errors**: Proper error logging and user feedback

## Testing

To test the refresh token functionality:

1. **Login** to the application
2. **Wait** for the access token to expire (or manually expire it)
3. **Make an API request** - it should automatically refresh and succeed
4. **Check the browser console** for refresh logs

## Migration Guide

### Updating Existing Code

Replace direct `fetch` calls with the new API client:

```typescript
// Old way
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})

// New way
const response = await api.get('/api/endpoint')
```

### Server Actions

Update server actions to use the server API client:

```typescript
// Old way
const response = await fetch(`${API_BASE_URL}/endpoint`, {
  headers: {
    'Authorization': `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  },
})

// New way
const response = await serverApiClient.get('/endpoint')
```

## Troubleshooting

### Common Issues

1. **Token Refresh Fails**: Check if refresh token is valid and not expired
2. **Infinite Refresh Loop**: Ensure the backend properly handles token refresh
3. **CORS Issues**: Make sure the API URL is correctly configured

### Debug Mode

Enable debug logging by checking the browser console for:
- "Access token expired, attempting refresh..."
- "Token refresh failed: [status]"
- "Token refresh error: [error]"

## Security Considerations

1. **Token Storage**: Tokens are stored securely in NextAuth sessions
2. **Automatic Sign-out**: Users are signed out when refresh fails
3. **HTTPS**: Always use HTTPS in production
4. **Token Rotation**: The backend rotates refresh tokens for security

## Future Enhancements

Potential improvements:
1. **Retry Logic**: Add exponential backoff for failed requests
2. **Offline Support**: Cache requests when offline
3. **Request Queuing**: Queue requests during token refresh
4. **Metrics**: Add request timing and success metrics


# JWT Refresh Token Testing Setup

## Overview
This setup tests the JWT refresh token logic with artificially short token lifetimes (30 seconds) to quickly verify the refresh mechanism works correctly.

## Test Components

### 1. Backend Configuration
- **File**: `data-plane/src/backend/core/settings.py`
- **Change**: `ACCESS_TOKEN_LIFETIME` set to 30 seconds
- **Purpose**: Forces tokens to expire quickly for testing

### 2. Frontend Configuration  
- **File**: `data-plane/src/frontend/lib/auth.ts`
- **Change**: Token expiration set to 30 seconds
- **Purpose**: Matches backend token lifetime

### 3. Test Scripts

#### Backend Test Script
- **File**: `data-plane/src/backend/test_refresh_token.py`
- **Purpose**: Tests the complete refresh flow programmatically
- **Usage**: `python test_refresh_token.py`

#### NextAuth React Test
- **File**: `data-plane/src/frontend/app/test-refresh/page.tsx`
- **URL**: `http://localhost:3000/test-refresh`
- **Purpose**: Tests NextAuth integration with refresh logic

#### Token Monitor
- **File**: `data-plane/src/backend/monitor_tokens.py`
- **Purpose**: Real-time monitoring of token validity and refresh activity

## Test User
- **Username**: `testuser`
- **Password**: `testpass123`
- **Role**: Superuser with staff privileges

## Testing Steps

### 1. Backend Testing
```bash
cd data-plane/src/backend
python test_refresh_token.py
```
This will:
- Login and get tokens
- Test API access with valid token
- Wait 30 seconds for token expiration
- Test API access with expired token (should fail)
- Refresh the token
- Test API access with new token (should succeed)

### 2. Frontend Testing
1. Open `http://localhost:3000/test-refresh.html`
2. Click "Login" to authenticate
3. Click "Test API Call" to verify access
4. Wait 30+ seconds
5. Click "Test API Call" again to trigger refresh
6. Watch console logs for refresh activity

### 3. NextAuth Testing
1. Open `http://localhost:3000/test-refresh`
2. Click "Login" to authenticate with NextAuth
3. Click "Test API Call" to verify access
4. Wait 30+ seconds
5. Click "Test API Call" again to trigger refresh
6. Watch the test results for refresh activity

### 4. Real-time Monitoring
```bash
cd data-plane/src/backend
python monitor_tokens.py
```
This will continuously monitor token validity and show refresh activity.

## Expected Results

### ✅ Success Indicators
- Initial login succeeds
- API calls work with valid tokens
- API calls fail with expired tokens (401 error)
- Token refresh succeeds
- API calls work again after refresh
- No "Cannot convert undefined or null to object" errors
- Automatic refresh happens transparently

### ❌ Failure Indicators
- Login fails
- API calls fail even with valid tokens
- Token refresh fails
- NextAuth client fetch errors
- Session becomes null unexpectedly

## Cleanup
After testing, remember to restore normal token lifetimes:
- Change `ACCESS_TOKEN_LIFETIME` back to `timedelta(minutes=60)`
- Change frontend token expiration back to `60 * 60 * 1000`
- Restart both servers
