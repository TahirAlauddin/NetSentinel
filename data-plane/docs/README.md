# Data Plane Documentation

This directory contains comprehensive documentation for the NetSentinel Data Plane application.

## Overview

The Data Plane is the tenant-facing application that provides the core ITSM functionality. It consists of:

- **Backend**: Django REST API with JWT authentication
- **Frontend**: Next.js application with React components
- **Database**: PostgreSQL for data persistence
- **Authentication**: NextAuth.js with automatic token refresh

## Documentation Structure

### Core Documentation

- **[CODING_STANDARDS.md](../CODING_STANDARDS.md)** - ⭐ **ESSENTIAL READING** - Complete coding standards, conventions, and best practices for the codebase
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development guide covering setup, architecture, testing, and deployment
- **[AUTHENTICATION.md](AUTHENTICATION.md)** - Comprehensive authentication system documentation with refresh token implementation
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with endpoints, examples, and SDK usage
- **[TESTING.md](TESTING.md)** - Testing strategies, unit tests, integration tests, and E2E testing
- **[REFRESH_TOKEN_GUIDE.md](REFRESH_TOKEN_GUIDE.md)** - Detailed guide on automatic token refresh implementation

### Quick Start

1. **Read Coding Standards**: ⭐ **START HERE** - Review [CODING_STANDARDS.md](../CODING_STANDARDS.md) before writing code
2. **Prerequisites**: Node.js 18+, Python 3.11+, Docker
3. **Setup**: Follow [DEVELOPMENT.md](DEVELOPMENT.md) for complete setup instructions
4. **Authentication**: See [AUTHENTICATION.md](AUTHENTICATION.md) for auth implementation details
5. **API Usage**: Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint documentation

### Architecture

```
data-plane/
├── src/
│   ├── backend/          # Django REST API
│   │   ├── core/         # Django settings
│   │   ├── apps/users/        # User management
│   │   ├── apps/tickets/        # Ticket management
│   │   └── requirements.txt
│   └── frontend/         # Next.js application
│       ├── app/          # App router pages
│       ├── components/  # React components
│       ├── lib/          # Utilities and API clients
│       └── package.json
└── docs/                 # This documentation
```

### Key Features

- **JWT Authentication**: Secure token-based authentication with automatic refresh
- **API Documentation**: Complete API reference with examples
- **TODO**: Add more features as development progresses

### Development Workflow

1. **Setup Environment**: Follow development guide
2. **Run Tests**: Ensure all tests pass
3. **Code Standards**: Follow Python/TypeScript standards
4. **Documentation**: Update docs with changes
5. **Testing**: Add tests for new features

### Contributing

For contribution guidelines, see the main [CONTRIBUTING.md](../../docs/CONTRIBUTING.md) file.

### Support

- **Issues**: Report bugs and feature requests in the main repository
- **Documentation**: All technical details are covered in this directory
- **API Reference**: Complete API documentation available
