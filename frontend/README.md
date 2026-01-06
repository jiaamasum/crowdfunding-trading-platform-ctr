# CrowdFund - Share-Based Crowdfunding Platform

A modern crowdfunding platform enabling share-based investments in innovative projects.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Django REST Framework
- **Auth**: Supabase Authentication
- **Database**: PostgreSQL (via Supabase)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:8080

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API will be available at http://localhost:8000

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
SUPABASE_URL=your-supabase-url
```

## Features

- 🔐 Supabase Authentication with email verification
- 🔑 Google OAuth integration
- 📊 Role-based dashboards (Admin, Developer, Investor)
- 💼 Project creation and management
- 💰 Share-based investments
- 🔒 Restricted content access requests
