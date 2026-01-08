import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

const pressItems = [
  { source: 'TechCrunch', title: 'CrowdFund raises $25M Series B to democratize investing', date: 'Dec 2024' },
  { source: 'Forbes', title: 'How CrowdFund is changing the crowdfunding landscape', date: 'Nov 2024' },
  { source: 'Bloomberg', title: 'The rise of fractional ownership in real estate', date: 'Oct 2024' },
  { source: 'CNBC', title: 'CrowdFund hits $50M in total investments', date: 'Sep 2024' },
];

export default function Press() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-display font-bold mb-6">Press & Media</h1>
        <p className="text-xl text-muted-foreground">
          Latest news and media coverage about CrowdFund.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {pressItems.map((item) => (
          <Card key={item.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-accent font-medium mb-1">{item.source}</p>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.date}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Media Inquiries</h2>
        <p className="text-muted-foreground mb-4">
          For press inquiries, please contact our media team.
        </p>
        <Button variant="outline">
          <a href="mailto:press@crowdfund.com">press@crowdfund.com</a>
        </Button>
      </div>
    </div>
  );
}
