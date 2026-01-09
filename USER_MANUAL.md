# CrowdFunding Trading Platform (CFP) - User Manual

## Version History

| Version | Date       | Author      | Description                                         |
|:--------|:-----------|:------------|:----------------------------------------------------|
| 3.0     | 2026-01-09 | Masum Jia   | Comprehensive detailed documentation                |
| 2.0     | 2026-01-09 | Masum Jia   | Comprehensive update with all platform features     |
| 1.0     | 2026-01-09 | Masum Jia   | Initial Release Documentation                       |

---

## Table of Contents

1. [Introduction](#1-introduction)
   - [Platform Overview](#platform-overview)
   - [Key Features](#key-features)
   - [Platform Statistics](#platform-statistics)
   - [Why Choose CFP](#why-choose-cfp)
2. [Getting Started](#2-getting-started)
   - [System Requirements](#21-system-requirements)
   - [Accessing the Platform](#22-accessing-the-platform)
   - [Registration](#23-registration)
   - [Email Verification](#24-email-verification)
   - [Login & Authentication](#25-login--authentication)
   - [Password Recovery](#26-password-recovery)
   - [Understanding the Interface](#27-understanding-the-interface)
3. [Platform Roles](#3-platform-roles)
   - [Role Comparison Table](#role-comparison-table)
   - [Role Descriptions](#role-descriptions)
   - [Changing Your Role](#changing-your-role)
4. [Investor Guide](#4-investor-guide)
   - [Investor Dashboard](#41-investor-dashboard)
   - [Browsing Projects](#42-browsing-projects)
   - [Project Details](#43-project-details)
   - [Requesting Access to Restricted Content](#44-requesting-access-to-restricted-content)
   - [Investment Process](#45-investment-process)
   - [Portfolio Management](#46-portfolio-management)
   - [My Investments Page](#47-my-investments-page)
   - [Investment Requests & Access Requests](#48-investment-requests--access-requests)
   - [Favorites & Compare](#49-favorites--compare)
   - [Wallet](#410-wallet)
5. [Developer Guide](#5-developer-guide)
   - [Developer Dashboard](#51-developer-dashboard)
   - [Creating a New Project](#52-creating-a-new-project)
   - [Project Form Fields Detailed](#53-project-form-fields-detailed)
   - [Managing Projects](#54-managing-projects)
   - [Project Media Management](#55-project-media-management)
   - [Submitting for Review](#56-submitting-for-review)
   - [Edit Requests](#57-edit-requests)
   - [Archive Requests](#58-archive-requests)
   - [Tracking Your Funding](#59-tracking-your-funding)
6. [Administrator Guide](#6-administrator-guide)
   - [Admin Dashboard Overview](#61-admin-dashboard-overview)
   - [Project Review Queue](#62-project-review-queue)
   - [Access Request Management](#63-access-request-management)
   - [Investment Request Processing](#64-investment-request-processing)
   - [Investment Approvals & Payment Tracking](#65-investment-approvals--payment-tracking)
   - [User Management](#66-user-management)
   - [Project Ledger](#67-project-ledger)
   - [Payments & Transactions](#68-payments--transactions)
   - [Audit Logs](#69-audit-logs)
   - [Administrative Best Practices](#610-administrative-best-practices)
7. [Profile & Settings](#7-profile--settings)
   - [Viewing Your Profile](#71-viewing-your-profile)
   - [Updating Profile Information](#72-updating-profile-information)
   - [Changing Your Avatar](#73-changing-your-avatar)
   - [Security Settings](#74-security-settings)
8. [Notifications](#8-notifications)
   - [Notification Center](#81-notification-center)
   - [Notification Types](#82-notification-types)
   - [Managing Notifications](#83-managing-notifications)
   - [Real-Time Updates](#84-real-time-updates)
9. [Platform Features](#9-platform-features)
   - [Dark Mode](#91-dark-mode)
   - [3D Model Viewer](#92-3d-model-viewer)
   - [Image Lightbox](#93-image-lightbox)
   - [Responsive Design](#94-responsive-design)
   - [Search & Filtering](#95-search--filtering)
   - [Data Export](#96-data-export)
10. [Security & Privacy](#10-security--privacy)
    - [Data Protection](#101-data-protection)
    - [Authentication Security](#102-authentication-security)
    - [Transaction Security](#103-transaction-security)
11. [Troubleshooting & FAQ](#11-troubleshooting--faq)
    - [Account Issues](#111-account-issues)
    - [Investment Issues](#112-investment-issues)
    - [Project Issues](#113-project-issues)
    - [Technical Issues](#114-technical-issues)
    - [Getting Help](#115-getting-help)
12. [Legal Information](#12-legal-information)
13. [Glossary](#13-glossary)
14. [Appendix](#14-appendix)

---

## 1. Introduction

Welcome to the **CrowdFunding Trading Platform (CFP)** — a comprehensive, role-based, share-driven fundraising and portfolio management platform that bridges the gap between innovative project developers seeking capital and investors looking for high-potential opportunities.

### Platform Overview

CFP is designed to democratize investment opportunities while maintaining rigorous governance and transparency standards. The platform operates on a share-based investment model, allowing:

- **Investors** to discover carefully vetted, high-potential projects, purchase fractional shares, track real-time portfolio performance, and manage investments with complete transparency. Investors can start with minimal amounts, making quality investments accessible to everyone.

- **Developers** to showcase their innovative projects, raise capital through share-based funding from a global investor base, and manage their project lifecycle from initial draft through approval to successful funding completion. Developers maintain control while accessing a diverse funding pool.

- **Administrators** to oversee the entire platform ecosystem with comprehensive governance controls, multi-stage approval workflows, access management, and detailed audit capabilities ensuring fair, transparent, and secure operations.

### Key Features

| Feature | Description |
|---------|-------------|
| **Share-Based Investments** | Projects are funded through share purchases, enabling fractional ownership. Buy as few as 1 share to participate in any project. |
| **Multi-Step Investment Workflow** | Investment requests go through admin approval before payment processing, ensuring compliance and investor protection. |
| **Access Control System** | Sensitive project information (financials, business plans, legal documents) requires explicit access approval. |
| **Project Lifecycle Management** | Complete workflow from draft creation → submission → admin review → approval → funding → completion. |
| **Real-Time Notifications** | Instant updates on investment status, approvals, project changes, and platform activity. |
| **Portfolio Analytics** | Interactive dashboards with charts showing investment allocation, performance trends, and historical data. |
| **Project Comparison** | Side-by-side comparison of up to 4 projects with normalized scoring across key metrics. |
| **3D Model Support** | Projects can include interactive 3D models (GLB/GLTF) for immersive visualization. |
| **Dark Mode** | Full dark theme support with automatic system preference detection. |
| **Audit Trail** | Comprehensive logging of all platform activities for transparency and compliance. |

### Platform Statistics

CFP has achieved significant milestones:

| Metric | Value |
|--------|-------|
| Total Invested | $48M+ |
| Active Projects | 150+ |
| Registered Investors | 12,000+ |
| Success Rate | 94% |

### Why Choose CFP

**For Investors:**
- **Vetted Projects**: Every project undergoes thorough administrative review before listing
- **Low Minimums**: Start investing from just $50 per share on many projects
- **Diversification**: Spread risk across multiple projects and categories
- **Real-Time Tracking**: Monitor portfolio performance as it happens
- **Secure Transactions**: Bank-level security for all financial operations
- **Global Access**: Invest in projects from around the world

**For Developers:**
- **Global Reach**: Access investors worldwide from a single platform
- **Flexible Funding**: Set your own share price and total shares
- **Maintained Control**: Retain project ownership while raising capital
- **Transparent Process**: Clear review workflow with detailed feedback
- **Investor Updates**: Keep investors informed with project updates
- **Protected Information**: Restrict sensitive content to approved investors only

**For Everyone:**
- **Transparent Governance**: All activities are logged and auditable
- **Secure Platform**: JWT-based authentication with encrypted data storage
- **Fair Operations**: Admin oversight ensures equitable treatment for all users

![Landing Page](/docs/screenshots/landing_page_hero.png)

---

## 2. Getting Started

### 2.1 System Requirements

Before using CFP, ensure your system meets these requirements:

#### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Web Browser** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+, or any modern browser |
| **JavaScript** | Must be enabled |
| **Cookies** | Must be enabled for authentication |
| **Screen Resolution** | 1280x720 minimum (responsive design supports mobile) |
| **Internet Connection** | Stable broadband connection recommended |

#### Recommended Requirements

| Component | Recommendation |
|-----------|----------------|
| **Web Browser** | Latest version of Chrome or Firefox |
| **Screen Resolution** | 1920x1080 for optimal experience |
| **Internet Speed** | 10 Mbps+ for smooth 3D model viewing |
| **WebGL** | Enabled for 3D model visualization |

#### Mobile Compatibility

- iOS 14+ with Safari or Chrome
- Android 10+ with Chrome
- Responsive design adapts to all screen sizes

### 2.2 Accessing the Platform

1. **Direct URL**: Navigate to the platform URL provided by your organization
2. **Homepage Navigation**: 
   - Click **Browse Projects** to view available investment opportunities without signing in
   - Click **Get Started** or **Sign Up** to create an account
   - Click **Sign In** if you already have an account

### 2.3 Registration

Creating an account is free and takes only a few minutes.

#### Step-by-Step Registration Process

1. **Navigate to Registration**
   - From the homepage, click **Sign Up** or **Get Started**
   - Or click **Sign In** then **Create an account**

2. **Fill in Your Details**

   | Field | Requirements | Tips |
   |-------|--------------|------|
   | **Full Name** | Minimum 2 characters | Use your real name for verification purposes |
   | **Email Address** | Valid email format | Use an email you regularly check |
   | **Password** | See password requirements below | Use the password generator for a secure password |
   | **Confirm Password** | Must match password | Copy-paste to ensure accuracy |
   | **Role** | Select Investor or Developer | Choose based on your primary use case |

3. **Password Requirements**

   Your password **must** contain:
   - ✓ At least 8 characters
   - ✓ At least one uppercase letter (A-Z)
   - ✓ At least one lowercase letter (a-z)
   - ✓ At least one number (0-9)
   - ✓ At least one special character (!@#$%^&*()_+)

   > **Pro Tip**: Click the **wand icon** (✨) next to the password field to automatically generate a strong, secure password that meets all requirements. Make sure to save this password securely!

4. **Select Your Role**

   | Role | Best For | Can Do |
   |------|----------|--------|
   | **Investor** | Those looking to fund projects | Browse projects, request access, invest in projects, track portfolio |
   | **Developer** | Those with projects seeking funding | Create projects, submit for review, manage project lifecycle |

5. **Submit Registration**
   - Review the Terms of Service and Privacy Policy
   - Click **Create Account**
   - You'll be redirected to the email verification page

![Registration Page](/docs/screenshots/registration_page.png)

### 2.4 Email Verification

Email verification is required to access all platform features.

#### Verification Process

1. **Check Your Email**
   - Look for an email from CFP with subject: "Verify Your Email"
   - Check spam/junk folders if not in inbox
   - Email is typically sent within 1-2 minutes

2. **Click Verification Link**
   - Open the email and click the verification button/link
   - The link expires after 24 hours

3. **Confirmation**
   - You'll be redirected to the platform with a success message
   - Your email is now verified and all features are unlocked

#### If You Don't Receive the Email

1. Wait 5 minutes and check spam/junk folders
2. Add CFP's email domain to your trusted senders
3. Try registering again with a different email
4. Contact support if issues persist

> **Important**: Without email verification, you cannot:
> - Submit investment requests
> - Create or submit projects
> - Access restricted project content
> - Perform any financial transactions

### 2.5 Login & Authentication

#### Standard Login

1. Navigate to the **Login** page
2. Enter your registered **email address**
3. Enter your **password**
4. Click **Sign In**

#### After Successful Login

Based on your role, you'll be redirected to:
- **Investors** → Investor Dashboard
- **Developers** → Developer Dashboard
- **Admins** → Admin Dashboard

#### Login Troubleshooting

| Issue | Solution |
|-------|----------|
| Wrong password | Use "Forgot password?" to reset |
| Account not found | Verify email address or register |
| Unverified email | Check email for verification link |
| Session expired | Log in again |

![Login Page](/docs/screenshots/login_page.png)

### 2.6 Password Recovery

If you forget your password, you can reset it easily.

#### Password Reset Process

1. **Initiate Reset**
   - Go to the Login page
   - Click **Forgot password?**

2. **Enter Your Email**
   - Type your registered email address
   - Click **Send Reset Link**

3. **Check Your Email**
   - Look for the password reset email
   - Click the reset link (expires in 1 hour)

4. **Create New Password**
   - Enter your new password (must meet all requirements)
   - Confirm the new password
   - Click **Reset Password**

5. **Login with New Password**
   - Return to login page
   - Sign in with your new credentials

### 2.7 Understanding the Interface

#### Global Navigation Elements

| Element | Location | Function |
|---------|----------|----------|
| **Logo** | Top-left | Click to return to homepage/dashboard |
| **Main Navigation** | Top/Sidebar | Access main platform sections |
| **Search Bar** | Varies by page | Search projects, users, etc. |
| **Notifications Bell** | Top-right | View and manage notifications |
| **User Avatar** | Top-right | Access profile, settings, logout |
| **Theme Toggle** | Top-right | Switch between light/dark mode |

#### Dashboard Layout

All dashboards follow a consistent layout:
- **Statistics Cards**: Key metrics at the top
- **Charts/Graphs**: Visual data representation
- **Quick Actions**: Common actions easily accessible
- **Data Tables**: Detailed information in table format
- **Recent Activity**: Latest updates and changes

---

## 3. Platform Roles

### Role Comparison Table

| Capability | Admin | Developer | Investor |
|------------|:-----:|:---------:|:--------:|
| View Public Projects | ✓ | ✓ | ✓ |
| View Project Details | ✓ | ✓ | ✓ |
| Create Projects | ✗ | ✓ | ✗ |
| Submit Projects for Review | ✗ | ✓ | ✗ |
| Edit Own Projects | ✗ | ✓ | ✗ |
| Request Project Edits | ✗ | ✓ | ✗ |
| Request Project Archive | ✗ | ✓ | ✗ |
| Review & Approve Projects | ✓ | ✗ | ✗ |
| Request Investment | ✗ | ✗ | ✓ |
| Process Investment Requests | ✓ | ✗ | ✗ |
| Make Payments | ✗ | ✗ | ✓ |
| View Portfolio | ✗ | ✗ | ✓ |
| Track Investments | ✗ | ✗ | ✓ |
| Request Access to Restricted Content | ✗ | ✗ | ✓ |
| Approve/Reject Access Requests | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| View Audit Logs | ✓ | ✗ | ✗ |
| View Project Ledger | ✓ | ✗ | ✗ |
| Use Favorites | ✗ | ✗ | ✓ |
| Use Compare Feature | ✗ | ✗ | ✓ |
| View Wallet | ✗ | ✗ | ✓ |
| Receive Notifications | ✓ | ✓ | ✓ |
| Update Profile | ✓ | ✓ | ✓ |

### Role Descriptions

#### Investor Role

Investors are users who fund projects by purchasing shares. Key responsibilities include:

- **Research**: Thoroughly review projects before investing
- **Due Diligence**: Request and review restricted content when needed
- **Investment Management**: Track and manage portfolio
- **Communication**: Respond to project updates

#### Developer Role

Developers are project creators seeking funding. Key responsibilities include:

- **Project Creation**: Create compelling project listings
- **Documentation**: Provide complete and accurate project information
- **Transparency**: Maintain honest communication with investors
- **Updates**: Keep investors informed of project progress

#### Administrator Role

Administrators oversee platform operations. Key responsibilities include:

- **Review**: Evaluate project submissions for quality and compliance
- **Access Control**: Manage investor access to restricted content
- **Investment Processing**: Review and process investment requests
- **User Management**: Monitor and manage user accounts
- **Compliance**: Ensure platform policies are followed

### Changing Your Role

Roles are assigned during registration. To change your role:

1. Contact platform administrators via support
2. Provide reason for role change request
3. Admin will review and process the request
4. You'll be notified of the decision

> **Note**: Role changes may require additional verification.

---

## 4. Investor Guide

### 4.1 Investor Dashboard

The Investor Dashboard is your central hub for portfolio management and investment tracking.

#### Dashboard Overview

Upon login, you'll see a comprehensive dashboard with the following sections:

**Statistics Cards (Top Row):**

| Card | Description | Calculation |
|------|-------------|-------------|
| **Portfolio Value** | Current total value of active investments | Sum of (shares × current price) for active investments |
| **Total Invested** | Cumulative amount invested | Sum of all completed investment amounts |
| **Active Investments** | Number of current positions | Count of investments with status "COMPLETED" |
| **Active Projects** | Unique projects invested in | Count of distinct projects in active portfolio |
| **Total Shares Owned** | Sum of all shares | Total shares across all active investments |

**Portfolio Allocation Chart:**

A pie chart showing your investment distribution across different projects:
- Hover over segments to see exact amounts
- Colors represent different projects
- Click segments to navigate to project details

**Investment Timeline Chart:**

A line chart displaying your investment history:
- X-axis: Time (months)
- Y-axis: Investment amounts
- Shows cumulative investment growth over time
- Identifies trends with trend indicators (↑ or ↓)

**Quick Stats:**

- **Favorites Count**: Projects saved for later
- **Compare List Count**: Projects in comparison queue
- **Recent Activity**: Latest investment actions

**Recent Investments Table:**

| Column | Description |
|--------|-------------|
| Project | Project name with thumbnail |
| Shares | Number of shares owned |
| Amount | Total investment amount |
| Status | Current investment status |
| Date | Investment date |

![Investor Dashboard](/docs/screenshots/investor_dashboard.png)

### 4.2 Browsing Projects

The Projects page is your gateway to discovering investment opportunities.

#### Accessing Projects

- From Dashboard: Click **Browse Projects** or **Projects** in navigation
- From Homepage: Click **Browse Projects** button
- Direct URL: Navigate to `/projects`

#### Search and Filtering

**Search Bar:**
- Real-time search as you type
- Searches project titles and descriptions
- Minimum 2 characters to trigger search
- 300ms debounce for performance

**Category Filter:**

| Category | Description |
|----------|-------------|
| All | Show all projects |
| Technology | Software, hardware, IT solutions |
| Real Estate | Property, construction, development |
| Healthcare | Medical, biotech, health services |
| Energy | Renewable, oil & gas, utilities |
| Agriculture | Farming, food production, agtech |
| Manufacturing | Industrial, production facilities |
| Retail | Consumer goods, e-commerce |
| Other | Projects not fitting other categories |

**Advanced Filters:**

Click the **Filter** icon to access:
- **Minimum Value**: Filter projects above a certain value
- **Maximum Value**: Filter projects below a certain value
- **Status**: Show only projects with specific funding status

**Sorting Options:**

| Sort Option | Description |
|-------------|-------------|
| Newest | Most recently created first |
| Oldest | Earliest created first |
| Highest Value | Highest total value first |
| Lowest Value | Lowest total value first |
| Most Funded | Highest funding percentage first |
| Ending Soon | Closest to deadline first |

**View Modes:**
- **Grid View**: Card-based layout (default)
- **List View**: Compact table layout

#### Understanding Project Cards

Each project card displays essential information at a glance:

| Element | Description |
|---------|-------------|
| **Thumbnail** | Project's primary image |
| **Title** | Project name (click to view details) |
| **Short Description** | Brief project summary |
| **Category Badge** | Color-coded category indicator |
| **Status Badge** | Current project status (Approved, Funding, etc.) |
| **Funding Progress** | Visual bar showing % of shares sold |
| **Per-Share Price** | Cost of one share |
| **Days Remaining** | Time until funding deadline |
| **Invested Badge** | Shows if you've already invested (green badge) |

#### Card Action Icons

| Icon | Action | Description |
|------|--------|-------------|
| ❤️ Heart | Favorite | Save project for later (filled = favorited) |
| ⚖️ Compare | Compare | Add to comparison list (max 4 projects) |

#### Infinite Scroll

- Projects load automatically as you scroll down
- Loading indicator shows when fetching more projects
- "No more projects" message when all are loaded

### 4.3 Project Details

The project detail page provides comprehensive information organized in tabs.

#### Accessing Project Details

- Click any project card
- Use the project link from favorites or investments
- Direct URL: `/projects/{project-id}`

#### Header Section

At the top of every project detail page:

| Element | Description |
|---------|-------------|
| **Back Button** | Return to previous page |
| **Project Title** | Full project name |
| **Category Badge** | Project category |
| **Status Badge** | Current status |
| **Favorite Button** | Add/remove from favorites |
| **Compare Button** | Add/remove from compare list |

#### Overview Tab

**Image Gallery:**
- Carousel with navigation arrows
- Click any image to open fullscreen lightbox
- Zoom and pan controls in lightbox
- Image counter shows current position

**Project Description:**
- Full detailed description
- May include formatting and sections

**Key Metrics Cards:**

| Metric | Description |
|--------|-------------|
| **Total Value** | Project's funding goal |
| **Per Share Price** | Cost per share |
| **Total Shares** | Number of available shares |
| **Shares Sold** | Shares already purchased |
| **Remaining Shares** | Shares still available |
| **Funding Progress** | Percentage funded |
| **Start Date** | When funding began |
| **End Date** | Funding deadline |
| **Days Remaining** | Time left to invest |

**Funding Progress Bar:**
- Visual representation of funding status
- Shows sold shares vs. remaining shares
- Color-coded status indicator

**Investment Actions:**

| Button | Condition | Action |
|--------|-----------|--------|
| **Request to Invest** | No pending request | Submit investment request |
| **View Request Status** | Request pending | Check request status |
| **Proceed to Payment** | Request approved | Complete payment |
| **View Investment** | Already invested | See investment details |

#### Restricted Tab

For projects with restricted content, this tab shows protected information:

**Before Access Approved:**
- List of restricted sections (locked icons)
- "Request Access" button
- Access request status (if request exists)

**After Access Approved:**
| Section | Content |
|---------|---------|
| **Financial Projections** | Revenue forecasts, financial models, projections |
| **Business Plan** | Detailed business strategy and execution plan |
| **Team Details** | Information about founders, team members, advisors |
| **Legal Documents** | Contracts, terms, compliance documentation |
| **Risk Assessment** | Identified risks and mitigation strategies |

#### 3D Model Tab

For projects with 3D models:

**Viewer Controls:**

| Control | Desktop | Mobile |
|---------|---------|--------|
| **Rotate** | Left-click + drag | Single finger drag |
| **Zoom** | Scroll wheel | Pinch gesture |
| **Pan** | Right-click + drag | Two finger drag |
| **Reset** | Click reset button | Click reset button |

**Viewer Features:**
- Auto-rotate toggle
- Fullscreen mode
- Model information overlay

### 4.4 Requesting Access to Restricted Content

Many projects protect sensitive information behind access requests.

#### Why Access Control?

- Protects confidential business information
- Ensures only serious investors see sensitive data
- Maintains competitive advantage for developers
- Creates commitment from potential investors

#### Requesting Access - Step by Step

1. **Navigate to Restricted Tab**
   - Open project details
   - Click "Restricted" tab
   - View locked content sections

2. **Initiate Request**
   - Click **Request Access** button
   - Access request dialog opens

3. **Complete Request Form**

   | Field | Required | Description |
   |-------|----------|-------------|
   | **Message** | Optional | Explain your interest in the project |
   | **Confirmation** | Required | Acknowledge request terms |

4. **Submit Request**
   - Click **Submit Request**
   - Confirmation toast appears
   - Status changes to "Pending"

5. **Wait for Review**
   - Admin reviews your request
   - You receive notification when decided
   - Check request status anytime

#### Access Request Statuses

| Status | Icon | Description | Next Steps |
|--------|------|-------------|------------|
| **Pending** | 🕐 | Awaiting admin review | Wait for decision |
| **Approved** | ✅ | Access granted | View restricted content |
| **Rejected** | ❌ | Access denied | Review admin note, may reapply |
| **Revoked** | 🚫 | Access removed | Contact admin if questions |

#### After Approval

Once approved:
1. Restricted tab unlocks automatically
2. All protected sections become visible
3. Access persists until revoked
4. Notification confirms access granted

### 4.5 Investment Process

CFP uses a multi-step investment workflow to ensure security and compliance.

#### Investment Workflow Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Request   │ → │   Admin     │ → │   Payment   │ → │  Complete   │
│ Investment  │    │   Review    │    │  Process    │    │ Investment  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      ↓                  ↓                  ↓                  ↓
   REQUESTED         APPROVED/          PROCESSING        COMPLETED
                     REJECTED
```

#### Step 1: Request Investment

**Prerequisites:**
- Verified email account
- Logged in as Investor
- Project status is "Approved" or actively funding
- Shares are available

**Process:**

1. **Navigate to Project**
   - Browse to desired project
   - Click to open project details

2. **Initiate Investment Request**
   - Click **Request to Invest** button
   - Investment request dialog opens

3. **Configure Investment**

   | Field | Description | Validation |
   |-------|-------------|------------|
   | **Shares** | Number of shares to purchase | Min: 1, Max: Remaining shares |
   | **Note** | Message for admin (optional) | Max 500 characters |
   | **Confirmation** | Acknowledge terms | Required checkbox |

4. **Review Summary**
   - Shares requested: X shares
   - Per share price: $Y
   - **Total Amount**: $X × $Y = $Total

5. **Submit Request**
   - Click **Submit Request**
   - Status changes to "REQUESTED"
   - Notification sent to admin

#### Step 2: Admin Review

Your request is reviewed by a platform administrator:

**What Admins Consider:**
- Investor profile and history
- Investment amount appropriateness
- Project availability and status
- Compliance requirements

**Possible Outcomes:**

| Decision | Result | Your Action |
|----------|--------|-------------|
| **Approved** | Request approved with expiration date | Proceed to payment |
| **Rejected** | Request denied with note | Review feedback, may resubmit |

**Approval Expiration:**
- Approved requests have a payment deadline (typically 7 days)
- If not paid by deadline, request expires
- Expired requests require new submission

#### Step 3: Payment

Once approved, complete your investment:

1. **Access Payment**
   - Click notification link, OR
   - Navigate to project → **Proceed to Payment**, OR
   - Go to Requests page → Click **Pay**

2. **Review Investment**
   - Verify share count (as approved)
   - Confirm total amount
   - Check project details

3. **Select Payment Method**

   | Method | Description | Processing |
   |--------|-------------|------------|
   | **Credit/Debit Card** | Visa, Mastercard, etc. | Instant |
   | **Bank Transfer** | Direct bank payment | 1-3 business days |
   | **Digital Wallet** | Platform wallet balance | Instant |

4. **Complete Payment**
   - Enter payment details
   - Review final summary
   - Click **Confirm Payment**
   - Wait for processing

5. **Payment Processing**
   - Status changes to "PROCESSING"
   - Admin confirms payment receipt
   - Status changes to "COMPLETED"

#### Step 4: Investment Confirmation

After successful payment:

- **Notification**: Confirmation notification sent
- **Portfolio Updated**: Investment appears in your portfolio
- **Shares Allocated**: Shares added to your ownership
- **Receipt Available**: Download investment receipt

#### Investment Status Reference

| Status | Color | Description | Can Cancel? |
|--------|-------|-------------|-------------|
| **REQUESTED** | Blue | Awaiting admin approval | Yes |
| **APPROVED** | Green | Approved, awaiting payment | Yes |
| **REJECTED** | Red | Denied by admin | N/A |
| **EXPIRED** | Gray | Approval window passed | N/A |
| **CANCELLED** | Gray | Cancelled by investor | N/A |
| **PROCESSING** | Yellow | Payment being processed | No |
| **COMPLETED** | Green | Successfully invested | Special* |
| **WITHDRAWN** | Orange | Withdrawn from investment | N/A |
| **REFUNDED** | Orange | Amount refunded | N/A |
| **REVERSED** | Red | Transaction reversed | N/A |

*Completed investments may be withdrawn subject to project terms.

### 4.6 Portfolio Management

Your portfolio is your collection of all investments across the platform.

#### Portfolio Dashboard Metrics

| Metric | Description |
|--------|-------------|
| **Total Portfolio Value** | Current value of all active investments |
| **Total Invested Amount** | Sum of all investment amounts |
| **Active Investment Value** | Value of non-withdrawn investments |
| **Withdrawn Value** | Value of withdrawn/refunded investments |
| **Total Shares** | Sum of all shares owned |
| **Active Shares** | Shares in active investments |
| **Active Projects** | Number of unique projects invested in |

#### Portfolio Visualization

**Allocation Pie Chart:**
- Shows investment distribution by project
- Percentage breakdown of portfolio
- Click segments for project details

**Performance Timeline:**
- Historical investment activity
- Monthly investment totals
- Growth trend indicators

### 4.7 My Investments Page

The Investments page provides detailed tracking of all your investments.

#### Accessing My Investments

- Navigation: Dashboard → **My Investments**
- Direct URL: `/app/investor/investments`

#### Investments Overview

**Summary Cards:**

| Card | Description |
|------|-------------|
| Total Invested | All-time investment total |
| Active Invested | Current active investments |
| Withdrawn | Withdrawn/refunded amount |
| Total Shares | All shares ever owned |
| Active Shares | Currently owned shares |

#### Investments Table

| Column | Description |
|--------|-------------|
| **Project** | Project name with thumbnail |
| **Shares** | Number of shares |
| **Amount** | Investment total |
| **Status** | Current status badge |
| **Date** | Investment date |
| **Actions** | View receipt, project link |

#### Investment Receipts

For completed investments, you can view and download receipts:

**Receipt Contains:**
- Investment ID
- Project details
- Share quantity and price
- Total amount
- Payment method
- Transaction date
- Status confirmation

**Accessing Receipts:**
1. Find investment in table
2. Click **Receipt** icon
3. Receipt dialog opens
4. Click **Download** for PDF

### 4.8 Investment Requests & Access Requests

The Requests page consolidates all pending and historical requests.

#### Investment Requests Tab

View all investment requests:

| Column | Description |
|--------|-------------|
| Project | Project name |
| Shares | Requested shares |
| Amount | Total value |
| Status | Request status |
| Submitted | Request date |
| Expires | Payment deadline (if approved) |
| Actions | Pay, Cancel, View |

**Available Actions:**

| Status | Actions |
|--------|---------|
| REQUESTED | Cancel request |
| APPROVED | Pay, Cancel |
| REJECTED | View details |
| EXPIRED | Resubmit |
| PROCESSING | View status |

#### Access Requests Tab

View all access requests:

| Column | Description |
|--------|-------------|
| Project | Project name |
| Status | Request status |
| Submitted | Request date |
| Admin Note | Feedback (if any) |
| Actions | Revoke (if approved) |

**Available Actions:**

| Status | Actions |
|--------|---------|
| PENDING | Wait |
| APPROVED | Revoke access |
| REJECTED | Resubmit |
| REVOKED | Resubmit |

### 4.9 Favorites & Compare

#### Favorites Feature

Save interesting projects for later review.

**Adding to Favorites:**
1. Click the ❤️ heart icon on any project card
2. Or click heart in project detail header
3. Heart fills to indicate favorited

**Viewing Favorites:**
- Navigation: **Favorites** in sidebar
- Shows all favorited projects in card grid
- Same filtering/sorting as main projects page

**Removing from Favorites:**
- Click filled heart icon
- Project removed from favorites
- Can re-add anytime

**Favorites Page Features:**
- Grid view of favorited projects
- Quick access to project details
- Shows if already invested
- Funding progress visible

#### Compare Feature

Compare up to 4 projects side-by-side.

**Adding to Compare:**
1. Click ⚖️ compare icon on project card
2. Icon changes to indicate in compare list
3. Maximum 4 projects allowed

**Viewing Comparison:**
- Navigation: **Compare** in sidebar
- Opens comparison table view

**Comparison Table Shows:**

| Metric | Description |
|--------|-------------|
| Project Image | Thumbnail of each project |
| Title | Project name |
| Category | Project category |
| Status | Current status |
| Per Share Price | Cost per share (best highlighted) |
| Total Value | Funding goal |
| Funding Progress | % funded (best highlighted) |
| Days Remaining | Time left (most highlighted) |
| Access Status | Your access level |
| Comparison Score | Normalized score |

**Comparison Features:**
- Best values highlighted in green
- Normalized scores for objective comparison
- Direct links to project details
- Quick invest button (if eligible)
- Remove individual projects
- Clear all button

**Removing from Compare:**
- Click X on project column header
- Or click compare icon again on original card

### 4.10 Wallet

Your platform wallet tracks all financial transactions.

#### Wallet Overview

- Navigation: **Wallet** in sidebar
- Shows current balance and transaction history

#### Wallet Balance

**Balance Sources:**
- Investment refunds
- Withdrawn investment returns
- Reversed transaction credits

**Using Wallet Balance:**
- Can apply to future investments
- Available as payment method

#### Transaction History

| Column | Description |
|--------|-------------|
| Type | Transaction type (Refund, Withdrawal, etc.) |
| Project | Associated project (if applicable) |
| Amount | Transaction value |
| Date | Transaction timestamp |

**Transaction Types:**

| Type | Description |
|------|-------------|
| REFUND | Investment amount returned |
| WITHDRAWAL | Funds withdrawn from investment |
| REVERSAL | Transaction reversed |
| CREDIT | Funds added to wallet |
| DEBIT | Funds used from wallet |

---

## 5. Developer Guide

### 5.1 Developer Dashboard

The Developer Dashboard provides a comprehensive view of your project portfolio and funding performance.

#### Dashboard Statistics Cards

| Card | Description | Calculation |
|------|-------------|-------------|
| **Total Projects** | All projects created | Count of all your projects |
| **Funds Secured** | Total capital raised | Sum of (shares sold × price) across approved projects |
| **Total Investors** | Unique investors | Count of distinct investors in your projects |
| **Shares Sold** | Total shares purchased | Sum of sold shares across all projects |

#### Dashboard Charts

**Funding Timeline Chart:**
- Area chart showing funding received over time
- X-axis: Months
- Y-axis: Funding amount
- Color gradient for visual appeal
- Hover for exact values

**Shares by Project Chart:**
- Horizontal bar chart
- Shows sold vs. remaining shares per project
- Stacked bars for comparison
- Project names on Y-axis

#### Project Quick View Table

| Column | Description |
|--------|-------------|
| Project | Project name |
| Status | Current status badge |
| Shares Sold | X / Total format |
| Funding Progress | Visual progress bar |
| Actions | Quick links |

#### Quick Actions

| Action | Description |
|--------|-------------|
| Create New Project | Start a new project |
| View All Projects | Open projects list |
| Recent Activity | View latest updates |

![Developer Dashboard](/docs/screenshots/developer_dashboard.png)

### 5.2 Creating a New Project

The project creation form guides you through all required information.

#### Accessing Project Creation

- From Dashboard: Click **Create New Project**
- From Projects: Click **New Project** button
- Direct URL: `/app/developer/projects/new`

#### Project Creation Workflow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Draft   │ → │  Submit  │ → │  Review  │ → │ Approved │
│  Create  │    │  Review  │    │  Admin   │    │  Live!   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

#### Form Sections

The project form is organized into logical sections:

1. **Basic Information**
2. **Funding Configuration**
3. **Timeline**
4. **Media**
5. **3D Model (Optional)**
6. **Restricted Fields (Optional)**

### 5.3 Project Form Fields Detailed

#### Basic Information Section

| Field | Requirements | Description |
|-------|--------------|-------------|
| **Title** | 5-100 characters | Clear, descriptive project name |
| **Short Description** | 20-200 characters | Brief summary for cards/listings |
| **Full Description** | 50-2000 characters | Detailed project explanation |
| **Category** | Required selection | Project classification |

**Category Options:**

| Category | Best For |
|----------|----------|
| Technology | Software, apps, hardware, IT |
| Real Estate | Property, development, construction |
| Healthcare | Medical, biotech, health services |
| Energy | Renewable, utilities, oil & gas |
| Agriculture | Farming, food tech, agribusiness |
| Manufacturing | Industrial, production, fabrication |
| Retail | Consumer goods, e-commerce, shops |
| Other | Projects not fitting above categories |

#### Funding Configuration Section

| Field | Validation | Description |
|-------|------------|-------------|
| **Total Project Value** | $10,000 - $100,000,000 | Total funding goal |
| **Total Shares** | 100 - 1,000,000 | Number of shares to issue |
| **Per-Share Price** | Auto-calculated | = Total Value ÷ Total Shares |

**Funding Strategy Tips:**

| Strategy | Shares | Price/Share | Best For |
|----------|--------|-------------|----------|
| Low barrier | More shares | Lower price | Attract more investors |
| Premium positioning | Fewer shares | Higher price | Serious investors |
| Balanced | Moderate | Moderate | General appeal |

**Example Configurations:**

| Total Value | Shares | Price/Share |
|-------------|--------|-------------|
| $100,000 | 1,000 | $100 |
| $100,000 | 10,000 | $10 |
| $1,000,000 | 10,000 | $100 |
| $1,000,000 | 100,000 | $10 |

#### Timeline Section

| Field | Description |
|-------|-------------|
| **Start Date** | When funding campaign begins |
| **End Date** | Funding deadline |
| **Duration** | Auto-calculated (days between dates) |

**Timeline Considerations:**
- Minimum recommended duration: 30 days
- Maximum recommended duration: 180 days
- Consider market timing and readiness
- Cannot change dates after approval without edit request

#### Media Section

**Project Images:**

| Requirement | Specification |
|-------------|---------------|
| **Quantity** | Up to 3 images |
| **File Size** | Maximum 5MB each |
| **Formats** | PNG, JPEG, JPG |
| **First Image** | Becomes thumbnail |

**Upload Methods:**
- Drag and drop files
- Click to browse files
- Paste from clipboard

**Image Management:**
- Click X to remove image
- Drag to reorder (first = thumbnail)
- Preview before upload

**Image Recommendations:**

| Image | Purpose | Suggested |
|-------|---------|-----------|
| Image 1 | Main thumbnail | Project logo or hero image |
| Image 2 | Supporting | Product/service showcase |
| Image 3 | Additional | Team, location, or details |

#### 3D Model Section (Optional)

Toggle **Has 3D Model** to enable:

| Field | Specification |
|-------|---------------|
| **File Format** | GLB or GLTF |
| **File Size** | Maximum 5MB |
| **Visibility** | Public or Restricted |

**3D Model Best Practices:**
- Optimize model for web viewing
- Keep polygon count reasonable
- Include textures within GLB
- Test model before upload

#### Restricted Fields Section (Optional)

Toggle **Has Restricted Fields** to enable protected content:

| Field | Max Length | Content Type |
|-------|------------|--------------|
| **Financial Projections** | 5,000 chars | Revenue forecasts, P&L projections, financial models |
| **Business Plan** | 5,000 chars | Strategy, execution plan, market analysis |
| **Team Details** | 3,000 chars | Founders, key team, advisors, experience |
| **Legal Documents** | 5,000 chars | Terms, contracts, compliance info |
| **Risk Assessment** | 3,000 chars | Identified risks, mitigation plans |

**Why Use Restricted Fields?**
- Protect sensitive competitive information
- Share detailed data only with committed investors
- Create access-based investor engagement
- Maintain confidentiality until appropriate

### 5.4 Managing Projects

#### My Projects Page

Access all your projects:
- Navigation: **My Projects** in sidebar
- View projects in list or grid format
- Filter by status
- Search by name

#### Project Status Lifecycle

| Status | Description | Available Actions |
|--------|-------------|-------------------|
| **DRAFT** | Initial creation, not submitted | Edit, Delete, Submit for Review |
| **PENDING_REVIEW** | Submitted, awaiting admin | View, (limited editing) |
| **APPROVED** | Live for investments | View, Request Edit, Request Archive |
| **REJECTED** | Not approved | View, Edit, Resubmit |
| **NEEDS_CHANGES** | Requires modifications | View, Edit, Resubmit |
| **ARCHIVED** | No longer active | View only |

#### Project Actions by Status

**Draft Projects:**
- ✏️ Edit all fields
- 🗑️ Delete project
- 📤 Submit for review

**Pending Review:**
- 👁️ View details
- ⏳ Wait for decision

**Approved Projects:**
- 👁️ View details and statistics
- 📝 Request edit (admin approval required)
- 📦 Request archive

**Rejected/Needs Changes:**
- 👁️ View feedback
- ✏️ Make requested changes
- 📤 Resubmit for review

### 5.5 Project Media Management

#### Accessing Media Management

1. Navigate to **My Projects**
2. Select a project
3. Click **Manage Media**

#### Image Management

**Uploading Images:**
1. Click upload area or drag files
2. Preview appears
3. Set order (first = thumbnail)
4. Save changes

**Reordering Images:**
- Drag and drop to reorder
- First position = main thumbnail

**Deleting Images:**
- Click X on image
- Confirm deletion
- Cannot undo!

#### 3D Model Management

**Uploading Model:**
1. Toggle 3D model enabled
2. Select GLB/GLTF file
3. Set visibility (public/restricted)
4. Preview in viewer
5. Save changes

**Replacing Model:**
- Click remove on existing model
- Upload new model
- Configure visibility
- Save changes

### 5.6 Submitting for Review

When your project is complete and ready for funding:

#### Pre-Submission Checklist

✓ All required fields completed
✓ Description is comprehensive
✓ Images uploaded (recommended)
✓ Funding configuration finalized
✓ Timeline set appropriately
✓ Restricted fields added (if applicable)

#### Submission Process

1. **Open Project**
   - Go to My Projects → Select project

2. **Review Details**
   - Verify all information is accurate
   - Preview how investors will see it

3. **Submit**
   - Click **Submit for Review**
   - Confirm submission dialog
   - Status changes to "PENDING_REVIEW"

4. **Wait for Review**
   - Admin reviews your submission
   - Typical review time: 1-3 business days
   - You'll receive notification of decision

#### Possible Review Outcomes

| Outcome | Description | Your Action |
|---------|-------------|-------------|
| **Approved** | Project goes live | Celebrate! Monitor funding |
| **Rejected** | Not suitable for platform | Review feedback, consider revisions |
| **Needs Changes** | Minor modifications required | Make changes, resubmit |

### 5.7 Edit Requests

Once approved, projects cannot be directly edited to protect investors.

#### When to Request an Edit

- Correct typos or errors
- Update project information
- Modify funding details
- Change timeline
- Update media

#### Edit Request Process

1. **Navigate to Approved Project**
   - Go to project details

2. **Request Edit**
   - Click **Request Edit** button
   - Edit request form opens

3. **Specify Changes**
   - Describe what you want to change
   - Provide justification
   - Be specific and clear

4. **Submit Request**
   - Click Submit
   - Status: Edit request pending

5. **Admin Review**
   - Admin evaluates the request
   - Considers investor impact
   - Approves or rejects

6. **If Approved**
   - Edit window opens (limited time)
   - Make your changes
   - Changes go live immediately

### 5.8 Archive Requests

Archive projects that should no longer be active.

#### When to Archive

- Project fully funded
- Project cancelled
- Project no longer viable
- Moving to new project

#### Archive Request Process

1. Navigate to project
2. Click **Request Archive**
3. Provide archive reason
4. Submit request
5. Admin reviews and decides
6. If approved, project is archived

#### Archive Impact

- Project no longer visible to new investors
- Existing investments remain valid
- Historical data preserved
- Cannot be reversed easily

### 5.9 Tracking Your Funding

#### Funding Metrics

Monitor your project's performance:

| Metric | Description |
|--------|-------------|
| **Shares Sold** | Number of shares purchased |
| **Remaining Shares** | Available for investment |
| **Funding Progress** | Percentage of goal |
| **Total Raised** | Capital secured |
| **Investor Count** | Unique investors |
| **Days Remaining** | Until funding deadline |

#### Investor Insights

View information about your investors:
- Investment amounts
- Investment dates
- Investment status

---

## 6. Administrator Guide

### 6.1 Admin Dashboard Overview

The Admin Dashboard provides complete platform oversight.

#### Statistics Overview

**Actionable Items:**

| Stat | Description | Action |
|------|-------------|--------|
| **Pending Reviews** | Projects awaiting review | Go to Review Queue |
| **Access Requests** | Pending access requests | Go to Access Requests |
| **Investment Requests** | Pending investment requests | Go to Investment Requests |
| **Investment Approvals** | Processing investments | Go to Investment Approvals |

**Platform Metrics:**

| Stat | Description |
|------|-------------|
| **Total Users** | All registered users |
| **Total Invested** | Sum of all investments |
| **Active Invested** | Current active investments |
| **Withdrawn/Refunded** | Returned funds |

#### Dashboard Charts

**Investment Trends:**
- Area chart showing investment volume over time
- Monthly breakdown
- Trend identification

**Project Status Distribution:**
- Pie chart of projects by status
- Approved, Pending, Draft, Rejected segments
- Click for filtered view

#### Activity Panels

**Recent Access Requests:**
- Latest 4 access requests
- Quick approve/reject actions
- Link to full list

**Recent Investment Requests:**
- Latest 4 investment requests
- Quick processing actions
- Link to full list

**Pending Projects:**
- Projects awaiting review
- Quick review access

![Admin Dashboard](/docs/screenshots/admin_dashboard.png)

### 6.2 Project Review Queue

#### Accessing Review Queue

- Navigation: **Review Queue** in sidebar
- Or click stat card on dashboard

#### Review Queue Tabs

| Tab | Content |
|-----|---------|
| **Projects** | New project submissions |
| **Edit Requests** | Approved project modification requests |
| **Archive Requests** | Project archive requests |

#### Reviewing a New Project

**Information Available:**

| Section | Details |
|---------|---------|
| Basic Info | Title, descriptions, category |
| Funding | Value, shares, pricing |
| Timeline | Start date, end date, duration |
| Media | Images, 3D model |
| Restricted | Protected content (if any) |
| Developer | Submitter information |

**Review Actions:**

| Action | Result | Use When |
|--------|--------|----------|
| **Approve** | Project goes live | All criteria met |
| **Reject** | Project denied | Not suitable for platform |
| **Request Changes** | Needs modifications | Minor issues to fix |

**Review Note:**
- Required for all decisions
- Visible to developer
- Be specific and constructive

#### Reviewing Edit Requests

**Before/After Comparison:**
- Shows original content
- Shows proposed changes
- Highlights differences

**Actions:**
- Approve: Developer can make changes
- Reject: Changes not allowed

**Considerations:**
- Impact on existing investors
- Materiality of changes
- Justification provided

#### Reviewing Archive Requests

**Information Shown:**
- Project details
- Current funding status
- Existing investments
- Archive reason

**Actions:**
- Approve: Project archived
- Reject: Project remains active

### 6.3 Access Request Management

#### Access Requests Page

- Navigation: **Access Requests** in sidebar

#### Tabs

| Tab | Content |
|-----|---------|
| **Pending** | Awaiting your decision |
| **Processed** | Historical decisions |

#### Request Information

| Field | Description |
|-------|-------------|
| Investor | Requesting user |
| Project | Target project |
| Message | Investor's request message |
| Submitted | Request date |
| Status | Current status |

#### Processing Access Requests

**Actions:**

| Action | Result |
|--------|--------|
| **Approve** | Investor can view restricted content |
| **Reject** | Access denied |
| **Revoke** | Remove previously granted access |

**Admin Note:**
- Required for all decisions
- Visible to investor
- Explain reasoning

**Search and Filter:**
- Search by investor or project name
- Filter by status

### 6.4 Investment Request Processing

#### Investment Requests Page

Shows all investments with status "REQUESTED"

#### Request Information

| Field | Description |
|-------|-------------|
| Investor | Name and email |
| Project | Project title |
| Shares | Requested quantity |
| Amount | Total value |
| Submitted | Request date |
| Note | Investor's message |

#### Processing a Request

**Approval Process:**

1. Review investor information
2. Verify project has available shares
3. Click **Approve**
4. Set expiration period (default: 7 days)
5. Add admin note (optional)
6. Confirm approval

**Rejection Process:**

1. Review request details
2. Click **Reject**
3. Provide rejection reason (required)
4. Confirm rejection

**Expiration Period:**
- Sets payment deadline
- Investor must pay within this window
- Expired requests require new submission
- Recommended: 7 days

### 6.5 Investment Approvals & Payment Tracking

#### Investment Approvals Page

Shows investments with status "PROCESSING"

**Information Displayed:**

| Field | Description |
|-------|-------------|
| Investment | ID and project |
| Investor | Name and email |
| Amount | Payment amount |
| Payment Method | Selected method |
| Status | Processing status |
| Payment Date | When paid |

**Actions:**
- View payment details
- Monitor processing
- Handle issues

### 6.6 User Management

#### Users Page

Comprehensive user management interface.

#### User Statistics

| Stat | Description |
|------|-------------|
| Total Users | All platform users |
| Investors | Users with investor role |
| Developers | Users with developer role |
| Admins | Admin users |

#### User List

| Column | Description |
|--------|-------------|
| User | Name and avatar |
| Email | Contact email |
| Role | User role badge |
| Status | Active/Verified status |
| Joined | Registration date |
| Activity | Projects/Investments count |

#### Filtering

- Search by name or email
- Filter by role

#### User Details

Click user to view:
- Full profile information
- Investment history (if investor)
- Project list (if developer)
- Activity summary

### 6.7 Project Ledger

Financial tracking for all projects.

#### Ledger Overview

**Entry Types:**

| Type | Description |
|------|-------------|
| INVESTMENT | Share purchase |
| REFUND | Investment returned |
| WITHDRAWAL | Funds withdrawn |
| REVERSAL | Transaction reversed |
| PAYMENT | Payment processed |

#### Ledger Table

| Column | Description |
|--------|-------------|
| Project | Project name |
| Type | Entry type |
| Amount | Transaction value |
| Investor | Related user |
| Date | Transaction date |
| Reference | Transaction ID |

#### Filtering and Search

- Search by project name
- Filter by entry type
- Date range selection

### 6.8 Payments & Transactions

#### Payments Page

View all financial transactions.

**Transaction Information:**

| Field | Description |
|-------|-------------|
| ID | Transaction identifier |
| Investment | Related investment |
| Amount | Payment amount |
| Method | Payment method |
| Status | Transaction status |
| Date | Transaction date |

**Transaction Statuses:**

| Status | Description |
|--------|-------------|
| PENDING | Awaiting processing |
| COMPLETED | Successfully processed |
| FAILED | Payment failed |
| REFUNDED | Amount returned |

### 6.9 Audit Logs

Comprehensive activity tracking.

#### Audit Log Types

**Project Actions:**
- PROJECT_CREATED
- PROJECT_UPDATED
- PROJECT_SUBMITTED
- PROJECT_APPROVED
- PROJECT_REJECTED
- PROJECT_ARCHIVED
- PROJECT_EDIT_REQUESTED
- PROJECT_EDIT_APPROVED
- PROJECT_EDIT_REJECTED

**Access Actions:**
- ACCESS_REQUEST_CREATED
- ACCESS_REQUEST_APPROVED
- ACCESS_REQUEST_REJECTED
- ACCESS_REQUEST_REVOKED

**Investment Actions:**
- INVESTMENT_REQUESTED
- INVESTMENT_APPROVED
- INVESTMENT_REJECTED
- INVESTMENT_PROCESSING
- INVESTMENT_COMPLETED
- INVESTMENT_REFUNDED
- INVESTMENT_WITHDRAWN
- INVESTMENT_REVERSED
- INVESTMENT_EXPIRED
- INVESTMENT_CANCELLED

**Payment Actions:**
- PAYMENT_PROCESSED
- PAYMENT_REFUNDED
- PAYMENT_WITHDRAWN
- PAYMENT_REVERSED

**User Actions:**
- USER_CREATED
- USER_UPDATED
- USER_DISABLED
- USER_BANNED
- USER_UNBANNED

#### Log Entry Information

| Field | Description |
|-------|-------------|
| Timestamp | When action occurred |
| Actor | User who performed action |
| Action Type | Type of action |
| Target | Affected entity |
| Details | Additional information |

#### Filtering and Search

- Search by actor name
- Filter by action type
- Date range selection

#### Log Details Dialog

Click any log entry to view:
- Full action details
- Before/after values (if applicable)
- Related entities
- Complete metadata

### 6.10 Administrative Best Practices

#### Review Guidelines

**Project Reviews:**
1. Read all submitted content thoroughly
2. Verify funding configuration is reasonable
3. Check images for appropriateness
4. Assess project viability
5. Provide constructive feedback

**Access Requests:**
1. Consider investor's intent
2. Balance privacy and transparency
3. Respond promptly (within 24-48 hours)
4. Document reasoning

**Investment Requests:**
1. Verify investor eligibility
2. Check share availability
3. Set reasonable expiration periods
4. Monitor expired requests

#### Response Times

| Request Type | Target Response |
|--------------|-----------------|
| Project Review | 1-3 business days |
| Access Request | 24-48 hours |
| Investment Request | 24 hours |
| Edit Request | 1-2 business days |

---

## 7. Profile & Settings

### 7.1 Viewing Your Profile

Access your profile at any time:

1. Click your **avatar** in the top-right corner
2. Select **Profile** from the dropdown menu
3. Or navigate directly to `/app/profile`

### 7.2 Updating Profile Information

#### Editable Fields

| Field | Editable | Notes |
|-------|----------|-------|
| **Display Name** | ✓ | Minimum 2 characters |
| **Avatar** | ✓ | Upload new image |
| **Email** | ✗ | Cannot be changed after registration |
| **Role** | ✗ | Contact admin to change |

#### Updating Your Name

1. Open Profile page
2. Edit the **Name** field
3. Click **Save Changes**
4. Confirmation toast appears

### 7.3 Changing Your Avatar

#### Upload Process

1. Open Profile page
2. Click on your current avatar (or placeholder)
3. Select an image file from your device
4. Preview the new avatar
5. Click **Save Changes**

#### Avatar Requirements

| Requirement | Specification |
|-------------|---------------|
| **Formats** | PNG, JPEG, JPG, GIF |
| **Size** | Maximum 5MB |
| **Recommended** | Square image (1:1 ratio) |
| **Minimum** | 100x100 pixels |

### 7.4 Security Settings

#### Password Reset

To change your password:

1. Open Profile page
2. Scroll to **Security** section
3. Click **Reset Password**
4. Check your email for reset link
5. Click link and set new password

#### Password Reset Link

- Sent to your registered email
- Valid for 1 hour
- Single use only

---

## 8. Notifications

### 8.1 Notification Center

Access notifications through the bell icon (🔔) in the header.

#### Notification Badge

- Red badge shows unread count
- Badge disappears when all read
- Updates in real-time

### 8.2 Notification Types

#### For Investors

| Type | Trigger | Priority |
|------|---------|----------|
| INVESTMENT_REQUESTED | You submitted investment request | Info |
| INVESTMENT_APPROVED | Admin approved your request | Success |
| INVESTMENT_REJECTED | Admin rejected your request | Alert |
| INVESTMENT_EXPIRED | Approval window passed | Warning |
| INVESTMENT_PROCESSING | Payment being processed | Info |
| INVESTMENT_COMPLETED | Investment successful | Success |
| INVESTMENT_REFUNDED | Refund processed | Info |
| INVESTMENT_WITHDRAWN | Withdrawal processed | Info |
| INVESTMENT_REVERSED | Transaction reversed | Alert |
| ACCESS_APPROVED | Access granted to project | Success |
| ACCESS_REJECTED | Access request denied | Alert |
| ACCESS_REVOKED | Access removed | Warning |
| PAYMENT_SUCCESS | Payment confirmed | Success |
| PAYMENT_FAILED | Payment failed | Alert |

#### For Developers

| Type | Trigger | Priority |
|------|---------|----------|
| PROJECT_SUBMITTED | Project sent for review | Info |
| PROJECT_APPROVED | Project approved, now live | Success |
| PROJECT_REJECTED | Project not approved | Alert |
| PROJECT_NEEDS_CHANGES | Changes required | Warning |
| PROJECT_EDIT_REQUESTED | Edit request submitted | Info |
| PROJECT_EDIT_APPROVED | Edit request approved | Success |
| PROJECT_EDIT_REJECTED | Edit request denied | Alert |
| PROJECT_ARCHIVE_APPROVED | Archive request approved | Info |
| PROJECT_ARCHIVE_REJECTED | Archive request denied | Alert |

#### For Administrators

| Type | Trigger | Priority |
|------|---------|----------|
| NEW_ACCESS_REQUEST | New access request submitted | Action Required |
| PROJECT_SUBMITTED | New project for review | Action Required |
| INVESTMENT_REQUESTED | New investment request | Action Required |
| USER_BANNED | User ban notification | Info |

### 8.3 Managing Notifications

#### Notification Center Interface

**Tabs:**
- **All**: Every notification
- **Unread**: Only unread items

**Actions:**
| Action | How |
|--------|-----|
| Mark as Read | Click individual notification |
| Mark All as Read | Click "Mark All as Read" button |
| Navigate | Click notification to go to related page |
| Filter | Use tabs to filter by read status |

#### Notification Item Details

Each notification shows:
- Icon (color-coded by type)
- Title/Message
- Timestamp (relative: "2 hours ago")
- Read/Unread indicator (blue dot)

### 8.4 Real-Time Updates

Notifications update automatically:
- No page refresh needed
- Badge count updates instantly
- New notifications appear at top
- 30-second refresh interval for dashboard

---

## 9. Platform Features

### 9.1 Dark Mode

CFP includes a complete dark theme for comfortable viewing in low-light environments.

#### Enabling Dark Mode

**Method 1: Theme Toggle**
1. Find the theme icon in the header (sun/moon)
2. Click to toggle between light and dark

**Method 2: System Preference**
- Platform automatically detects OS preference
- Follows your system's dark/light setting

#### Dark Mode Features

- All pages fully styled for dark mode
- Charts and graphs adapt to dark theme
- Images maintain visibility
- Consistent color scheme throughout

#### Theme Persistence

- Your preference is saved automatically
- Applies across all sessions
- Per-browser preference

![Investor Dashboard Dark Mode](/docs/screenshots/investor_dashboard_dark_mode.png)

### 9.2 3D Model Viewer

Projects can include interactive 3D models for immersive visualization.

#### Supported Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| GL Transmission Format Binary | .glb | Recommended |
| GL Transmission Format | .gltf | With separate assets |

#### Viewer Controls

| Action | Desktop | Mobile | Touch |
|--------|---------|--------|-------|
| **Rotate** | Left-click + Drag | One finger drag | Swipe |
| **Zoom** | Scroll wheel | Pinch | Pinch |
| **Pan** | Right-click + Drag | Two finger drag | Two finger swipe |
| **Reset** | Reset button | Reset button | Reset button |

#### Viewer Features

| Feature | Description |
|---------|-------------|
| **Auto-Rotate** | Toggle automatic rotation |
| **Fullscreen** | Expand to full screen |
| **Zoom Controls** | + / - buttons |
| **Reset View** | Return to initial position |
| **Loading Indicator** | Shows while model loads |

#### Viewer Requirements

- WebGL-enabled browser
- Hardware acceleration enabled
- Sufficient GPU memory for complex models

### 9.3 Image Lightbox

View project images in fullscreen detail.

#### Opening Lightbox

- Click any project image in the gallery
- Image opens in fullscreen overlay

#### Lightbox Controls

| Control | Function |
|---------|----------|
| **Left/Right Arrows** | Navigate between images |
| **Close (X)** | Exit lightbox |
| **Zoom In (+)** | Enlarge image |
| **Zoom Out (-)** | Reduce image |
| **Reset** | Return to original size |
| **Keyboard Arrows** | Navigate images |
| **Escape** | Close lightbox |

### 9.4 Responsive Design

CFP works seamlessly across all device sizes.

#### Breakpoints

| Size | Width | Layout |
|------|-------|--------|
| Mobile | < 640px | Single column, hamburger menu |
| Tablet | 640px - 1024px | Adaptive columns |
| Desktop | > 1024px | Full sidebar, multi-column |

#### Mobile Optimizations

- Touch-friendly buttons and inputs
- Collapsible navigation
- Optimized image loading
- Swipe gestures for carousels

### 9.5 Search & Filtering

Powerful search and filter capabilities throughout the platform.

#### Global Search

- Available on project browsing pages
- Real-time results as you type
- Searches titles and descriptions
- 300ms debounce for performance

#### Advanced Filters

| Filter Type | Options |
|-------------|---------|
| **Category** | All categories available |
| **Status** | By project status |
| **Value Range** | Min and max value |
| **Sort** | Multiple sort options |

### 9.6 Data Export

Download records for your documentation.

#### Investment Receipts

Available for completed investments:
1. Go to My Investments
2. Find the investment
3. Click Receipt icon
4. View or download PDF

---

## 10. Security & Privacy

### 10.1 Data Protection

CFP implements comprehensive data protection measures.

#### Data Storage

| Data Type | Protection |
|-----------|------------|
| Passwords | Bcrypt hashing, never stored in plain text |
| Personal Info | Encrypted at rest |
| Financial Data | PCI-compliant storage |
| Session Data | Secure cookies with HTTPOnly flag |

#### Data Access

- Role-based access control
- Minimum privilege principle
- Audit logging of data access

### 10.2 Authentication Security

#### JWT Token Security

- Short-lived access tokens
- Secure refresh token rotation
- Token encryption

#### Session Management

- Automatic session timeout
- Secure cookie settings
- CSRF protection

### 10.3 Transaction Security

#### Payment Security

- PCI DSS compliance
- Encrypted transmission (TLS 1.3)
- Fraud detection measures

#### Investment Verification

- Multi-step approval process
- Admin oversight required
- Expiration windows for approvals

---

## 11. Troubleshooting & FAQ

### 11.1 Account Issues

**Q: I can't log in to my account.**

A: Try these steps:
1. Verify your email address is correct
2. Use "Forgot password?" to reset
3. Check if your account is verified
4. Clear browser cookies and try again
5. Try a different browser

**Q: I'm not receiving any emails from the platform.**

A: Check the following:
1. Look in spam/junk folder
2. Add our domain to trusted senders
3. Verify email address is correct
4. Check if email provider is blocking

**Q: How do I change my email address?**

A: Email addresses cannot be changed after registration for security reasons. Contact support if you need assistance.

**Q: I forgot which email I registered with.**

A: Contact support with any identifying information you can provide. You may need to create a new account.

### 11.2 Investment Issues

**Q: Why was my investment request rejected?**

A: Investment requests may be rejected for various reasons:
- Insufficient shares available
- Project eligibility requirements not met
- Compliance concerns
- Check the admin's note for specific reasons

**Q: My approved investment expired. Can I recover it?**

A: No, expired approvals cannot be recovered. You must submit a new investment request. To prevent this:
- Note the expiration date when approved
- Set a reminder to complete payment
- Complete payment as soon as possible

**Q: How long does admin approval take?**

A: Typical response times:
- Investment requests: 24 hours
- Access requests: 24-48 hours
- Results may vary based on volume

**Q: Can I cancel an investment request?**

A: Yes, you can cancel requests with these statuses:
- REQUESTED: Yes, cancel anytime
- APPROVED: Yes, before payment
- PROCESSING: No, in payment flow
- COMPLETED: Subject to withdrawal terms

**Q: How do withdrawals work?**

A: Withdrawal eligibility depends on:
- Project terms and conditions
- Investment status
- Platform policies
- Check specific project terms before investing

### 11.3 Project Issues

**Q: Why was my project rejected?**

A: Projects may be rejected for:
- Incomplete information
- Unrealistic funding goals
- Policy violations
- Quality concerns
- Review the admin's feedback carefully

**Q: How can I edit my approved project?**

A: For approved projects:
1. Submit an Edit Request
2. Explain what changes you need
3. Wait for admin approval
4. Make changes within the edit window

**Q: What happens if my project doesn't reach full funding?**

A: This depends on platform and project policies. Consult Terms of Service and specific project terms.

**Q: How long does project review take?**

A: Typical review time is 1-3 business days, depending on:
- Application volume
- Project complexity
- Required verification

### 11.4 Technical Issues

**Q: The platform is loading slowly.**

A: Try these solutions:
1. Check your internet connection
2. Clear browser cache
3. Disable browser extensions
4. Try a different browser
5. Refresh the page

**Q: The 3D model viewer isn't working.**

A: Ensure your browser supports WebGL:
1. Check if WebGL is enabled in settings
2. Update your graphics drivers
3. Try a different browser (Chrome recommended)
4. Enable hardware acceleration
5. Check if the model file is valid

**Q: Charts and graphs aren't displaying.**

A: Try these fixes:
1. Enable JavaScript
2. Clear browser cache
3. Disable ad blockers
4. Try a different browser

**Q: Images aren't loading.**

A: Check the following:
1. Internet connection stability
2. Browser image settings
3. Clear cache and reload
4. Check if you're behind a firewall

**Q: I'm getting logged out frequently.**

A: This might be due to:
1. Browser cookie settings
2. Session timeout (normal after inactivity)
3. Multiple devices logged in
4. Browser security extensions

### 11.5 Getting Help

If you can't find an answer to your question:

1. **Review this Manual**: Use Ctrl/Cmd+F to search
2. **Check Legal Documents**: Terms of Service, Privacy Policy
3. **Contact Support**: Reach out to platform administrators
4. **Community Forums**: If available

---

## 12. Legal Information

### Accessing Legal Documents

Legal documents are accessible from the platform footer:

| Document | Location | Content |
|----------|----------|---------|
| Terms of Service | Footer link | Usage terms, user responsibilities |
| Privacy Policy | Footer link | Data handling, user rights |
| Cookie Policy | Footer link | Cookie usage, preferences |
| Risk Disclosure | Footer link | Investment risks, disclaimers |

### Terms of Service Summary

Key points (read full document for complete terms):
- Account responsibilities
- Acceptable use policies
- Intellectual property rights
- Limitation of liability
- Dispute resolution

### Privacy Policy Summary

Key points (read full document for complete policy):
- What data we collect
- How we use your data
- Data sharing policies
- Your privacy rights
- Data retention periods

### Risk Disclosure Summary

**Important**: All investments carry risk.
- Past performance doesn't guarantee future results
- You may lose some or all of your investment
- Conduct your own due diligence
- Only invest what you can afford to lose
- Consult financial advisors for personalized advice

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Access Request** | A request by an investor to view restricted project content |
| **Approved** | Status indicating admin approval has been granted |
| **Audit Log** | Chronological record of platform activities |
| **Draft** | Initial project state before submission |
| **Edit Request** | Developer request to modify an approved project |
| **Funding Progress** | Percentage of shares sold relative to total shares |
| **Investment Request** | Request to purchase shares in a project |
| **Ledger** | Financial record of all transactions |
| **Per-Share Price** | Cost to purchase one share of a project |
| **Portfolio** | Collection of all investor's investments |
| **Processing** | Status during payment confirmation |
| **Restricted Content** | Protected project information requiring access approval |
| **Review Queue** | List of items awaiting admin review |
| **Shares** | Units of ownership in a project |
| **Total Value** | Target funding amount for a project |
| **Wallet** | Platform balance from refunds and withdrawals |
| **Withdrawal** | Removal of investment from a project |

---

## 14. Appendix

### A. Keyboard Shortcuts

| Shortcut | Action | Where |
|----------|--------|-------|
| Escape | Close dialogs/modals | Everywhere |
| ← → | Navigate images | Lightbox |
| Enter | Submit forms | Forms |

### B. Supported Payment Methods

| Method | Processing Time | Notes |
|--------|-----------------|-------|
| Credit/Debit Card | Instant | Visa, Mastercard, Amex |
| Bank Transfer | 1-3 days | Wire transfer |
| Digital Wallet | Instant | Platform wallet balance |

### C. File Format Reference

| Use Case | Supported Formats | Max Size |
|----------|-------------------|----------|
| Profile Avatar | PNG, JPEG, JPG, GIF | 5MB |
| Project Images | PNG, JPEG, JPG | 5MB |
| 3D Models | GLB, GLTF | 5MB |

### D. Status Color Reference

| Color | Meaning |
|-------|---------|
| 🟢 Green | Success, Approved, Completed |
| 🔵 Blue | Info, Pending, Processing |
| 🟡 Yellow/Orange | Warning, Action Needed |
| 🔴 Red | Error, Rejected, Failed |
| ⚫ Gray | Inactive, Archived, Expired |

### E. Contact & Support

For platform support:
- Review this documentation
- Check FAQ section
- Contact platform administrators
- Access support through the platform interface

---

## Document Information

**Last Updated**: January 9, 2026  
**Version**: 3.0  
**Author**: [Masum Jia](https://github.com/jiaamasum)  
**GitHub**: [@jiaamasum](https://github.com/jiaamasum)

---

## Author

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
      </td>
    </tr>
  </table>
</div>

---

<div align="center">

© 2026 CrowdFunding Trading Platform. All rights reserved.  
Created and maintained by **[Masum Jia](https://github.com/jiaamasum)**

This user manual is provided for informational purposes only. All information is subject to change without notice. Please refer to the platform's official Terms of Service and Privacy Policy for binding agreements.

</div>
