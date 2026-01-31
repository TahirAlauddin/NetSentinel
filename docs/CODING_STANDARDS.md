# NetSentinel Coding Standards

This document outlines the coding standards and conventions that must be followed throughout the NetSentinel codebase. 

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript/React Standards](#typescriptreact-standards)
3. [Python/Django Standards](#pythondjango-standards)
4. [File Organization](#file-organization)
5. [Naming Conventions](#naming-conventions)
6. [Export/Import Patterns](#exportimport-patterns)
7. [Component Structure](#component-structure)
8. [Type Definitions](#type-definitions)
9. [Error Handling](#error-handling)
10. [Testing Standards](#testing-standards)
11. [Documentation Standards](#documentation-standards)
12. [Code Formatting](#code-formatting)

---

## General Principles

### Core Principles

1. **Consistency**: Follow established patterns throughout the codebase
2. **Clarity**: Write code that is self-documenting and easy to understand
3. **Maintainability**: Structure code for long-term maintenance
4. **Type Safety**: Leverage TypeScript's type system to catch errors early
5. **DRY (Don't Repeat Yourself)**: Avoid code duplication
6. **SOLID Principles**: Apply object-oriented design principles where applicable

### Code Quality

- All code must pass linting and type checking
- Code coverage must meet minimum thresholds (60% for branches, functions, lines, statements)
- All new features must include appropriate tests
- Code reviews are required for all changes

---

## TypeScript/React Standards

### TypeScript Configuration

- **Strict Mode**: Always enabled (`"strict": true` in tsconfig.json)
- **Type Safety**: Avoid `any` types; use `unknown` when necessary
- **Type Inference**: Prefer type inference where types are obvious
- **Explicit Types**: Use explicit types for function parameters and return types in public APIs

### React Component Patterns

#### Component Declaration

**✅ DO**: Use named function exports for all components

```typescript
// ✅ Correct - Named export
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  return <div>{user.name}</div>;
}

// ❌ Wrong - Default export
export default function UserProfile({ user, onUpdate }: UserProfileProps) {
  return <div>{user.name}</div>;
}
```

#### Component Structure

Components should follow this structure:

```typescript
"use client"; // Only if needed for client-side features

import { useState, useEffect } from "react";
import { ComponentProps } from "@/types/components";

interface ComponentNameProps {
  /** Description of prop */
  requiredProp: string;
  /** Description of optional prop */
  optionalProp?: number;
}

/**
 * ComponentName - Brief description of what the component does
 * 
 * @param requiredProp - Description of required prop
 * @param optionalProp - Description of optional prop
 */
export function ComponentName({ 
  requiredProp, 
  optionalProp = defaultValue 
}: ComponentNameProps) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState<StateType>(initialValue);
  
  // 2. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 3. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 4. Computed values
  const computedValue = useMemo(() => {
    // Computation
  }, [dependencies]);
  
  // 5. Early returns
  if (condition) {
    return <LoadingState />;
  }
  
  // 6. Main render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Hooks

- Use custom hooks to extract reusable logic
- Prefix custom hooks with `use` (e.g., `useFormData`, `useApiClient`)
- Keep hooks focused on a single responsibility
- Document hook parameters and return values

```typescript
/**
 * useFormData - Manages form state and validation
 * 
 * @param initialData - Initial form data
 * @returns Form state and handlers
 */
export function useFormData<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Hook implementation
  
  return { data, errors, setData, setErrors, validate };
}
```

### Props Interface Naming

- Always suffix prop interfaces with `Props`
- Use descriptive, specific names

```typescript
// ✅ Correct
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

// ❌ Wrong
interface Props {
  user: User;
}

interface UserProfile {
  user: User;
}
```

---

## Export/Import Patterns

### Named Exports Only

**All components, utilities, and types MUST use named exports. Default exports are NOT allowed for components.**

### Export Rules

1. **Components**: Always use named function exports
   ```typescript
   // ✅ Correct
   export function MyComponent() { }
   
   // ❌ Wrong
   export default function MyComponent() { }
   ```

2. **Utilities**: Use named exports
   ```typescript
   // ✅ Correct
   export function formatDate(date: Date): string { }
   export const CONSTANTS = { };
   
   // ❌ Wrong
   export default function formatDate(date: Date): string { }
   ```

3. **Types/Interfaces**: Use named exports
   ```typescript
   // ✅ Correct
   export interface User { }
   export type Status = "active" | "inactive";
   
   // ❌ Wrong
   export default interface User { }
   ```

4. **Constants**: Use named exports
   ```typescript
   // ✅ Correct
   export const API_BASE_URL = "https://api.example.com";
   export const STATUS_OPTIONS = [/* ... */];
   ```

### Import Rules

1. **Always use named imports** for components and utilities
   ```typescript
   // ✅ Correct
   import { UserProfile } from "@/components/users/UserProfile";
   import { formatDate, formatCurrency } from "@/utils/formatting";
   
   // ❌ Wrong
   import UserProfile from "@/components/users/UserProfile";
   import formatDate from "@/utils/formatting";
   ```

2. **Group imports** in this order:
   ```typescript
   // 1. React and Next.js
   import { useState, useEffect } from "react";
   import { useRouter } from "next/navigation";
   
   // 2. Third-party libraries
   import { toast } from "sonner";
   import { LucideIcon } from "lucide-react";
   
   // 3. Internal components
   import { Button } from "@/components/ui/button";
   import { UserProfile } from "@/components/users/UserProfile";
   
   // 4. Internal utilities and hooks
   import { formatDate } from "@/utils/formatting";
   import { useFormData } from "@/hooks/useFormData";
   
   // 5. Types
   import { User } from "@/types/users";
   import { ApiResponse } from "@/types/api";
   
   // 6. Constants
   import { API_BASE_URL } from "@/constants/api";
   ```

3. **Use absolute imports** with `@/` alias for internal imports
   ```typescript
   // ✅ Correct
   import { Button } from "@/components/ui/button";
   import { User } from "@/types/users";
   
   // ❌ Wrong (relative imports for internal code)
   import { Button } from "../../components/ui/button";
   ```

### Barrel Exports (index.ts files)

When creating barrel exports, use named re-exports:

```typescript
// ✅ Correct - index.ts
export { ComponentA } from "./ComponentA";
export { ComponentB } from "./ComponentB";
export type { ComponentAProps } from "./ComponentA";

// ❌ Wrong
export default ComponentA;
```

---

## File Organization

### Directory Structure

```
components/
├── apps/
│   └── assets/
│       ├── shared/
│       │   ├── form/
│       │   │   ├── AssetForm.tsx
│       │   │   ├── AssetFormHeader.tsx
│       │   │   └── index.ts (barrel export)
│       │   └── steps/
│       │       ├── BasicDetailsStep.tsx
│       │       └── LocationAndUsageStep.tsx
│       └── AssetTable.tsx
├── ui/ (shadcn components)
└── layout/
    └── app-shell.tsx
```

### File Naming

- **Components**: PascalCase (e.g., `UserProfile.tsx`, `AssetForm.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`, `apiClient.ts`)
- **Types**: camelCase with `.ts` extension (e.g., `users.ts`, `api.ts`)
- **Constants**: camelCase (e.g., `navigation.ts`, `assets.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useFormData.ts`, `useApiClient.ts`)
- **Tests**: Match source file name with `.test.tsx` or `.test.ts` suffix

### File Extensions

- `.tsx` for React components
- `.ts` for utilities, types, constants, and non-React code
- `.test.tsx` for component tests
- `.test.ts` for utility/function tests

---

## Naming Conventions

### Variables and Functions

- **camelCase** for variables, functions, and methods
  ```typescript
  const userName = "John";
  function getUserData() { }
  const handleSubmit = () => { };
  ```

### Components

- **PascalCase** for component names
  ```typescript
  export function UserProfile() { }
  export function AssetFormSteps() { }
  ```

### Constants

- **UPPER_SNAKE_CASE** for true constants (values that never change)
- **camelCase** for exported constant objects/arrays
  ```typescript
  export const API_BASE_URL = "https://api.example.com";
  export const MAX_RETRIES = 3;
  export const statusOptions = ["active", "inactive"];
  export const navigationItems = [/* ... */];
  ```

### Types and Interfaces

- **PascalCase** for types and interfaces
- **Props suffix** for component prop interfaces
  ```typescript
  interface User { }
  interface UserProfileProps { }
  type Status = "active" | "inactive";
  ```

### Boolean Variables

- Prefix with `is`, `has`, `should`, `can`, or `will`
  ```typescript
  const isActive = true;
  const hasPermission = false;
  const shouldRender = condition;
  const canEdit = user.role === "admin";
  ```

---

## Component Structure

### Component Organization

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Prefer component composition
3. **Separation of Concerns**: Separate presentation from business logic
4. **Reusability**: Design components to be reusable

### Component Size

- Keep components focused and under 300 lines when possible
- Extract complex logic into custom hooks
- Break large components into smaller, focused sub-components

### Props Interface

Always define explicit prop interfaces:

```typescript
interface ComponentProps {
  /** Required prop description */
  requiredProp: string;
  /** Optional prop description */
  optionalProp?: number;
  /** Callback description */
  onAction: (data: DataType) => void;
  /** Boolean flag description */
  isEnabled?: boolean;
}
```

### State Management

- Use `useState` for local component state
- Use Context API for shared state across component trees
- Consider state management libraries (Zustand, Redux) for complex global state
- Keep state as close to where it's used as possible

---

## Type Definitions

### Type Files

- Create dedicated type files for domain models
- Group related types together
- Export types from a central location when possible

```typescript
// types/users.ts
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export type UserRole = "admin" | "user" | "guest";

export interface UserCreateDto {
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserUpdateDto extends Partial<UserCreateDto> {
  id: number;
}
```

### Type Safety

- Avoid `any` - use `unknown` if type is truly unknown
- Use type guards for runtime type checking
- Leverage TypeScript's discriminated unions for state management

```typescript
// ✅ Correct
function processData(data: unknown): string {
  if (typeof data === "string") {
    return data.toUpperCase();
  }
  throw new Error("Invalid data type");
}

// ❌ Wrong
function processData(data: any): string {
  return data.toUpperCase();
}
```

---

## Error Handling

### Error Boundaries

- Use Error Boundaries for React component error handling
- Provide fallback UI for error states
- Log errors appropriately

```typescript
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Error boundary implementation
}
```

### API Error Handling

- Use try-catch blocks for async operations
- Provide user-friendly error messages
- Log errors for debugging
- Handle network errors gracefully

```typescript
try {
  const response = await apiClient.getData();
  return response.data;
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  } else {
    toast.error("An unexpected error occurred");
    console.error("API Error:", error);
  }
  throw error;
}
```

### Validation

- Validate user input before submission
- Provide clear validation error messages
- Use TypeScript types to prevent invalid data structures

---

## Testing Standards

### Test File Organization

- Mirror source file structure in test directory
- Use `.test.tsx` for component tests
- Use `.test.ts` for utility/function tests
- Group related tests in describe blocks

### Test Naming

```typescript
describe("ComponentName", () => {
  it("should render with required props", () => { });
  it("should handle user interaction correctly", () => { });
  it("should display error state when API fails", () => { });
});
```

### Test Coverage Requirements

- **Minimum 70% coverage** for:
  - Branches
  - Functions
  - Lines
  - Statements

### Testing Best Practices

- Test user interactions, not implementation details
- Use React Testing Library for component tests
- Mock external dependencies (API calls, third-party libraries)
- Test error states and edge cases
- Keep tests focused and independent

```typescript
import { render, screen } from "@/tests/__utils__/test-utils";
import userEvent from "@testing-library/user-event";
import { ComponentName } from "@/components/ComponentName";

describe("ComponentName", () => {
  it("should render correctly", () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

---

## Documentation Standards

### Code Comments

- Use JSDoc comments for public APIs
- Explain "why" not "what" in comments
- Keep comments up-to-date with code changes

```typescript
/**
 * Calculates the total cost including tax
 * 
 * @param basePrice - The base price before tax
 * @param taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @returns The total price including tax
 */
export function calculateTotal(basePrice: number, taxRate: number): number {
  return basePrice * (1 + taxRate);
}
```

### Component Documentation

- Include component description in JSDoc
- Document all props with descriptions
- Provide usage examples for complex components

```typescript
/**
 * UserProfile - Displays user profile information with edit capability
 * 
 * Features:
 * - Displays user name, email, and avatar
 * - Supports edit mode for updating profile
 * - Handles form validation and submission
 * 
 * @param user - User data to display
 * @param onUpdate - Callback when profile is updated
 * @param isEditing - Whether the profile is in edit mode
 */
export function UserProfile({ user, onUpdate, isEditing = false }: UserProfileProps) {
  // Implementation
}
```

### README Files

- Include README.md in major directories
- Document purpose, structure, and usage
- Provide examples and common patterns

---

## Code Formatting

### Prettier Configuration

The project uses Prettier for code formatting. Configuration is in `.prettierrc`:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Formatting Rules

- Run Prettier before committing code
- Use `npm run format` to format all files
- Configure your editor to format on save

### ESLint

- Follow ESLint rules defined in `eslint.config.mjs`
- Fix all linting errors before submitting PRs
- Use `npm run lint` to check for linting issues

---

## Python/Django Standards

### Code Style

- **PEP 8**: Follow Python PEP 8 style guide
- **Black**: Use Black for code formatting (line length: 100)
- **isort**: Use isort for import sorting
- **Flake8**: Use Flake8 for linting

```bash
# Format code
black .
isort .

# Lint code
flake8 .
```

### Django Best Practices

- Use class-based views for complex logic
- Implement proper error handling
- Use serializers for data validation
- Follow DRY principle
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

### File Organization

```
backend/
├── apps/
│   ├── users/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── tests/
│   └── assets/
├── core/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
```

---

## Git Workflow

### Commit Messages

Follow Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```
feat(auth): add multi-factor authentication support
fix(api): resolve token refresh race condition
refactor(frontend): standardize component exports to named exports
docs: update coding standards documentation
```

### Branch Naming

- `feature/description`: New features
- `bugfix/description`: Bug fixes
- `hotfix/description`: Critical fixes
- `refactor/description`: Code refactoring
- `docs/description`: Documentation updates

---

## Checklist for Code Review

Before submitting code, ensure:

- [ ] All code follows naming conventions
- [ ] All components use named exports (no default exports)
- [ ] All imports use named imports
- [ ] TypeScript types are properly defined
- [ ] All functions have proper JSDoc comments
- [ ] Code is formatted with Prettier
- [ ] All linting errors are fixed
- [ ] Tests are written and passing
- [ ] Test coverage meets requirements (70%)
- [ ] Error handling is implemented
- [ ] Documentation is updated if needed

---

## Enforcement

These standards are enforced through:

1. **Code Reviews**: All PRs are reviewed for adherence to standards
2. **Linting**: ESLint and Flake8 catch style violations
3. **Type Checking**: TypeScript compiler enforces type safety
4. **Pre-commit Hooks**: Automated checks before commits (if configured)
5. **CI/CD**: Automated testing and linting in CI pipeline

---

## Questions or Suggestions?

If you have questions about these standards or suggestions for improvements, please:

1. Open an issue in the repository
2. Discuss in team meetings
3. Propose changes via pull request

---

**Last Updated**: 2024
**Version**: 1.0

