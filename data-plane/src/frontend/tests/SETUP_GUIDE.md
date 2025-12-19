# Jest Test Setup Guide

## Installation

After creating the test structure, install the required dependencies:

```powershell
cd data-plane/src/frontend
npm install
```

This will install:
- `jest` - Testing framework
- `jest-environment-jsdom` - DOM environment for React tests
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - DOM matchers for Jest
- `@testing-library/user-event` - User interaction simulation
- `@types/jest` - TypeScript types for Jest

## Configuration Files

### `jest.config.js`
- Configures Jest for Next.js
- Sets up module aliases (`@/*`)
- Configures test environment (jsdom)
- Sets up coverage collection

### `jest.setup.js`
- Global test setup
- Mocks Next.js modules (router, image, auth)
- Mocks browser APIs (ResizeObserver, matchMedia)
- Imports jest-dom matchers

## Running Tests

```powershell
# Run all tests
npm test

# Run tests in watch mode (for development)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- __tests__/unit/lib/utils.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="API Client"

# Run tests in CI mode (no watch, with coverage)
npm run test:ci
```

## Test Structure

```
__tests__/
├── __mocks__/          # Global mocks (next-auth, fetch)
├── __fixtures__/       # Test data and mock responses
├── __utils__/          # Test utilities and helpers
├── unit/              # Unit tests (pure functions)
├── components/         # Component tests
├── hooks/             # Custom hook tests
├── lib/               # Library/utility tests
├── integration/       # Integration tests
├── middleware/        # Middleware tests
└── e2e/              # End-to-end tests
```

## Writing Tests

### Example: Unit Test
```typescript
import { parseApiError } from '@/lib/api-client/error-parser'

describe('parseApiError', () => {
  it('should parse simple detail error', () => {
    const error = { detail: 'Something went wrong' }
    const result = parseApiError(error)
    expect(result.message).toBe('Something went wrong')
  })
})
```

### Example: Component Test
```typescript
import { render, screen } from '@/__tests__/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('should handle click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Example: API Mocking
```typescript
import { mockApiSuccess, mockApiError } from '@/__tests__/__utils__/api-mock-helpers'

it('should handle successful API call', async () => {
  mockApiSuccess({ id: 1, name: 'Test' })
  // ... test code
})

it('should handle API errors', async () => {
  mockApiError({ detail: 'Error message' }, 400)
  // ... test code
})
```

## Common Issues & Solutions

### Issue: Module not found
**Solution**: Check that `@/*` alias is correctly configured in `tsconfig.json` and `jest.config.js`

### Issue: Next.js module errors
**Solution**: Ensure `jest.setup.js` properly mocks Next.js modules

### Issue: React hooks errors
**Solution**: Use `@testing-library/react` render function, not React's render

### Issue: Async test failures
**Solution**: Use `waitFor` or `findBy*` queries for async operations

### Issue: Coverage not working
**Solution**: Ensure `collectCoverageFrom` in `jest.config.js` includes your source files

## Next Steps

1. ✅ Test structure created
2. ✅ Configuration files set up
3. ✅ Dependencies added to package.json
4. ⏳ Install dependencies: `npm install`
5. ⏳ Run initial tests: `npm test`
6. ⏳ Implement actual tests (replace placeholders)
7. ⏳ Add more tests as you develop features

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

