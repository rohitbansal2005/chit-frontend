import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestRegisterPrompt from './GuestRegisterPrompt';
import { ArrowLeft, KeyRound, LogOut, MailCheck, MailWarning, RadioTower, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext-new';
import { Button } from '@/components/ui/button';
import { AccountSettingsContent } from '@/components/UserSettingsDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { UserService } from '@/lib/app-data';
import { AuthUser } from '@/lib/auth-new';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatDistanceToNow } from 'date-fns';

interface DeletionStatus {
  pending: boolean;
  scheduledFor: string | null;
  daysRemaining: number;
}

const AccountSettings = () => {
  const {
    currentUser,
    loading,
    updateUserProfile,
    signUp,
    resendEmailVerification,
    verifyEmail,
    changePassword,
    requestAccountDeletion,
    cancelAccountDeletion,
    getAccountDeletionStatus
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/auth');
    }
  }, [loading, currentUser, navigate]);

  const isGuest = Boolean(currentUser?.type === 'guest' || currentUser?.isAnonymous);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [deletionStatusLoading, setDeletionStatusLoading] = useState(false);
  const [deletionActionLoading, setDeletionActionLoading] = useState(false);

  const refreshDeletionStatus = useCallback(async () => {
    if (isGuest) {
      setDeletionStatus(null);
      return;
    }
    setDeletionStatusLoading(true);
    try {
      const status = await getAccountDeletionStatus();
      setDeletionStatus({
        pending: status.pending,
        scheduledFor: status.scheduledFor ? new Date(status.scheduledFor).toISOString() : null,
        daysRemaining: status.daysRemaining ?? 0
      });
    } catch (error: any) {
      console.error('Failed to load deletion status', error);
      setDeletionStatus(null);
      toast({
        title: 'Unable to load deletion status',
        description: error?.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setDeletionStatusLoading(false);
    }
  }, [getAccountDeletionStatus, isGuest, toast]);

  useEffect(() => {
    if (!loading && currentUser && !isGuest) {
      refreshDeletionStatus();
    }
    if (isGuest) {
      setDeletionStatus(null);
    }
  }, [loading, currentUser, isGuest, refreshDeletionStatus]);

  const handleScheduleDeletion = async () => {
    setDeletionActionLoading(true);
    try {
      const result = await requestAccountDeletion();
      const scheduledDate = result?.scheduledFor ? format(new Date(result.scheduledFor), 'PPpp') : null;
      toast({
        title: 'Deletion scheduled',
        description: scheduledDate ? `Your account will be removed on ${scheduledDate}.` : 'Your account will be removed after 10 days.'
      });
      await refreshDeletionStatus();
    } catch (error: any) {
      toast({
        title: 'Unable to schedule deletion',
        description: error?.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setDeletionActionLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    setDeletionActionLoading(true);
    try {
      await cancelAccountDeletion();
      toast({ title: 'Deletion canceled', description: 'Your account will stay active.' });
      await refreshDeletionStatus();
    } catch (error: any) {
      toast({
        title: 'Unable to cancel deletion',
        description: error?.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setDeletionActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (isGuest) {
    return <GuestRegisterPrompt />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Customize how people see you across ChitZ.</p>
            <h1 className="text-3xl font-semibold">Account settings</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Button>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            {isGuest && (
              <AccountSettingsContent
                user={currentUser}
                onUpdateProfile={updateUserProfile}
                onUpgradeAccount={async ({ email, password, displayName }) => {
                  await signUp(email, password, displayName);
                }}
                layout="page"
                showCloseButton={false}
                title="Create your free account"
                description="Upgrade instantly to save chats and access every setting."
                showProfileSection={false}
                showIdentityBadges={false}
                className="border border-dashed border-primary/50 bg-primary/5"
              />
            )}

            <AccountOverviewCard user={currentUser as AuthUser} />

            <AccountSecurityCard
              user={currentUser as AuthUser}
              disabled={isGuest}
              onChangePassword={changePassword}
              onSendVerification={async () => {
                if (!currentUser.email) {
                  throw new Error('No email linked');
                }
                await resendEmailVerification(currentUser.email);
              }}
              onMarkVerified={verifyEmail}
            />

            <AccountDeletionCard
              disabled={isGuest}
              status={deletionStatus}
              loading={deletionStatusLoading}
              actionLoading={deletionActionLoading}
              onRequestDeletion={handleScheduleDeletion}
              onCancelDeletion={handleCancelDeletion}
            />
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <AccountSettingsContent
              user={currentUser}
              onUpdateProfile={updateUserProfile}
              onUpgradeAccount={async ({ email, password, displayName }) => {
                await signUp(email, password, displayName);
              }}
              layout="page"
              showCloseButton={false}
              title="Personal details"
              description="Update how your profile appears to others."
              showUpgradeSection={false}
              className="border border-border/70 shadow-xl"
              disableProfileEditing={isGuest}
              disabledProfileMessage="Guest sessions cannot edit personal details. Create a free account to unlock this section."
            />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacySettingsSection disabled={isGuest} />
          </TabsContent>

          <TabsContent value="sessions">
            <SessionSecuritySection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface PrivacySettingsSectionProps {
  disabled: boolean;
}

const PrivacySettingsSection = ({ disabled }: PrivacySettingsSectionProps) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [privacyState, setPrivacyState] = useState({
    dmScope: 'everyone' as 'everyone' | 'friends',
    profilePhotoVisibility: 'everyone' as 'everyone' | 'friends'
  });

  const handleDmScopeChange = (value: 'everyone' | 'friends') => {
    (async () => {
      setPrivacyState((prev) => ({ ...prev, dmScope: value }));
      try {
        if (currentUser && currentUser.id) {
          await UserService.updateUser(currentUser.id, { settings: { ...(currentUser as any).settings, dmScope: value } });
        }
        toast({
          title: 'Private messages updated',
          description: value === 'everyone' ? 'Anyone can DM you now.' : 'Only friends can DM you now.'
        });
      } catch (err) {
        toast({ title: 'Unable to update DM settings', description: 'Please try again later.', variant: 'destructive' });
      }
    })();
  };

  // initialize profile visibility from current user settings when available
  useEffect(() => {
    if (currentUser && (currentUser as any).settings && (currentUser as any).settings.profilePhotoVisibility) {
      const pv = (currentUser as any).settings.profilePhotoVisibility as 'everyone' | 'friends';
      setPrivacyState((prev) => ({ ...prev, profilePhotoVisibility: pv }));
    }
  }, [currentUser]);

  const handleProfilePhotoVisibilityChange = async (value: 'everyone' | 'friends') => {
    setPrivacyState((prev) => ({ ...prev, profilePhotoVisibility: value }));
    try {
      if (currentUser && currentUser.id) {
        await UserService.updateUser(currentUser.id, { settings: { ...(currentUser as any).settings, profilePhotoVisibility: value } });
      }
      toast({
        title: 'Profile photo visibility updated',
        description: value === 'everyone' ? 'Your profile photo is visible to everyone.' : 'Only friends can see your profile photo.'
      });
    } catch (err) {
      toast({ title: 'Unable to update profile photo visibility', variant: 'destructive' });
    }
  };

  return (
    <Card className="border border-border/70 shadow-xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl">Privacy & safety</CardTitle>
          <p className="text-sm text-muted-foreground">Control who can reach you and how your data behaves.</p>
        </div>
        {disabled ? <ShieldOff className="w-5 h-5 text-muted-foreground" /> : <ShieldCheck className="w-5 h-5 text-emerald-500" />}
      </CardHeader>
      <CardContent className="space-y-4">
        {disabled && (
          <Alert>
            <AlertDescription>
              Privacy controls unlock after you create a free account. Finish upgrading to keep strangers out.
            </AlertDescription>
          </Alert>
        )}
        <div className="rounded-xl border border-border/60 px-4 py-4 space-y-3">
          <div>
            <Label className="text-base">Who can send private messages?</Label>
            <p className="text-sm text-muted-foreground">Choose between everyone or just your friends.</p>
          </div>
          <Select
            value={privacyState.dmScope}
            onValueChange={(value) => handleDmScopeChange(value as 'everyone' | 'friends')}
            disabled={disabled}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="friends">Friends only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl border border-border/60 px-4 py-4 space-y-3">
          <div>
            <Label className="text-base">Who can see your profile photo?</Label>
            <p className="text-sm text-muted-foreground">Control who can view your profile photo.</p>
          </div>
          <Select
            value={privacyState.profilePhotoVisibility}
            onValueChange={(value) => handleProfilePhotoVisibilityChange(value as 'everyone' | 'friends')}
            disabled={disabled}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="friends">Friends only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

const devices = [
  {
    id: 'device-1',
    name: 'Chrome on Windows',
    location: 'Ghaziabad, India',
    lastActive: 'Active now',
    primary: true
  },
  {
    id: 'device-2',
    name: 'Safari on iPhone 15',
    location: 'Noida, India',
    lastActive: '2 hours ago',
    primary: false
  },
  {
    id: 'device-3',
    name: 'Edge on Surface',
    location: 'Unknown location',
    lastActive: 'Yesterday',
    primary: false
  }
];

const SessionSecuritySection = () => {
  return (
    <Card className="border border-border/70 shadow-xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl">Devices & sessions</CardTitle>
          <p className="text-sm text-muted-foreground">Sign out suspicious sessions or monitor where you are logged in.</p>
        </div>
        <RadioTower className="w-5 h-5 text-blue-500" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/60 divide-y divide-border">
          {devices.map((device) => (
            <div key={device.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {device.name}
                  {device.primary && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Primary</span>}
                </p>
                <p className="text-sm text-muted-foreground">{device.location}</p>
                <p className="text-xs text-muted-foreground">{device.lastActive}</p>
              </div>
              <Button variant="outline" size="sm" className="self-start sm:self-auto">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface AccountSecurityCardProps {
  user: AuthUser;
  disabled: boolean;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onSendVerification: () => Promise<void>;
  onMarkVerified: () => Promise<void>;
}

const AccountSecurityCard = ({ user, disabled, onChangePassword, onSendVerification, onMarkVerified }: AccountSecurityCardProps) => {
  const { toast } = useToast();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const emailLinked = Boolean(user.email);
  const emailVerified = Boolean(user.email && user.emailVerified);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    setPasswordError(null);

    if (!passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim()) {
      setPasswordError('Both current and new passwords are required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: 'Password updated', description: 'Your password was changed successfully.' });
    } catch (error: any) {
      const message = error?.message || 'Unable to change password right now.';
      setPasswordError(message);
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!emailLinked) {
      toast({ title: 'No email linked', description: 'Add an email address first.', variant: 'destructive' });
      return;
    }
    setSendLoading(true);
    try {
      await onSendVerification();
      toast({ title: 'Verification email sent', description: 'Check your inbox for the verification link.' });
    } catch (error: any) {
      const message = error?.message || 'Unable to send verification email right now.';
      toast({ title: 'Send failed', description: message, variant: 'destructive' });
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerifyNow = async () => {
    setVerifyLoading(true);
    try {
      await onMarkVerified();
      toast({ title: 'Email verified', description: 'Your email address is now trusted.' });
    } catch (error: any) {
      const message = error?.message || 'Unable to verify email right now.';
      toast({ title: 'Verification failed', description: message, variant: 'destructive' });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <Card className="border border-border/70 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Security controls</CardTitle>
        <p className="text-sm text-muted-foreground">Manage password safety and email verification.</p>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Change password</h3>
          </div>
          {disabled && (
            <Alert>
              <AlertDescription>Guest accounts must upgrade before changing passwords.</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="text-sm font-medium">Current password</label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                placeholder="••••••••"
                disabled={disabled || passwordLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">New password</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                placeholder="At least 6 characters"
                disabled={disabled || passwordLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm password</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                placeholder="Re-enter new password"
                disabled={disabled || passwordLoading}
              />
            </div>
            <div className="md:col-span-3 flex flex-wrap gap-3">
              <Button type="submit" disabled={disabled || passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update password'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={disabled || passwordLoading}
                onClick={() => {
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError(null);
                }}
              >
                Reset form
              </Button>
            </div>
            {passwordError && (
              <div className="md:col-span-3">
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              </div>
            )}
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            {emailVerified ? (
              <MailCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <MailWarning className="w-4 h-4 text-amber-500" />
            )}
            <h3 className="font-semibold text-lg">Email verification</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {emailLinked ? (
              <Badge variant={emailVerified ? 'secondary' : 'destructive'}>
                {emailVerified ? 'Verified' : 'Not verified'}
              </Badge>
            ) : (
              <Badge variant="outline">No email linked</Badge>
            )}
            {user.email && <span className="text-sm text-muted-foreground">{user.email}</span>}
          </div>
          {!emailLinked && (
            <Alert>
              <AlertDescription>Add an email to unlock verification features.</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSendVerification}
              disabled={!emailLinked || sendLoading}
            >
              {sendLoading ? 'Sending...' : 'Send verification email'}
            </Button>
            {!emailVerified && (
              <Button
                type="button"
                onClick={handleVerifyNow}
                disabled={!emailLinked || verifyLoading}
              >
                {verifyLoading ? 'Verifying...' : 'Mark as verified'}
              </Button>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

interface AccountDeletionCardProps {
  disabled: boolean;
  status: DeletionStatus | null;
  loading: boolean;
  actionLoading: boolean;
  onRequestDeletion: () => Promise<void>;
  onCancelDeletion: () => Promise<void>;
}

const AccountDeletionCard = ({ disabled, status, loading, actionLoading, onRequestDeletion, onCancelDeletion }: AccountDeletionCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scheduledDate = status?.scheduledFor ? new Date(status.scheduledFor) : null;
  const relativeTime = scheduledDate ? formatDistanceToNow(scheduledDate, { addSuffix: true }) : null;

  const handleConfirm = async () => {
    await onRequestDeletion();
    setConfirmOpen(false);
  };

  return (
    <>
      <Card className="border border-destructive/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Delete account</CardTitle>
              <p className="text-sm text-muted-foreground">Schedule a permanent removal with a 10-day grace period.</p>
            </div>
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {disabled ? (
            <Alert>
              <AlertDescription>
                Guest sessions expire automatically. Upgrade to a registered account to manage permanent deletion.
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Checking your deletion status...</p>
          ) : status?.pending && scheduledDate ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Your account is scheduled for deletion on <strong>{format(scheduledDate, 'PPpp')}</strong>. It will disappear {relativeTime}.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Sign in again or cancel below before the timer ends to keep everything. You can always schedule deletion later.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={onCancelDeletion} disabled={actionLoading}>
                  Keep my account
                </Button>
                <Button variant="ghost" onClick={() => setConfirmOpen(true)} disabled={actionLoading}>
                  Reschedule deletion
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                When you request deletion, we lock the account and remove it after 10 days. Logging back in during that window cancels the process automatically.
              </p>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={actionLoading}>
                Delete my account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule account deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              We will queue your account for removal in 10 days. Sign in again anytime before then to cancel automatically or use the cancel button in this panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Never mind</AlertDialogCancel>
            <AlertDialogAction disabled={actionLoading} onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface AccountOverviewCardProps {
  user: AuthUser;
}

const AccountOverviewCard = ({ user }: AccountOverviewCardProps) => {
  const isGuest = user.type === 'guest' || user.isAnonymous;
  const accountItems = [
    {
      label: 'Account status',
      value: isGuest ? 'Guest session' : 'Registered user',
      accent: isGuest ? 'text-orange-500' : 'text-emerald-500'
    },
    {
      label: 'Email',
      value: user.email || 'Not linked'
    },
    {
      label: 'Email verification',
      value: user.email ? (user.emailVerified ? 'Verified' : 'Pending verification') : 'No email on file',
      accent: user.email ? (user.emailVerified ? 'text-emerald-500' : 'text-amber-500') : undefined
    },
    {
      label: 'User ID',
      value: user.uid || user.id || 'Unavailable'
    }
  ];

  return (
    <Card className="border border-border/70 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Account overview</CardTitle>
        <p className="text-sm text-muted-foreground">Key information about your login and membership.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {accountItems.map(({ label, value, accent }) => (
            <div key={label} className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className={`text-base font-semibold ${accent ?? ''}`}>{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSettings;
