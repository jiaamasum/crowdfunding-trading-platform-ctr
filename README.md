
<div align="center">
  <img src="docs/brand/logo.png" alt="CFP Logo" width="120" style="background:#f5f5f5;padding:15px;border-radius:15px;box-shadow:0 4px 6px rgba(0,0,0,0.1);" />

  <h1>Crowdfunding Trading Platform (CFP-MVP)</h1>

  <p>
    <strong>Next-Gen Investment & Project Funding Ecosystem</strong>
  </p>

  <p>
    <a href="frontend/README.md"><strong>Frontend Docs</strong></a> |
    <a href="backend/README.md"><strong>Backend Docs</strong></a> |
    <a href="docs/screenshots/project_overview.mov"><strong>Video Demo</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/status-MVP%20Complete-success" alt="Status" />
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
    <img src="https://img.shields.io/badge/frontend-Next.js-black" alt="Frontend" />
    <img src="https://img.shields.io/badge/backend-Django-092e20" alt="Backend" />
  </p>
</div>

---

## 📖 Overview
**CFP-MVP** is a comprehensive digital platform connecting visionary **Project Developers** with potential **Investors** through a regulated, role-based environment. It enables:
- **Developers** to raise capital by selling project shares.
- **Investors** to browse, compare, and invest in projects to build diversified portfolios.
- **Admins** to oversee compliance, approve projects, and manage users.

## 🚀 Key Features
- **✨ Role-Based Dashboards**: Tailored experiences for Investors, Developers, and Admins.
- **📈 Share Trading Logic**: Atomic transactions and dynamic share calculation.
- **🔐 Secure Access**: JWT authentication with RBAC and specialized permission flows.
- **🖼️ Rich Media**: Support for 3D models, video galleries, and high-res project imagery.
- **⚖️ Comparison Tools**: Side-by-side project analysis for informed investing.

## 🏗 Technology Stack

| Area | Technology |
| --- | --- |
| **Frontend** | Next.js (React), Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| **Backend** | Django REST Framework, Python 3.14 |
| **Database** | PostgreSQL (via Supabase) |
| **Storage** | Supabase Storage (Buckets for Media, 3D, Profiles) |
| **Auth** | JWT (SimpleJWT) + Supabase Auth Integration |

## 📂 Repository Structure
This monorepo contains:

- **[`frontend/`](frontend/README.md)**: The React-based user interface.
- **[`backend/`](backend/README.md)**: The Django REST API server.
- **[`docs/`](docs/)**: Project documentation assets, screenshots, and brand materials.

## 🏁 Quick Start

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Configure .env (see backend/README.md)
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Configure .env.local (see frontend/README.md)
npm run dev
```

## 📸 visual Tour

| **Investor Dashboard** | **Project Details** |
|:---:|:---:|
| <img src="docs/screenshots/investor_dashboard.png" width="400" /> | <img src="docs/screenshots/project_overview.mov" width="400" /> |

| **Admin Control** | **Developer Stats** |
|:---:|:---:|
| <img src="docs/screenshots/admin_dashboard.png" width="400" /> | <img src="docs/screenshots/developer_dashboard.png" width="400" /> |

## 🤝 Contributing
1. Clone the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Push to the branch and open a PR.

## 📄 License
MIT © 2026 Masum Jia
