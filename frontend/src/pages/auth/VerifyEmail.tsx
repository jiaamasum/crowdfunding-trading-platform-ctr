import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, resendVerificationEmail } = useAuthStore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  // If user is already authenticated and verified, redirect to app
  useEffect(() => {
    if (isAuthenticated && user?.isVerified) {
      navigate('/app');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-soft-xl border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Email Verification</CardTitle>
            <CardDescription className="text-base mt-2">
              We sent a verification link to your email. Confirm it to finish setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Didn't get the email?</p>
              <p>Resend the verification link below or check your spam folder.</p>
            </div>

            {resent ? (
              <div className="flex items-center gap-2 text-emerald-600 justify-center">
                <CheckCircle className="h-5 w-5" />
                <span>Verification email sent!</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Your email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={async () => {
                    if (!email) {
                      toast({
                        title: 'Email required',
                        description: 'Please enter your email address.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    setIsResending(true);
                    try {
                      const result = await resendVerificationEmail(email);
                      setResent(true);
                      toast({
                        title: result.detail || 'Verification email sent',
                        description: 'Please check your inbox and spam folder.',
                      });
                    } catch (error) {
                      toast({
                        title: 'Failed to send email',
                        description: error instanceof Error ? error.message : 'Please try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsResending(false);
                    }
                  }}
                  disabled={isResending}
                  className="w-full"
                  variant="outline"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend verification email'
                  )}
                </Button>
              </div>
            )}

            <div className="text-center">
              <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
