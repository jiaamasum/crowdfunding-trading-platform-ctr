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
import apiClient, { getSupabaseAccessToken } from '@/lib/apiClient';
import { normalizeMediaUrl } from '@/lib/media';
import { MediaImage } from '@/components/common/MediaImage';
import { mediaApi } from '@/lib/mediaApi';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

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
      const supabaseAccessToken = getSupabaseAccessToken();
      const response = await apiClient.patch('/auth/me/', {
        name,
        avatar_url: avatarUrl,
        supabase_access_token: supabaseAccessToken || undefined,
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

  const handlePasswordUpdate = async () => {
    if (!password || password !== passwordConfirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    try {
      const accessToken = getSupabaseAccessToken();
      if (!accessToken) {
        toast({ title: 'Please re-authenticate to update password', variant: 'destructive' });
        return;
      }
      await apiClient.post('/auth/password-update/', {
        access_token: accessToken,
        password,
      });
      toast({ title: 'Password updated' });
      setPassword('');
      setPasswordConfirm('');
    } catch (error: any) {
      toast({
        title: 'Password update failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirm Password</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                />
              </div>
            </div>
            <Separator />
            <Button variant="outline" onClick={handlePasswordUpdate}>
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
