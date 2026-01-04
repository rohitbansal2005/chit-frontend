import { useState, useRef } from "react";
import { 
  ArrowLeft, 
  Camera, 
  Settings, 
  Shield, 
  Star, 
  Trophy, 
  Crown, 
  Award,
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Smartphone,
  Download,
  Trash2,
  Mail,
  Key,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";

interface User {
  name: string;
  type: 'guest' | 'email';
  email?: string;
  avatar?: string;
  bio?: string;
  age?: number;
  gender?: string;
  location?: string;
  badges?: string[];
  joinedDate?: string;
  premiumStatus?: 'free' | 'monthly' | 'yearly';
  premiumExpiry?: string;
  lastUsernameChange?: string;
}

interface SettingsState {
  notifications: {
    messages: boolean;
    mentions: boolean;
    groupInvites: boolean;
    systemUpdates: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    showReadReceipts: boolean;
  };
  appearance: {
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    showAvatars: boolean;
    animationsEnabled: boolean;
  };
  language: 'english' | 'hindi' | 'spanish' | 'french';
}

interface SettingsPageProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

const availableBadges = [
  { id: 'verified', name: 'Verified', icon: Shield, color: 'bg-blue-500' },
  { id: 'premium', name: 'Premium', icon: Crown, color: 'bg-yellow-500' },
  { id: 'active', name: 'Active User', icon: Star, color: 'bg-green-500' },
  { id: 'moderator', name: 'Moderator', icon: Award, color: 'bg-purple-500' },
  { id: 'champion', name: 'Champion', icon: Trophy, color: 'bg-orange-500' },
];

const countries = [
  // Popular countries first
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'Asia' },
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'North America' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'North America' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oceania' },
  // European countries
  { code: 'DE', name: 'Germany', flag: '��', region: 'Europe' },
  { code: 'FR', name: 'France', flag: '�🇷', region: 'Europe' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'Europe' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', region: 'Europe' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', region: 'Europe' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', region: 'Europe' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', region: 'Europe' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', region: 'Europe' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', region: 'Europe' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', region: 'Europe' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', region: 'Europe' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', region: 'Europe' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', region: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', region: 'Europe' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', region: 'Europe' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', region: 'Europe' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', region: 'Europe' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', region: 'Europe' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', region: 'Europe' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', region: 'Europe' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', region: 'Europe' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', region: 'Europe' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', region: 'Europe' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', region: 'Europe/Asia' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', region: 'Europe' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', region: 'Europe/Asia' },
  // Asian countries
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'Asia' },
  { code: 'KR', name: 'South Korea', flag: '��', region: 'Asia' },
  { code: 'CN', name: 'China', flag: '🇨🇳', region: 'Asia' },
  { code: 'TH', name: 'Thailand', flag: '��', region: 'Asia' },
  { code: 'VN', name: 'Vietnam', flag: '��', region: 'Asia' },
  { code: 'SG', name: 'Singapore', flag: '�🇬', region: 'Asia' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', region: 'Asia' },
  { code: 'ID', name: 'Indonesia', flag: '��', region: 'Asia' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', region: 'Asia' },
  { code: 'BD', name: 'Bangladesh', flag: '��', region: 'Asia' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', region: 'Asia' },
  { code: 'LK', name: 'Sri Lanka', flag: '��', region: 'Asia' },
  { code: 'NP', name: 'Nepal', flag: '��', region: 'Asia' },
  { code: 'AF', name: 'Afghanistan', flag: '��', region: 'Asia' },
  // Middle East
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸�', region: 'Middle East' },
  { code: 'AE', name: 'United Arab Emirates', flag: '��', region: 'Middle East' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', region: 'Middle East' },
  // Africa
  { code: 'EG', name: 'Egypt', flag: '��', region: 'Africa' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', region: 'Africa' },
  { code: 'NG', name: 'Nigeria', flag: '��', region: 'Africa' },
  { code: 'KE', name: 'Kenya', flag: '��', region: 'Africa' },
  { code: 'GH', name: 'Ghana', flag: '��', region: 'Africa' },
  // Americas
  { code: 'BR', name: 'Brazil', flag: '��', region: 'South America' },
  { code: 'MX', name: 'Mexico', flag: '��', region: 'North America' },
  { code: 'AR', name: 'Argentina', flag: '🇦�', region: 'South America' },
  // Oceania
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', region: 'Oceania' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', region: 'Oceania' },
].sort((a, b) => a.name.localeCompare(b.name));

export const SettingsPage = ({ user, onBack, onUpdateUser, onLogout }: SettingsPageProps) => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user.avatar || null);
  const [profileData, setProfileData] = useState({
    name: user.name,
    bio: user.bio || '',
    age: user.age || '',
    gender: user.gender || '',
    location: user.location || '',
  });

  // Country selection state
  const [openCountrySelect, setOpenCountrySelect] = useState(false);

  // Account upgrade state
  const [upgradeData, setUpgradeData] = useState({
    email: '',
    password: ''
  });
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SettingsState>({
    notifications: {
      messages: true,
      mentions: true,
      groupInvites: true,
      systemUpdates: false,
      soundEnabled: true,
      vibrationEnabled: true,
    },
    privacy: {
      profileVisibility: 'public' as 'public' | 'friends' | 'private',
      showOnlineStatus: true,
      allowDirectMessages: true,
      showReadReceipts: true,
    },
    appearance: {
      fontSize: 'medium' as 'small' | 'medium' | 'large',
      compactMode: false,
      showAvatars: true,
      animationsEnabled: true,
    },
    language: 'english' as 'english' | 'hindi' | 'spanish' | 'french',
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image smaller than 5MB", variant: "destructive" });
      return;
    }

    try {
      toast({ title: "Uploading image..." });
      const res = await uploadToCloudinary(file, 'chitz/avatars');
      setProfileImage(res.url);
      toast({ title: "Profile image uploaded", description: "Your profile image has been updated" });
    } catch (err) {
      console.error('Upload failed', err);
      toast({ title: "Upload failed", description: "Could not upload image. Try again.", variant: "destructive" });
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    // Validate bio length
    if (profileData.bio.length > 1000) {
      toast({
        title: "Bio too long",
        description: "Bio must be 1000 characters or less",
        variant: "destructive"
      });
      return;
    }

    // Check if username has changed
    const usernameChanged = profileData.name !== user.name;
    
    if (usernameChanged) {
      // Check if user can change username
      const canChangeUsername = checkUsernameChangePermission();
      
      if (!canChangeUsername.allowed) {
        toast({
          title: "Username change not allowed",
          description: canChangeUsername.reason,
          variant: "destructive"
        });
        return;
      }
    }

    const updatedUser = {
      ...user,
      ...profileData,
      avatar: profileImage || user.avatar,
      age: profileData.age ? Number(profileData.age) : undefined,
      // Update lastUsernameChange if username was changed
      lastUsernameChange: usernameChanged ? new Date().toISOString() : user.lastUsernameChange,
    };

    try {
      await onUpdateUser(updatedUser);
      setIsEditingProfile(false);
      if (usernameChanged) {
        toast({
          title: "Username updated successfully",
          description: "Your username has been changed. Next change allowed after 30 days."
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been saved successfully"
        });
      }
    } catch (err) {
      console.error('Failed to save profile', err);
      toast({
        title: 'Failed to save profile',
        description: err?.message || 'Please try again later',
        variant: 'destructive'
      });
    }
  };

  const checkUsernameChangePermission = () => {
    // If user has never changed username, allow change
    if (!user.lastUsernameChange) {
      return { allowed: true, reason: "" };
    }

    const lastChangeDate = new Date(user.lastUsernameChange);
    const now = new Date();
    const daysDifference = Math.floor((now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Allow change if 30 days have passed
    if (daysDifference >= 30) {
      return { allowed: true, reason: "" };
    }

    const daysRemaining = 30 - daysDifference;
    return { 
      allowed: false, 
      reason: `You can change your username in ${daysRemaining} days. Last changed on ${lastChangeDate.toLocaleDateString()}.`
    };
  };

  const getUsernameChangeStatus = () => {
    if (!user.lastUsernameChange) {
      return "You haven't changed your username yet.";
    }

    const permission = checkUsernameChangePermission();
    if (permission.allowed) {
      return "You can change your username now.";
    }

    return permission.reason;
  };

  // OTP Functions
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  };

  const sendOtp = async () => {
    // Email validation first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(upgradeData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsVerifyingOtp(true);
      
      // Generate OTP
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);
      
      // Simulate sending email (in real app, call backend API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, show OTP in console and toast
      console.log(`OTP for ${upgradeData.email}: ${newOtp}`);
      
      setOtpSent(true);
      setOtpTimer(60); // 60 seconds timer
      
      // Start countdown timer
      const timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast({
        title: "OTP Sent!",
        description: `Verification code sent to ${upgradeData.email}. Check your inbox.`,
      });

      // For demo purposes, also show OTP in a toast (remove in production)
      setTimeout(() => {
        toast({
          title: "Demo: OTP Code",
          description: `Your verification code is: ${newOtp}`,
          variant: "default"
        });
      }, 1000);

    } catch (error) {
      toast({
        title: "Failed to send OTP",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast({
        title: "OTP required",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Verification code must be 6 digits",
        variant: "destructive"
      });
      return;
    }

    if (otp !== generatedOtp) {
      toast({
        title: "Invalid OTP",
        description: "Verification code is incorrect. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // OTP verified, proceed with account upgrade
    await handleAccountUpgrade();
  };

  const resendOtp = async () => {
    setOtp('');
    await sendOtp();
  };

  const handleAccountUpgrade = async () => {
    // At this point, email is already verified via OTP
    // Just validate password
    if (!upgradeData.password.trim()) {
      toast({
        title: "Password required",
        description: "Please create a password",
        variant: "destructive"
      });
      return;
    }

    if (upgradeData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsUpgrading(true);

    try {
      // Simulate account creation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Upgrade user account
      const upgradedUser = {
        ...user,
        type: 'email' as const,
        email: upgradeData.email,
        badges: user.badges?.includes('verified') 
          ? user.badges 
          : [...(user.badges || []), 'verified'], // Add verified badge if not already present
        // In a real app, you'd hash the password and send to backend
        // For demo, we're just storing the fact that they have an email account
      };

      onUpdateUser(upgradedUser);

      // Clear upgrade form and OTP states
      setUpgradeData({
        email: '',
        password: ''
      });
      setOtpSent(false);
      setOtp('');
      setGeneratedOtp(null);
      setOtpTimer(0);

      toast({
        title: "Account upgraded successfully!",
        description: "You can now sign in with your verified email and password"
      });

    } catch (error) {
      toast({
        title: "Upgrade failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSettingChange = (category: keyof SettingsState, setting: string, value: any) => {
    setSettings(prev => {
      if (category === 'language') {
        return {
          ...prev,
          language: value as SettingsState['language']
        };
      }
      
      const categorySettings = prev[category] as Record<string, any>;
      return {
        ...prev,
        [category]: {
          ...categorySettings,
          [setting]: value
        }
      };
    });
    
    toast({
      title: "Setting updated",
      description: "Your preference has been saved"
    });
  };

  const handleExportData = () => {
    const dataToExport = {
      user,
      settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chitz-data-${user.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Your data has been downloaded successfully"
    });
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast({
        title: "Account deletion requested",
        description: "Your account will be deleted within 30 days",
        variant: "destructive"
      });
      onLogout();
    }
  };

  const isPremium = user.premiumStatus && user.premiumStatus !== 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <Settings className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      {profileImage && <AvatarImage src={profileImage} alt={user.name} />}
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      onClick={triggerImageUpload}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-muted-foreground">{user.email || 'Guest User'}</p>
                    {user.bio && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-md">
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {user.bio}
                        </p>
                      </div>
                    )}
                    {isPremium && (
                      <Badge className="mt-2 bg-yellow-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {/* Profile Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name">Username</Label>
                      {user.lastUsernameChange && (
                        <Badge variant="outline" className="text-xs">
                          {checkUsernameChangePermission().allowed ? (
                            <span className="text-green-600">✓ Can change</span>
                          ) : (
                            <span className="text-orange-600">⏳ Cooldown active</span>
                          )}
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditingProfile}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getUsernameChangeStatus()}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profileData.age ?? ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={profileData.gender || ''}
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
                      disabled={!isEditingProfile}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Country</Label>
                    <Popover open={openCountrySelect} onOpenChange={setOpenCountrySelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCountrySelect}
                          className="w-full justify-between"
                          disabled={!isEditingProfile}
                        >
                          {profileData.location ? (
                            <span className="flex items-center gap-2">
                              <span>{countries.find(c => c.name === profileData.location)?.flag}</span>
                              <span>{profileData.location}</span>
                            </span>
                          ) : (
                            "Select country..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[250px]">
                              <CommandItem
                                value=""
                                onSelect={() => {
                                  setProfileData(prev => ({ ...prev, location: '' }));
                                  setOpenCountrySelect(false);
                                }}
                              >
                                <span className="text-muted-foreground">Clear selection</span>
                              </CommandItem>
                              
                              {/* Popular countries section */}
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b mb-1">
                                Popular
                              </div>
                              {['India', 'United States', 'United Kingdom', 'Canada', 'Australia'].map((countryName) => {
                                const country = countries.find(c => c.name === countryName);
                                if (!country) return null;
                                return (
                                  <CommandItem
                                    key={country.code}
                                    value={country.name}
                                    onSelect={(currentValue) => {
                                      setProfileData(prev => ({ 
                                        ...prev, 
                                        location: currentValue === profileData.location ? '' : currentValue 
                                      }));
                                      setOpenCountrySelect(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        profileData.location === country.name ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    <span className="flex items-center gap-2">
                                      <span>{country.flag}</span>
                                      <span>{country.name}</span>
                                    </span>
                                  </CommandItem>
                                );
                              })}
                              
                              {/* All countries */}
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b my-1">
                                All Countries
                              </div>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={country.name}
                                  onSelect={(currentValue) => {
                                    setProfileData(prev => ({ 
                                      ...prev, 
                                      location: currentValue === profileData.location ? '' : currentValue 
                                    }));
                                    setOpenCountrySelect(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      profileData.location === country.name ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <span className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{country.region}</span>
                                  </span>
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">Bio</Label>
                    <span className={`text-xs ${
                      profileData.bio.length > 1000 ? 'text-red-500' : 
                      profileData.bio.length > 900 ? 'text-yellow-500' : 
                      'text-muted-foreground'
                    }`}>
                      {profileData.bio.length}/1000
                    </span>
                  </div>
                  {isEditingProfile && (
                    <p className="text-xs text-muted-foreground mb-2">
                      💡 Use line breaks (Enter) to organize your thoughts clearly. Words will wrap automatically.
                    </p>
                  )}
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      // Allow input but show warning if over limit
                      if (newValue.length <= 1100) { // Allow slight overflow for better UX
                        setProfileData(prev => ({ ...prev, bio: newValue }));
                      }
                    }}
                    onPaste={(e) => {
                      // Handle paste events to respect character limit
                      const paste = e.clipboardData.getData('text');
                      const currentLength = profileData.bio.length;
                      const availableSpace = 1000 - currentLength;
                      
                      if (paste.length > availableSpace) {
                        e.preventDefault();
                        const truncatedPaste = paste.substring(0, availableSpace);
                        setProfileData(prev => ({ ...prev, bio: prev.bio + truncatedPaste }));
                        
                        toast({
                          title: "Text truncated",
                          description: `Pasted text was trimmed to fit the 1000 character limit`,
                          variant: "default"
                        });
                      }
                    }}
                    disabled={!isEditingProfile}
                    placeholder="Tell us about yourself... (max 1000 characters)&#10;Write about your interests, hobbies, or anything you'd like to share.&#10;Use line breaks to organize your thoughts clearly."
                    className="min-h-[120px] resize-none leading-relaxed"
                    style={{
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6',
                      wordBreak: 'break-word'
                    }}
                  />
                  {profileData.bio.length > 950 && (
                    <p className={`text-xs mt-1 ${
                      profileData.bio.length > 1000 ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {profileData.bio.length > 1000 
                        ? 'Bio exceeds maximum length!' 
                        : `${1000 - profileData.bio.length} characters remaining`
                      }
                    </p>
                  )}
                  
                  {/* Bio Preview */}
                  {profileData.bio && isEditingProfile && (
                    <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                      <Label className="text-xs font-semibold text-muted-foreground">Preview:</Label>
                      <div className="mt-1 text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {profileData.bio}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!isEditingProfile ? (
                    <Button onClick={() => setIsEditingProfile(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={profileData.bio.length > 1000}
                        className={profileData.bio.length > 1000 ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>

                {/* Badges */}
                {user.badges && user.badges.length > 0 && (
                  <div>
                    <Label>Your Badges</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.badges.map(badgeId => {
                        const badge = availableBadges.find(b => b.id === badgeId);
                        if (!badge) return null;
                        const IconComponent = badge.icon;
                        return (
                          <Badge key={badgeId} className={`${badge.color} text-white`}>
                            <IconComponent className="w-3 h-3 mr-1" />
                            {badge.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Account Upgrade for Guest Users */}
                {user.type === 'guest' && (
                  <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Upgrade to Email Account
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Create a permanent account with email and password to secure your profile and access more features.
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="upgrade-email">Email Address</Label>
                          <Input
                            id="upgrade-email"
                            type="email"
                            value={upgradeData.email}
                            onChange={(e) => setUpgradeData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter your email address"
                            disabled={isUpgrading}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="upgrade-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="upgrade-password"
                              type={showPassword ? "text" : "password"}
                              value={upgradeData.password}
                              onChange={(e) => setUpgradeData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Create a strong password"
                              disabled={isUpgrading}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              disabled={isUpgrading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* OTP Verification Section */}
                        {otpSent && (
                          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-3">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <Label className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                Email Verification
                              </Label>
                            </div>
                            
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              We've sent a 6-digit verification code to <strong>{upgradeData.email}</strong>
                            </p>
                            
                            <div>
                              <Label htmlFor="otp-input">Verification Code</Label>
                              <Input
                                id="otp-input"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter 6-digit code"
                                disabled={isUpgrading || isVerifyingOtp}
                                maxLength={6}
                                className="text-center text-lg tracking-widest font-mono"
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {otpTimer > 0 ? (
                                  `Resend code in ${otpTimer}s`
                                ) : (
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={resendOtp}
                                    disabled={isVerifyingOtp}
                                    className="p-0 h-auto text-xs"
                                  >
                                    Resend code
                                  </Button>
                                )}
                              </span>
                              <span className="text-green-600 dark:text-green-400">
                                {otp.length}/6 digits
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm mb-2">Benefits of Email Account:</h4>
                        <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                          <li>• Secure login with password protection</li>
                          <li>• Account recovery options</li>
                          <li>• Email notifications</li>
                          <li>• Data backup and sync</li>
                          <li>• Access from multiple devices</li>
                        </ul>
                      </div>

                      {!otpSent ? (
                        // Step 1: Send OTP
                        <Button 
                          onClick={sendOtp}
                          disabled={isVerifyingOtp || !upgradeData.email || !upgradeData.password}
                          className="w-full"
                        >
                          {isVerifyingOtp ? (
                            <>
                              <Mail className="w-4 h-4 mr-2 animate-pulse" />
                              Sending verification code...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Verification Code
                            </>
                          )}
                        </Button>
                      ) : (
                        // Step 2: Verify OTP and Create Account
                        <Button 
                          onClick={verifyOtp}
                          disabled={isUpgrading || otp.length !== 6}
                          className="w-full"
                        >
                          {isUpgrading ? (
                            <>
                              <Check className="w-4 h-4 mr-2 animate-pulse" />
                              Creating Email Account...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Verify Code & Create Account
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Message Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
                    </div>
                    <Switch
                      checked={settings.notifications.messages}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'messages', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Mentions</Label>
                      <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
                    </div>
                    <Switch
                      checked={settings.notifications.mentions}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'mentions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Group Invites</Label>
                      <p className="text-sm text-muted-foreground">Get notified when you're invited to groups</p>
                    </div>
                    <Switch
                      checked={settings.notifications.groupInvites}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'groupInvites', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">System Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified about app updates and news</p>
                    </div>
                    <Switch
                      checked={settings.notifications.systemUpdates}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'systemUpdates', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Sound Notifications</Label>
                      <p className="text-sm text-muted-foreground">Play sound for notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.soundEnabled}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'soundEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Vibration</Label>
                      <p className="text-sm text-muted-foreground">Vibrate for notifications on mobile</p>
                    </div>
                    <Switch
                      checked={settings.notifications.vibrationEnabled}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'vibrationEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Profile Visibility</Label>
                  <Select
                    value={settings.privacy.profileVisibility || ''}
                    onValueChange={(value) => handleSettingChange('privacy', 'profileVisibility', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                      <SelectItem value="friends">Friends - Only friends can see your profile</SelectItem>
                      <SelectItem value="private">Private - Only you can see your profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                    </div>
                    <Switch
                      checked={settings.privacy.showOnlineStatus}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'showOnlineStatus', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Allow Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">Allow others to send you direct messages</p>
                    </div>
                    <Switch
                      checked={settings.privacy.allowDirectMessages}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'allowDirectMessages', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Read Receipts</Label>
                      <p className="text-sm text-muted-foreground">Show when you've read messages</p>
                    </div>
                    <Switch
                      checked={settings.privacy.showReadReceipts}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'showReadReceipts', checked)}
                    />
                  </div>
                </div>

                {user.type === 'email' && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-4">Account Security</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="w-4 h-4 mr-2" />
                        Update Email
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Smartphone className="w-4 h-4 mr-2" />
                        Two-Factor Authentication
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </div>

                <div>
                  <Label>Font Size</Label>
                  <Select
                    value={settings.appearance.fontSize}
                    onValueChange={(value) => handleSettingChange('appearance', 'fontSize', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Use less space for messages</p>
                    </div>
                    <Switch
                      checked={settings.appearance.compactMode}
                      onCheckedChange={(checked) => handleSettingChange('appearance', 'compactMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Show Avatars</Label>
                      <p className="text-sm text-muted-foreground">Display profile pictures in chat</p>
                    </div>
                    <Switch
                      checked={settings.appearance.showAvatars}
                      onCheckedChange={(checked) => handleSettingChange('appearance', 'showAvatars', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Animations</Label>
                      <p className="text-sm text-muted-foreground">Enable smooth animations</p>
                    </div>
                    <Switch
                      checked={settings.appearance.animationsEnabled}
                      onCheckedChange={(checked) => handleSettingChange('appearance', 'animationsEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => handleSettingChange('language', 'value', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                      <SelectItem value="spanish">Español (Spanish)</SelectItem>
                      <SelectItem value="french">Français (French)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data & Storage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" onClick={handleDeleteAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={onLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
