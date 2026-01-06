import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Eye, EyeOff, Wand2 } from 'lucide-react';
import type { UserRole } from '@/types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  role: z.enum(['INVESTOR', 'DEVELOPER'] as const),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'INVESTOR' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await registerUser(data.email, data.password, data.name, data.role as UserRole);
      if (result.requiresVerification) {
        toast({ title: result.detail || 'Account created!', description: 'Please check your email to verify your account.' });
        navigate('/auth/verify-email');
        return;
      }
      toast({ title: result.detail || 'Account created!', description: 'Your account is ready. Welcome aboard!' });
      navigate('/app');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let newPassword = "";
    // Ensure at least one of each required type
    newPassword += "A"; // Uppercase
    newPassword += "a"; // Lowercase
    newPassword += "1"; // Number
    newPassword += "!"; // Special

    // Fill the rest randomly
    for (let i = 0; i < 12; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle
    newPassword = newPassword.split('').sort(() => 0.5 - Math.random()).join('');

    setValue('password', newPassword, { shouldValidate: true });
    setValue('confirmPassword', newPassword, { shouldValidate: true });
    setShowPassword(true);
    setShowConfirmPassword(true);
    toast({ title: 'Strong password generated', description: 'Be sure to save this password!' });
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-8 w-8 text-accent" />
            <span className="text-2xl font-display font-bold">CrowdFund</span>
          </Link>

          <h1 className="text-3xl font-display font-bold mb-2">Create account</h1>
          <p className="text-muted-foreground mb-8">Join our community of investors and developers</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I want to</Label>
              <Select defaultValue="INVESTOR" onValueChange={(v) => setValue('role', v as 'INVESTOR' | 'DEVELOPER')}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INVESTOR">Invest in projects</SelectItem>
                  <SelectItem value="DEVELOPER">Create and fund projects</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-accent hover:bg-transparent"
                  onClick={generatePassword}
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Generate Strong Password
                </Button>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('password')} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...register('confirmPassword')} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" variant="highlight" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/auth/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="text-center text-primary-foreground">
          <h2 className="text-4xl font-display font-bold mb-4">Start Your Journey</h2>
          <p className="text-lg opacity-80 max-w-md">Create an account to invest in innovative projects or fund your own ideas.</p>
        </motion.div>
      </div>
    </div>
  );
}
