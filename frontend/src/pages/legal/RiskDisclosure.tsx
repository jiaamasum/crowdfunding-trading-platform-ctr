import { AlertTriangle } from 'lucide-react';

export default function RiskDisclosure() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h1 className="text-4xl font-display font-bold">Risk Disclosure</h1>
      </div>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
          <p className="text-amber-700 dark:text-amber-400 font-medium">
            Investing in crowdfunding projects involves significant risks, including the potential loss of your entire investment.
          </p>
        </div>
        
        <h2 className="text-2xl font-semibold mt-8">1. Investment Risks</h2>
        <p>All investments carry inherent risks. The value of investments can go down as well as up, and you may receive back less than you invest.</p>
        
        <h2 className="text-2xl font-semibold mt-8">2. Illiquidity</h2>
        <p>Crowdfunding investments are typically illiquid. You may not be able to sell your shares when you want to, and there may not be a secondary market.</p>
        
        <h2 className="text-2xl font-semibold mt-8">3. Project Failure</h2>
        <p>Many early-stage projects fail. You should be prepared for the possibility that a project may not achieve its goals or generate returns.</p>
        
        <h2 className="text-2xl font-semibold mt-8">4. Diversification</h2>
        <p>We recommend diversifying your investments across multiple projects to reduce risk. Never invest more than you can afford to lose.</p>
      </div>
    </div>
  );
}
