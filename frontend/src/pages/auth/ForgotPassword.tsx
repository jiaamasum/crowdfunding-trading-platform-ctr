import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuthStore();
  const { toast } = useToast();

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsSubmitting(true);
    try {
      const result = await resetPassword(data.email);
      if (result.detail) {
        toast({
          title: result.detail,
          description: 'Please check your inbox and spam folder.',
        });
      }
      setSubmitted(true);
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-soft-xl border-border/50">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                If an account exists with that email, we've sent password reset instructions.
              </p>
              <Link to="/auth/login">
                <Button className="w-full">Back to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Forgot Password?</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your email and we'll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
            <div className="text-center mt-6">
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
