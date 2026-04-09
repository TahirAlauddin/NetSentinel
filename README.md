# NetSentinel Multi-Tenant ITSM Platform

A comprehensive multi-tenant ITSM (IT Service Management) platform built with Django, Next.js, and Kubernetes.

## Overview

NetSentinel provides a SaaS ITSM solution where each tenant (company) gets:
- **Dedicated subdomain** (e.g., `acme.netsentinel.local`)
- **Isolated database** (logical database per tenant)
- **Separate Kubernetes namespace** with resource limits
- **Independent runtime environment**

## Quick Access

- **Control Plane**: http://netsentinel.local
- **Tenant Apps**: http://{subdomain}.netsentinel.local

## Documentation

### Getting Started
- **[Minikube Setup Guide](docs/minikube-setup-guide.md)** - Minikube local development setup
- **[Design Documentation](docs/design-docs.md)** - Architecture and system design
- **[Provisioning Guide](docs/provisioning-guide.md)** - Tenant provisioning process

### Development
- **[Coding Standards](data-plane/CODING_STANDARDS.md)** - ⭐ **ESSENTIAL** - Coding standards and conventions
- **[Data Plane Development](data-plane/docs/DEVELOPMENT.md)** - Backend and frontend development guides
- **[Contributing](docs/CONTRIBUTING.md)** - Run, test, and lint: single-command checks and PR process
- **[API Documentation](data-plane/docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Testing Guide](data-plane/docs/TESTING.md)** - Testing strategies and procedures
- **[Authentication Guide](data-plane/docs/AUTHENTICATION.md)** - Auth system documentation

### Operations
- **[Troubleshooting Guide](docs/troubleshooting-guide.md)** - Common issues and solutions
- **[Contributing Guidelines](docs/CONTRIBUTING.md)** - How to contribute to the project

## Project Structure

```
NetSentinel/
├── control-plane/           # Control plane application (future)
├── data-plane/             # Tenant application (current)
│   ├── src/                # Application source code
│   │   ├── backend/        # Django backend
│   │   └── frontend/       # Next.js frontend
│   └── docs/               # Data plane documentation
├── infrastructure/          # Kubernetes and infrastructure configs
└── docs/                   # General documentation
```

## Key Features

### Control Plane
- **Tenant Registration**: Company signup and validation
- **Provisioning Orchestration**: Automated tenant environment setup
- **Billing Management**: Subscription and payment handling
- **Admin Dashboard**: Tenant monitoring and management

### Data Plane (Tenant Application)
- **User Management**: Multi-role user system
- **Ticket System**: IT support ticket management
- **Organization Management**: Department and team structure
- **Health Monitoring**: Application health checks

### Infrastructure
- **Kubernetes Orchestration**: Container orchestration and scaling
- **Database Isolation**: Per-tenant logical databases
- **Network Security**: Namespace isolation and network policies
- **Resource Management**: CPU, memory, and storage limits

## Contributing

Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team at team@netsentinel.local

