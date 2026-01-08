import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { exchangeSupabaseSession } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (!accessToken) {
      toast({
        title: 'Authentication failed',
        description: 'Missing access token from provider.',
        variant: 'destructive',
      });
      navigate('/auth/login');
      return;
    }

    if (type === 'recovery') {
      navigate(`/auth/reset-password#${hash}`, { replace: true });
      return;
    }

    exchangeSupabaseSession(accessToken, refreshToken)
      .then(() => navigate('/app'))
      .catch((error) => {
        toast({
          title: 'Authentication failed',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
        navigate('/auth/login');
      });
  }, [exchangeSupabaseSession, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p>Completing sign-in...</p>
      </div>
    </div>
  );
}
