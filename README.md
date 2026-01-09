<div align="center">
  <img src="docs/brand/logo.png" alt="CFP logo" width="120" style="background:#f5f5f5;padding:12px;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.08);" />

  <h1>🚀 Crowdfunding Trading Platform (CFP-MVP)</h1>

  <p>
    <strong>A role-based, share-driven fundraising and portfolio management platform.</strong>
  </p>

  <p>
    <a href="frontend/README.md"><strong>🎨 Frontend Docs</strong></a> •
    <a href="backend/README.md"><strong>⚙️ Backend Docs</strong></a> •
    <a href="USER_MANUAL.md"><strong>📖 User Manual</strong></a> •
    <a href="#-getting-started"><strong>🏁 Quick Start</strong></a> •
    <a href="CONTRIBUTING.md"><strong>🤝 Contributing</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/status-MVP-0b7285?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb?style=for-the-badge&logo=react" alt="Frontend" />
    <img src="https://img.shields.io/badge/backend-Django%20REST-092e20?style=for-the-badge&logo=django" alt="Backend" />
    <img src="https://img.shields.io/badge/license-MIT-2f855a?style=for-the-badge" alt="License" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-0ea5e9?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/PostgreSQL-31648c?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Supabase-3ecf8e?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
</div>

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Platform Highlights](#-platform-highlights)
- [📸 Screenshots](#-screenshots)
- [🏗️ Architecture](#️-architecture)
- [👥 Role Capabilities](#-role-capabilities)
- [🔄 User Journeys](#-user-journeys)
- [📦 System Modules](#-system-modules)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Repository Structure](#-repository-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Configuration](#️-configuration)
- [📚 API Documentation](#-api-documentation)
- [🧪 Quality Checks](#-quality-checks)
- [❓ Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [👨‍💻 Author](#-author)
- [📄 License](#-license)

---

## ✨ Overview

**CFP (Crowdfunding Trading Platform)** is a comprehensive role-based crowdfunding platform that enables:

- **Project Developers** to raise capital through share-based investments
- **Investors** to build diversified portfolios with transparent tracking
- **Administrators** to maintain platform governance and oversight

The platform emphasizes **governance**, **access control**, and **transparent portfolio tracking** across all user roles, providing a secure and efficient fundraising ecosystem.

### 🎯 Key Value Propositions

| For Developers | For Investors | For Administrators |
|---------------|---------------|-------------------|
| 📈 Structured project lifecycle | 💼 Portfolio management | 🛡️ Complete oversight |
| 💰 Share-based fundraising | 📊 Investment tracking | ✅ Approval workflows |
| 📢 Investor communication | 🔍 Project comparison | 📋 Audit logging |
| 🎮 3D model showcase | ❤️ Favorites system | 👥 User management |

---

## 🎯 Platform Highlights

<table>
  <tr>
    <td>🎭 <strong>Role-Based Dashboards</strong></td>
    <td>Customized interfaces for Admin, Developer, and Investor roles</td>
  </tr>
  <tr>
    <td>📊 <strong>Project Lifecycle</strong></td>
    <td>From submission to approval, funding, and completion</td>
  </tr>
  <tr>
    <td>💎 <strong>Share-Based Investments</strong></td>
    <td>Purchase shares with real-time portfolio tracking</td>
  </tr>
  <tr>
    <td>🔐 <strong>Access Request Workflow</strong></td>
    <td>Controlled access to restricted project content</td>
  </tr>
  <tr>
    <td>🔔 <strong>Real-Time Notifications</strong></td>
    <td>Stay updated on investments, approvals, and activities</td>
  </tr>
  <tr>
    <td>📱 <strong>Responsive Design</strong></td>
    <td>Works seamlessly on desktop and mobile devices</td>
  </tr>
  <tr>
    <td>🌙 <strong>Dark Mode</strong></td>
    <td>Eye-friendly dark theme with system preference detection</td>
  </tr>
  <tr>
    <td>🎮 <strong>3D Model Viewer</strong></td>
    <td>Interactive GLB/GLTF model viewing for projects</td>
  </tr>
</table>

---

## 📸 Screenshots

<details>
<summary><strong>🖼️ Click to view all screenshots</strong></summary>

### Landing & Authentication

| Landing Page | Login | Registration |
|:---:|:---:|:---:|
| ![Landing](docs/screenshots/landing_page_hero.png) | ![Login](docs/screenshots/login_page.png) | ![Register](docs/screenshots/registration_page.png) |

### Dashboards

| Admin Dashboard | Developer Dashboard | Investor Dashboard |
|:---:|:---:|:---:|
| ![Admin](docs/screenshots/admin_dashboard.png) | ![Developer](docs/screenshots/developer_dashboard.png) | ![Investor](docs/screenshots/investor_dashboard.png) |

### Features

| Developer Projects | Investor Dark Mode | API Swagger |
|:---:|:---:|:---:|
| ![Projects](docs/screenshots/developer_dashboard_projects.png) | ![Dark](docs/screenshots/investor_dashboard_dark_mode.png) | ![API](docs/screenshots/backend_api_swagger.png) |

</details>

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client["🌐 Frontend"]
        React["React + Vite"]
        UI["shadcn/ui + Tailwind"]
        State["Zustand Store"]
    end
    
    subgraph Server["⚙️ Backend"]
        Django["Django REST Framework"]
        Auth["JWT Authentication"]
        ORM["Django ORM"]
    end
    
    subgraph Data["💾 Data Layer"]
        DB[(PostgreSQL)]
        Storage[(Supabase Storage)]
    end
    
    React --> Django
    UI --> React
    State --> React
    Django --> Auth
    Django --> ORM
    ORM --> DB
    Django --> Storage
```

---

## 👥 Role Capabilities

| Capability | 👑 Admin | 👨‍💻 Developer | 💼 Investor |
|------------|:--------:|:-------------:|:-----------:|
| Project submission | ❌ | ✅ | ❌ |
| Project review & approval | ✅ | ❌ | ❌ |
| Share-based investments | ❌ | ❌ | ✅ |
| Access request management | ✅ | ✅ | ✅ |
| Portfolio tracking | ❌ | ❌ | ✅ |
| User management | ✅ | ❌ | ❌ |
| Audit log access | ✅ | ❌ | ❌ |
| Wallet management | ❌ | ❌ | ✅ |
| Project analytics | ✅ | ✅ | ❌ |
| Notifications | ✅ | ✅ | ✅ |

---

## 🔄 User Journeys

### 👨‍💻 Developer Journey

```mermaid
flowchart LR
    A[Create Project] --> B[Add Media & Details]
    B --> C[Submit for Review]
    C --> D{Admin Review}
    D -->|Approved| E[Project Live]
    D -->|Rejected| F[Revise & Resubmit]
    E --> G[Track Funding]
    G --> H[Manage Investors]
```

### 💼 Investor Journey

```mermaid
flowchart LR
    A[Browse Projects] --> B[View Details]
    B --> C{Access Required?}
    C -->|Yes| D[Request Access]
    C -->|No| E[Invest]
    D --> E
    E --> F[Track Portfolio]
    F --> G[Manage Investments]
```

### 👑 Admin Journey

```mermaid
flowchart LR
    A[Dashboard Overview] --> B[Review Queue]
    B --> C[Approve/Reject]
    C --> D[Manage Users]
    D --> E[Process Investments]
    E --> F[Monitor Audit Logs]
```

---

## 📦 System Modules

| Module | Description | Key Features |
|--------|-------------|--------------|
| **👥 Users & Roles** | Authentication and authorization | JWT auth, role-based access, profile management |
| **📋 Projects** | Project lifecycle management | CRUD, media uploads, approval workflow |
| **💰 Investments** | Share purchase system | Buy shares, portfolio tracking, wallet |
| **🔓 Access Requests** | Content access control | Request/approve restricted content |
| **🔔 Notifications** | Real-time updates | Investment alerts, approval notices |
| **📊 Audit Logs** | Activity tracking | Admin activity trails, security logs |
| **📁 Media** | Asset management | Images, 3D models, documents |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library with hooks |
| **Vite** | Fast build tool & dev server |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Accessible UI components |
| **Zustand** | State management |
| **React Hook Form** | Form handling |
| **Recharts** | Data visualization |

### Backend

| Technology | Purpose |
|------------|---------|
| **Django 4.x** | Web framework |
| **Django REST Framework** | REST API toolkit |
| **SimpleJWT** | JWT authentication |
| **PostgreSQL** | Primary database |
| **Supabase** | File storage |
| **drf-spectacular** | OpenAPI documentation |

---

## 📁 Repository Structure

```
CFP-MVP/
├── 📂 backend/              # Django REST API
│   ├── config/              # Project settings
│   ├── users/               # User management
│   ├── projects/            # Project module
│   ├── investments/         # Investment module
│   ├── access_requests/     # Access control
│   ├── notifications/       # Notifications
│   ├── audit/               # Audit logging
│   └── tests/               # Test suite
│
├── 📂 frontend/             # React + Vite app
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── store/           # State management
│   └── public/              # Static assets
│
├── 📂 docs/                 # Documentation
│   ├── brand/               # Logo and branding
│   └── screenshots/         # App screenshots
│
├── 📄 README.md             # This file
├── 📄 USER_MANUAL.md        # User documentation
├── 📄 CONTRIBUTING.md       # Contribution guide
└── 📄 LICENSE               # MIT License
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | 3.10+ |
| Node.js | 18+ LTS |
| PostgreSQL | 14+ |
| Supabase | Account required |

### Quick Setup

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/jiaamasum/CFP-MVP.git
cd CFP-MVP
```

#### 2️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create admin user (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

#### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Start development server
npm run dev
```

### 🌐 Access Points

| Service | URL |
|---------|-----|
| **Frontend** | `http://localhost:8080` |
| **Backend API** | `http://localhost:8000` |
| **Swagger UI** | `http://localhost:8000/api/schema/swagger-ui/` |
| **ReDoc** | `http://localhost:8000/api/schema/redoc/` |

---

## ⚙️ Configuration

### Backend Environment Variables

```bash
# backend/.env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=postgres://user:password@localhost:5432/cfp_db

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

### Frontend Environment Variables

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:8000/api
VITE_API_BASE_URL=http://localhost:8000/api
VITE_FRONTEND_URL=http://localhost:8080

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 📚 API Documentation

Interactive API documentation is available when the backend is running:

| Documentation | URL |
|---------------|-----|
| **Swagger UI** | `http://localhost:8000/api/schema/swagger-ui/` |
| **ReDoc** | `http://localhost:8000/api/schema/redoc/` |
| **OpenAPI Schema** | `http://localhost:8000/api/schema/` |

---

## 🧪 Quality Checks

### Frontend

```bash
cd frontend

# Linting
npm run lint

# Type checking
npm run type-check

# Tests
npm run test

# Build verification
npm run build
```

### Backend

```bash
cd backend

# Format code
black .
isort .

# Linting
flake8

# Type checking
mypy .

# Tests
pytest

# Tests with coverage
pytest --cov=. --cov-report=html
```

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Frontend can't reach API** | Check `VITE_API_URL` and ensure backend is running |
| **CORS errors** | Verify `CORS_ALLOWED_ORIGINS` includes frontend URL |
| **Database connection failed** | Check `DATABASE_URL` and PostgreSQL status |
| **Images not loading** | Verify Supabase bucket names and permissions |
| **JWT authentication fails** | Check `SUPABASE_JWT_SECRET` matches Supabase config |
| **Build fails** | Run linting/type checks to identify errors |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- 🍴 Fork and clone workflow
- 📝 Commit message conventions
- 🔍 Code review process
- ✅ Pull request requirements

---

## 👨‍💻 Author

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/jiaamasum">
          <img src="https://github.com/jiaamasum.png" width="120px;" alt="Masum Jia" style="border-radius:50%;"/>
          <br />
          <sub><b>Masum Jia</b></sub>
        </a>
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

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Masum Jia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

See the [LICENSE](LICENSE) file for full details.

---

<div align="center">
  <p>
    <sub>Built with ❤️ by <a href="https://github.com/jiaamasum">Masum Jia</a></sub>
  </p>
  <p>
    <a href="frontend/README.md">🎨 Frontend</a> •
    <a href="backend/README.md">⚙️ Backend</a> •
    <a href="USER_MANUAL.md">📖 User Manual</a> •
    <a href="CONTRIBUTING.md">🤝 Contributing</a>
  </p>
  
  ⭐ **Star this repository if you find it useful!** ⭐
</div>
