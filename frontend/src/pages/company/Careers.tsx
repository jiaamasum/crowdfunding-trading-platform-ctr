import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase } from 'lucide-react';

const openings = [
  { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
  { title: 'Product Designer', department: 'Design', location: 'New York, NY', type: 'Full-time' },
  { title: 'Investment Analyst', department: 'Finance', location: 'San Francisco, CA', type: 'Full-time' },
  { title: 'Customer Success Manager', department: 'Operations', location: 'Remote', type: 'Full-time' },
];

export default function Careers() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-display font-bold mb-6">Join Our Team</h1>
        <p className="text-xl text-muted-foreground">
          Help us build the future of crowdfunding. We're looking for passionate people to join our mission.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl font-semibold mb-6">Open Positions</h2>
        {openings.map((job) => (
          <Card key={job.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{job.department}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{job.type}</Badge>
                  <Button size="sm">Apply Now</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mt-12 text-center">
        <p className="text-muted-foreground">
          Don't see a role that fits? Send us your resume at <a href="mailto:careers@crowdfund.com" className="text-accent hover:underline">careers@crowdfund.com</a>
        </p>
      </div>
    </div>
  );
}
