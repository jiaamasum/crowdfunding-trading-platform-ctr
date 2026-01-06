// User Roles
export type UserRole = 'ADMIN' | 'DEVELOPER' | 'INVESTOR';

// Project Status
export type ProjectStatus = 
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_CHANGES'
  | 'ARCHIVED';

// Access Request Status
export type AccessRequestStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';

// Payment Status
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

// Investment Status
export type InvestmentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

// Notification Type
export type NotificationType =
  | 'PROJECT_SUBMITTED'
  | 'PROJECT_APPROVED'
  | 'PROJECT_REJECTED'
  | 'PROJECT_NEEDS_CHANGES'
  | 'ACCESS_REQUESTED'
  | 'ACCESS_APPROVED'
  | 'ACCESS_REJECTED'
  | 'ACCESS_REVOKED'
  | 'INVESTMENT_SUCCESS'
  | 'INVESTMENT_FAILED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'NEW_ACCESS_REQUEST';

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Project
export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: ProjectCategory;
  status: ProjectStatus;
  developerId: string;
  developerName: string;
  
  // Financial
  totalValue: number;
  totalShares: number;
  sharesSold: number;
  perSharePrice: number; // Computed: totalValue / totalShares
  remainingShares: number; // Computed: totalShares - sharesSold
  fundingProgress: number; // Computed: (sharesSold / totalShares) * 100
  
  // Duration
  durationDays: number;
  startDate?: string;
  endDate?: string;
  daysRemaining?: number;
  
  // Media
  thumbnailUrl?: string;
  images: string[];
  has3DModel: boolean;
  model3DUrl?: string;
  is3DPublic: boolean;
  
  // Restricted Fields (may be locked)
  restrictedFields?: RestrictedFields;
  hasRestrictedFields: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface RestrictedFields {
  financialProjections?: string;
  businessPlan?: string;
  teamDetails?: string;
  legalDocuments?: string;
  riskAssessment?: string;
}

export type ProjectCategory = 
  | 'TECHNOLOGY'
  | 'REAL_ESTATE'
  | 'ENERGY'
  | 'HEALTHCARE'
  | 'AGRICULTURE'
  | 'MANUFACTURING'
  | 'RETAIL'
  | 'SERVICES'
  | 'OTHER';

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'ENERGY', label: 'Energy' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'SERVICES', label: 'Services' },
  { value: 'OTHER', label: 'Other' },
];

// Access Request
export interface AccessRequest {
  id: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  projectId: string;
  projectTitle: string;
  status: AccessRequestStatus;
  message?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

// Investment
export interface Investment {
  id: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  projectId: string;
  projectTitle: string;
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  status: InvestmentStatus;
  createdAt: string;
  completedAt?: string;
}

// Payment
export interface Payment {
  id: string;
  transactionId: string;
  investorId: string;
  investorName: string;
  investmentId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
  processedAt?: string;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: 'project' | 'access_request' | 'investment' | 'payment';
  createdAt: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  actionType: AuditActionType;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetType: 'project' | 'user' | 'access_request' | 'investment' | 'payment';
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type AuditActionType =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_SUBMITTED'
  | 'PROJECT_APPROVED'
  | 'PROJECT_REJECTED'
  | 'PROJECT_ARCHIVED'
  | 'ACCESS_REQUEST_CREATED'
  | 'ACCESS_REQUEST_APPROVED'
  | 'ACCESS_REQUEST_REJECTED'
  | 'ACCESS_REQUEST_REVOKED'
  | 'INVESTMENT_CREATED'
  | 'PAYMENT_PROCESSED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DISABLED';

// Favorites
export interface Favorite {
  id: string;
  userId: string;
  projectId: string;
  createdAt: string;
}

// Dashboard Stats
export interface DeveloperStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  archivedProjects: number;
  totalFundsSecured: number;
  totalInvestors: number;
  totalSharesSold: number;
}

export interface InvestorStats {
  totalInvestedProjects: number;
  totalInvestedAmount: number;
  totalSharesOwned: number;
  portfolioValue: number;
}

export interface AdminStats {
  pendingReviewCount: number;
  pendingAccessRequests: number;
  totalUsers: number;
  totalInvestments: number;
  totalPayments: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter/Sort Options
export interface ProjectFilters {
  search?: string;
  category?: ProjectCategory;
  status?: ProjectStatus;
  minProgress?: number;
  maxProgress?: number;
  minSharePrice?: number;
  maxSharePrice?: number;
  minDuration?: number;
  maxDuration?: number;
}

export type ProjectSortOption = 
  | 'newest'
  | 'most_funded'
  | 'lowest_price'
  | 'highest_price'
  | 'ending_soon';
