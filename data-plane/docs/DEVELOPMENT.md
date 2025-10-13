# NetSentinel Development Guide

This comprehensive guide covers all aspects of developing the NetSentinel multi-tenant ITSM platform.

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Backend Development](#backend-development)
3. [Frontend Development](#frontend-development)
4. [Testing](#testing)
5. [Code Standards](#code-standards)
6. [Debugging](#debugging)
7. [Performance Optimization](#performance-optimization)
8. [Deployment](#deployment)


## Project Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Django)      │◄──►│   (SQLite)      │
│   Port: 3000    │    │   Port: 8000    │    │   Local File    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.5.4
- **Language**: TypeScript
- **UI Library**: Radix UI + Tailwind CSS
- **Authentication**: NextAuth.js
- **State Management**: React Context + NextAuth
- **HTTP Client**: Custom API client with automatic token refresh

#### Backend
- **Framework**: Django 5.2.7
- **Language**: Python 3.11+
- **API**: Django REST Framework
- **Authentication**: SimpleJWT
- **User Management**: Djoser
- **Database**: SQLite (development), PostgreSQL (production)
- **Documentation**: drf-yasg (Swagger)

### Directory Structure

```
data-plane/src/
├── backend/
│   ├── core/                 # Django project settings
│   │   ├── __init__.py
│   │   ├── settings.py       # Main settings file
│   │   ├── urls.py           # Root URL configuration
│   │   ├── wsgi.py           # WSGI configuration
│   │   └── asgi.py           # ASGI configuration
│   ├── users/                # User management app
│   │   ├── models.py         # User model
│   │   ├── views.py          # API views
│   │   ├── serializers.py    # Data serializers
│   │   ├── urls.py           # URL patterns
│   │   └── migrations/       # Database migrations
│   ├── manage.py             # Django management script
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile           # Container configuration
└── frontend/
    ├── app/                  # Next.js app router
    │   ├── (auth)/           # Authentication pages
    │   ├── (app)/            # Main application pages
    │   ├── api/              # API routes
    │   └── globals.css       # Global styles
    ├── components/           # React components
    │   ├── auth-provider.tsx # Authentication provider
    │   ├── protected-route.tsx # Route protection
    │   └── ...               # Other components
    ├── lib/                  # Utility libraries
    │   ├── auth.ts           # NextAuth configuration
    │   ├── api-client.ts     # API client with refresh
    │   ├── server-api.ts     # Server-side API client
    │   └── utils.ts          # Utility functions
    ├── middleware.ts          # Next.js middleware
    ├── package.json          # Node.js dependencies
    └── Dockerfile           # Container configuration
```

## Backend Development

### Django Project Structure

The backend follows Django best practices with a modular structure:

#### Core Settings (`core/settings.py`)

Key configurations:
- **Database**: SQLite for development, PostgreSQL for production
- **Authentication**: SimpleJWT with token rotation
- **CORS**: Configured for frontend integration
- **API**: REST Framework with pagination and filtering

#### User Management (`users/`)

- **Models**: Custom User model extending AbstractUser
- **Serializers**: User data serialization for API
- **Views**: API endpoints for user management
- **URLs**: RESTful URL patterns

### API Development

#### Creating New Endpoints

1. **Define Model** (if needed):
```python
# users/models.py
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

2. **Create Serializer**:
```python
# users/serializers.py
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio', 'avatar', 'created_at']
```

3. **Create View**:
```python
# users/views.py
class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
```

4. **Add URL Pattern**:
```python
# users/urls.py
router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet)
urlpatterns = [
    path('', include(router.urls)),
]
```

### Database Management

#### Migrations

```bash
# Create migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Rollback migration
python manage.py migrate users 0001
```

#### Database Operations

```bash
# Access Django shell
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Load fixtures
python manage.py loaddata fixtures/initial_data.json

# Dump data
python manage.py dumpdata users.User --indent 2 > users.json
```

### Authentication & Authorization

#### JWT Configuration

The system uses SimpleJWT with the following settings:

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}
```

#### Custom Permissions

```python
# users/permissions.py
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user
```

## Frontend Development

### Next.js App Router

The frontend uses Next.js 15 with the app router for modern React development.

#### Page Structure

```
app/
├── (auth)/              # Authentication group
│   ├── login/           # Login page
│   └── logout/          # Logout page
├── (app)/               # Main application group
│   ├── dashboard/       # Dashboard page
│   ├── settings/        # Settings page
│   └── unauthorized/    # 403 error page
├── api/                 # API routes
│   └── auth/            # Authentication API routes
├── globals.css          # Global styles
└── layout.tsx          # Root layout
```

#### Component Development

```typescript
// components/user-profile.tsx
import { useSession } from "next-auth/react"
import { api } from "@/lib/utils"

export function UserProfile() {
  const { data: session } = useSession()
  
  const handleUpdateProfile = async (data: ProfileData) => {
    try {
      const response = await api.put('/users/profile/', data)
      if (response.error) {
        throw new Error(response.error)
      }
      // Handle success
    } catch (error) {
      // Handle error
    }
  }
  
  return (
    <div>
      <h1>Profile</h1>
      {/* Profile form */}
    </div>
  )
}
```

### API Client Usage

The custom API client handles authentication and token refresh automatically:

```typescript
import { api, handleApiResponse, safeApiResponse } from "@/lib/utils"

// Method 1: Throws on error
try {
  const users = handleApiResponse(await api.get('/users/'))
  console.log(users)
} catch (error) {
  console.error('Request failed:', error.message)
}

// Method 2: Returns success/error object
const response = await api.get('/users/')
const result = safeApiResponse(response)

if (result.success) {
  console.log(result.data)
} else {
  console.error('Request failed:', result.error)
}
```

### Authentication Integration

#### Using NextAuth Hooks

```typescript
import { useSession, signIn, signOut } from "next-auth/react"

export function AuthButton() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Loading...</p>
  
  if (session) {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }
  
  return (
    <button onClick={() => signIn()}>Sign in</button>
  )
}
```

#### Protected Routes

```typescript
import { ProtectedRoute } from '@/components/protected-route'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>Admin-only content</div>
    </ProtectedRoute>
  )
}
```

### State Management

The application uses React Context for global state management:

```typescript
// contexts/app-context.tsx
import { createContext, useContext, useReducer } from 'react'

interface AppState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
```

## Testing

### Backend Testing

#### Unit Tests

```python
# users/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()

class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))

class UserAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_registration(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            're_password': 'newpass123'
        }
        response = self.client.post('/api/v1/auth/users/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

#### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend Testing

#### Component Testing

```typescript
// components/__tests__/user-profile.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { UserProfile } from '../user-profile'
import { SessionProvider } from 'next-auth/react'

const mockSession = {
  user: {
    email: 'test@example.com',
    username: 'testuser'
  }
}

describe('UserProfile', () => {
  it('renders user information', () => {
    render(
      <SessionProvider session={mockSession}>
        <UserProfile />
      </SessionProvider>
    )
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
})
```

#### API Testing

```typescript
// lib/__tests__/api-client.test.ts
import { apiClient } from '../api-client'

// Mock fetch
global.fetch = jest.fn()

describe('ApiClient', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })
  
  it('should handle token refresh on 401', async () => {
    // Mock 401 response
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 401,
        json: () => Promise.resolve({ detail: 'Token expired' })
      })
      // Mock successful refresh
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ access: 'new-token' })
      })
      // Mock successful retry
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ data: 'success' })
      })
    
    const response = await apiClient.get('/test-endpoint')
    expect(response.data).toBe('success')
  })
})
```

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Code Standards

### Python/Django Standards

#### Code Style

- **PEP 8**: Follow Python PEP 8 style guide
- **Black**: Use Black for code formatting
- **isort**: Use isort for import sorting
- **Flake8**: Use Flake8 for linting

```bash
# Install development tools
pip install black isort flake8

# Format code
black .
isort .

# Lint code
flake8 .
```

#### Django Best Practices

- Use class-based views for complex logic
- Implement proper error handling
- Use serializers for data validation
- Follow DRY (Don't Repeat Yourself) principle
- Write comprehensive docstrings

### TypeScript/React Standards

#### Code Style

- **ESLint**: Use ESLint for code linting
- **Prettier**: Use Prettier for code formatting
- **TypeScript**: Strict type checking enabled

```bash
# Install development tools
npm install -D eslint prettier @typescript-eslint/parser

# Format code
npm run format

# Lint code
npm run lint
```

#### React Best Practices

- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript for type safety
- Follow component composition patterns
- Write comprehensive prop types

### Git Workflow

#### Branch Naming

- `feature/description`: New features
- `bugfix/description`: Bug fixes
- `hotfix/description`: Critical fixes
- `refactor/description`: Code refactoring
- `docs/description`: Documentation updates

#### Commit Messages

Follow conventional commits:

```
feat: add user profile management
fix: resolve token refresh issue
docs: update authentication guide
refactor: simplify API client logic
test: add unit tests for user model
```

## Debugging

### Backend Debugging

#### Django Debug Toolbar

```python
# settings.py
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']
```

#### Logging Configuration

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### Frontend Debugging

#### React Developer Tools

Install React Developer Tools browser extension for component inspection.

#### Next.js Debugging

```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

#### API Debugging

```typescript
// Add request/response logging
const response = await api.get('/endpoint')
console.log('Response:', response)
```

## Performance Optimization

### Backend Optimization

#### Database Optimization

```python
# Use select_related for foreign keys
users = User.objects.select_related('profile').all()

# Use prefetch_related for many-to-many
users = User.objects.prefetch_related('groups').all()

# Use only() to limit fields
users = User.objects.only('username', 'email')
```

#### Caching

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

# views.py
from django.core.cache import cache

def expensive_view(request):
    cache_key = f'expensive_data_{request.user.id}'
    data = cache.get(cache_key)
    
    if data is None:
        data = expensive_calculation()
        cache.set(cache_key, data, 300)  # 5 minutes
    
    return Response(data)
```

### Frontend Optimization

#### Code Splitting

```typescript
// Dynamic imports for code splitting
const LazyComponent = dynamic(() => import('./LazyComponent'), {
  loading: () => <p>Loading...</p>,
})
```

#### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // For above-the-fold images
/>
```

#### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze
```

## Deployment

### Local Development

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./data-plane/src/backend
    ports:
      - "8000:8000"
    environment:
      - DEBUG=True
      - DATABASE_URL=sqlite:///db.sqlite3
    volumes:
      - ./data-plane/src/backend:/app
  
  frontend:
    build: ./data-plane/src/frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    volumes:
      - ./data-plane/src/frontend:/app
      - /app/node_modules
```

#### Kubernetes Development

```bash
# Start Minikube
minikube start

# Deploy infrastructure
kubectl apply -f infrastructure/

# Deploy applications
kubectl apply -f data-plane/src/backend/k8s/
kubectl apply -f data-plane/src/frontend/k8s/
```

### Production Deployment

#### Environment Configuration

```bash
# Production environment variables
export SECRET_KEY="production-secret-key"
export DEBUG=False
export DATABASE_URL="postgresql://user:pass@host:port/db"
export ALLOWED_HOSTS="yourdomain.com,www.yourdomain.com"
```

#### Database Migration

```bash
# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic

# Create superuser
python manage.py createsuperuser
```

#### Frontend Build

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

## Troubleshooting

### Common Issues

#### Backend Issues

1. **Database Connection Errors**
   - Check database URL configuration
   - Verify database server is running
   - Check network connectivity

2. **CORS Issues**
   - Verify CORS_ALLOWED_ORIGINS includes frontend URL
   - Check CORS_ALLOW_CREDENTIALS setting

3. **Authentication Issues**
   - Verify JWT settings
   - Check token expiration times
   - Validate user permissions

#### Frontend Issues

1. **API Connection Errors**
   - Check NEXT_PUBLIC_API_URL configuration
   - Verify backend is running
   - Check network connectivity

2. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL configuration
   - Validate token refresh logic

3. **Build Errors**
   - Check TypeScript errors
   - Verify all dependencies are installed
   - Check environment variables

### Debug Commands

```bash
# Backend debugging
python manage.py shell
python manage.py check
python manage.py validate

# Frontend debugging
npm run lint
npm run type-check
npm run build
```

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)

## Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Write code following project standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Changes**
   ```bash
   # Backend tests
   python manage.py test
   
   # Frontend tests
   npm test
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/new-feature
   ```

### Code Review Checklist

- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact is considered
- [ ] Error handling is implemented
- [ ] TypeScript types are correct
