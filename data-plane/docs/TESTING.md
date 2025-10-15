# NetSentinel Testing Guide

This guide covers comprehensive testing strategies for the NetSentinel multi-tenant ITSM platform, including unit tests, integration tests, end-to-end tests, and performance testing.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Performance Testing](#performance-testing)
7. [Test Automation](#test-automation)
8. [CI/CD Integration](#cicd-integration)

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \     <- Few, Slow, Expensive
     /______\
    /        \
   /Integration\ <- Some, Medium Speed/Cost
  /____________\
 /              \
/   Unit Tests   \ <- Many, Fast, Cheap
/________________\
```

### Test Types Overview

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load
- **Security Tests**: Test authentication and authorization
- **API Tests**: Test API endpoints and contracts

## Backend Testing

### Django Testing Framework

#### Test Configuration

```python
# settings/test.py
from .base import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Test-specific settings
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
```

#### Unit Tests

```python
# users/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from users.models import UserProfile

User = get_user_model()

class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_user(self):
        """Test user creation with valid data."""
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertTrue(self.user.check_password('testpass123'))
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser')

    def test_create_superuser(self):
        """Test superuser creation."""
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_user_str_representation(self):
        """Test user string representation."""
        expected = f"{self.user.first_name} {self.user.last_name} ({self.user.email})"
        self.assertEqual(str(self.user), expected)

    def test_get_full_name(self):
        """Test get_full_name method."""
        self.user.first_name = 'John'
        self.user.last_name = 'Doe'
        self.assertEqual(self.user.get_full_name(), 'John Doe')

    def test_get_short_name(self):
        """Test get_short_name method."""
        self.user.first_name = 'John'
        self.assertEqual(self.user.get_short_name(), 'John')

class UserProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_user_profile(self):
        """Test user profile creation."""
        profile = UserProfile.objects.create(
            user=self.user,
            bio='Test bio',
            phone_number='+1234567890'
        )
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.bio, 'Test bio')
        self.assertEqual(profile.phone_number, '+1234567890')

    def test_user_profile_one_to_one_relationship(self):
        """Test one-to-one relationship between User and UserProfile."""
        profile = UserProfile.objects.create(user=self.user)
        self.assertEqual(self.user.userprofile, profile)
```

#### API Tests

```python
# users/tests/test_views.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )

    def get_auth_headers(self, user):
        """Get authentication headers for a user."""
        refresh = RefreshToken.for_user(user)
        return {
            'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'
        }

    def test_user_registration(self):
        """Test user registration endpoint."""
        url = reverse('users:user-list')
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            're_password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 3)  # 2 existing + 1 new

    def test_user_login(self):
        """Test user login endpoint."""
        url = reverse('users:jwt-create')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_get_current_user(self):
        """Test get current user endpoint."""
        url = reverse('users:user-me')
        headers = self.get_auth_headers(self.user)
        response = self.client.get(url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_update_current_user(self):
        """Test update current user endpoint."""
        url = reverse('users:user-me')
        headers = self.get_auth_headers(self.user)
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'email': 'updated@example.com'
        }
        response = self.client.put(url, data, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.email, 'updated@example.com')

    def test_change_password(self):
        """Test change password endpoint."""
        url = reverse('users:user-set-password')
        headers = self.get_auth_headers(self.user)
        data = {
            'current_password': 'testpass123',
            'new_password': 'newpass123'
        }
        response = self.client.post(url, data, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(self.user.check_password('newpass123'))

    def test_token_refresh(self):
        """Test token refresh endpoint."""
        refresh = RefreshToken.for_user(self.user)
        url = reverse('users:jwt-refresh')
        data = {'refresh': str(refresh)}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_token_verification(self):
        """Test token verification endpoint."""
        refresh = RefreshToken.for_user(self.user)
        url = reverse('users:jwt-verify')
        data = {'token': str(refresh.access_token)}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout(self):
        """Test logout endpoint."""
        refresh = RefreshToken.for_user(self.user)
        url = reverse('users:jwt-logout')
        data = {'refresh': str(refresh)}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints."""
        url = reverse('users:user-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_credentials(self):
        """Test login with invalid credentials."""
        url = reverse('users:jwt-create')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

#### Serializer Tests

```python
# users/tests/test_serializers.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer, UserCreateSerializer
from users.models import UserProfile

User = get_user_model()

class UserSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )

    def test_user_serializer(self):
        """Test user serializer."""
        serializer = UserSerializer(self.user)
        expected_data = {
            'id': self.user.id,
            'username': 'testuser',
            'email': 'test@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'is_staff': False,
            'is_active': True,
            'is_superuser': False,
            'date_joined': self.user.date_joined.isoformat(),
            'last_login': self.user.last_login.isoformat() if self.user.last_login else None
        }
        self.assertEqual(serializer.data, expected_data)

    def test_user_create_serializer(self):
        """Test user creation serializer."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            're_password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        serializer = UserCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, 'newuser')
        self.assertEqual(user.email, 'new@example.com')
        self.assertTrue(user.check_password('newpass123'))

    def test_user_create_serializer_password_mismatch(self):
        """Test user creation with password mismatch."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            're_password': 'differentpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
```

#### Running Backend Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users

# Run specific test class
python manage.py test users.tests.test_models.UserModelTest

# Run specific test method
python manage.py test users.tests.test_models.UserModelTest.test_create_user

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html

# Run with verbose output
python manage.py test --verbosity=2

# Run tests in parallel
python manage.py test --parallel
```

## Frontend Testing

### Testing Setup

#### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### Test Setup File

```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()
```

#### Component Tests

```typescript
// components/__tests__/user-profile.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { UserProfile } from '../user-profile'
import { api } from '@/lib/utils'

// Mock the API client
jest.mock('@/lib/utils', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
  handleApiResponse: jest.fn(),
  safeApiResponse: jest.fn(),
}))

const mockSession = {
  user: {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
  },
  accessToken: 'mock-access-token',
}

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders user profile information', async () => {
    const mockUserData = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    }

    ;(api.get as jest.Mock).mockResolvedValue({
      data: mockUserData,
      status: 200,
    })

    render(
      <SessionProvider session={mockSession}>
        <UserProfile />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })

  it('handles profile update', async () => {
    const mockUserData = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    }

    ;(api.get as jest.Mock).mockResolvedValue({
      data: mockUserData,
      status: 200,
    })

    ;(api.put as jest.Mock).mockResolvedValue({
      data: { ...mockUserData, first_name: 'Updated' },
      status: 200,
    })

    render(
      <SessionProvider session={mockSession}>
        <UserProfile />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    const updateButton = screen.getByRole('button', { name: /update profile/i })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/auth/users/me/', expect.any(Object))
    })
  })

  it('handles API errors gracefully', async () => {
    ;(api.get as jest.Mock).mockResolvedValue({
      error: 'Failed to fetch user data',
      status: 500,
    })

    render(
      <SessionProvider session={mockSession}>
        <UserProfile />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/error loading profile/i)).toBeInTheDocument()
    })
  })
})
```

#### API Client Tests

```typescript
// lib/__tests__/api-client.test.ts
import { apiClient } from '../api-client'
import { getSession, signOut } from 'next-auth/react'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
  signOut: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  it('should make authenticated requests', async () => {
    const mockSession = {
      accessToken: 'mock-access-token',
    }

    ;(getSession as jest.Mock).mockResolvedValue(mockSession)
    ;(fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ data: 'success' }),
    })

    const response = await apiClient.get('/test-endpoint')

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/test-endpoint',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-access-token',
        }),
      })
    )
    expect(response.data).toBe('success')
  })

  it('should handle token refresh on 401', async () => {
    const mockSession = {
      accessToken: 'expired-token',
      refreshToken: 'valid-refresh-token',
    }

    ;(getSession as jest.Mock).mockResolvedValue(mockSession)
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: () => Promise.resolve({ detail: 'Token expired' }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ access: 'new-access-token' }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ data: 'success' }),
      })

    const response = await apiClient.get('/test-endpoint')

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(response.data).toBe('success')
  })

  it('should sign out user when refresh fails', async () => {
    const mockSession = {
      accessToken: 'expired-token',
      refreshToken: 'invalid-refresh-token',
    }

    ;(getSession as jest.Mock).mockResolvedValue(mockSession)
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: () => Promise.resolve({ detail: 'Token expired' }),
      })
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: () => Promise.resolve({ detail: 'Refresh token expired' }),
      })

    const response = await apiClient.get('/test-endpoint')

    expect(signOut).toHaveBeenCalledWith({ redirect: false })
    expect(response.error).toBe('Authentication failed')
  })

  it('should handle network errors', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({
      accessToken: 'mock-token',
    })
    ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const response = await apiClient.get('/test-endpoint')

    expect(response.error).toBe('Network error')
    expect(response.status).toBe(0)
  })
})
```

#### Hook Tests

```typescript
// hooks/__tests__/use-auth.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../use-auth'
import { useSession, signIn, signOut } from 'next-auth/react'

jest.mock('next-auth/react')

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user data when authenticated', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      },
      accessToken: 'mock-token',
    }

    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual(mockSession.user)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('should return loading state when session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(true)
  })

  it('should handle sign in', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signIn('testuser', 'password')
    })

    expect(signIn).toHaveBeenCalledWith('credentials', {
      username: 'testuser',
      password: 'password',
      redirect: false,
    })
  })

  it('should handle sign out', async () => {
    const mockSession = {
      user: { id: '1', email: 'test@example.com' },
      accessToken: 'mock-token',
    }

    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })
})
```

#### Running Frontend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test user-profile.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="UserProfile"

# Run tests in CI mode
npm run test:ci
```

## Integration Testing

### API Integration Tests

```python
# tests/test_integration.py
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json

User = get_user_model()

class AuthenticationIntegrationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_complete_auth_flow(self):
        """Test complete authentication flow."""
        # 1. Login
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        login_response = self.client.post('/api/v1/auth/jwt/create/', login_data)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']
        
        # 2. Access protected endpoint
        headers = {'Authorization': f'Bearer {access_token}'}
        user_response = self.client.get('/api/v1/auth/users/me/', headers=headers)
        self.assertEqual(user_response.status_code, status.HTTP_200_OK)
        self.assertEqual(user_response.data['username'], 'testuser')
        
        # 3. Refresh token
        refresh_data = {'refresh': refresh_token}
        refresh_response = self.client.post('/api/v1/auth/jwt/refresh/', refresh_data)
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        
        new_access_token = refresh_response.data['access']
        
        # 4. Use new token
        headers = {'Authorization': f'Bearer {new_access_token}'}
        user_response = self.client.get('/api/v1/auth/users/me/', headers=headers)
        self.assertEqual(user_response.status_code, status.HTTP_200_OK)
        
        # 5. Logout
        logout_data = {'refresh': refresh_token}
        logout_response = self.client.post('/api/v1/auth/jwt/logout/', logout_data)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

    def test_user_registration_and_login(self):
        """Test user registration followed by login."""
        # 1. Register new user
        registration_data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            're_password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        reg_response = self.client.post('/api/v1/auth/users/', registration_data)
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        
        # 2. Login with new user
        login_data = {
            'username': 'newuser',
            'password': 'newpass123'
        }
        login_response = self.client.post('/api/v1/auth/jwt/create/', login_data)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        # 3. Verify user data
        access_token = login_response.data['access']
        headers = {'Authorization': f'Bearer {access_token}'}
        user_response = self.client.get('/api/v1/auth/users/me/', headers=headers)
        self.assertEqual(user_response.status_code, status.HTTP_200_OK)
        self.assertEqual(user_response.data['username'], 'newuser')
```

### Database Integration Tests

```python
# tests/test_database_integration.py
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from django.contrib.auth import get_user_model
from users.models import UserProfile

User = get_user_model()

class DatabaseIntegrationTest(TransactionTestCase):
    def test_user_profile_cascade_delete(self):
        """Test that user profile is deleted when user is deleted."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        profile = UserProfile.objects.create(
            user=user,
            bio='Test bio'
        )
        
        user_id = user.id
        profile_id = profile.id
        
        # Delete user
        user.delete()
        
        # Verify user and profile are deleted
        self.assertFalse(User.objects.filter(id=user_id).exists())
        self.assertFalse(UserProfile.objects.filter(id=profile_id).exists())

    def test_user_profile_one_to_one_constraint(self):
        """Test one-to-one constraint between User and UserProfile."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create first profile
        profile1 = UserProfile.objects.create(user=user, bio='First bio')
        
        # Try to create second profile for same user
        with self.assertRaises(Exception):
            profile2 = UserProfile.objects.create(user=user, bio='Second bio')
```

## End-to-End Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Examples

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should allow user to login and access dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass123')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
    
    // Verify dashboard content
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('testuser')
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login
    await page.waitForURL('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should allow user to logout', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login
    await page.waitForURL('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill with invalid credentials
    await page.fill('[data-testid="username-input"]', 'invaliduser')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid username or password')
  })
})
```

```typescript
// tests/e2e/user-profile.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should display user profile information', async ({ page }) => {
    await page.goto('/profile')
    
    // Verify profile information is displayed
    await expect(page.locator('[data-testid="profile-username"]')).toContainText('testuser')
    await expect(page.locator('[data-testid="profile-email"]')).toContainText('test@example.com')
  })

  test('should allow user to update profile', async ({ page }) => {
    await page.goto('/profile')
    
    // Update profile information
    await page.fill('[data-testid="first-name-input"]', 'Updated')
    await page.fill('[data-testid="last-name-input"]', 'Name')
    await page.fill('[data-testid="email-input"]', 'updated@example.com')
    
    // Save changes
    await page.click('[data-testid="save-profile-button"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Verify updated information
    await expect(page.locator('[data-testid="profile-name"]')).toContainText('Updated Name')
    await expect(page.locator('[data-testid="profile-email"]')).toContainText('updated@example.com')
  })

  test('should allow user to change password', async ({ page }) => {
    await page.goto('/profile')
    
    // Navigate to password change section
    await page.click('[data-testid="change-password-tab"]')
    
    // Fill password change form
    await page.fill('[data-testid="current-password-input"]', 'testpass123')
    await page.fill('[data-testid="new-password-input"]', 'newpass123')
    await page.fill('[data-testid="confirm-password-input"]', 'newpass123')
    
    // Submit form
    await page.click('[data-testid="change-password-button"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})
```

### Running E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Run E2E tests
npx playwright test

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in headed mode
npx playwright test --headed

# Run tests with specific browser
npx playwright test --project=chromium

# Generate test report
npx playwright show-report
```

## Performance Testing

### Load Testing with Locust

```python
# tests/performance/locustfile.py
from locust import HttpUser, task, between
import json

class NetSentinelUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login and get access token."""
        response = self.client.post('/api/v1/auth/jwt/create/', json={
            'username': 'testuser',
            'password': 'testpass123'
        })
        if response.status_code == 200:
            self.access_token = response.json()['access']
            self.headers = {'Authorization': f'Bearer {self.access_token}'}
        else:
            self.access_token = None
            self.headers = {}

    @task(3)
    def get_current_user(self):
        """Test get current user endpoint."""
        if self.access_token:
            self.client.get('/api/v1/auth/users/me/', headers=self.headers)

    @task(1)
    def update_profile(self):
        """Test update profile endpoint."""
        if self.access_token:
            self.client.put('/api/v1/auth/users/me/', 
                           json={'first_name': 'Updated'},
                           headers=self.headers)

    @task(1)
    def refresh_token(self):
        """Test token refresh endpoint."""
        if self.access_token:
            self.client.post('/api/v1/auth/jwt/refresh/', 
                           json={'refresh': 'valid_refresh_token'})

    @task(2)
    def get_api_info(self):
        """Test public API info endpoint."""
        self.client.get('/api/v1/')
```

### Running Performance Tests

```bash
# Install Locust
pip install locust

# Run performance tests
locust -f tests/performance/locustfile.py --host=http://localhost:8000

# Run with specific user count and spawn rate
locust -f tests/performance/locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10

# Run in headless mode
locust -f tests/performance/locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10 --headless
```

## Test Automation

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd data-plane/src/backend
        pip install -r requirements.txt
        pip install coverage
    
    - name: Run tests
      run: |
        cd data-plane/src/backend
        coverage run --source='.' manage.py test
        coverage report
        coverage xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./data-plane/src/backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: data-plane/src/frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd data-plane/src/frontend
        npm ci
    
    - name: Run tests
      run: |
        cd data-plane/src/frontend
        npm run test:ci
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./data-plane/src/frontend/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: data-plane/src/frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd data-plane/src/frontend
        npm ci
        npx playwright install --with-deps
    
    - name: Run E2E tests
      run: |
        cd data-plane/src/frontend
        npx playwright test
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict

  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.40.0
    hooks:
      - id: eslint
        files: \.(js|jsx|ts|tsx)$
        additional_dependencies:
          - eslint@8.40.0
          - "@typescript-eslint/eslint-plugin@5.57.0"
          - "@typescript-eslint/parser@5.57.0"
```

## CI/CD Integration

### Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:ci && npm run test:e2e"
  }
}
```

### Docker Test Environment

```dockerfile
# Dockerfile.test
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Run tests
CMD ["npm", "run", "test:ci"]
```

### Test Data Management

```python
# tests/fixtures/test_data.py
from django.contrib.auth import get_user_model
from users.models import UserProfile

User = get_user_model()

def create_test_user(username='testuser', email='test@example.com', **kwargs):
    """Create a test user with default values."""
    defaults = {
        'username': username,
        'email': email,
        'password': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User',
    }
    defaults.update(kwargs)
    return User.objects.create_user(**defaults)

def create_test_superuser(username='admin', email='admin@example.com', **kwargs):
    """Create a test superuser."""
    defaults = {
        'username': username,
        'email': email,
        'password': 'adminpass123',
        'first_name': 'Admin',
        'last_name': 'User',
    }
    defaults.update(kwargs)
    return User.objects.create_superuser(**defaults)

def create_test_profile(user, bio='Test bio', **kwargs):
    """Create a test user profile."""
    defaults = {
        'user': user,
        'bio': bio,
        'phone_number': '+1234567890',
    }
    defaults.update(kwargs)
    return UserProfile.objects.create(**defaults)
```

## Best Practices

### Test Organization

1. **Test Structure**: Follow the same structure as your source code
2. **Test Naming**: Use descriptive names that explain what is being tested
3. **Test Isolation**: Each test should be independent and not rely on other tests
4. **Test Data**: Use factories or fixtures for consistent test data
5. **Test Coverage**: Aim for high coverage but focus on critical paths

### Test Performance

1. **Parallel Execution**: Run tests in parallel when possible
2. **Database Optimization**: Use in-memory databases for faster tests
3. **Mocking**: Mock external dependencies to speed up tests
4. **Test Selection**: Run only relevant tests during development

### Test Maintenance

1. **Regular Updates**: Keep tests updated with code changes
2. **Test Documentation**: Document complex test scenarios
3. **Test Reviews**: Include tests in code reviews
4. **Test Metrics**: Monitor test performance and coverage

### Debugging Tests

1. **Verbose Output**: Use verbose flags for detailed test output
2. **Test Debugging**: Use debuggers for complex test failures
3. **Test Logging**: Add logging to understand test execution
4. **Test Isolation**: Isolate failing tests to identify issues

## Conclusion

This comprehensive testing guide provides the foundation for maintaining high-quality code in the NetSentinel project. By following these practices and implementing the suggested test strategies, you can ensure reliable, maintainable, and performant software.

Remember to:
- Write tests early and often
- Keep tests simple and focused
- Maintain good test coverage
- Automate test execution
- Monitor test performance
- Continuously improve testing practices
