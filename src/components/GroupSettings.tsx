import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  X, 
  Users, 
  Settings, 
  Crown, 
  Shield, 
  Star,
  UserMinus, 
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Upload,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  joinedDate: string;
  status: 'online' | 'offline';
  isPremium?: boolean;
}

interface GroupSettings {
  allowMembersToAddOthers: boolean;
  onlyAdminsCanSendMessages: boolean;
  groupDescription: string;
  groupRules: string;
  groupIcon?: string;
  groupWallpaper?: string;
  disappearingMessages: {
    enabled: boolean;
    duration: 1 | 15 | 30; // days
  };
}

interface BannedUser {
  id: string;
  name: string;
  avatar: string;
  bannedDate: string;
  bannedBy: string;
  reason?: string;
  messageContent?: string;
  messageId?: string;
}

interface MutedUser {
  id: string;
  name: string;
  avatar: string;
  mutedDate: string;
  mutedBy: string;
  mutedUntil?: string;
  reason?: string;
  messageContent?: string;
  messageId?: string;
}

interface GroupSettingsProps {
  groupName: string;
  groupSettings: GroupSettings;
  members: GroupMember[];
  bannedUsers?: BannedUser[];
  mutedUsers?: MutedUser[];
  currentUserRole: 'owner' | 'admin' | 'member';
  onClose: () => void;
  onUpdateSettings: (settings: GroupSettings) => void;
  onUpdateMemberRole: (memberId: string, newRole: 'admin' | 'member') => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateGroupLogo?: (logoUrl: string | undefined) => void;
  onUpdateGroupName?: (newName: string) => void;
  onUnbanUser?: (userId: string) => void;
  onUnmuteUser?: (userId: string) => void;
}

export const GroupSettingsModal = ({
  groupName,
  groupSettings,
  members,
  bannedUsers = [],
  mutedUsers = [],
  currentUserRole,
  onClose,
  onUpdateSettings,
  onUpdateMemberRole,
  onRemoveMember,
  onUpdateGroupLogo,
  onUpdateGroupName,
  onUnbanUser,
  onUnmuteUser
}: GroupSettingsProps) => {
  const [settings, setSettings] = useState(groupSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'moderation'>('general');
  const [groupLogo, setGroupLogo] = useState<string | undefined>(groupSettings.groupIcon);
  const [selectedWallpaper, setSelectedWallpaper] = useState<string | undefined>(groupSettings.groupWallpaper);
  const [currentGroupName, setCurrentGroupName] = useState(groupName);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Pre-available wallpapers organized by categories
  const wallpaperCategories = {
    nature: {
      name: 'Nature',
      wallpapers: [
        {
          id: 'mountains-1',
          name: 'Snow Mountains',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'forest-1',
          name: 'Dark Forest',
          url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'ocean-1',
          name: 'Ocean Waves',
          url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'sunset-1',
          name: 'Mountain Sunset',
          url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'beach-1',
          name: 'Tropical Beach',
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'lake-1',
          name: 'Mountain Lake',
          url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=600&fit=crop&crop=entropy&auto=format'
        }
      ]
    },
    gradients: {
      name: 'Gradients',
      wallpapers: [
        {
          id: 'gradient-blue',
          name: 'Blue Gradient',
          url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'gradient-purple',
          name: 'Purple Gradient',
          url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'gradient-pink',
          name: 'Pink Gradient',
          url: 'https://images.unsplash.com/photo-1557683304-673a23048d34?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'gradient-orange',
          name: 'Orange Gradient',
          url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'gradient-green',
          name: 'Green Gradient',
          url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'gradient-teal',
          name: 'Teal Gradient',
          url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&h=600&fit=crop&crop=entropy&auto=format'
        }
      ]
    },
    abstract: {
      name: 'Abstract',
      wallpapers: [
        {
          id: 'abstract-1',
          name: 'Blue Abstract',
          url: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'abstract-2',
          name: 'Geometric Shapes',
          url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'abstract-3',
          name: 'Fluid Art',
          url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'abstract-4',
          name: 'Color Splash',
          url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'abstract-5',
          name: 'Digital Art',
          url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'abstract-6',
          name: 'Wave Pattern',
          url: 'https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&h=600&fit=crop&crop=entropy&auto=format'
        }
      ]
    },
    minimal: {
      name: 'Minimal',
      wallpapers: [
        {
          id: 'minimal-1',
          name: 'Clean White',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'minimal-2',
          name: 'Soft Gray',
          url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'minimal-3',
          name: 'Light Blue',
          url: 'https://images.unsplash.com/photo-1618004912476-29818d81ae2e?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'minimal-4',
          name: 'Beige Tone',
          url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop&crop=entropy&auto=format'
        }
      ]
    },
    dark: {
      name: 'Dark Mode',
      wallpapers: [
        {
          id: 'dark-1',
          name: 'Dark Gray',
          url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'dark-2',
          name: 'Night Sky',
          url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'dark-3',
          name: 'Deep Blue',
          url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'dark-4',
          name: 'Carbon Black',
          url: 'https://images.unsplash.com/photo-1545670723-196ed0954986?w=800&h=600&fit=crop&crop=entropy&auto=format'
        },
        {
          id: 'dark-5',
          name: 'Space Stars',
          url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop&crop=entropy&auto=format'
        }
      ]
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('nature');

  const handleSettingsUpdate = (key: keyof GroupSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const handleGroupNameChange = (newName: string) => {
    setCurrentGroupName(newName);
    if (onUpdateGroupName) {
      onUpdateGroupName(newName);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 1MB)
      if (file.size > 1 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 1MB",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setGroupLogo(imageUrl);
        handleSettingsUpdate('groupIcon', imageUrl);
        onUpdateGroupLogo?.(imageUrl);
        toast({
          title: "Group logo updated",
          description: "Group logo has been successfully changed"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setGroupLogo(undefined);
    handleSettingsUpdate('groupIcon', undefined);
    onUpdateGroupLogo?.(undefined);
    toast({
      title: "Group logo removed",
      description: "Group logo has been removed"
    });
  };

  const handleWallpaperSelect = (wallpaperUrl: string) => {
    setSelectedWallpaper(wallpaperUrl);
    handleSettingsUpdate('groupWallpaper', wallpaperUrl);
    toast({
      title: "Wallpaper updated",
      description: "Group wallpaper has been changed"
    });
  };

  const handleRemoveWallpaper = () => {
    setSelectedWallpaper(undefined);
    handleSettingsUpdate('groupWallpaper', undefined);
    toast({
      title: "Wallpaper removed",
      description: "Default wallpaper restored"
    });
  };

  const canModifySettings = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleAddMember = async () => {
    if (!newMemberUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    setIsAddingMember(true);
    
    // Simulate API call to add member
    setTimeout(() => {
      // Check if user already exists in group
      const userExists = members.some(member => 
        member.name.toLowerCase() === newMemberUsername.toLowerCase()
      );

      if (userExists) {
        toast({
          title: "User already in group",
          description: "This user is already a member of the group",
          variant: "destructive"
        });
      } else {
        // In real app, this would make API call to backend
        toast({
          title: "Member added successfully",
          description: `${newMemberUsername} has been added to the group`
        });
        setShowAddMemberModal(false);
        setNewMemberUsername("");
      }
      
      setIsAddingMember(false);
    }, 1000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Filter members based on search query
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Group Settings
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              General
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Members ({members.length})
            </button>
            {canManageMembers && (
              <button
                onClick={() => setActiveTab('moderation')}
                className={`flex-1 p-3 text-sm font-medium transition-colors ${
                  activeTab === 'moderation'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Moderation
              </button>
            )}
          </div>

          <ScrollArea className="h-96">
            {activeTab === 'general' && (
              <div className="p-6 space-y-6">
                {/* Group Logo */}
                <div className="space-y-2">
                  <Label>Group Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16">
                        {groupLogo ? (
                          <AvatarImage src={groupLogo} alt={groupName} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                            {groupName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-1 space-y-2">
                      {canModifySettings && (
                        <>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Logo
                            </Button>
                            {groupLogo && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRemoveLogo}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Upload an image (max 1MB). Recommended: 512x512px
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Group Wallpaper */}
                {canModifySettings && (
                  <div className="space-y-2">
                    <Label>Group Wallpaper</Label>
                    <div className="space-y-3">
                      {/* Current Wallpaper Preview */}
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-dashed border-muted">
                        {selectedWallpaper ? (
                          <img 
                            src={selectedWallpaper} 
                            alt="Current wallpaper" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No wallpaper selected</span>
                          </div>
                        )}
                      </div>

                      {/* Wallpaper Categories and Grid */}
                      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                          {Object.entries(wallpaperCategories).map(([key, category]) => (
                            <TabsTrigger key={key} value={key} className="text-xs">
                              {category.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {Object.entries(wallpaperCategories).map(([key, category]) => (
                          <TabsContent key={key} value={key} className="mt-4">
                            <div className="grid grid-cols-3 gap-3">
                              {category.wallpapers.map((wallpaper) => (
                                <div key={wallpaper.id} className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => handleWallpaperSelect(wallpaper.url)}
                                    className={`w-full h-20 rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                                      selectedWallpaper === wallpaper.url 
                                        ? 'border-primary ring-2 ring-primary/20' 
                                        : 'border-muted hover:border-primary/50'
                                    }`}
                                  >
                                    <img 
                                      src={wallpaper.url} 
                                      alt={wallpaper.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                  <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    {wallpaper.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>

                      {/* Remove Wallpaper Button */}
                      {selectedWallpaper && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRemoveWallpaper}
                          className="w-full"
                        >
                          Remove Wallpaper
                        </Button>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Select a wallpaper to customize your group chat background
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Group Name */}
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={currentGroupName}
                    onChange={(e) => handleGroupNameChange(e.target.value)}
                    disabled={!canModifySettings}
                    placeholder="Enter group name"
                  />
                </div>

                {/* Group Description */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="groupDescription">Description</Label>
                    <span className="text-sm text-muted-foreground">
                      {(settings.groupDescription || '').length}/500
                    </span>
                  </div>
                  <Textarea
                    id="groupDescription"
                    value={settings.groupDescription || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 500) {
                        handleSettingsUpdate('groupDescription', value);
                      }
                    }}
                    disabled={!canModifySettings}
                    placeholder="Enter group description (max 500 characters)"
                    rows={3}
                  />
                </div>

                {/* Group Rules */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="groupRules">Group Rules</Label>
                    <span className="text-sm text-muted-foreground">
                      {(settings.groupRules || '').length}/1000
                    </span>
                  </div>
                  <Textarea
                    id="groupRules"
                    value={settings.groupRules || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 1000) {
                        handleSettingsUpdate('groupRules', value);
                      }
                    }}
                    disabled={!canModifySettings}
                    placeholder="Enter group rules and guidelines (max 1000 characters)"
                    rows={4}
                  />
                </div>

                <Separator />

                {/* Group Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Permissions</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Members can add others</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow members to invite new people to the group
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowMembersToAddOthers}
                      onCheckedChange={(value) => handleSettingsUpdate('allowMembersToAddOthers', value)}
                      disabled={!canModifySettings}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Only admins can send messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Restrict messaging to admins and owners only
                      </p>
                    </div>
                    <Switch
                      checked={settings.onlyAdminsCanSendMessages}
                      onCheckedChange={(value) => handleSettingsUpdate('onlyAdminsCanSendMessages', value)}
                      disabled={!canModifySettings}
                    />
                  </div>

                  {/* Disappearing Messages */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Disappearing Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Auto-delete messages after selected time period
                        </p>
                      </div>
                      <Switch
                        checked={settings.disappearingMessages.enabled}
                        onCheckedChange={(value) => 
                          handleSettingsUpdate('disappearingMessages', {
                            ...settings.disappearingMessages,
                            enabled: value
                          })
                        }
                        disabled={!canModifySettings}
                      />
                    </div>

                    {settings.disappearingMessages.enabled && (
                      <div className="ml-4 space-y-2">
                        <Label className="text-sm">Delete messages after</Label>
                        <Select
                          value={settings.disappearingMessages.duration.toString()}
                          onValueChange={(value) => 
                            handleSettingsUpdate('disappearingMessages', {
                              ...settings.disappearingMessages,
                              duration: parseInt(value) as 1 | 15 | 30
                            })
                          }
                          disabled={!canModifySettings}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="15">15 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Pinned and system messages are never deleted
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="p-6">
                {/* Search Box */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members by name or role..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {memberSearchQuery && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Found {filteredMembers.length} member(s) matching "{memberSearchQuery}"
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} border-2 border-background rounded-full`}></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            {getRoleIcon(member.role)}
                            {member.isPremium && (
                              <Star className="w-4 h-4 text-purple-500 fill-purple-500 premium-star" />
                            )}
                            <Badge variant={member.role === 'owner' ? 'default' : member.role === 'admin' ? 'secondary' : 'outline'}>
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Joined {member.joinedDate}
                          </p>
                        </div>
                      </div>

                      {canManageMembers && member.role !== 'owner' && member.id !== 'current-user' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role === 'member' && currentUserRole === 'owner' && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  onUpdateMemberRole(member.id, 'admin');
                                  toast({ title: `${member.name} is now an admin` });
                                }}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {member.role === 'admin' && currentUserRole === 'owner' && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  onUpdateMemberRole(member.id, 'member');
                                  toast({ title: `${member.name} is now a member` });
                                }}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Remove Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                onRemoveMember(member.id);
                                toast({ 
                                  title: `${member.name} removed from group`,
                                  variant: "destructive"
                                });
                              }}
                              className="text-red-600"
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Remove from Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No members found</h3>
                      <p className="text-muted-foreground">
                        No members match your search criteria. Try a different search term.
                      </p>
                    </div>
                  )}

                  {canManageMembers && (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setShowAddMemberModal(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Members
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'moderation' && (
              <div className="p-6 space-y-6">
                {/* Banned Users Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserMinus className="w-5 h-5 text-destructive" />
                    <h3 className="text-lg font-semibold">Banned Users</h3>
                    <Badge variant="destructive" className="text-xs">
                      {bannedUsers.length}
                    </Badge>
                  </div>
                  
                  {bannedUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserMinus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No banned users</p>
                      <p className="text-sm">Users banned from this group will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bannedUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-destructive text-destructive-foreground">
                                {user.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Banned by {user.bannedBy} • {new Date(user.bannedDate).toLocaleDateString()}
                              </p>
                              {user.reason && (
                                <p className="text-xs text-destructive mt-1">
                                  Reason: {user.reason}
                                </p>
                              )}
                              {user.messageContent && (
                                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
                                  <p className="text-destructive font-medium mb-1">Offending message:</p>
                                  <p className="text-muted-foreground italic">"{user.messageContent}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                          {onUnbanUser && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUnbanUser(user.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Unban
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Muted Users Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserMinus className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">Muted Users</h3>
                    <Badge variant="secondary" className="text-xs">
                      {mutedUsers.length}
                    </Badge>
                  </div>
                  
                  {mutedUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserMinus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No muted users</p>
                      <p className="text-sm">Users muted in this group will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mutedUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-orange-100 text-orange-700">
                                {user.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Muted by {user.mutedBy} • {new Date(user.mutedDate).toLocaleDateString()}
                              </p>
                              {user.mutedUntil && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Until: {new Date(user.mutedUntil).toLocaleString()}
                                </p>
                              )}
                              {user.reason && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Reason: {user.reason}
                                </p>
                              )}
                              {user.messageContent && (
                                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded text-xs">
                                  <p className="text-orange-700 dark:text-orange-300 font-medium mb-1">Offending message:</p>
                                  <p className="text-muted-foreground italic">"{user.messageContent}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                          {onUnmuteUser && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUnmuteUser(user.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Unmute
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New Member
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username to add..."
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isAddingMember) {
                      handleAddMember();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the exact username of the person you want to add to this group.
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setNewMemberUsername("");
                  }}
                  disabled={isAddingMember}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={!newMemberUsername.trim() || isAddingMember}
                >
                  {isAddingMember ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
