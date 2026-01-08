<div align="center">
  <img src="docs/brand/logo.png" alt="CFP logo" width="120" style="background:#f5f5f5;padding:12px;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.08);" />

  <h1>Crowdfunding Trading Platform (CFP-MVP)</h1>

  <p>
    Role-based, share-driven fundraising and portfolio management platform.
  </p>

  <p>
    <a href="frontend/README.md"><strong>Frontend Docs</strong></a> |
    <a href="backend/README.md"><strong>Backend Docs</strong></a> |
    <a href="#getting-started"><strong>Quickstart</strong></a> |
    <a href="#api-documentation"><strong>API Docs</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/status-MVP-0b7285" alt="Status" />
    <img src="https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb" alt="Frontend" />
    <img src="https://img.shields.io/badge/backend-Django%20REST-092e20" alt="Backend" />
    <img src="https://img.shields.io/badge/license-MIT-2f855a" alt="License" />
  </p>
</div>

---

## Executive Summary
CFP is a role-based crowdfunding platform that lets project developers raise capital through share-based investments while investors build portfolios under a controlled administrative review process. The platform emphasizes governance, access control, and transparent portfolio tracking across all roles.

## Table of Contents
- [Animated Preview](#animated-preview)
- [Screenshots](#screenshots)
- [API Screens](#api-screens)
- [Platform Highlights](#platform-highlights)
- [Business Value](#business-value)
- [Role Capabilities](#role-capabilities)
- [User Journeys](#user-journeys)
- [Architecture](#architecture)
- [System Modules](#system-modules)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Quality Checks](#quality-checks)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Animated Preview
Click the image to watch the walkthrough.

[![Project overview](docs/screenshots/landing_page_hero.png)](https://www.youtube.com/watch?v=W0yWAXwcvXc)

## Screenshots
| Landing | Login | Registration | Admin Dashboard |
| --- | --- | --- | --- |
| ![Landing](docs/screenshots/landing_page_hero.png) | ![Login](docs/screenshots/login_page.png) | ![Registration](docs/screenshots/registration_page.png) | ![Admin](docs/screenshots/admin_dashboard.png) |

| Developer Dashboard | Developer Projects | Investor Dashboard | Investor Dashboard (Dark) |
| --- | --- | --- | --- |
| ![Developer](docs/screenshots/developer_dashboard.png) | ![Developer Projects](docs/screenshots/developer_dashboard_projects.png) | ![Investor](docs/screenshots/investor_dashboard.png) | ![Investor Dark](docs/screenshots/investor_dashboard_dark_mode.png) |

## API Screens
| Swagger UI | Schemawise View |
| --- | --- |
| ![Swagger](docs/screenshots/backend_api_swagger.png) | ![Schemawise](docs/screenshots/backend_api_swagger_schemawise.png) |

## Platform Highlights
- Role-aware dashboards for Admin, Developer, and Investor.
- Project lifecycle from submission to approval and funding.
- Share-based investment transactions and portfolio tracking.
- Access request workflow with notifications and audit logs.
- API-first design with OpenAPI documentation.
- Media handling for projects and profiles.

## Business Value
- Governance by design with admin-controlled review queues.
- Investor confidence through access gates and audit trails.
- Faster funding cycles with structured project lifecycles.
- Portfolio transparency via share-based calculations.

## Role Capabilities
| Capability | Admin | Developer | Investor |
| --- | --- | --- | --- |
| Project submission | No | Yes | No |
| Project review and approval | Yes | No | No |
| Share-based investments | No | No | Yes |
| Access request approvals | Yes | No | No |
| Portfolio tracking | No | No | Yes |
| Notifications and updates | Yes | Yes | Yes |

## User Journeys
### Developer
1. Create a project and submit for review.
2. Add media and supporting details.
3. Track funding progress and share sales.

### Investor
1. Browse and compare approved projects.
2. Request access where required.
3. Purchase shares and track portfolio performance.

### Admin
1. Review and approve project submissions.
2. Manage access requests and user activity.
3. Monitor investments, payments, and audit logs.

## Architecture
```mermaid
flowchart LR
  UI["React Client (Vite)"] --> API[Django REST API]
  API --> DB[(PostgreSQL)]
  API --> Storage[(Supabase Storage)]
  API --> Auth[JWT]
```

## System Modules
| Module | Purpose |
| --- | --- |
| Users and Roles | Authentication, permissions, role-aware access |
| Projects | Submission, review, approval, and lifecycle status |
| Investments | Share purchases, totals, and payment tracking |
| Access Requests | Controlled content access workflows |
| Notifications | In-app updates and alerts |
| Audit Logs | Administrative activity trails |
| Media | Project and profile asset storage |

## Tech Stack
| Layer | Tools |
| --- | --- |
| Frontend | Vite, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Django, Django REST Framework, SimpleJWT |
| Data | PostgreSQL (local or Supabase-hosted) |
| Storage | Supabase Storage |
| Docs | OpenAPI via drf-spectacular |

## Repository Structure
```
backend/   Django REST API and services
frontend/  Vite React client
docs/      Product assets and screenshots
```

## Getting Started
### Prerequisites
- Python 3.x
- Node.js LTS
- PostgreSQL
- Supabase project (storage and JWT integration)

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:8080` (configured in `frontend/vite.config.ts`).

## Configuration
### Environment Variables (reference)
| Variable | Scope | Purpose |
| --- | --- | --- |
| DATABASE_URL | Backend | PostgreSQL connection string |
| CORS_ALLOWED_ORIGINS | Backend | Allowed frontend origins |
| SUPABASE_URL | Backend | Supabase project URL |
| SUPABASE_JWT_SECRET | Backend | JWT verification secret |
| SUPABASE_STORAGE_BUCKET_MEDIA | Backend | Project media bucket |
| SUPABASE_STORAGE_BUCKET_3D | Backend | 3D asset bucket |
| SUPABASE_STORAGE_BUCKET_PROFILE | Backend | Profile image bucket |
| VITE_API_URL | Frontend | API base URL |
| VITE_FRONTEND_URL | Frontend | Frontend public URL |

### Backend (.env)
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

### Frontend (.env)
```bash
VITE_API_URL=http://127.0.0.1:8000/api
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_FRONTEND_URL=http://127.0.0.1:8080
```

## API Documentation
- Swagger UI: `http://localhost:8000/api/schema/swagger-ui/`
- Redoc: `http://localhost:8000/api/schema/redoc/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

## Quality Checks
- Frontend lint: `npm run lint` (run from `frontend/`)
- Backend tests: `python manage.py test` (run from `backend/`)

## Troubleshooting
- Frontend cannot reach the API: confirm `VITE_API_URL` and backend status.
- CORS errors: ensure `CORS_ALLOWED_ORIGINS` matches your frontend URL.
- Missing media: verify Supabase bucket names in `backend/.env`.

## License
MIT. See `LICENSE`.
