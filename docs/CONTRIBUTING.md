# NetSentinel Contributing Guide

This guide provides information for contributors who want to help improve the NetSentinel multi-tenant ITSM platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Testing Requirements](#testing-requirements)
5. [Documentation](#documentation)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **Git** for version control
- **Docker** and Docker Compose (optional but recommended)
- **Code Editor** (VS Code, IntelliJ, etc.)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/NetSentinel.git
   cd NetSentinel
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/NetSentinel.git
   ```

### Development Setup

Follow the setup instructions in `data-plane/docs/DEVELOPMENT.md` to get your local environment running.

## Development Workflow

### Branch Strategy

We use **Git Flow** with the following branch types:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features
- **`bugfix/*`**: Bug fixes
- **`hotfix/*`**: Critical production fixes
- **`release/*`**: Release preparation

### Creating a Feature Branch

```bash
# Start from develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name

# Push to your fork
git push origin feature/your-feature-name
```

### Branch Naming Convention

Use descriptive branch names:

- `feature/user-profile-management`
- `bugfix/fix-token-refresh-issue`
- `hotfix/security-patch-auth`
- `refactor/simplify-api-client`
- `docs/update-deployment-guide`

### Commit Messages

Follow the **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- **`feat`**: New feature
- **`fix`**: Bug fix
- **`docs`**: Documentation changes
- **`style`**: Code style changes (formatting, etc.)
- **`refactor`**: Code refactoring
- **`test`**: Adding or updating tests
- **`chore`**: Maintenance tasks
- **`perf`**: Performance improvements
- **`ci`**: CI/CD changes

#### Examples

```bash
feat(auth): add multi-factor authentication support

fix(api): resolve token refresh race condition

docs: update API documentation with new endpoints

refactor(frontend): simplify component state management

test(backend): add unit tests for user model

chore: update dependencies to latest versions
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

```python
class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user profiles.
    
    Provides CRUD operations for user profile data with
    proper authentication and permission checks.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return profiles for the authenticated user only."""
        return UserProfile.objects.filter(user=self.request.user)
```

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

```typescript
interface UserProfileProps {
  /** User data to display */
  user: User
  /** Callback when profile is updated */
  onUpdate: (user: User) => void
  /** Whether the profile is in edit mode */
  isEditing?: boolean
}

export function UserProfile({ user, onUpdate, isEditing = false }: UserProfileProps) {
  // Component implementation
}
```

### File Organization

#### Backend Structure

```
backend/
├── apps/
│   ├── users/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── tests/
│   │   └── migrations/
│   └── tickets/
├── core/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   └── wsgi.py
└── requirements/
    ├── base.txt
    ├── development.txt
    └── production.txt
```

#### Frontend Structure

```
frontend/
├── app/
│   ├── (auth)/
│   ├── (app)/
│   └── api/
├── components/
│   ├── ui/
│   ├── forms/
│   └── layout/
├── lib/
│   ├── api/
│   ├── auth/
│   └── utils/
├── hooks/
├── types/
└── __tests__/
```

## Testing Requirements

### Test Coverage

- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 80% code coverage
- **Critical paths**: 100% coverage required

### Writing Tests

#### Backend Tests

```python
# users/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import UserProfile

User = get_user_model()

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
            bio='Test bio'
        )
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.bio, 'Test bio')

    def test_user_profile_str_representation(self):
        """Test user profile string representation."""
        profile = UserProfile.objects.create(
            user=self.user,
            bio='Test bio'
        )
        expected = f"{self.user.get_full_name()} Profile"
        self.assertEqual(str(profile), expected)
```

#### Frontend Tests

```typescript
// components/__tests__/user-profile.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { UserProfile } from '../user-profile'

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User'
  }

  it('renders user profile information', () => {
    render(<UserProfile user={mockUser} onUpdate={jest.fn()} />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('calls onUpdate when profile is updated', () => {
    const mockOnUpdate = jest.fn()
    render(<UserProfile user={mockUser} onUpdate={mockOnUpdate} />)
    
    fireEvent.click(screen.getByRole('button', { name: /update/i }))
    
    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
      ...mockUser,
      first_name: 'Updated'
    }))
  })
})
```

### Running Tests

```bash
# Backend tests
cd data-plane/src/backend
python manage.py test
coverage run --source='.' manage.py test
coverage report

# Frontend tests
cd data-plane/src/frontend
npm test
npm run test:coverage
```

## Documentation

### Code Documentation

#### Python Docstrings

```python
def create_user_profile(user: User, bio: str = None) -> UserProfile:
    """
    Create a user profile for the given user.
    
    Args:
        user: The user to create a profile for
        bio: Optional biography text for the profile
        
    Returns:
        UserProfile: The created user profile instance
        
    Raises:
        ValidationError: If the user already has a profile
        ValueError: If the bio is too long
        
    Example:
        >>> user = User.objects.get(username='john')
        >>> profile = create_user_profile(user, bio='Software developer')
        >>> profile.bio
        'Software developer'
    """
    if hasattr(user, 'userprofile'):
        raise ValidationError('User already has a profile')
    
    if bio and len(bio) > 500:
        raise ValueError('Bio must be 500 characters or less')
    
    return UserProfile.objects.create(user=user, bio=bio)
```

#### TypeScript Documentation

```typescript
/**
 * Creates a new user profile with the provided data.
 * 
 * @param user - The user to create a profile for
 * @param profileData - The profile data to create
 * @returns Promise that resolves to the created profile
 * 
 * @throws {ValidationError} When user already has a profile
 * @throws {ApiError} When the API request fails
 * 
 * @example
 * ```typescript
 * const user = { id: '1', username: 'john' }
 * const profileData = { bio: 'Software developer' }
 * const profile = await createUserProfile(user, profileData)
 * console.log(profile.bio) // 'Software developer'
 * ```
 */
export async function createUserProfile(
  user: User,
  profileData: CreateProfileData
): Promise<UserProfile> {
  // Implementation
}
```

### README Updates

When adding new features, update relevant README files:

- **Main README**: Update feature list and quick start
- **Component README**: Document new components
- **API README**: Document new endpoints

### Documentation Standards

- Use clear, concise language
- Include code examples
- Update documentation with code changes
- Use proper markdown formatting
- Include screenshots for UI changes

## Pull Request Process

### Before Submitting

1. **Run tests** and ensure they pass
2. **Check code coverage** meets requirements
3. **Run linting** and fix any issues
4. **Update documentation** if needed
5. **Test your changes** thoroughly

### Pull Request Template

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Code coverage meets requirements

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)

Add screenshots to help explain your changes.

```

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
## Bug Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

A clear and concise description of what actually happened.

## Environment

- OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
- Browser: [e.g. Chrome 91, Firefox 89, Safari 14]
- Node.js version: [e.g. 18.0.0]
- Python version: [e.g. 3.11.0]

## Additional Context

Add any other context about the problem here.
```

Happy coding! 🚀
