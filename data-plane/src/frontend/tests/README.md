# Test Structure Documentation

## Overview

This directory contains the comprehensive test suite for the NetSentinel data plane frontend. The structure is designed to mirror the source code organization while providing clear separation of concerns and test types.

## Test Structure

```
__tests__/
├── __mocks__/              # Global mocks
├── __fixtures__/           # Test data and fixtures
├── __utils__/              # Test utilities and helpers
├── unit/                   # Unit tests (pure functions, utilities)
├── integration/            # Integration tests (API + components)
├── components/             # Component tests
├── hooks/                  # Custom hook tests
├── lib/                    # Library/utility tests
├── middleware/             # Middleware tests
└── e2e/                    # End-to-end test scenarios
```

## Test Types

### Unit Tests
- Pure functions
- Utility functions
- Type guards
- Formatters
- Validators
- Error parsers

### Component Tests
- Rendering
- User interactions
- Props handling
- State management
- Event handlers

### Integration Tests
- API client + components
- Form submission flows
- Authentication flows
- Data fetching

### E2E Tests
- Critical user paths
- Full workflows
- Cross-component interactions

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.ts

# Run tests matching pattern
npm test -- --testNamePattern="API Client"
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Descriptive Names**: Test names should describe what they test
4. **Mock External Dependencies**: Mock APIs, Next.js modules, etc.
5. **Test User Behavior**: Test what users see and do, not implementation
6. **Keep Tests Simple**: One assertion per test when possible
7. **Use Test Utilities**: Reuse helpers and utilities
8. **Mock Data**: Use fixtures for consistent test data

