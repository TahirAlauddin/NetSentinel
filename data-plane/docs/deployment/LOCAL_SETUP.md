# Local Development Setup — data-plane

Get the data-plane running on your local machine for development or testing.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| Docker + Docker Compose | Latest | Containerised local stack |

---

## Option 1 — Run Directly (No Docker)

### Backend

```bash
cd data-plane/src/backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env           # then fill in values (see below)

# Apply migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

The backend will be available at `http://localhost:8000`.

#### Required Environment Variables

| Variable | Example | Description |
|---|---|---|
| `SECRET_KEY` | `dev-secret-key` | Django secret key |
| `DEBUG` | `True` | Enable debug mode |
| `DATABASE_URL` | `sqlite:///db.sqlite3` | Database connection string |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed request hosts |

### Frontend

```bash
cd data-plane/src/frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local    # then fill in values

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

#### Required Environment Variables

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API base URL |
| `NEXTAUTH_SECRET` | `dev-nextauth-secret` | NextAuth.js signing secret |
| `NEXTAUTH_URL` | `http://localhost:3000` | Base URL for NextAuth callbacks |

---

## Option 2 — Docker Compose

Run the full stack (backend + frontend) in containers with a single command.


```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## Verifying the Setup

Once running, confirm everything is working:

```bash
# Backend health check
curl http://localhost:8000/api/v1/health/

# API docs (Swagger)
open http://localhost:8000/api/docs/

# Frontend
open http://localhost:3000
```
