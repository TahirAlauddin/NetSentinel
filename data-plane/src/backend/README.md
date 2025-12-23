# NetSentinel Backend

Django REST Framework backend API for the NetSentinel network infrastructure and asset management system.

## Overview

NetSentinel Backend is a Django-based REST API that provides:
- User authentication and authorization (JWT-based)
- Infrastructure management (locations, circuits, contacts, departments)
- Asset management (computers, displays, network devices, phones, peripherals)
- API documentation via Swagger/ReDoc

## Technology Stack

- **Framework**: Django 5.2.7
- **API**: Django REST Framework 3.16.1
- **Authentication**: JWT (djangorestframework-simplejwt)
- **User Management**: Djoser
- **Database**: PostgreSQL (production) / SQLite (development)
- **Documentation**: drf-yasg (Swagger/OpenAPI)

## Project Structure

```
backend/
├── core/              # Core Django settings and configuration
├── users/             # User management app
├── infrastructure/    # Infrastructure management (locations, circuits, contacts)
├── assets/            # Asset management (computers, network devices, etc.)
├── manage.py          # Django management script
└── requirements.txt   # Python dependencies
```

## Installation

### Prerequisites

- Python 3.11+
- PostgreSQL (for production) or SQLite (for development)
- Virtual environment (recommended)

### Setup

1. Create and activate a virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Create a `.env` file in the backend root directory:

```env
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Database (PostgreSQL - optional, defaults to SQLite)
POSTGRES_HOST=localhost
POSTGRES_DB=netsentinel
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_PORT=5432
```

4. Start a postgres container:

```powershell
docker run -d -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=your-password -e POSTGRES_DB=netsentinel postgres
```

5. Run migrations:

```powershell
python manage.py migrate
```

6. Create a superuser (optional):

```powershell
python manage.py createsuperuser
```

7. Run the development server:

```powershell
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/users/` - User registration
- `POST /api/v1/auth/jwt/create/` - Login (get JWT tokens)
- `POST /api/v1/auth/jwt/refresh/` - Refresh access token
- `GET /api/v1/auth/users/me/` - Get current user

### Infrastructure
- `/api/v1/infrastructure/locations/` - Location management
- `/api/v1/infrastructure/circuits/` - Circuit management
- `/api/v1/infrastructure/contacts/` - Contact management
- `/api/v1/infrastructure/departments/` - Department management
- `/api/v1/infrastructure/categories/` - Category management

### Assets
- `/api/v1/assets/` - Asset management
- `/api/v1/assets/tags/` - Asset tags
- `/api/v1/assets/categories/` - Asset categories
- `/api/v1/assets/vendors/` - Vendor management

### Users
- `/api/v1/users/` - User management endpoints

### Health & Documentation
- `GET /api/health/` - Health check endpoint
- `GET /swagger/` - Swagger UI documentation
- `GET /redoc/` - ReDoc documentation
- `GET /swagger.json` - OpenAPI schema (JSON)

## Development

### Running Tests

```powershell
python manage.py test
```

### Creating Migrations

```powershell
python manage.py makemigrations
python manage.py migrate
```

### Accessing Django Admin

1. Create a superuser (if not already created):
```powershell
python manage.py createsuperuser
```

2. Navigate to `http://localhost:8000/admin/`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | (required) |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000,http://localhost:8080` |
| `POSTGRES_HOST` | PostgreSQL host | (optional) |
| `POSTGRES_DB` | PostgreSQL database name | (optional) |
| `POSTGRES_USER` | PostgreSQL user | (optional) |
| `POSTGRES_PASSWORD` | PostgreSQL password | (optional) |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |

## Database

The application supports both PostgreSQL (production) and SQLite (development):

- **PostgreSQL**: Configure via environment variables (`POSTGRES_*`)
- **SQLite**: Default fallback if PostgreSQL variables are not set

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Valid for 60 minutes
- **Refresh Token**: Valid for 7 days
- **Token Rotation**: Enabled (refresh tokens are rotated on use)

Include the token in requests:
```
Authorization: Bearer <access_token>
```

## Docker

The backend includes Docker support. See the main project documentation for Docker deployment instructions.

## License

See the main project README for license information.

