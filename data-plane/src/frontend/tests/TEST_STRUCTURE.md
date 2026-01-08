# Test Structure Overview

## Directory Structure

```
__tests__/
├── __mocks__/                          # Global mocks
│   ├── next-auth.ts                    # NextAuth mocks
│   └── fetch.ts                        # Fetch API mocks
│
├── __fixtures__/                       # Test data and fixtures
│   └── api-responses.ts                # Mock API response data
│
├── __utils__/                          # Test utilities and helpers
│   ├── test-utils.tsx                  # Custom render with providers
│   └── api-mock-helpers.ts             # API mocking utilities
│
├── unit/                               # Unit tests (pure functions)
│   ├── lib/
│   │   ├── utils.test.ts               # Utility functions
│   │   └── api-client/
│   │       ├── error-parser.test.ts    # Error parsing
│   │       └── base.test.ts            # Base API client
│   └── components/pages/assets/utils/
│       ├── format.test.ts              # Formatting utilities
│       ├── validation.test.ts          # Validation utilities
│       ├── calculate.test.ts           # Calculation utilities
│       └── filter.test.ts              # Filtering utilities
│
├── components/                         # Component tests
│   ├── ui/
│   │   └── button.test.tsx             # UI component tests
│   ├── pages/assets/
│   │   ├── AssetTable.test.tsx         # Asset table component
│   │   ├── AssetDetail.test.tsx        # Asset detail component
│   │   └── form/
│   │       ├── AssetForm.test.tsx      # Main form component
│   │       └── fields/
│   │           ├── SelectField.test.tsx
│   │           └── DateField.test.tsx
│   ├── layout/
│   │   └── sidebar.test.tsx            # Layout components
│   ├── asset-dialogs/
│   │   └── AddSoftwareDialog.test.tsx  # Dialog components
│   └── auth-provider.test.tsx          # Auth provider
│
├── hooks/                              # Custom hook tests
│   └── useFormActions.test.ts          # Form actions hook
│
├── lib/                                # Library tests
│   └── auth.test.ts                    # Auth utilities
│
├── integration/                        # Integration tests
│   ├── api-client.test.ts              # API client integration
│   └── form-submission.test.tsx        # Form submission flow
│
├── middleware/                         # Middleware tests
│   └── middleware.test.ts              # Next.js middleware
│
└── e2e/                                # End-to-end tests
    └── asset-workflow.test.tsx         # Complete workflows
```

## Test Categories

### 1. Unit Tests (`__tests__/unit/`)
**Purpose**: Test pure functions, utilities, and isolated logic
- No side effects
- Fast execution
- Easy to maintain
- Examples: formatters, validators, error parsers

### 2. Component Tests (`__tests__/components/`)
**Purpose**: Test React components in isolation
- Render components
- Test user interactions
- Test props and state
- Mock dependencies
- Examples: buttons, forms, dialogs

### 3. Hook Tests (`__tests__/hooks/`)
**Purpose**: Test custom React hooks
- Test hook logic
- Test state management
- Test side effects
- Examples: useFormActions, useCalendarAlerts

### 4. Integration Tests (`__tests__/integration/`)
**Purpose**: Test interactions between multiple units
- Test API + components
- Test form submission flows
- Test authentication flows
- Examples: API client with components, form submission

### 5. E2E Tests (`__tests__/e2e/`)
**Purpose**: Test complete user workflows
- Test full user journeys
- Test critical paths
- Examples: asset creation workflow, asset editing workflow

### 6. Middleware Tests (`__tests__/middleware/`)
**Purpose**: Test Next.js middleware
- Test route protection
- Test redirects
- Test authentication checks

## Test Files Status

### ✅ Implemented (with actual tests)
- `unit/lib/utils.test.ts` - Utility functions
- `unit/lib/api-client/error-parser.test.ts` - Error parsing
- `unit/lib/api-client/base.test.ts` - Base API client
- `components/ui/button.test.tsx` - Button component

### 📝 Placeholder (structure ready, needs implementation)
- All other test files have placeholder tests
- Each file includes TODO comments for what to test
- Structure and imports are set up

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Implement Tests**
   - Start with unit tests (easiest)
   - Move to component tests
   - Add integration tests
   - Complete E2E tests

4. **Coverage Goals**
   - Aim for 70%+ coverage
   - Focus on critical paths first
   - Add tests as you refactor

## Testing Best Practices

1. **Test Behavior, Not Implementation**
   - Test what users see and do
   - Don't test internal state unless necessary

2. **Use Descriptive Test Names**
   - `it('should display error message when API call fails')`
   - Not: `it('test error')`

3. **Follow AAA Pattern**
   - Arrange: Set up test data
   - Act: Execute the code
   - Assert: Verify results

4. **Keep Tests Isolated**
   - Each test should be independent
   - Don't rely on test execution order
   - Clean up after each test

5. **Mock External Dependencies**
   - Mock API calls
   - Mock Next.js modules
   - Mock browser APIs

6. **Test Edge Cases**
   - Empty states
   - Error states
   - Loading states
   - Boundary conditions

## Common Testing Patterns

### Testing API Calls
```typescript
import { mockApiSuccess, mockApiError } from '@/__tests__/__utils__/api-mock-helpers'

it('should handle successful API call', async () => {
  mockApiSuccess({ id: 1 })
  // ... test code
})
```

### Testing User Interactions
```typescript
import userEvent from '@testing-library/user-event'

it('should handle user input', async () => {
  const user = userEvent.setup()
  render(<Component />)
  await user.type(screen.getByLabelText('Name'), 'Test')
})
```

### Testing Async Operations
```typescript
import { waitFor } from '@testing-library/react'

it('should load data', async () => {
  render(<Component />)
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

