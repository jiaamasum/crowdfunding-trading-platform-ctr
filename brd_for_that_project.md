Business Requirements Document 

Project Name: Crowdfunding Trading Platform 
Document Type: Business Requirements Document 
Version: 1.3 
Date: December 19, 2025 

 

1. Executive Summary 

The Crowdfunding Trading Platform is a role-based digital system designed to connect Project Developers and Investors under controlled administration. Developers create investment projects, Investors evaluate and invest, and Admins manage approvals, access control, and platform governance. 

The platform follows a share-based investment model, where each project defines a Total Project Value and Total Shares. The system calculates per-share prices and allows investors to purchase shares within availability. Dashboards for Developers and Investors provide summarized insights into investments and project performance. 

 

2. Business Objectives 

Provide a secure crowdfunding platform with controlled investment access 

Enable share-based investments with accurate calculations and oversell prevention 

Offer clear dashboards for Developers and Investors to track performance 

Allow investors to make informed decisions using comparison and visualization tools 

Ensure admin-level governance through approvals, revocations, and audit logs 

 

3. Project Scope 

3.1 In Scope 

Authentication and Access 

User registration and login 

Email verification 

Password reset 

Role-based access control 

User Roles 

Admin 

Project Developer 

Investor 

Project Lifecycle Management 

Project states: Draft, Pending Review, Approved, Rejected, Needs Changes, Archived 

Developers can edit projects only in allowed states 

Admin approval required before public visibility 

Share-Based Investment Model 

Total Project Value defined by developer 

Total Shares defined by developer 

Per Share Price calculated automatically 

Investors purchase shares based on availability 

Overselling is strictly prevented 

 

Developer Dashboard 

Each Project Developer has access to a personalized dashboard that provides visibility to their project performance. 

Developer Dashboard Features: 

Total number of projects created 

List of active and completed projects 

Total amount secured from investors (per project and overall) 

Number of investors per project 

Shares sold vs total shares for each project 

Project progress status and duration overview 

This dashboard helps developers track funding performance and investor engagement across their projects. 

 

Investor Dashboard 

Each Investor has access to a personalized dashboard that summarizes their investment activity and portfolio status. 

Investor Dashboard Features: 

Total number of projects invested in 

Total invested amount 

List of invested projects with status 

Shares owned per project 

Project progress summary and remaining duration 

Investment history and payment records 

This dashboard allows investors to easily monitor their portfolio and ongoing investments. 

 

Investor Discovery and Decision Tools 

Browse and filter projects 

Favorites and bookmarks 

Comparator for side-by-side comparison 

Project duration and progress visibility 

Restricted Data Access Control 

Certain project fields marked as restricted 

Investors must request access to restricted data 

Admin approves, rejects, or revokes access 

Backend-level enforcement ensures no data leakage 

Payment and Investment 

Sandbox payment gateway integration 

Successful payments create share purchase records 

Failed payments are logged 

Investors can view investment history and receipts 

Admins can view all payment logs 

3D Project Visualization 

Optional 3D model viewing per project 

Rotate, zoom, and reset controls 

Admin-defined file size and format limits 

3D content can be public or restricted 

Real-Time Notifications 

Admin notifications for project submissions and access requests 

Investor notifications for access decisions and payment status 

Developer notifications for approval and review feedback 

Notification center with unread status 

Admin Panel 

User management 

Project approval queue 

Access request management 

Investment and payment logs 

Audit log viewing 

 

3.2 Out of Scope 

Advanced predictive analytics 

External third-party integrations beyond payment sandbox 

 

4. Stakeholders 

Platform Owner or Supervisor 

System Administrators 

Project Developers 

Investors 

 

5. User Roles and Permissions 

Admin 

Approve, reject, and request changes for projects 

Grant and revoke access to restricted project data 

View all dashboards and system-wide metrics 

Monitor payment and transaction logs 

Access full audit logs 

Project Developer 

Create and manage projects 

View Developer Dashboard insights 

Monitor investor participation and funding progress 

Investor 

Browse, favorite, and compare projects 

View Investor Dashboard insights 

Monitor investment performance and project progress 

 

6. Key Business Rules 

Email verification is mandatory before investing or requesting restricted access 

Restricted project data is visible only after admin approval 

Admin can revoke access at any time 

Per Share Price = Total Project Value ÷ Total Shares 

Investment Amount = Shares Purchased × Per Share Price 

Overselling of shares is not allowed 

Dashboard data must reflect real-time or near real-time values 

All access decisions and payments must be logged 

 

7. Functional Requirements 

Authentication 

Secure registration and login 

Email verification workflow 

Password recovery 

Developer Project Management 

Create projects with mandatory fields 

Upload images and optional 3D assets 

Submit projects for review 

Track funding status via dashboard 

Investor Project Interaction 

Browse and filter projects 

View public project details 

See share availability and pricing 

Dashboards 

Developer Dashboard showing funding and investor metrics 

Investor Dashboard showing portfolio and project summaries 

Favorites and Comparator 

Bookmark projects 

Compare multiple projects side by side 

Restricted Access Workflow 

Request restricted access 

Admin decision with reason 

Immediate enforcement on approval or revocation 

Investment and Payment 

Share selection and automatic total calculation 

Sandbox payment processing 

Success and failure handling 

Receipt and history storage 

Notifications and Logging 

Real-time notifications for key actions 

Persistent notification history 

Comprehensive audit logs 

 

8. Non-Functional Requirements 

Security 

Role-based authorization at API level 

Secure password storage 

Protection against unauthorized data access 

Performance 

Paginated dashboards and listings 

Efficient summary calculations 

Reliability 

Idempotent payment handling 

Accurate dashboard metrics under concurrency 

Usability 

Clear and simple dashboard layouts 

Transparent progress indicators 

Easy navigation between dashboard and details 

 

9. High-Level Data Entities 

User 

Project 

ProjectMedia 

Favorite 

AccessRequest 

SharePurchaseTransaction 

PaymentTransaction 

Notification 

AuditLog 

 

10. Core User Journeys 

Investor 

Register → Verify Email → Browse Projects → Favorite or Compare → Request Access → Approval → Buy Shares → Payment → View Dashboard 

Developer 

Register → Create Project → Define Shares → Upload Media → Submit → Admin Review → Monitor Dashboard 

Admin 

Review Projects → Approve or Reject → Manage Access Requests → Monitor Dashboards → Review Logs 

 

11. Assumptions, Dependencies, Constraints 

Assumptions 

Developers provide accurate project values and share counts 

Dashboard metrics are derived from stored transactions 

Email delivery is reliable 

Dependencies 

Email service provider 

Payment gateway sandbox 

Media storage service 

Constraints 

Sandbox payments only during MVP 

Backend enforcement of all access rules 

Atomic share allocation required 

 

12. Risks and Mitigation 

Duplicate payments handled via idempotent logic 

Data leakage prevented by backend authorization 

Overselling prevented by transactional updates 

Large media files managed via size limits 

 

13. Acceptance Criteria 

Developers can view funding and investor metrics per project 

Investors can view portfolio and project summaries 

Dashboard values update correctly after investments 

Restricted data remains protected 

Share calculations are accurate 

Payments update dashboards correctly 

Notifications are delivered and stored 

 