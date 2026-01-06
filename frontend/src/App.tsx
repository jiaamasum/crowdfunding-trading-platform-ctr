import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";

// Public Pages
import LandingPage from "./pages/Index";
import ProjectsPage from "./pages/Projects";
import ProjectDetailPage from "./pages/ProjectDetail";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import VerifyEmailPage from "./pages/auth/VerifyEmail";
import AuthCallbackPage from "./pages/auth/AuthCallback";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/Notifications";

// Footer Pages
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import RiskDisclosure from "./pages/legal/RiskDisclosure";
import About from "./pages/company/About";
import Careers from "./pages/company/Careers";
import Press from "./pages/company/Press";
import Contact from "./pages/company/Contact";
import Pricing from "./pages/platform/Pricing";
import FAQ from "./pages/platform/FAQ";

// Layouts
import InvestorLayout from "./components/layouts/InvestorLayout";
import DeveloperLayout from "./components/layouts/DeveloperLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import PublicLayout from "./components/layouts/PublicLayout";

// Investor Pages
import InvestorDashboard from "./pages/investor/Dashboard";
import InvestorFavorites from "./pages/investor/Favorites";
import InvestorCompare from "./pages/investor/Compare";
import InvestorInvestments from "./pages/investor/Investments";
import InvestorInvest from "./pages/investor/Invest";

// Developer Pages
import DeveloperDashboard from "./pages/developer/Dashboard";
import DeveloperProjects from "./pages/developer/Projects";
import DeveloperCreateProject from "./pages/developer/CreateProject";
import DeveloperProjectDetail from "./pages/developer/ProjectDetail";
import DeveloperProjectMedia from "./pages/developer/ProjectMedia";
import DeveloperEditProject from "./pages/developer/EditProject";
import DeveloperSubmitProject from "./pages/developer/SubmitProject";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminReviewQueue from "./pages/admin/ReviewQueue";
import AdminProjectReview from "./pages/admin/ProjectReview";
import AdminAccessRequests from "./pages/admin/AccessRequests";
import AdminUsers from "./pages/admin/Users";
import AdminUserDetail from "./pages/admin/UserDetail";
import AdminInvestments from "./pages/admin/Investments";
import AdminPayments from "./pages/admin/Payments";
import AdminAuditLogs from "./pages/admin/AuditLogs";

// Guards
import { RequireAuth } from "@/components/auth/RouteGuards";

const queryClient = new QueryClient();

function AuthHashRedirect({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash.includes('access_token=')) {
      const hash = location.hash.replace('#', '');
      const params = new URLSearchParams(hash);
      const type = params.get('type');
      if (type === 'recovery') {
        navigate(`/auth/reset-password${location.hash}`, { replace: true });
      } else {
        navigate(`/auth/callback${location.hash}`, { replace: true });
      }
    }
  }, [location.hash, navigate]);

  return <>{children}</>;
}

function FavoritesSync() {
  const { isAuthenticated } = useAuthStore();
  const { loadFavorites, clearFavorites, loadCompare, clearCompare } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      clearFavorites();
      clearCompare();
      return;
    }
    loadFavorites().catch((error) => console.error('Failed to load favorites', error));
    loadCompare().catch((error) => console.error('Failed to load compare list', error));
  }, [isAuthenticated, loadFavorites, clearFavorites, loadCompare, clearCompare]);

  return null;
}

// Role-based redirect component
function AppRedirect() {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/auth/login" replace />;
  
  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/app/admin" replace />;
    case 'DEVELOPER':
      return <Navigate to="/app/developer" replace />;
    case 'INVESTOR':
      return <Navigate to="/app/investor" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FavoritesSync />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<AuthHashRedirect><LandingPage /></AuthHashRedirect>} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          
          {/* Public Pages with Shared Layout */}
          <Route element={<PublicLayout />}>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/risk-disclosure" element={<RiskDisclosure />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/press" element={<Press />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
          </Route>
          
          {/* Protected App Redirect */}
          <Route path="/app" element={<RequireAuth><AppRedirect /></RequireAuth>} />
          
          {/* Investor Routes */}
          <Route path="/app/investor" element={<RequireAuth><InvestorLayout /></RequireAuth>}>
            <Route index element={<InvestorDashboard />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id/invest" element={<InvestorInvest />} />
            <Route path="favorites" element={<InvestorFavorites />} />
            <Route path="compare" element={<InvestorCompare />} />
            <Route path="investments" element={<InvestorInvestments />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          
          {/* Developer Routes */}
          <Route path="/app/developer" element={<RequireAuth><DeveloperLayout /></RequireAuth>}>
            <Route index element={<DeveloperDashboard />} />
            <Route path="projects" element={<DeveloperProjects />} />
            <Route path="projects/new" element={<DeveloperCreateProject />} />
            <Route path="projects/:id" element={<DeveloperProjectDetail />} />
            <Route path="projects/:id/edit" element={<DeveloperEditProject />} />
            <Route path="projects/:id/media" element={<DeveloperProjectMedia />} />
            <Route path="projects/:id/submit" element={<DeveloperSubmitProject />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/app/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<AdminDashboard />} />
            <Route path="projects/review-queue" element={<AdminReviewQueue />} />
            <Route path="projects/:id/review" element={<AdminProjectReview />} />
            <Route path="access-requests" element={<AdminAccessRequests />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="investments" element={<AdminInvestments />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
