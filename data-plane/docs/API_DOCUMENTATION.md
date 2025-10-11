# NetSentinel API Documentation

This document provides comprehensive documentation for the NetSentinel API endpoints, authentication, and usage examples.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Formats](#requestresponse-formats)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [SDK Examples](#sdk-examples)

## Authentication

### JWT Authentication

NetSentinel uses JWT (JSON Web Tokens) for authentication. The system implements a dual-token approach:

- **Access Token**: Short-lived token (1 hour) for API requests
- **Refresh Token**: Long-lived token (7 days) for obtaining new access tokens

### Authentication Flow

1. **Login**: Send credentials to `/auth/jwt/create/` to obtain tokens
2. **API Requests**: Include access token in Authorization header
3. **Token Refresh**: Use refresh token to get new access token when expired
4. **Logout**: Blacklist refresh token to invalidate session

### Token Configuration

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),      # 1 hour
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),         # 7 days
    "ROTATE_REFRESH_TOKENS": True,                       # Rotate refresh tokens
    "BLACKLIST_AFTER_ROTATION": True,                   # Blacklist old refresh tokens
    "UPDATE_LAST_LOGIN": True,                           # Update last login timestamp
    "ALGORITHM": "HS256",                                # Signing algorithm
    "AUTH_HEADER_TYPES": ("Bearer",),                    # Authorization header type
}
```

## API Endpoints

### Base URL

```
Development: http://localhost:8000/api/v1
Production: https://api.netsentinel.com/api/v1
```

### Authentication Endpoints

#### Login

**POST** `/auth/jwt/create/`

Obtain access and refresh tokens by providing user credentials.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "No active account found with the given credentials"
}
```

#### Refresh Token

**POST** `/auth/jwt/refresh/`

Obtain a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Token is invalid or expired"
}
```

#### Verify Token

**POST** `/auth/jwt/verify/`

Verify if a token is valid.

**Request Body:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Token is invalid or expired"
}
```

#### Logout

**POST** `/auth/jwt/logout/`

Blacklist a refresh token to invalidate the session.

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{}
```

### User Management Endpoints

#### Get Current User

**GET** `/auth/users/me/`

Get information about the currently authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_staff": false,
  "is_active": true,
  "is_superuser": false,
  "date_joined": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-01T12:00:00Z"
}
```

#### Update Current User

**PUT** `/auth/users/me/`

Update information for the currently authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_staff": false,
  "is_active": true,
  "is_superuser": false,
  "date_joined": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-01T12:00:00Z"
}
```

#### Change Password

**POST** `/auth/users/set_password/`

Change the password for the currently authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

**Response (204 No Content):**
```
```

#### User Registration

**POST** `/auth/users/`

Register a new user account.

**Request Body:**
```json
{
  "username": "new_user",
  "email": "new@example.com",
  "password": "secure_password",
  "re_password": "secure_password",
  "first_name": "New",
  "last_name": "User"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "username": "new_user",
  "email": "new@example.com",
  "first_name": "New",
  "last_name": "User",
  "is_staff": false,
  "is_active": true,
  "is_superuser": false,
  "date_joined": "2024-01-01T00:00:00Z"
}
```

### System Endpoints

#### API Information

**GET** `/`

Get basic information about the API.

**Response (200 OK):**
```json
{
  "message": "NetSentinel API is running!",
  "version": "v1",
  "endpoints": {
    "authentication": "/api/v1/auth/",
    "user_stats": "/api/v1/stats/",
    "documentation": "/swagger/"
  },
  "note": "Most endpoints require authentication. Use /api/v1/auth/users/ to register or /api/v1/auth/jwt/create/ to login."
}
```

#### User Statistics (Admin Only)

**GET** `/stats/`

Get user statistics (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "total_users": 150,
  "active_users": 120,
  "staff_users": 5,
  "superusers": 2,
  "new_users_this_month": 25
}
```

## Request/Response Formats

### Content Types

- **Request**: `application/json`
- **Response**: `application/json`

### Pagination

List endpoints support pagination using query parameters:

```
GET /auth/users/?page=2&page_size=20
```

**Response:**
```json
{
  "count": 150,
  "next": "http://api.netsentinel.com/api/v1/auth/users/?page=3",
  "previous": "http://api.netsentinel.com/api/v1/auth/users/?page=1",
  "results": [
    {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com"
    }
  ]
}
```

### Filtering and Search

Many endpoints support filtering and search:

```
GET /auth/users/?search=john&is_active=true
GET /auth/users/?ordering=-date_joined
```

### Field Selection

Use the `fields` parameter to limit returned fields:

```
GET /auth/users/me/?fields=id,username,email
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "field": "field_name"  // For field-specific errors
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no content returned
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: HTTP method not allowed
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Common Error Examples

#### Authentication Errors

```json
{
  "detail": "Authentication credentials were not provided."
}
```

```json
{
  "detail": "Token is invalid or expired"
}
```

#### Validation Errors

```json
{
  "username": ["This field is required."],
  "email": ["Enter a valid email address."],
  "password": ["This password is too short. It must contain at least 8 characters."]
}
```

#### Permission Errors

```json
{
  "detail": "You do not have permission to perform this action."
}
```

## Rate Limiting

### Rate Limits

- **Authentication endpoints**: 5 requests per minute per IP
- **User endpoints**: 100 requests per hour per user
- **General API**: 1000 requests per hour per user

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "detail": "Request was throttled. Expected available in 60 seconds."
}
```

## SDK Examples

### JavaScript/TypeScript

#### Using Fetch API

```typescript
class NetSentinelAPI {
  private baseURL = 'http://localhost:8000/api/v1'
  private accessToken: string | null = null

  async login(username: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/jwt/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()
    this.accessToken = data.access
    return data
  }

  async getCurrentUser() {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${this.baseURL}/auth/users/me/`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user')
    }

    return response.json()
  }

  async refreshToken(refreshToken: string) {
    const response = await fetch(`${this.baseURL}/auth/jwt/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    this.accessToken = data.access
    return data
  }
}

// Usage
const api = new NetSentinelAPI()

try {
  await api.login('username', 'password')
  const user = await api.getCurrentUser()
  console.log(user)
} catch (error) {
  console.error('API Error:', error)
}
```

#### Using Axios

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/auth/jwt/refresh/`, {
            refresh: refreshToken,
          })
          const newAccessToken = response.data.access
          localStorage.setItem('access_token', newAccessToken)
          error.config.headers.Authorization = `Bearer ${newAccessToken}`
          return api.request(error.config)
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Usage
try {
  const response = await api.get('/auth/users/me/')
  console.log(response.data)
} catch (error) {
  console.error('API Error:', error)
}
```

### Python

#### Using Requests

```python
import requests
import json
from typing import Optional, Dict, Any

class NetSentinelAPI:
    def __init__(self, base_url: str = "http://localhost:8000/api/v1"):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.session = requests.Session()

    def login(self, username: str, password: str) -> Dict[str, Any]:
        """Login and obtain tokens."""
        response = self.session.post(
            f"{self.base_url}/auth/jwt/create/",
            json={"username": username, "password": password}
        )
        response.raise_for_status()
        
        data = response.json()
        self.access_token = data["access"]
        self.refresh_token = data["refresh"]
        return data

    def get_current_user(self) -> Dict[str, Any]:
        """Get current user information."""
        if not self.access_token:
            raise ValueError("Not authenticated")
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.session.get(
            f"{self.base_url}/auth/users/me/",
            headers=headers
        )
        response.raise_for_status()
        return response.json()

    def refresh_access_token(self) -> str:
        """Refresh access token."""
        if not self.refresh_token:
            raise ValueError("No refresh token available")
        
        response = self.session.post(
            f"{self.base_url}/auth/jwt/refresh/",
            json={"refresh": self.refresh_token}
        )
        response.raise_for_status()
        
        data = response.json()
        self.access_token = data["access"]
        return self.access_token

    def logout(self) -> None:
        """Logout and blacklist refresh token."""
        if self.refresh_token:
            self.session.post(
                f"{self.base_url}/auth/jwt/logout/",
                json={"refresh": self.refresh_token}
            )
        self.access_token = None
        self.refresh_token = None

# Usage
api = NetSentinelAPI()

try:
    api.login("username", "password")
    user = api.get_current_user()
    print(f"Welcome, {user['first_name']} {user['last_name']}")
except requests.exceptions.RequestException as e:
    print(f"API Error: {e}")
```

### cURL Examples

#### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

#### Get Current User

```bash
curl -X GET http://localhost:8000/api/v1/auth/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Update User Profile

```bash
curl -X PUT http://localhost:8000/api/v1/auth/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com"
  }'
```

#### Refresh Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/jwt/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

## Testing the API

### Using Swagger UI

Access the interactive API documentation at:
```
http://localhost:8000/swagger/
```

### Using Postman

1. Import the API collection
2. Set up environment variables:
   - `base_url`: `http://localhost:8000/api/v1`
   - `access_token`: (will be set after login)
   - `refresh_token`: (will be set after login)

3. Run the authentication flow:
   - Login to get tokens
   - Use tokens for authenticated requests

### Using Insomnia

1. Create a new workspace
2. Add environment variables
3. Create requests for each endpoint
4. Use the authentication flow

## Security Considerations

### Token Security

- **Storage**: Store tokens securely (httpOnly cookies recommended)
- **Transmission**: Always use HTTPS in production
- **Expiration**: Tokens have short lifespans for security
- **Rotation**: Refresh tokens are rotated on each use

### API Security

- **Rate Limiting**: Implemented to prevent abuse
- **Input Validation**: All inputs are validated and sanitized
- **CORS**: Properly configured for frontend integration
- **Authentication**: Required for all protected endpoints

### Best Practices

1. **Never expose tokens in client-side code**
2. **Use HTTPS in production**
3. **Implement proper error handling**
4. **Monitor API usage and errors**
5. **Keep tokens secure and rotate regularly**
6. **Validate all user inputs**
7. **Use proper HTTP status codes**
8. **Implement proper logging and monitoring**

## Changelog

### Version 1.0.0
- Initial API release
- JWT authentication implementation
- User management endpoints
- Basic CRUD operations
- Swagger documentation

### Future Versions
- Multi-factor authentication
- Social login integration
- Advanced user permissions
- Audit logging endpoints
- Webhook support
- GraphQL API
