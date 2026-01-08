import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Investor',
    price: 'Free',
    description: 'For individual investors',
    features: ['Browse all projects', 'Invest in any project', 'Portfolio tracking', 'Email updates', 'Basic support'],
  },
  {
    name: 'Developer',
    price: 'Free',
    description: 'For project creators',
    features: ['Submit unlimited projects', 'Dashboard analytics', 'Investor communications', 'Priority review', 'Dedicated support'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For institutions',
    features: ['Custom integrations', 'API access', 'White-label options', 'Dedicated account manager', 'SLA guarantees'],
  },
];

export default function Pricing() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-display font-bold mb-6">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">
          No hidden fees. Start investing or raising capital for free.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.highlighted ? 'border-accent shadow-lg' : ''}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">{plan.price}</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/register">
                <Button className="w-full mt-6" variant={plan.highlighted ? 'highlight' : 'outline'}>
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
