import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageContainer } from '@/components/ui/page-container';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import { normalizeMediaUrl } from '@/lib/media';
import { MediaImage } from '@/components/common/MediaImage';
import { mediaApi } from '@/lib/mediaApi';
import { getFrontendUrl } from '@/lib/env';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  if (!user) {
    return (
      <PageContainer title="Profile">
        <div className="text-muted-foreground">Please sign in to view your profile.</div>
      </PageContainer>
    );
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return user.avatarUrl;

    const response = await mediaApi.upload({
      file: avatarFile,
      bucket: 'users-profile-image',
      folder: 'avatars',
    });

    return response.resolve_url || response.public_url || response.storage_path;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const avatarUrl = await uploadAvatar();
      const response = await apiClient.patch('/auth/me/', {
        name,
        avatar_url: avatarUrl,
      });
      updateUser({
        name: response.data.name,
        avatarUrl: normalizeMediaUrl(response.data.avatar_url, 'users-profile-image'),
      });
      toast({ title: 'Profile updated' });
      setAvatarFile(null);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      if (!user?.email) {
        toast({ title: 'Email missing', variant: 'destructive' });
        return;
      }
      setIsResettingPassword(true);
      await apiClient.post('/auth/password-reset/', {
        email: user.email,
        redirect_to: `${getFrontendUrl()}/auth/reset-password`,
      });
      toast({ title: 'Password reset email sent' });
    } catch (error: any) {
      toast({
        title: 'Password reset failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <PageContainer title="Profile" description="Manage your personal details and security">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {user.avatarUrl && (
                  <MediaImage
                    src={user.avatarUrl}
                    alt={user.name}
                    className="aspect-square h-full w-full"
                    bucket="users-profile-image"
                    loading="eager"
                  />
                )}
                <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile Photo</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Request a password reset email to update your credentials.
            </p>
            <Separator />
            <Button variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword}>
              {isResettingPassword ? 'Sending...' : 'Send Password Reset Email'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
