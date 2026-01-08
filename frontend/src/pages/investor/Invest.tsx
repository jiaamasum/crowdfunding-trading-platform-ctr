import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Money, SharesProgress } from '@/components/ui/money';
import { PageContainer } from '@/components/ui/page-container';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, Minus, Plus, CreditCard, Building2, Wallet, 
  CheckCircle, AlertCircle, Loader2, Lock, Shield 
} from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import { investmentsApi } from '@/lib/investmentsApi';
import type { Project } from '@/types';
import type { Investment } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MediaImage } from '@/components/common/MediaImage';

type Step = 'shares' | 'payment' | 'processing' | 'success' | 'failed';

const paymentMethods = [
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { id: 'bank', label: 'Bank Transfer', icon: Building2 },
  { id: 'wallet', label: 'Digital Wallet', icon: Wallet },
];

export default function InvestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [investmentRequest, setInvestmentRequest] = useState<Investment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<Step>('shares');
  const [shares, setShares] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [projectData, investments] = await Promise.all([
          projectsApi.getById(id),
          investmentsApi.list({ project: id }),
        ]);
        setProject(projectData);
        const approved = investments.filter((inv) => inv.status === 'APPROVED');
        const latestApproved = approved.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const isExpired = Boolean(
          latestApproved?.approvalExpiresAt
            && new Date(latestApproved.approvalExpiresAt) < new Date()
        );
        setInvestmentRequest(isExpired ? null : (latestApproved || null));
      } catch (error) {
        toast({
          title: 'Unable to load project',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [id, toast]);

  useEffect(() => {
    if (!investmentRequest) return;
    setShares(investmentRequest.shares);
  }, [investmentRequest?.id]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading project...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  if (!investmentRequest) {
    return (
      <PageContainer>
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">No approved investment request found for this project.</p>
          <Link to={`/projects/${project.id}`}>
            <Button variant="outline">Back to Project</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (investmentRequest.status !== 'APPROVED') {
    return (
      <PageContainer>
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            Your investment request is currently {investmentRequest.status.toLowerCase()}.
          </p>
          <Link to={`/projects/${project.id}`}>
            <Button variant="outline">Back to Project</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const requestedShares = investmentRequest?.shares || shares;
  const totalAmount = requestedShares * project.perSharePrice;
  const maxShares = investmentRequest?.shares || project.remainingShares;

  const handleSharesChange = (value: number) => {
    if (investmentRequest) return;
    if (value < 1) setShares(1);
    else if (value > maxShares) setShares(maxShares);
    else setShares(value);
  };

  const handlePayment = async () => {
    setStep('processing');
    setIsProcessing(true);

    try {
      if (!project || !investmentRequest) {
        throw new Error('Investment request not found');
      }
      await investmentsApi.pay(investmentRequest.id, paymentMethod);

      const refreshed = await projectsApi.getById(project.id);
      setProject(refreshed);
      setStep('processing');
      toast({ title: 'Payment received', description: 'Awaiting admin approval.' });
    } catch (error) {
      toast({
        title: 'Investment failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setStep('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'shares':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Approved Share Request</CardTitle>
                <CardDescription>Review the shares approved by the admin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSharesChange(shares - 1)}
                    disabled={investmentRequest ? true : shares <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={requestedShares}
                    onChange={(e) => handleSharesChange(parseInt(e.target.value) || 1)}
                    className="w-24 text-center text-2xl font-bold"
                    min={1}
                    max={maxShares}
                    disabled={!!investmentRequest}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSharesChange(shares + 1)}
                    disabled={investmentRequest ? true : shares >= maxShares}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {requestedShares >= maxShares && !investmentRequest && (
                  <p className="text-center text-warning text-sm">Maximum available shares selected</p>
                )}

                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per share</span>
                    <Money amount={project.perSharePrice} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number of shares</span>
                    <span>{requestedShares}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <Money amount={totalAmount} className="text-accent" />
                  </div>
                </div>

                <Button
                  variant="highlight"
                  className="w-full"
                  size="lg"
                  onClick={() => setStep('payment')}
                  disabled={!investmentRequest}
                >
                  Continue to Payment
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                        paymentMethod === method.id ? "border-accent bg-accent/5" : "hover:border-accent/50"
                      )}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <method.icon className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">{method.label}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {paymentMethod === 'card' && (
                  <div className="space-y-4 p-4 rounded-lg border">
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input placeholder="4242 4242 4242 4242" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry</Label>
                        <Input placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label>CVC</Label>
                        <Input placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{requestedShares} shares × <Money amount={project.perSharePrice} /></span>
                    <Money amount={totalAmount} />
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <Money amount={totalAmount} className="text-accent" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Your payment is secure and encrypted</span>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('shares')}>Back</Button>
                  <Button variant="highlight" className="flex-1" onClick={handlePayment}>
                    <Shield className="h-4 w-4 mr-2" /> Pay <Money amount={totalAmount} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-accent mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold mb-2">Payment Received</h2>
            <p className="text-muted-foreground">Your payment is confirmed and awaiting admin approval.</p>
            <div className="mt-6">
              <Link to="/app/investor/investments">
                <Button variant="outline">View Investments</Button>
              </Link>
            </div>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Investment Successful!</h2>
            <p className="text-muted-foreground mb-2">You have successfully purchased</p>
            <p className="text-3xl font-bold text-accent mb-6">{requestedShares} shares</p>
            
            <Card className="max-w-sm mx-auto mb-6">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project</span>
                  <span className="font-medium">{project.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-medium">{requestedShares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid</span>
                  <Money amount={totalAmount} className="font-semibold" />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Link to="/app/investor/investments">
                <Button variant="outline">View Investments</Button>
              </Link>
              <Link to="/app/investor/projects">
                <Button variant="highlight">Browse More Projects</Button>
              </Link>
            </div>
          </motion.div>
        );

      case 'failed':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Payment Failed</h2>
            <p className="text-muted-foreground mb-6">There was an issue processing your payment. Please try again.</p>
            
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setStep('payment')}>Try Again</Button>
              <Link to="/app/investor/projects">
                <Button variant="ghost">Cancel</Button>
              </Link>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <PageContainer>
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Full width centered for success/failed states */}
      {(step === 'success' || step === 'failed') ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-lg">
            {renderStep()}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            {step !== 'processing' && (
              <div className="flex items-center gap-4 mb-8">
                {['shares', 'payment'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      step === s || (s === 'shares' && step === 'payment')
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      step === s ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {s === 'shares' ? 'Approved Request' : 'Payment'}
                    </span>
                    {i < 1 && <div className="w-8 h-px bg-border" />}
                  </div>
                ))}
              </div>
            )}

            {renderStep()}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Investment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.thumbnailUrl && (
                  <MediaImage src={project.thumbnailUrl} alt={project.title} className="w-full aspect-video object-cover rounded-lg" />
                )}
                <h3 className="font-semibold">{project.title}</h3>
                <SharesProgress sold={project.sharesSold} total={project.totalShares} />
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per share</span>
                    <Money amount={project.perSharePrice} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span>{project.remainingShares.toLocaleString()} shares</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
