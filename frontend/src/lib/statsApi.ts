import apiClient from '@/lib/apiClient';
import type { AdminStats, DeveloperStats, InvestorStats } from '@/types';

const mapInvestorStats = (data: any): InvestorStats => ({
  totalInvestedProjects: Number(data.total_invested_projects || 0),
  totalInvestedAmount: Number(data.total_invested_amount || 0),
  totalSharesOwned: Number(data.total_shares_owned || 0),
  portfolioValue: Number(data.portfolio_value || 0),
  activeInvestedProjects: Number(data.active_invested_projects || 0),
  activeInvestedAmount: Number(data.active_invested_amount || 0),
  activeSharesOwned: Number(data.active_shares_owned || 0),
  withdrawnInvestedAmount: Number(data.withdrawn_invested_amount || 0),
  withdrawnSharesOwned: Number(data.withdrawn_shares_owned || 0),
  activeInvestments: Number(data.active_investments || 0),
  withdrawnInvestments: Number(data.withdrawn_investments || 0),
});

const mapDeveloperStats = (data: any): DeveloperStats => ({
  totalProjects: Number(data.total_projects || 0),
  activeProjects: Number(data.active_projects || 0),
  completedProjects: Number(data.completed_projects || 0),
  archivedProjects: Number(data.archived_projects || 0),
  totalFundsSecured: Number(data.total_funds_secured || 0),
  totalInvestors: Number(data.total_investors || 0),
  totalSharesSold: Number(data.total_shares_sold || 0),
});

const mapAdminStats = (data: any): AdminStats => ({
  pendingReviewCount: Number(data.pending_review_count || 0),
  pendingAccessRequests: Number(data.pending_access_requests || 0),
  totalUsers: Number(data.total_users || 0),
  totalInvestments: Number(data.total_investments || 0),
  totalPayments: Number(data.total_payments || 0),
  totalInvestedAmount: Number(data.total_invested_amount || 0),
  activeInvestedAmount: Number(data.active_invested_amount || 0),
  withdrawnInvestedAmount: Number(data.withdrawn_invested_amount || 0),
  activeInvestments: Number(data.active_investments || 0),
  withdrawnInvestments: Number(data.withdrawn_investments || 0),
  totalShares: Number(data.total_shares || 0),
  activeShares: Number(data.active_shares || 0),
  withdrawnShares: Number(data.withdrawn_shares || 0),
});

export const statsApi = {
  async getInvestor(): Promise<InvestorStats> {
    const response = await apiClient.get('/stats/');
    return mapInvestorStats(response.data);
  },
  async getDeveloper(): Promise<DeveloperStats> {
    const response = await apiClient.get('/stats/');
    return mapDeveloperStats(response.data);
  },
  async getAdmin(): Promise<AdminStats> {
    const response = await apiClient.get('/stats/');
    return mapAdminStats(response.data);
  },
};
