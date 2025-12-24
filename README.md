# Crowdfunding Trading Platform (CFP-MVP)

A role-based digital platform designed to connect **Project Developers** and **Investors** under controlled administration. The platform facilitates share-based investments in projects, allowing developers to raise funds and investors to build portfolios.

## 🚀 Features

-   **Role-Based Access**: Specialized dashboards for Admins, Project Developers, and Investors.
-   **Share-Based Investment**: Dynamic calculation of share prices and atomic transaction handling.
-   **Project Management**: Developers can create, submit, and manage projects.
-   **Investment discovery**: Investors can compare, favorite, and browse projects.
-   **Security**: Admin-controlled approval workflows and restricted data access.

## 🛠 Tech Stack

### Backend
-   **Framework**: Django REST Framework (Python)
-   **Database**: PostgreSQL (via Supabase)
-   **Authentication**: JWT (JSON Web Tokens)
-   **Storage**: Supabase Storage

### Frontend
-   **Framework**: Next.js (React)
-   **Styling**: Tailwind CSS
-   **Components**: shadcn/ui
-   **Icons**: Lucide React

## 📦 Project Structure

The project is organized as a monorepo:

-   `backend/`: Django project code.
-   `frontend/`: Next.js application code.

## 🛠 Getting Started

### Prerequisites
-   Python 3.x
-   Node.js & npm

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables:
    -   Copy `.env.example` to `.env` and fill in your details.
5.  Run migrations and start the server:
    ```bash
    python manage.py migrate
    python manage.py runserver
    ```

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
