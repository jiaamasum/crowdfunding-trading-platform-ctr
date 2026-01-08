import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Shield, Globe } from 'lucide-react';

const values = [
  { icon: Target, title: 'Mission-Driven', description: 'Democratizing access to investment opportunities for everyone.' },
  { icon: Shield, title: 'Trust & Security', description: 'Bank-level security and rigorous project vetting processes.' },
  { icon: Users, title: 'Community First', description: 'Building a community of investors and developers who succeed together.' },
  { icon: Globe, title: 'Global Impact', description: 'Enabling investments in projects that make a difference worldwide.' },
];

export default function About() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-display font-bold mb-6">About CrowdFund</h1>
        <p className="text-xl text-muted-foreground">
          We're on a mission to democratize investing by connecting visionary developers with passionate investors worldwide.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {values.map((value) => (
          <Card key={value.title}>
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <value.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-display font-bold mb-4">Our Story</h2>
        <p className="text-muted-foreground mb-6">
          Founded in 2023, CrowdFund was born from a simple idea: everyone should have access to quality investment opportunities. 
          We've since helped thousands of investors build diversified portfolios while enabling developers to bring their visions to life.
        </p>
        <Link to="/auth/register">
          <Button variant="highlight" size="lg">Join Our Community</Button>
        </Link>
      </div>
    </div>
  );
}
