Got it. Here’s the tech stack organized with that clearly stated: you will **use Supabase as the service provider**, but **you will implement authentication, email flows, and database interactions yourself** (not using Supabase’s ready-made auth UI or default implementation).

## Proposed Tech Stack

### 1) Frontend

* **Framework:** Next.js (React)
* **UI Components:** shadcn/ui
* **Styling:** Tailwind CSS
* **Forms + Validation:** React Hook Form + Zod
* **API Client / Server State:** TanStack Query (React Query)
* **State (UI-level):** Zustand or React Context (lightweight)
* **3D Viewer:** Three.js + React Three Fiber (rotate, zoom, reset)
* **Notifications UI:** Notification center (unread count, mark-as-read)

---

### 2) Backend

* **Framework:** Django REST Framework (DRF)
* **Authentication:** JWT (access + refresh tokens)
* **Authorization:** RBAC permissions for Admin, Developer, Investor enforced at API level
* **Email Handling:** Supabase email service (SMTP/email delivery) triggered by backend
* **Async Jobs (Optional but recommended):**

  * MVP: synchronous email sending is acceptable
  * Upgrade path: Celery + Redis for background emails and notification processing

---

### 3) Database and Storage

* **Database:** PostgreSQL (Supabase-hosted)

  * Used as a managed database service only
  * All schema design, migrations, constraints, and queries handled by the backend (Django ORM)
* **Media and 3D Storage:** Supabase Storage

  * Store images and 3D assets
  * File validation and access rules handled by your backend

---

### 4) Supabase Usage Policy (Important Clarification)

You will use Supabase as a **managed service provider** only:

* Supabase PostgreSQL for database hosting
* Supabase Storage for file hosting
* Supabase Email service for sending verification/reset emails

But you will **not rely on Supabase’s default authentication implementation** (such as built-in auth UI, direct Supabase Auth client flows, or automatic user/session management).
Instead:

* **All authentication logic** (registration, email verification, login, JWT issuance/refresh, password reset workflow) will be **implemented by your backend (Django REST Framework)**.
* Supabase will be used only to **deliver emails and host data**, while the platform retains **full control over business logic, permissions, and security rules**.

---

### 5) Real-Time Notifications

* **MVP approach:** Polling (frontend requests notifications periodically)
* **Upgrade approach:** Django Channels (WebSockets) for real-time alerts

Recommendation: implement **polling first**, then add WebSockets if time permits.

---

### 6) Security and Quality

* API-level RBAC enforcement across all endpoints
* Secure password hashing and input validation in Django
* JWT authentication with refresh flow
* Idempotent payment callbacks to prevent duplicate investments
* Atomic database transactions to prevent overselling shares
* Audit logs stored in DB for critical actions

---

### Short “Tech Stack Summary” (copy-paste)

The system will use **Next.js** with **shadcn/ui** and **Tailwind CSS** for the frontend, and **Django REST Framework** for backend APIs. Authentication will use **JWT** with role-based permissions. The database will be **PostgreSQL hosted on Supabase**, and project assets will be stored in **Supabase Storage**. Email verification and password reset emails will be sent using **Supabase email service**, but the authentication workflow and session management will be implemented fully by the backend rather than using Supabase’s default auth implementation.

If you want, I can also write this as a formal SRS section titled **“Technology Stack and Tools”** with a short justification for each choice.
