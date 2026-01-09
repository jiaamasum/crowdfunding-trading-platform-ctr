<div align="center">
  <img src="../docs/brand/logo.png" alt="CFP logo" width="100" style="background:#f5f5f5;padding:12px;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.08);" />

  <h1>⚙️ CFP Backend</h1>

  <p>
    <strong>Django REST API for role-based crowdfunding, investments, and governance.</strong>
  </p>

  <p>
    <a href="../README.md"><strong>📖 About Project</strong></a> •
    <a href="../frontend/README.md"><strong>🎨 Frontend</strong></a> •
    <a href="#-quick-start"><strong>🚀 Quick Start</strong></a> •
    <a href="../CONTRIBUTING.md"><strong>🤝 Contributing</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/framework-Django%204.x-092e20?style=for-the-badge&logo=django" alt="Django" />
    <img src="https://img.shields.io/badge/api-REST%20Framework-ff1709?style=for-the-badge&logo=django" alt="DRF" />
    <img src="https://img.shields.io/badge/db-PostgreSQL-31648c?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/docs-OpenAPI-6ba539?style=for-the-badge&logo=openapiinitiative" alt="OpenAPI" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/auth-SimpleJWT-000000?style=flat-square" alt="SimpleJWT" />
    <img src="https://img.shields.io/badge/storage-Supabase-3ecf8e?style=flat-square&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/tests-Pytest-0a9edc?style=flat-square&logo=pytest" alt="Pytest" />
    <img src="https://img.shields.io/badge/quality-SonarQube-4e9bcd?style=flat-square&logo=sonarqube" alt="SonarQube" />
  </p>
</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [📸 API Screenshots](#-api-screenshots)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🗄️ Database](#️-database)
- [🔐 Authentication](#-authentication)
- [📦 Django Apps](#-django-apps)
- [🌐 API Endpoints](#-api-endpoints)
- [📚 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🛠️ Development](#️-development)
- [📊 Code Quality](#-code-quality)
- [❓ Troubleshooting](#-troubleshooting)
- [👨‍💻 Author](#-author)

---

## ✨ Features

### 🔐 Authentication & Authorization
| Feature | Description |
|---------|-------------|
| JWT Authentication | Secure token-based auth with SimpleJWT |
| Role-Based Access | Admin, Developer, Investor permissions |
| Google OAuth | Social authentication support |
| Token Refresh | Automatic token refresh mechanism |

### 📊 Core Business Logic
| Feature | Description |
|---------|-------------|
| Project Management | Full CRUD with approval workflow |
| Share-Based Investments | Purchase shares, track portfolios |
| Access Request System | Controlled content access |
| Wallet System | User balance and transactions |

### 🛡️ Platform Governance
| Feature | Description |
|---------|-------------|
| Review Queue | Project approval workflow |
| Audit Logging | Complete activity trails |
| User Verification | Admin-controlled verification |
| Investment Processing | Multi-step transaction handling |

### 📡 API Features
| Feature | Description |
|---------|-------------|
| OpenAPI Schema | Auto-generated documentation |
| Swagger UI | Interactive API explorer |
| Pagination | Efficient data loading |
| Filtering | Advanced query parameters |

---

## 📸 API Screenshots

<details>
<summary><strong>Click to expand API screenshots</strong></summary>

| Swagger UI | Schema View |
|:---:|:---:|
| ![Swagger](../docs/screenshots/backend_api_swagger.png) | ![Schema](../docs/screenshots/backend_api_swagger_schemawise.png) |

</details>

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client["🌐 Clients"]
        Web[React Frontend]
        Mobile[Mobile App]
    end
    
    subgraph Backend["⚙️ Django Backend"]
        API[REST API]
        Auth[JWT Auth]
        Models[ORM Models]
    end
    
    subgraph Data["💾 Data Layer"]
        DB[(PostgreSQL)]
        Storage[(Supabase Storage)]
    end
    
    Web --> API
    Mobile --> API
    API --> Auth
    API --> Models
    Models --> DB
    API --> Storage
```

### Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Django 4.x | Web framework |
| **API** | Django REST Framework | REST API toolkit |
| **Auth** | SimpleJWT | JWT authentication |
| **Database** | PostgreSQL | Primary data store |
| **Storage** | Supabase | Media file storage |
| **Docs** | drf-spectacular | OpenAPI generation |
| **Testing** | Pytest | Test framework |
| **Quality** | Black, Flake8, Mypy | Code quality tools |

---

## 📁 Project Structure

```
backend/
├── config/                 # Project configuration
│   ├── settings.py         # Django settings
│   ├── urls.py             # Root URL configuration
│   ├── permissions.py      # Custom permissions
│   └── supabase_auth.py    # Supabase JWT integration
├── users/                  # User management app
│   ├── models.py           # User model
│   ├── serializers.py      # User serializers
│   ├── views.py            # User views
│   └── urls.py             # User routes
├── projects/               # Project management app
│   ├── models.py           # Project, EditRequest models
│   ├── serializers.py      # Project serializers
│   ├── views.py            # Project views
│   └── urls.py             # Project routes
├── investments/            # Investment management app
│   ├── models.py           # Investment, Wallet models
│   ├── serializers.py      # Investment serializers
│   ├── views.py            # Investment views
│   └── urls.py             # Investment routes
├── access_requests/        # Access control app
│   ├── models.py           # AccessRequest model
│   ├── serializers.py      # Request serializers
│   ├── views.py            # Request views
│   └── urls.py             # Request routes
├── notifications/          # Notification system
│   ├── models.py           # Notification model
│   └── views.py            # Notification views
├── audit/                  # Audit logging
│   ├── models.py           # AuditLog model
│   └── views.py            # Audit views
├── tests/                  # Test suite
│   ├── test_users.py
│   ├── test_projects.py
│   ├── test_investments.py
│   └── ...
├── media/                  # Local media storage
├── logs/                   # Application logs
├── manage.py               # Django CLI
├── requirements.txt        # Python dependencies
├── pytest.ini              # Pytest configuration
└── Makefile                # Development commands
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+ (3.11 recommended)
- **PostgreSQL** 14+
- **Supabase** project (for storage)

### Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run database migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

The API will be available at **`http://localhost:8000`**

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Django Configuration
DEBUG=True
SECRET_KEY=your-super-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://user:password@localhost:5432/cfp_db

# Frontend
FRONTEND_URL=http://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Storage Buckets
SUPABASE_STORAGE_BUCKET_MEDIA=project-media
SUPABASE_STORAGE_BUCKET_3D=project-3d
SUPABASE_STORAGE_BUCKET_PROFILE=users-profile-image
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DEBUG` | ✅ | Enable debug mode (False in production) |
| `SECRET_KEY` | ✅ | Django secret key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_JWT_SECRET` | ✅ | JWT verification secret |

---

## 🗄️ Database

### Models Overview

```mermaid
erDiagram
    User ||--o{ Project : creates
    User ||--o{ Investment : makes
    User ||--o{ AccessRequest : submits
    Project ||--o{ Investment : receives
    Project ||--o{ AccessRequest : has
    User ||--o{ Notification : receives
    User ||--o{ Wallet : owns
```

### Key Models

| Model | App | Description |
|-------|-----|-------------|
| `User` | users | Custom user with roles |
| `Project` | projects | Crowdfunding projects |
| `ProjectEditRequest` | projects | Edit approval workflow |
| `Investment` | investments | Share purchases |
| `Wallet` | investments | User balance |
| `AccessRequest` | access_requests | Content access requests |
| `Notification` | notifications | User notifications |
| `AuditLog` | audit | Activity logging |

### Migrations

```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

---

## 🔐 Authentication

### JWT Configuration

The API uses **SimpleJWT** for authentication:

```python
# Token endpoints
POST /api/token/          # Obtain token pair
POST /api/token/refresh/  # Refresh access token
POST /api/token/verify/   # Verify token
```

### Usage

```bash
# Get tokens
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in requests
curl -X GET http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer <access_token>"
```

### Role-Based Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, approvals, user management |
| **Developer** | Create/manage own projects, view investors |
| **Investor** | Browse projects, make investments, manage portfolio |

---

## 📦 Django Apps

| App | Responsibility | Key Models |
|-----|----------------|------------|
| **users** | Authentication, profiles, roles | `User` |
| **projects** | Project lifecycle, media | `Project`, `ProjectEditRequest` |
| **investments** | Shares, wallets, transactions | `Investment`, `Wallet` |
| **access_requests** | Content access control | `AccessRequest` |
| **notifications** | System notifications | `Notification` |
| **audit** | Activity logging | `AuditLog` |

---

## 🌐 API Endpoints

### Base Routes

| Route | Purpose |
|-------|---------|
| `api/` | Root API info |
| `api/users/` | User management |
| `api/projects/` | Project CRUD |
| `api/investments/` | Investment operations |
| `api/access-requests/` | Access control |
| `api/notifications/` | Notifications |
| `api/audit-logs/` | Audit trails |
| `api/stats/` | Dashboard statistics |

### Key Endpoints

<details>
<summary><strong>Users API</strong></summary>

```
POST   /api/register/           # Register new user
POST   /api/token/              # Login (get tokens)
POST   /api/token/refresh/      # Refresh token
GET    /api/users/me/           # Current user profile
PUT    /api/users/me/           # Update profile
GET    /api/users/              # List users (admin)
```
</details>

<details>
<summary><strong>Projects API</strong></summary>

```
GET    /api/projects/                    # List projects
POST   /api/projects/                    # Create project
GET    /api/projects/{id}/               # Get project
PUT    /api/projects/{id}/               # Update project
DELETE /api/projects/{id}/               # Delete project
POST   /api/projects/{id}/submit/        # Submit for review
GET    /api/projects/pending/            # Pending projects (admin)
POST   /api/projects/{id}/approve/       # Approve project (admin)
POST   /api/projects/{id}/reject/        # Reject project (admin)
```
</details>

<details>
<summary><strong>Investments API</strong></summary>

```
GET    /api/investments/                 # List investments
POST   /api/investments/                 # Create investment
GET    /api/investments/{id}/            # Get investment
GET    /api/investments/portfolio/       # Portfolio summary
GET    /api/wallet/                      # Get wallet
POST   /api/wallet/deposit/              # Deposit funds
GET    /api/wallet/transactions/         # Transaction history
```
</details>

---

## 📚 API Documentation

Interactive API documentation is available:

| Type | URL |
|------|-----|
| **Swagger UI** | `http://localhost:8000/api/schema/swagger-ui/` |
| **ReDoc** | `http://localhost:8000/api/schema/redoc/` |
| **OpenAPI Schema** | `http://localhost:8000/api/schema/` |

---

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_users.py

# Run specific test
pytest tests/test_users.py::test_user_registration

# Verbose output
pytest -v
```

### Test Coverage

View coverage report at `htmlcov/index.html` after running tests with coverage.

---

## 🛠️ Development

### Useful Commands

```bash
# Start development server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Collect static files
python manage.py collectstatic
```

### Using Makefile

```bash
make run        # Start server
make migrate    # Run migrations
make test       # Run tests
make lint       # Run linters
make format     # Format code
```

---

## 📊 Code Quality

### Tools

| Tool | Purpose |
|------|---------|
| **Black** | Code formatting |
| **isort** | Import sorting |
| **Flake8** | Style guide enforcement |
| **Mypy** | Static type checking |
| **Pytest** | Testing |
| **Coverage** | Code coverage |

### Running Quality Checks

```bash
# Format code
black .
isort .

# Lint code
flake8

# Type checking
mypy .

# All checks
make lint
```

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** | Check JWT token; verify `SUPABASE_JWT_SECRET` |
| **CORS Error** | Add frontend URL to `CORS_ALLOWED_ORIGINS` |
| **Database Connection Failed** | Verify `DATABASE_URL` and PostgreSQL is running |
| **Storage Upload Failed** | Check Supabase bucket names and credentials |
| **Migration Error** | Run `python manage.py migrate --run-syncdb` |
| **Import Error** | Ensure virtual environment is activated |

---

## 👨‍💻 Author

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/jiaamasum">
          <img src="https://github.com/jiaamasum.png" width="100px;" alt="Masum Jia" style="border-radius:50%;"/>
          <br />
          <sub><b>Masum Jia</b></sub>
        </a>
        <br />
        <sub>Project Creator & Lead Developer</sub>
        <br />
        <a href="https://github.com/jiaamasum" title="GitHub">
          <img src="https://img.shields.io/badge/GitHub-jiaamasum-181717?style=flat-square&logo=github" alt="GitHub"/>
        </a>
      </td>
    </tr>
  </table>
  
  <p><strong>Created and maintained by <a href="https://github.com/jiaamasum">Masum Jia</a></strong></p>
</div>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">
  <p>
    <sub>Built with ❤️ using Django, Django REST Framework, and PostgreSQL</sub>
  </p>
  <p>
    <a href="../README.md">🏠 Back to Main</a> •
    <a href="../frontend/README.md">🎨 Frontend Docs</a> •
    <a href="../CONTRIBUTING.md">🤝 Contributing</a>
  </p>
</div>
