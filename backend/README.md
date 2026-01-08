<p align="center">
  <img src="../docs/brand/logo.png" alt="CFP logo" width="96" style="background:#f5f5f5;padding:10px;border-radius:10px;" />
</p>

<h1 align="center">CFP Backend</h1>

<p align="center">
  Django REST API for role-based crowdfunding, investments, and governance.
</p>

<p align="center">
  <a href="../README.md">About Project</a> |
  <a href="../frontend/README.md">Frontend</a> |
  <a href="#local-setup">Run locally</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/api-Django%20REST-092e20" alt="Django REST" />
  <img src="https://img.shields.io/badge/docs-OpenAPI-2563eb" alt="OpenAPI" />
  <img src="https://img.shields.io/badge/db-PostgreSQL-31648c" alt="PostgreSQL" />
</p>

---

## Table of Contents
- [Animated Preview](#animated-preview)
- [Screenshots](#screenshots)
- [System Overview](#system-overview)
- [Core Capabilities](#core-capabilities)
- [Key Django Apps](#key-django-apps)
- [Authentication and Security](#authentication-and-security)
- [Storage Buckets](#storage-buckets)
- [Requirements](#requirements)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Useful Commands](#useful-commands)
- [API Documentation](#api-documentation)
- [Base Routes](#base-routes)
- [Troubleshooting](#troubleshooting)

## Animated Preview
Click the image to watch the walkthrough.

[![API walkthrough](../docs/screenshots/backend_api_swagger.png)](https://www.youtube.com/watch?v=W0yWAXwcvXc)

## Screenshots
| Swagger UI | Schemawise View |
| --- | --- |
| ![Swagger](../docs/screenshots/backend_api_swagger.png) | ![Schemawise](../docs/screenshots/backend_api_swagger_schemawise.png) |

## System Overview
```mermaid
flowchart LR
  Client[Web Client] --> API[Django REST API]
  API --> DB[(PostgreSQL)]
  API --> Storage[(Supabase Storage)]
  API --> Auth[JWT]
```

## Core Capabilities
- Role-aware authentication and authorization.
- Project creation, review, approval, and archiving flows.
- Share-based investments and portfolio tracking endpoints.
- Access request workflow and notification delivery.
- Media storage integration via Supabase buckets.
- OpenAPI schema generation with drf-spectacular.

## Key Django Apps
| App | Responsibility |
| --- | --- |
| `users` | Authentication, roles, and user profiles |
| `projects` | Project lifecycle management |
| `investments` | Share purchases and payment tracking |
| `access_requests` | Restricted content approvals |
| `notifications` | System and user notifications |
| `audit` | Activity logging and audit trails |

## Authentication and Security
- JWT-based authentication with SimpleJWT.
- Role-based access control across API endpoints.
- CORS configured via `CORS_ALLOWED_ORIGINS`.
- Supabase JWT secret used for verification.

## Storage Buckets
Configured via environment variables:
- `SUPABASE_STORAGE_BUCKET_MEDIA` for project media
- `SUPABASE_STORAGE_BUCKET_3D` for 3D assets
- `SUPABASE_STORAGE_BUCKET_PROFILE` for user profile images

## Requirements
- Python 3.x
- PostgreSQL
- Supabase project (storage and JWT integration)

## Local Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

API server runs at `http://localhost:8000`.

## Environment Variables
Configure these in `backend/.env`:

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | PostgreSQL connection string |
| FRONTEND_URL | Frontend public URL |
| CORS_ALLOWED_ORIGINS | Allowed origins for browser clients |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_JWT_SECRET | JWT verification secret |

```bash
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://user:password@localhost:5432/dbname
FRONTEND_URL=http://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_STORAGE_BUCKET_MEDIA=project-media
SUPABASE_STORAGE_BUCKET_3D=project-3d
SUPABASE_STORAGE_BUCKET_PROFILE=users-profile-image
```

## Useful Commands
- `python manage.py makemigrations` Create migrations
- `python manage.py migrate` Apply migrations
- `python manage.py createsuperuser` Create an admin user
- `python manage.py runserver` Start the API server
- `python manage.py test` Run tests

## API Documentation
- Swagger UI: `http://localhost:8000/api/schema/swagger-ui/`
- Redoc: `http://localhost:8000/api/schema/redoc/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

## Base Routes
| Route | Purpose |
| --- | --- |
| `api/` | Users and authentication |
| `api/projects/` | Project workflows |
| `api/investments/` | Investment transactions |
| `api/access-requests/` | Access requests |
| `api/media/` | Media uploads and retrieval |
| `api/notifications/` | Notification endpoints |
| `api/audit-logs/` | Audit trails |
| `api/stats/` | Dashboard statistics |

## Troubleshooting
- 401 errors: verify `SUPABASE_JWT_SECRET` and token configuration.
- CORS issues: ensure `CORS_ALLOWED_ORIGINS` includes the frontend URL.
- Storage failures: confirm Supabase bucket names and credentials.
