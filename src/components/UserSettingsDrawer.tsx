import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AuthUser } from "@/lib/auth-new";
import { cn } from "@/lib/utils";
import { X, Shield, Mail, Lock, User as UserIcon, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface UpgradePayload {
  email: string;
  password: string;
  displayName: string;
}

interface UserSettingsDrawerProps {
  open: boolean;
  user: AuthUser;
  onClose: () => void;
  onUpdateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  onUpgradeAccount: (payload: UpgradePayload) => Promise<void>;
}

interface AccountSettingsContentProps {
  user: AuthUser;
  onClose?: () => void;
  onUpdateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  onUpgradeAccount: (payload: UpgradePayload) => Promise<void>;
  layout?: 'modal' | 'page';
  resetToken?: number;
  showCloseButton?: boolean;
  title?: string;
  description?: string;
  showIdentityBadges?: boolean;
  showProfileSection?: boolean;
  showUpgradeSection?: boolean;
  disableProfileEditing?: boolean;
  disabledProfileMessage?: string;
  className?: string;
}

const validateEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
};

const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Singapore",
  "Brazil",
  "Japan",
  "Spain",
  "Italy",
  "Mexico",
  "United Arab Emirates",
  "South Africa",
  "Saudi Arabia",
  "Indonesia",
  "Philippines",
  "Netherlands",
  "Sweden",
  "Norway",
  "Switzerland"
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not", label: "Prefer not to say" }
];

const DOB_MIN_AGE = 15;
const DOB_MAX_AGE = 99;
const DOB_DEFAULT_MONTH = new Date("2000-01-01");

const parseDobString = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateAgeFromDate = (date?: Date) => {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "";
};

export const AccountSettingsContent = ({
  user,
  onClose,
  onUpdateProfile,
  onUpgradeAccount,
  layout = 'modal',
  resetToken = 0,
  showCloseButton = true,
  title,
  description,
  showIdentityBadges = true,
  showProfileSection = true,
  showUpgradeSection = true,
  disableProfileEditing = false,
  disabledProfileMessage,
  className
}: AccountSettingsContentProps) => {
  const { toast } = useToast();
  const initialDob = (user as any)?.dob || "";
  const initialDobDate = parseDobString(initialDob);
  const dobLocked = !!initialDobDate;

  const dobMaxDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setFullYear(d.getFullYear() - DOB_MIN_AGE);
    return d;
  }, []);

  const dobMinDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setFullYear(d.getFullYear() - DOB_MAX_AGE);
    return d;
  }, []);
  const initialAge = user.age ? String(user.age) : (initialDobDate ? calculateAgeFromDate(initialDobDate) : "");
  const [profileForm, setProfileForm] = useState({
    displayName: user.displayName || user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    age: initialAge,
    gender: user.gender || "",
    dob: initialDob,
    photoURL: user.photoURL || (user as any)?.avatar || ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({
    displayName: user.displayName || user.name || "",
    email: "",
    password: ""
  });
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [dobPickerOpen, setDobPickerOpen] = useState(false);

  const isGuest = useMemo(() => {
    return user.type === 'guest' || user.userType === 'guest' || user.isAnonymous;
  }, [user]);

  useEffect(() => {
    const nextDob = (user as any)?.dob || "";
    const nextDobDate = parseDobString(nextDob);
    setProfileForm({
      displayName: user.displayName || user.name || "",
      bio: user.bio || "",
      location: user.location || "",
      age: user.age ? String(user.age) : (nextDobDate ? calculateAgeFromDate(nextDobDate) : ""),
      gender: user.gender || "",
      dob: nextDob,
      photoURL: user.photoURL || (user as any)?.avatar || ""
    });
    setUpgradeForm((prev) => ({
      ...prev,
      displayName: user.displayName || user.name || ""
    }));
    setUpgradeError(null);
  }, [user, resetToken]);

  useEffect(() => {
    if (!profileForm.photoURL) {
      setIsPhotoPreviewOpen(false);
    }
  }, [profileForm.photoURL]);

  const wrapperClasses = layout === 'page'
    ? "w-full"
    : "w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col";
  const cardClasses = layout === 'page'
    ? "flex flex-col border border-border/60 shadow-xl"
    : "flex flex-col";
  const cardTitle = title || "Account settings";
  const cardDescription = description || "Manage your profile and upgrade your account at any time.";

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);

    if (disableProfileEditing) {
      setProfileError("Guest accounts cannot update details until they upgrade.");
      return;
    }

    if (!profileForm.displayName.trim()) {
      setProfileError("Display name is required");
      return;
    }

    setSavingProfile(true);
    try {
      await onUpdateProfile({
        name: profileForm.displayName.trim(),
        displayName: profileForm.displayName.trim(),
        bio: profileForm.bio.trim() || undefined,
        location: profileForm.location || undefined,
        gender: profileForm.gender || undefined,
        age: profileForm.age ? Number(profileForm.age) : undefined,
        dob: profileForm.dob || undefined,
        photoURL: profileForm.photoURL || undefined
      });
      toast({
        title: "Profile updated",
        description: "Your changes were saved successfully."
      });
    } catch (error: any) {
      const message = error?.message || "Unable to save profile right now";
      setProfileError(message);
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpgradeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpgradeError(null);

    if (!upgradeForm.displayName.trim()) {
      setUpgradeError("Please choose a display name");
      return;
    }
    if (!validateEmail(upgradeForm.email)) {
      setUpgradeError("Enter a valid email address");
      return;
    }
    if (upgradeForm.password.length < 6) {
      setUpgradeError("Password must be at least 6 characters");
      return;
    }

    setUpgradeLoading(true);
    try {
      await onUpgradeAccount({
        displayName: upgradeForm.displayName.trim(),
        email: upgradeForm.email.trim(),
        password: upgradeForm.password
      });
      toast({
        title: "Account created",
        description: "You are now signed in with your registered account."
      });
      setUpgradeForm({
        displayName: upgradeForm.displayName.trim(),
        email: "",
        password: ""
      });
    } catch (error: any) {
      const message = error?.message || "Could not upgrade account";
      setUpgradeError(message);
      toast({
        title: "Upgrade failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic validations
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image smaller than 2MB', variant: 'destructive' });
      return;
    }

    try {
      toast({ title: 'Uploading profile photo...' });
      const res = await uploadToCloudinary(file, 'chitz/avatars');
      setProfileForm((prev) => ({ ...prev, photoURL: res.url }));
      toast({ title: 'Profile photo uploaded' });
    } catch (err) {
      console.error('Profile upload failed', err);
      toast({ title: 'Upload failed', description: 'Could not upload profile photo', variant: 'destructive' });
    }
  };

  const triggerImagePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveProfilePhoto = () => {
    setProfileForm((prev) => ({ ...prev, photoURL: "" }));
  };

  const handleOpenPhotoPreview = () => {
    if (!profileForm.photoURL) return;
    setIsPhotoPreviewOpen(true);
  };

  const handleDobSelect = (date?: Date) => {
    if (dobLocked) return;
    if (!date) {
      setProfileForm((prev) => ({ ...prev, dob: "", age: "" }));
      return;
    }
    const normalized = formatDateForInput(date);
    const derivedAge = calculateAgeFromDate(date);
    setProfileForm((prev) => ({ ...prev, dob: normalized, age: derivedAge }));
    setDobPickerOpen(false);
  };

  const selectedDobDate = parseDobString(profileForm.dob);

  return (
    <>
    <Card className={cn(`${wrapperClasses} ${cardClasses}`, className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{cardTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {cardDescription}
            </p>
            {showIdentityBadges && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={isGuest ? "destructive" : "secondary"}>
                  {isGuest ? "Guest session" : "Registered user"}
                </Badge>
                <Badge variant="outline">{user.email || "No email linked"}</Badge>
              </div>
            )}
          </div>
          {showCloseButton && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close settings">
              <X className="w-5 h-5" />
            </Button>
          )}
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 overflow-y-auto space-y-8 p-6">
          {showProfileSection && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Profile</h3>
              </div>
              {disableProfileEditing && disabledProfileMessage && (
                <Alert variant="default">
                  <AlertDescription>{disabledProfileMessage}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border/60 p-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-full",
                      profileForm.photoURL ? "cursor-zoom-in focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" : "cursor-not-allowed"
                    )}
                    role={profileForm.photoURL ? "button" : undefined}
                    onClick={profileForm.photoURL ? handleOpenPhotoPreview : undefined}
                    tabIndex={profileForm.photoURL ? 0 : -1}
                    onKeyDown={
                      profileForm.photoURL
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleOpenPhotoPreview();
                            }
                          }
                        : undefined
                    }
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profileForm.photoURL || undefined} alt={profileForm.displayName || "Avatar"} />
                      <AvatarFallback>{(profileForm.displayName || "U").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-semibold">Profile photo</p>
                    <p className="text-xs text-muted-foreground">
                      {profileForm.photoURL ? "Click the photo for a larger preview." : "PNG, JPG up to 2MB."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={triggerImagePicker}
                    disabled={disableProfileEditing || savingProfile}
                  >
                    Upload new photo
                  </Button>
                  {profileForm.photoURL && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRemoveProfilePhoto}
                      disabled={disableProfileEditing || savingProfile}
                    >
                      Remove
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageChange}
                    disabled={disableProfileEditing || savingProfile}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Display name</label>
                <Input
                  value={profileForm.displayName}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))
                  }
                  placeholder="Enter your name"
                  disabled={disableProfileEditing || savingProfile}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, bio: event.target.value.slice(0, 280) }))
                  }
                  placeholder="Tell people a little about you (max 280 characters)"
                  rows={4}
                  disabled={disableProfileEditing || savingProfile}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {profileForm.bio.length}/280
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Country/region</label>
                  <Select
                    value={profileForm.location || undefined}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, location: value }))
                    }
                    disabled={disableProfileEditing || savingProfile}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date of birth</label>
                  <Popover open={dobPickerOpen} onOpenChange={setDobPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "mt-1 w-full justify-start text-left font-normal",
                          !profileForm.dob && "text-muted-foreground"
                        )}
                        disabled={disableProfileEditing || savingProfile || dobLocked}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDobDate ? format(selectedDobDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDobDate}
                        onSelect={handleDobSelect}
                        disabled={(date) => dobLocked || date > dobMaxDate || date < dobMinDate}
                        captionLayout="dropdown-buttons"
                        fromYear={dobMinDate.getFullYear()}
                        toYear={dobMaxDate.getFullYear()}
                        defaultMonth={selectedDobDate || dobMaxDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="mt-2 flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">Only ages {DOB_MIN_AGE} to {DOB_MAX_AGE} are allowed. DOB can be set once and can’t be changed.</p>
                    {dobLocked && <p className="text-xs text-muted-foreground">DOB is locked.</p>}
                    {profileForm.dob && !dobLocked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          handleDobSelect(undefined);
                          setDobPickerOpen(false);
                        }}
                        disabled={disableProfileEditing || savingProfile}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Age</label>
                  <Input
                    value={profileForm.age || ""}
                    placeholder="Auto-calculated after DOB"
                    readOnly
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Gender</label>
                  <Select
                    value={profileForm.gender || undefined}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, gender: value }))
                    }
                    disabled={disableProfileEditing || savingProfile}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {profileError && (
                <Alert variant="destructive">
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={disableProfileEditing || savingProfile}>
                  {savingProfile ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                      const resetDob = (user as any)?.dob || "";
                      const resetDobDate = parseDobString(resetDob);
                      setProfileForm({
                        displayName: user.displayName || user.name || "",
                        bio: user.bio || "",
                        location: user.location || "",
                        age: user.age ? String(user.age) : (resetDobDate ? calculateAgeFromDate(resetDobDate) : ""),
                        gender: user.gender || "",
                        dob: resetDob,
                        photoURL: user.photoURL || (user as any)?.avatar || ""
                      });
                    setProfileError(null);
                  }}
                  disabled={disableProfileEditing || savingProfile}
                >
                  Reset
                </Button>
              </div>
            </form>
          </section>
          )}

          {showUpgradeSection && isGuest && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Upgrade your account</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Link an email and password to keep your conversations and unlock profile syncing across devices.
              </p>
              <form onSubmit={handleUpgradeSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Display name</label>
                  <Input
                    value={upgradeForm.displayName}
                    onChange={(event) =>
                      setUpgradeForm((prev) => ({ ...prev, displayName: event.target.value }))
                    }
                    placeholder="Choose how people see you"
                    disabled={upgradeLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" /> Email address
                  </label>
                  <Input
                    type="email"
                    value={upgradeForm.email}
                    onChange={(event) =>
                      setUpgradeForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                    disabled={upgradeLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" /> Password
                  </label>
                  <Input
                    type="password"
                    value={upgradeForm.password}
                    onChange={(event) =>
                      setUpgradeForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Create a strong password"
                    disabled={upgradeLoading}
                  />
                </div>
                {upgradeError && (
                  <Alert variant="destructive">
                    <AlertDescription>{upgradeError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={upgradeLoading}>
                  {upgradeLoading ? "Creating account..." : "Create free account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We will sign you in with the new account as soon as it is created.
                </p>
              </form>
            </section>
          )}
        </CardContent>
      </Card>
      <Dialog open={isPhotoPreviewOpen} onOpenChange={setIsPhotoPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile photo preview</DialogTitle>
          </DialogHeader>
          {profileForm.photoURL ? (
            <img
              src={profileForm.photoURL}
              alt="Profile preview"
              className="w-full rounded-xl object-cover"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Upload a photo to see the preview here.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const UserSettingsDrawer = ({
  open,
  user,
  onClose,
  onUpdateProfile,
  onUpgradeAccount
}: UserSettingsDrawerProps) => {
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    if (open) {
      setResetToken((prev) => prev + 1);
    }
  }, [open, user]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-10">
      <AccountSettingsContent
        user={user}
        onClose={onClose}
        onUpdateProfile={onUpdateProfile}
        onUpgradeAccount={onUpgradeAccount}
        layout="modal"
        resetToken={resetToken}
        showCloseButton
      />
    </div>
  );
};
