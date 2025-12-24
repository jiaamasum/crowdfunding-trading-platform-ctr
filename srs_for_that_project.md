# Software Requirements Specification (SRS)

## Crowdfunding Trading Platform (Full Scope MVP)

**Version:** 1.0
**Date:** December 2025
**Prepared By:** Masum Jia and Team

---

## 1. Purpose

This document specifies the software requirements for the Crowdfunding Trading Platform. It defines system features, constraints, and quality expectations for development, testing, and evaluation.

---

## 2. Scope

The system is a role-based crowdfunding platform:

* Developers create projects and submit for approval.
* Investors browse projects, request access to restricted details, and invest using a share-based model.
* Admins approve projects, manage restricted access, monitor investments, and maintain auditability.

The MVP includes authentication, project workflow, restricted access control, share investing, sandbox payment, favorites, comparator, 3D viewer, notifications, dashboards for Developers and Investors, and an admin panel with audit logging.

Out of scope:

* Advanced predictive analytics
* External integrations beyond the sandbox payment gateway

---

## 3. System Overview

### 3.1 User Roles

* **Admin:** Approvals, access control, governance, logs.
* **Project Developer:** Creates projects, monitors funding via dashboard.
* **Investor:** Browses, compares, favorites, requests access, invests, monitors portfolio via dashboard.

### 3.2 Operating Environment

* Web application accessible via modern browsers (Chrome, Firefox).
* Secure backend server with HTTPS communication.
* Dashboard-based UI for Admin, Developer, and Investor.
* Forms for creation, approval, and investment.
* Comparator presented as a side-by-side table.
* 3D viewer supports rotate, zoom, and reset controls.
* External services used by the platform:

  * Email service for verification and notifications
  * Sandbox payment gateway for transactions
  * Media storage for images and 3D assets

### 3.3 Assumptions and Constraints

Assumptions:

* Email verification is required for investing and restricted access requests.
* Dashboard metrics are derived from stored transactions.
* Email delivery is reliable.

Constraints:

* Payment is sandbox-only in MVP.
* Restricted data must be enforced at API level, not only UI.
* Share allocation must be atomic to prevent overselling under concurrency.
* Uploaded media must follow configured size and format limits.

---

## 4. User Stories (Separated)

### 4.1 Authentication

* As a user, I want to register as an Investor or Developer so I can access the correct features.
* As a user, I want to verify my email so I can securely access protected actions.
* As a user, I want to log in and log out so my account stays secure.
* As a user, I want to reset my password so I can recover access.

### 4.2 Developer Project Management

* As a Developer, I want to create a project so investors can invest after approval.
* As a Developer, I want to upload media and optional 3D assets to showcase the project.
* As a Developer, I want to submit my project for admin review so it can go live.
* As a Developer, I want controlled edit rules based on project status so the workflow is managed.
* As a Developer, I want a dashboard so I can track investors, secured amount, and funding progress.

### 4.3 Admin Project Review

* As an Admin, I want a review queue so I can process projects efficiently.
* As an Admin, I want to approve, reject, or request changes so only valid projects go live.
* As an Admin, I want decisions and access-control actions logged so actions are traceable.

### 4.4 Investor Discovery and Tools

* As an Investor, I want to browse approved projects so I can find opportunities.
* As an Investor, I want to search and filter projects so I can find relevant options.
* As an Investor, I want to favorite projects so I can revisit them easily.
* As an Investor, I want to compare projects side by side so I can decide faster.
* As an Investor, I want a dashboard so I can track investments, project progress, and portfolio summary.

### 4.5 Restricted Access

* As an Investor, I want to request access to restricted project details so I can evaluate deeper information.
* As an Admin, I want to approve, reject, or revoke access so sensitive data remains controlled.

### 4.6 Investment and Payment

* As an Investor, I want to buy shares so I can invest in projects.
* As an Admin, I want payment and investment logs so I can audit transactions.

### 4.7 3D Viewer

* As an Investor, I want to view 3D project content so I can understand visuals better.
* As an Admin, I want file limits enforced so the platform remains stable.

### 4.8 Notifications

* As an Admin, I want notifications for submissions and access requests so I can respond quickly.
* As a Developer, I want notifications about approval results so I can act.
* As an Investor, I want notifications about access and payment so I stay updated.

### 4.9 Admin Panel and Logs

* As an Admin, I want a management panel so I can govern users, projects, and access requests.
* As an Admin, I want audit logs so critical actions are traceable and reviewable.

---

## 5. Functional Requirements

### 5.1 Authentication and Account Management

Requirements:

* The system shall allow users to register using email and password.
* The system shall require email verification.
* The system shall provide login and logout.
* The system shall provide password reset via email.
* The system shall enforce role-based access control for Admin, Developer, and Investor.
* Unverified investors shall not be able to invest or request restricted access.
* Unauthorized users shall not be able to access restricted APIs or data.

Acceptance Criteria:

* Investor cannot invest or request restricted access until email is verified.
* Logging out invalidates the session.
* Password reset results in successful login using the new password.

---

### 5.2 Project Requirements (Developer)

Requirements:

* The system shall allow Developers to create projects with required fields: title, description, category, duration, total project value, total shares.
* The system shall support the following project states: Draft, Pending Review, Approved, Rejected, Needs Changes, Archived.
* The system shall allow Developers to submit projects for review, changing state to Pending Review.
* The system shall enforce that admin approval is mandatory before public visibility.
* The system shall control editing based on project status (Developers can edit only in allowed states).
* The system shall allow uploading images and optional 3D models with file validation (size and format).

Acceptance Criteria:

* A project cannot be submitted unless required fields are completed.
* Draft projects are not visible publicly.
* Approved projects appear in public project listing.
* Upload validation blocks unsupported or oversized files.

---

### 5.3 Admin Review and Approval

Requirements:

* The system shall show Admin a queue of projects pending review.
* The system shall allow Admin to approve, reject, or request changes.
* The system shall store review decisions with timestamp and notes.
* The system shall notify Developers of review outcomes.

Acceptance Criteria:

* Approved projects appear publicly.
* Rejected and Needs Changes store a reason/notes.
* Decision is recorded and visible in admin logs.

---

### 5.4 Investor Discovery and Project Details

Requirements:

* The system shall allow Investors to browse and filter approved projects.
* The system shall provide search and filtering.
* The system shall show project duration and progress.
* The system shall show share and funding details on listing and detail pages.

Acceptance Criteria:

* Only Approved projects appear to Investors.
* Search and filters return correct results.
* Share metrics remain consistent across listing, detail, comparator, and dashboards.

---

### 5.5 Favorites and Bookmarks

Requirements:

* The system shall allow Investors to add or remove favorites.
* The system shall provide a favorites list.
* The system shall prioritize favorited projects for that investor.

Acceptance Criteria:

* Favorited projects appear in the favorites list.
* Prioritization applies only for the investor who favorited.

---

### 5.6 Comparator

Requirements:

* The system shall allow Investors to compare 2 to 4 projects side by side.
* The comparator shall be presented as a side-by-side table.
* Restricted fields shall not show unless access is granted.

Acceptance Criteria:

* Comparator supports at least 2 projects and up to 4 projects.
* Restricted fields remain hidden without approval.

---

### 5.7 Restricted Data Access Control

Requirements:

* The system shall support restricted project fields.
* Verified investors shall be able to request access to restricted project data.
* Admin shall be able to approve, reject, or revoke access with reason.
* Revocation shall take immediate effect.
* All access decisions shall be logged.
* Backend enforcement is mandatory to prevent any restricted data leakage.

Acceptance Criteria:

* Restricted fields never appear in API responses without approved access.
* Revocation removes access immediately and restricted content becomes locked again.
* Access status displays correctly (Pending, Approved, Rejected, Revoked).

---

### 5.8 Share-Based Investment and Payment (Sandbox)

Requirements:

* Developers shall define Total Project Value and Total Shares.
* The system shall calculate: Per Share Price = Total Project Value ÷ Total Shares.
* Investors shall select number of shares to purchase.
* The system shall calculate: Investment Amount = Shares Purchased × Per Share Price.
* At no time shall sold shares exceed total defined shares.
* Overselling is strictly prohibited and must be prevented under concurrency.
* The system shall integrate a sandbox payment gateway.
* Successful payments shall create share purchase records.
* Failed payments shall be logged and shall not allocate shares.
* Idempotent logic shall prevent duplicate transactions (including repeated callbacks).

Acceptance Criteria:

* Investors cannot buy more shares than remaining.
* Successful payment creates a purchase record and updates shares sold and remaining shares.
* Failed payments do not affect share counts.
* Duplicate callbacks do not create duplicate investment records.

---

### 5.9 3D Viewer

Requirements:

* The system shall support optional 3D model upload per project.
* The 3D viewer shall provide rotate, zoom, and reset controls.
* Admin-defined size and format limits shall be enforced.
* 3D content may be public or restricted based on project settings.

Acceptance Criteria:

* Unsupported 3D uploads are blocked.
* Viewer loads and works for valid assets.
* Restricted 3D content stays hidden unless access is granted.

---

### 5.10 Notifications

Requirements:

* Admin shall receive notifications for project submissions and access requests.
* Developers shall receive notifications for project status changes.
* Investors shall receive notifications for access decisions and payment status.
* The system shall provide a persistent notification center with read/unread state and mark-as-read.

Acceptance Criteria:

* Notifications trigger for required events and remain visible in the notification center.
* Unread count updates correctly.
* Mark-as-read works reliably.

---

### 5.11 Dashboards

Developer Dashboard Requirements:

* The system shall provide a dashboard for Developers.
* The dashboard shall show: total projects created, active and completed projects, total funds secured (overall and per project), investor count per project, shares sold vs total shares, project duration and status overview.
* Dashboard values shall be derived from investment transactions.

Acceptance Criteria:

* Dashboard updates after successful investments.
* Metrics match transaction data and share counts.

Investor Dashboard Requirements:

* The system shall provide a dashboard for Investors.
* The dashboard shall show: total projects invested in, total invested amount, shares owned per project, project progress summary, investment history and payment receipts.

Acceptance Criteria:

* Dashboard reflects actual transactions.
* Investment history includes share count, price per share at purchase time, and receipt data.

---

### 5.12 Admin Panel and Audit Logs

Requirements:

* The system shall provide admin management views for users, projects, access requests, investments, and payments.
* Audit logs shall record admin approvals, revocations, and rejections.
* Audit logs shall record payment success and failure events.
* Logs must be immutable and reviewable.

Acceptance Criteria:

* Every critical action produces a log entry.
* Admin can review logs reliably for auditing and troubleshooting.

---

## 6. Non-Functional Requirements

### 6.1 Security

* Secure password hashing.
* API-level RBAC enforcement.
* Strict protection of restricted data.
* Audit trail for sensitive actions.

### 6.2 Performance

* Paginated listings and dashboards.
* Efficient aggregation queries for dashboard calculations.
* Near real-time dashboard updates under normal operating conditions.

### 6.3 Reliability and Consistency

* Idempotent payment handling.
* Atomic database transactions for share allocation.
* Consistent dashboard metrics under concurrency.

### 6.4 Usability

* Clear dashboard layouts.
* Locked content clearly indicated with guidance and request status.
* Simple and guided investment flow with clear share price and total payable.

### 6.5 Maintainability

* Modular architecture.
* Logging supports debugging, audits, and issue resolution.

---

## 7. Data Requirements

### 7.1 Core Entities

Users, Projects, ProjectMedia, Favorites, Access Requests, Share Purchase Transactions, Payment Transactions, Notifications, Audit Logs.

### 7.2 Data Rules

* Per share price is derived from total project value and total shares.
* Shares remaining cannot be negative.
* Restricted fields are returned only if access is approved.
* Share purchase and payment records must be consistent and traceable.

---

## 8. Testing and Validation

### Testing Coverage

* Auth: register, verify, login, reset
* Project workflow: create, submit, approve/reject, state transitions
* Restricted access enforcement at API level
* Investment: share calculation, oversell prevention under concurrency
* Payment: success/failure/duplicate callback handling
* Dashboards: metrics accuracy and transaction-derived values
* Notifications: triggers, unread state, persistence
* Comparator and favorites behavior

### Acceptance Conditions

System is accepted when:

* Email verification is enforced before investment.
* Restricted data is inaccessible without approval.
* Admin revocation removes access immediately.
* Per-share price calculations are accurate.
* Share overselling is impossible.
* Successful payments update shares and dashboards.
* Failed payments do not affect share counts.
* Notifications are delivered and stored correctly.

---
