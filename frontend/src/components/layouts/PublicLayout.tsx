import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header
        showThemeToggle
        links={[
          { label: 'Projects', to: '/projects' },
          { label: 'Pricing', to: '/pricing' },
          { label: 'About', to: '/about' },
          { label: 'FAQ', to: '/faq' },
        ]}
      />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>



      {/* Footer */}
      <Footer />
    </div>
  );
}
