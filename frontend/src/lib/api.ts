import type {
  Project,
  Investment,
  Payment,
  Notification,
  AccessRequest,
  AuditLog,
  User,
  PaginatedResponse,
  ProjectFilters,
  ProjectSortOption,
  DeveloperStats,
  InvestorStats,
  AdminStats,
} from '@/types';
import {
  MOCK_PROJECTS,
  MOCK_INVESTMENTS,
  MOCK_PAYMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_ACCESS_REQUESTS,
  MOCK_AUDIT_LOGS,
  MOCK_USERS,
} from './mockData';

// Simulated API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// API Base URL (would be used in production)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Projects API
export const projectsApi = {
  async getAll(
    filters?: ProjectFilters,
    sort?: ProjectSortOption,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Project>> {
    await delay();
    
    let projects = [...MOCK_PROJECTS].filter(p => p.status === 'APPROVED');
    
    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      projects = projects.filter(p => 
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }
    
    if (filters?.category) {
      projects = projects.filter(p => p.category === filters.category);
    }
    
    if (filters?.minProgress !== undefined) {
      projects = projects.filter(p => p.fundingProgress >= filters.minProgress!);
    }
    
    if (filters?.maxProgress !== undefined) {
      projects = projects.filter(p => p.fundingProgress <= filters.maxProgress!);
    }
    
    if (filters?.minSharePrice !== undefined) {
      projects = projects.filter(p => p.perSharePrice >= filters.minSharePrice!);
    }
    
    if (filters?.maxSharePrice !== undefined) {
      projects = projects.filter(p => p.perSharePrice <= filters.maxSharePrice!);
    }
    
    // Apply sorting
    switch (sort) {
      case 'newest':
        projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'most_funded':
        projects.sort((a, b) => b.fundingProgress - a.fundingProgress);
        break;
      case 'lowest_price':
        projects.sort((a, b) => a.perSharePrice - b.perSharePrice);
        break;
      case 'highest_price':
        projects.sort((a, b) => b.perSharePrice - a.perSharePrice);
        break;
      case 'ending_soon':
        projects.sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999));
        break;
    }
    
    // Paginate
    const total = projects.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = projects.slice(start, start + pageSize);
    
    return { data, total, page, pageSize, totalPages };
  },
  
  async getById(id: string): Promise<Project | null> {
    await delay();
    return MOCK_PROJECTS.find(p => p.id === id) || null;
  },
  
  async getByDeveloper(developerId: string): Promise<Project[]> {
    await delay();
    return MOCK_PROJECTS.filter(p => p.developerId === developerId);
  },
  
  async getReviewQueue(): Promise<Project[]> {
    await delay();
    return MOCK_PROJECTS.filter(p => p.status === 'PENDING_REVIEW');
  },
  
  async create(project: Partial<Project>): Promise<Project> {
    await delay(800);
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: project.title || 'Untitled Project',
      description: project.description || '',
      shortDescription: project.shortDescription || '',
      category: project.category || 'OTHER',
      status: 'DRAFT',
      developerId: project.developerId || '',
      developerName: project.developerName || '',
      totalValue: project.totalValue || 0,
      totalShares: project.totalShares || 0,
      sharesSold: 0,
      perSharePrice: project.totalShares ? (project.totalValue || 0) / project.totalShares : 0,
      remainingShares: project.totalShares || 0,
      fundingProgress: 0,
      durationDays: project.durationDays || 0,
      thumbnailUrl: project.thumbnailUrl,
      images: project.images || [],
      has3DModel: false,
      is3DPublic: true,
      hasRestrictedFields: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    MOCK_PROJECTS.push(newProject);
    return newProject;
  },
  
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    await delay(600);
    const index = MOCK_PROJECTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    
    MOCK_PROJECTS[index] = {
      ...MOCK_PROJECTS[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return MOCK_PROJECTS[index];
  },
  
  async submit(id: string): Promise<Project> {
    await delay(600);
    const index = MOCK_PROJECTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    
    MOCK_PROJECTS[index] = {
      ...MOCK_PROJECTS[index],
      status: 'PENDING_REVIEW',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return MOCK_PROJECTS[index];
  },
  
  async review(id: string, decision: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES', note: string): Promise<Project> {
    await delay(800);
    const index = MOCK_PROJECTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    
    MOCK_PROJECTS[index] = {
      ...MOCK_PROJECTS[index],
      status: decision,
      reviewNote: note,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: decision === 'APPROVED' ? new Date().toISOString() : undefined,
    };
    
    return MOCK_PROJECTS[index];
  },
};

// Investments API
export const investmentsApi = {
  async getByInvestor(investorId: string): Promise<Investment[]> {
    await delay();
    return MOCK_INVESTMENTS.filter(i => i.investorId === investorId);
  },
  
  async getAll(): Promise<Investment[]> {
    await delay();
    return MOCK_INVESTMENTS;
  },
  
  async create(investment: Partial<Investment>): Promise<Investment> {
    await delay(1000);
    const newInvestment: Investment = {
      id: `inv-${Date.now()}`,
      investorId: investment.investorId || '',
      investorName: investment.investorName || '',
      investorEmail: investment.investorEmail || '',
      projectId: investment.projectId || '',
      projectTitle: investment.projectTitle || '',
      shares: investment.shares || 0,
      pricePerShare: investment.pricePerShare || 0,
      totalAmount: (investment.shares || 0) * (investment.pricePerShare || 0),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    
    MOCK_INVESTMENTS.push(newInvestment);
    return newInvestment;
  },
  
  async complete(id: string): Promise<Investment> {
    await delay(500);
    const index = MOCK_INVESTMENTS.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Investment not found');
    
    MOCK_INVESTMENTS[index] = {
      ...MOCK_INVESTMENTS[index],
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    };
    
    // Update project shares sold
    const investment = MOCK_INVESTMENTS[index];
    const projectIndex = MOCK_PROJECTS.findIndex(p => p.id === investment.projectId);
    if (projectIndex !== -1) {
      MOCK_PROJECTS[projectIndex].sharesSold += investment.shares;
      MOCK_PROJECTS[projectIndex].remainingShares -= investment.shares;
      MOCK_PROJECTS[projectIndex].fundingProgress = 
        (MOCK_PROJECTS[projectIndex].sharesSold / MOCK_PROJECTS[projectIndex].totalShares) * 100;
    }
    
    return MOCK_INVESTMENTS[index];
  },
};

// Payments API
export const paymentsApi = {
  async getAll(): Promise<Payment[]> {
    await delay();
    return MOCK_PAYMENTS;
  },
  
  async process(investmentId: string, amount: number, method: string): Promise<Payment> {
    await delay(2000); // Simulate payment processing
    
    const success = Math.random() > 0.1; // 90% success rate for demo
    
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
      investorId: '',
      investorName: '',
      investmentId,
      amount,
      status: success ? 'SUCCESS' : 'FAILED',
      paymentMethod: method,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };
    
    MOCK_PAYMENTS.push(payment);
    
    if (!success) {
      throw new Error('Payment processing failed. Please try again.');
    }
    
    return payment;
  },
};

// Notifications API
export const notificationsApi = {
  async getByUser(userId: string): Promise<Notification[]> {
    await delay();
    return MOCK_NOTIFICATIONS.filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  async getUnreadCount(userId: string): Promise<number> {
    await delay(200);
    return MOCK_NOTIFICATIONS.filter(n => n.userId === userId && !n.isRead).length;
  },
  
  async markAsRead(id: string): Promise<void> {
    await delay(200);
    const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === id);
    if (index !== -1) {
      MOCK_NOTIFICATIONS[index].isRead = true;
    }
  },
  
  async markAllAsRead(userId: string): Promise<void> {
    await delay(300);
    MOCK_NOTIFICATIONS.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
  },
};

// Access Requests API
export const accessRequestsApi = {
  async getByInvestor(investorId: string): Promise<AccessRequest[]> {
    await delay();
    return MOCK_ACCESS_REQUESTS.filter(ar => ar.investorId === investorId);
  },
  
  async getAll(): Promise<AccessRequest[]> {
    await delay();
    return MOCK_ACCESS_REQUESTS;
  },
  
  async getPending(): Promise<AccessRequest[]> {
    await delay();
    return MOCK_ACCESS_REQUESTS.filter(ar => ar.status === 'PENDING');
  },
  
  async create(request: Partial<AccessRequest>): Promise<AccessRequest> {
    await delay(600);
    const newRequest: AccessRequest = {
      id: `access-${Date.now()}`,
      investorId: request.investorId || '',
      investorName: request.investorName || '',
      investorEmail: request.investorEmail || '',
      projectId: request.projectId || '',
      projectTitle: request.projectTitle || '',
      status: 'PENDING',
      message: request.message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    MOCK_ACCESS_REQUESTS.push(newRequest);
    return newRequest;
  },
  
  async decide(
    id: string, 
    decision: 'APPROVED' | 'REJECTED' | 'REVOKED', 
    note: string,
    adminId: string
  ): Promise<AccessRequest> {
    await delay(600);
    const index = MOCK_ACCESS_REQUESTS.findIndex(ar => ar.id === id);
    if (index === -1) throw new Error('Access request not found');
    
    MOCK_ACCESS_REQUESTS[index] = {
      ...MOCK_ACCESS_REQUESTS[index],
      status: decision,
      adminNote: note,
      decidedAt: new Date().toISOString(),
      decidedBy: adminId,
      updatedAt: new Date().toISOString(),
    };
    
    return MOCK_ACCESS_REQUESTS[index];
  },
  
  async getForProject(investorId: string, projectId: string): Promise<AccessRequest | null> {
    await delay(200);
    return MOCK_ACCESS_REQUESTS.find(
      ar => ar.investorId === investorId && ar.projectId === projectId
    ) || null;
  },
};

// Audit Logs API
export const auditLogsApi = {
  async getAll(): Promise<AuditLog[]> {
    await delay();
    return MOCK_AUDIT_LOGS.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};

// Users API
export const usersApi = {
  async getAll(): Promise<User[]> {
    await delay();
    return MOCK_USERS;
  },
  
  async getById(id: string): Promise<User | null> {
    await delay();
    return MOCK_USERS.find(u => u.id === id) || null;
  },
};

// Favorites API (client-side managed, but could be backend)
export const favoritesApi = {
  async add(userId: string, projectId: string): Promise<void> {
    await delay(200);
    console.log(`Added project ${projectId} to favorites for user ${userId}`);
  },
  
  async remove(userId: string, projectId: string): Promise<void> {
    await delay(200);
    console.log(`Removed project ${projectId} from favorites for user ${userId}`);
  },
};

// Stats API
export const statsApi = {
  async getDeveloperStats(developerId: string): Promise<DeveloperStats> {
    await delay();
    const projects = MOCK_PROJECTS.filter(p => p.developerId === developerId);
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'APPROVED').length,
      completedProjects: 0,
      archivedProjects: projects.filter(p => p.status === 'ARCHIVED').length,
      totalFundsSecured: projects.reduce((sum, p) => sum + (p.sharesSold * p.perSharePrice), 0),
      totalInvestors: new Set(MOCK_INVESTMENTS.filter(i => 
        projects.some(p => p.id === i.projectId)
      ).map(i => i.investorId)).size,
      totalSharesSold: projects.reduce((sum, p) => sum + p.sharesSold, 0),
    };
  },
  
  async getInvestorStats(investorId: string): Promise<InvestorStats> {
    await delay();
    const investments = MOCK_INVESTMENTS.filter(i => i.investorId === investorId && i.status === 'COMPLETED');
    
    return {
      totalInvestedProjects: new Set(investments.map(i => i.projectId)).size,
      totalInvestedAmount: investments.reduce((sum, i) => sum + i.totalAmount, 0),
      totalSharesOwned: investments.reduce((sum, i) => sum + i.shares, 0),
      portfolioValue: investments.reduce((sum, i) => sum + i.totalAmount, 0) * 1.15, // Mock 15% growth
    };
  },
  
  async getAdminStats(): Promise<AdminStats> {
    await delay();
    return {
      pendingReviewCount: MOCK_PROJECTS.filter(p => p.status === 'PENDING_REVIEW').length,
      pendingAccessRequests: MOCK_ACCESS_REQUESTS.filter(ar => ar.status === 'PENDING').length,
      totalUsers: MOCK_USERS.length,
      totalInvestments: MOCK_INVESTMENTS.length,
      totalPayments: MOCK_PAYMENTS.length,
    };
  },
};
