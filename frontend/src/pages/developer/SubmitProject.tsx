import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Send, CheckCircle, AlertTriangle, FileText, 
  DollarSign, Image as ImageIcon, Box, Loader2 
} from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import type { Project } from '@/types';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

export default function SubmitProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmations, setConfirmations] = useState({
    accurate: false,
    terms: false,
    understand: false,
  });
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      const data = await projectsApi.getById(id);
      setProject(data);
    };

    loadProject();
  }, [id]);
  
  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const canSubmit = ['DRAFT', 'NEEDS_CHANGES'].includes(project.status);

  if (!canSubmit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">This project cannot be submitted for review</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Validation checks
  const checks = [
    { 
      label: 'Project has title and description', 
      passed: project.title.length >= 3 && project.description.length >= 50 
    },
    { 
      label: 'Total value is set', 
      passed: project.totalValue > 0 
    },
    { 
      label: 'Total shares defined', 
      passed: project.totalShares > 0 
    },
    { 
      label: 'Duration is configured', 
      passed: project.durationDays > 0 
    },
    { 
      label: 'Has at least one image', 
      passed: project.images.length > 0 || !!project.thumbnailUrl 
    },
  ];

  const allChecksPassed = checks.every(c => c.passed);
  const allConfirmed = Object.values(confirmations).every(Boolean);

  const handleSubmit = async () => {
    if (!allChecksPassed || !allConfirmed) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.post(`/projects/${project.id}/submit/`);
    } catch (error) {
      toast.error('Submission failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      setIsSubmitting(false);
      return;
    }
    
    toast.success('Project submitted for review!', {
      description: 'You will be notified when an admin reviews your project.',
    });
    
    setIsSubmitting(false);
    navigate('/app/developer/projects');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">Submit for Review</h1>
          <p className="text-muted-foreground mt-1">{project.title}</p>
        </div>
      </div>

      {/* Project Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
            <CardDescription>Review your project before submitting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {project.thumbnailUrl && (
                <img 
                  src={project.thumbnailUrl} 
                  alt={project.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{project.shortDescription}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{project.category.replace('_', ' ')}</Badge>
                  <Badge variant="outline">${project.totalValue.toLocaleString()}</Badge>
                  <Badge variant="outline">{project.totalShares.toLocaleString()} shares</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Validation Checks */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submission Checklist
            </CardTitle>
            <CardDescription>All items must be completed before submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {checks.map((check, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  check.passed ? 'bg-success/10' : 'bg-warning/10'
                }`}
              >
                {check.passed ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )}
                <span className={check.passed ? 'text-foreground' : 'text-warning'}>
                  {check.label}
                </span>
              </div>
            ))}
            
            {!allChecksPassed && (
              <p className="text-sm text-warning mt-4">
                Please complete all required items before submitting your project.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Confirmations</CardTitle>
            <CardDescription>Please confirm the following before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="accurate" 
                checked={confirmations.accurate}
                onCheckedChange={(checked) => 
                  setConfirmations(prev => ({ ...prev, accurate: !!checked }))
                }
              />
              <Label htmlFor="accurate" className="text-sm leading-relaxed cursor-pointer">
                I confirm that all information provided is accurate and truthful to the best of my knowledge.
              </Label>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-3">
              <Checkbox 
                id="terms" 
                checked={confirmations.terms}
                onCheckedChange={(checked) => 
                  setConfirmations(prev => ({ ...prev, terms: !!checked }))
                }
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I agree to the platform's terms of service and understand the review process.
              </Label>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-3">
              <Checkbox 
                id="understand" 
                checked={confirmations.understand}
                onCheckedChange={(checked) => 
                  setConfirmations(prev => ({ ...prev, understand: !!checked }))
                }
              />
              <Label htmlFor="understand" className="text-sm leading-relaxed cursor-pointer">
                I understand that submission does not guarantee approval, and the project may be rejected or require changes.
              </Label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!allChecksPassed || !allConfirmed || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit for Review
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
