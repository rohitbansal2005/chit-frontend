import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageActions } from "@/components/MessageActions";
import { EmojiPicker } from "@/components/EmojiPicker";
import { GroupSettingsModal } from "@/components/GroupSettings";
import { ReportModal } from "@/components/ReportModal";
import { UserActionsMenu } from "@/components/UserActionsMenu";
import { MuteDurationModal } from "@/components/MuteDurationModal";
import { MuteCountdown } from "@/components/MuteCountdown";
import { toast } from "@/hooks/use-toast";
import { 
  Send, 
  Smile, 
  MoreVertical, 
  Plus,
  Search,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Mic,
  MicOff,
  Crown,
  Shield,
  Star,
  FileText,
  VolumeX,
  X,
  LogOut,
  Share2,
  Trash2,
  Users,
  Link,
  Pin,
  PinOff,
  Timer,
  UserPlus,
  Ban,
  Eye,
  SkipForward
} from "lucide-react";

interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
  avatar: string;
  type: 'text' | 'system';
  userId: string;
  replyTo?: string;
  edited?: boolean;
  pinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: string;
  timestamp?: number; // Unix timestamp for auto-deletion
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds who reacted
  userRole?: 'owner' | 'admin' | 'member';
  userIsPremium?: boolean;
}

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

interface ChatRoomProps {
  roomName: string;
  roomType: 'public' | 'private' | 'dm';
  participants: number;
  onBack: () => void;
  currentUser?: User;
  roomImage?: string;
  onNextRandomChat?: () => void; // For random chat functionality
}

export const ChatRoom = ({ roomName, roomType, participants, onBack, currentUser, roomImage, onNextRandomChat }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      user: "System",
      message: `Welcome to ${roomName}! Be respectful and have fun chatting.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: "S",
      type: "system",
      userId: "system",
      timestamp: Date.now()
    },
    {
      id: "2",
      user: "Alice",
      message: "Hey everyone! How's it going? 😊",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: "A",
      type: "text",
      userId: "user-alice",
      userRole: "admin",
      userIsPremium: true,
      pinned: true,
      pinnedBy: "Admin",
      pinnedAt: "2 hours ago",
      reactions: {
        "👍": ["user-bob", "user-charlie"],
        "❤️": ["user-bob"]
      }
    },
    {
      id: "3",
      user: "Bob",
      message: "Great! Just working on some new features. The new reactions are awesome! 🚀",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: "B",
      type: "text",
      userId: "user-bob",
      userRole: "member",
      userIsPremium: true,
      pinned: true,
      pinnedBy: "Owner",
      pinnedAt: "1 hour ago",
      reactions: {
        "🔥": ["user-alice", "current-user"],
        "💯": ["user-alice"]
      }
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{userId: string, userName: string}[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showGroupRules, setShowGroupRules] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMuteDurationModal, setShowMuteDurationModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showPinnedMessagesModal, setShowPinnedMessagesModal] = useState(false);
  const [muteTarget, setMuteTarget] = useState<{userId: string, userName: string, messageId?: string, messageContent?: string} | null>(null);
  const [reportTarget, setReportTarget] = useState<{messageId: string, userId: string, userName: string} | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [currentGroupLogo, setCurrentGroupLogo] = useState<string | undefined>(roomImage);
  const [currentRoomName, setCurrentRoomName] = useState(roomName);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Group settings and members
  const [groupSettings, setGroupSettings] = useState<GroupSettings>({
    allowMembersToAddOthers: true,
    onlyAdminsCanSendMessages: false,
    groupDescription: "Welcome to our awesome group chat! Feel free to share ideas and have fun.",
    groupRules: "1. Be respectful to all members\n2. No spam or irrelevant content\n3. Use appropriate language\n4. Stay on topic\n5. Have fun!",
    groupIcon: roomImage,
    groupWallpaper: undefined,
    disappearingMessages: {
      enabled: false,
      duration: 1
    }
  });

  const [groupMembers] = useState<GroupMember[]>([
    {
      id: "current-user",
      name: currentUser?.name || "You",
      avatar: currentUser?.name?.charAt(0).toUpperCase() || "Y",
      role: "owner",
      joinedDate: "Dec 2024",
      status: "online"
    },
    {
      id: "user-alice",
      name: "Alice",
      avatar: "A",
      role: "admin",
      joinedDate: "Dec 2024",
      status: "online",
      isPremium: true
    },
    {
      id: "user-bob",
      name: "Bob",
      avatar: "B",
      role: "member",
      joinedDate: "Dec 2024",
      status: "online",
      isPremium: true
    },
    {
      id: "user-charlie",
      name: "Charlie",
      avatar: "C",
      role: "member",
      joinedDate: "Dec 2024",
      status: "offline"
    },
    {
      id: "user-david",
      name: "David",
      avatar: "D",
      role: "member",
      joinedDate: "Nov 2024",
      status: "offline"
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize pinned messages from existing messages
  useEffect(() => {
    const initialPinnedMessages = messages.filter(msg => msg.pinned);
    setPinnedMessages(initialPinnedMessages);
  }, []);

  // Auto-delete messages based on disappearing messages setting
  useEffect(() => {
    if (!groupSettings.disappearingMessages.enabled) return;

    const checkExpiredMessages = () => {
      const now = Date.now();
      const durationMs = groupSettings.disappearingMessages.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      
      setMessages(prev => prev.filter(msg => {
        // Don't delete system messages or pinned messages
        if (msg.type === 'system' || msg.pinned) return true;
        
        // Delete if message is older than the set duration
        if (msg.timestamp && (now - msg.timestamp) > durationMs) {
          return false;
        }
        return true;
      }));
    };

    // Check every hour for expired messages
    const interval = setInterval(checkExpiredMessages, 60 * 60 * 1000);
    
    // Also check immediately
    checkExpiredMessages();

    return () => clearInterval(interval);
  }, [groupSettings.disappearingMessages]);

  useEffect(() => {
    // Cleanup function for voice recording
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [mediaRecorder]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || isRecording) return;

    if (editingMessage) {
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage 
          ? { ...msg, message: newMessage.trim(), edited: true }
          : msg
      ));
      setEditingMessage(null);
      toast({ title: "Message updated" });
    } else {
      const message: Message = {
        id: Date.now().toString(),
        user: currentUser?.name || "You",
        message: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: currentUser?.avatar || currentUser?.name?.charAt(0).toUpperCase() || "Y",
        type: "text",
        userId: "current-user",
        userRole: "owner", // Current user is owner
        userIsPremium: false, // Can be dynamic based on user subscription
        replyTo: replyingTo || undefined,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, message]);
      
      // Simulate someone else typing and responding
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const responses = [
          "That's interesting! Tell me more 😊",
          "I agree with that point of view",
          "Thanks for sharing that!",
          "Great conversation topic!",
          "What's your experience with that?"
        ];
        const response: Message = {
          id: (Date.now() + 1).toString(),
          user: "Alex",
          message: responses[Math.floor(Math.random() * responses.length)],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: "A",
          type: "text",
          userId: "alex-123"
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }

    setNewMessage("");
    setReplyingTo(null);
  };

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReplyingTo(messageId);
      toast({ title: `Replying to ${message.user}` });
    }
  };

  const handleEdit = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.userId === "current-user") {
      setEditingMessage(messageId);
      setNewMessage(message.message);
      toast({ title: "Editing message" });
    }
  };

  const handleDelete = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    toast({ title: "Message deleted", variant: "destructive" });
  };

  const handleReport = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReportTarget({
        messageId: messageId,
        userId: message.userId,
        userName: message.user
      });
      setShowReportModal(true);
    }
  };

  const handleBlock = (userId: string) => {
    toast({ title: "User blocked", description: "You won't see messages from this user anymore." });
  };

  const handleStartDM = (userId: string) => {
    const message = messages.find(m => m.userId === userId);
    const userName = message?.user || "User";
    
    // Don't DM yourself
    if (userId === 'current-user') {
      toast({
        title: "Cannot DM yourself",
        description: "You cannot send a direct message to yourself.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to DM or create new conversation
    toast({ 
      title: "Opening DM", 
      description: `Starting conversation with ${userName}...` 
    });

    // TODO: Implement actual DM navigation
    // For now, we'll simulate opening a DM
    setTimeout(() => {
      if (onBack) {
        onBack(); // Go back to chat list
        // In a real app, this would navigate to the DM with this user
      }
    }, 1000);
  };

  const handleMentionUser = (userId: string) => {
    const message = messages.find(m => m.userId === userId);
    const userName = message?.user || "User";
    
    // Don't mention yourself
    if (userId === 'current-user') {
      return;
    }
    
    // Add @mention to the input
    const mention = `@${userName} `;
    setNewMessage(prev => {
      // If already typing, add mention at the end
      if (prev.trim()) {
        return prev + " " + mention;
      }
      // If empty, just add the mention
      return mention;
    });
    
    // Focus the input
    const inputElement = document.querySelector('input[placeholder*="Type"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
    
    toast({ 
      title: "User mentioned", 
      description: `@${userName} added to message`,
      duration: 1500
    });
  };

  // User Actions Handlers
  const handleViewProfile = (userId: string) => {
    const user = groupMembers.find(m => m.id === userId);
    const userName = user?.name || "User";
    
    toast({
      title: "Profile",
      description: `Viewing ${userName}'s profile...`,
      duration: 2000
    });
    
    // TODO: Implement profile modal or navigation
    console.log(`Viewing profile for user: ${userId} (${userName})`);
  };

  const handleAddFriend = (userId: string) => {
    const user = groupMembers.find(m => m.id === userId);
    const userName = user?.name || "User";
    
    toast({
      title: "Friend Request Sent",
      description: `Sent friend request to ${userName}`,
      duration: 2000
    });
    
    // TODO: Implement actual friend request logic
    console.log(`Adding friend: ${userId} (${userName})`);
  };

  const handleBlockUser = (userId: string) => {
    const user = groupMembers.find(m => m.id === userId);
    const userName = user?.name || "User";
    
    toast({
      title: "User Blocked",
      description: `${userName} has been blocked`,
      variant: "destructive",
      duration: 2000
    });
    
    // TODO: Implement actual blocking logic
    console.log(`Blocking user: ${userId} (${userName})`);
  };

  const handleBanUser = (userId: string, messageId?: string, messageContent?: string) => {
    const user = groupMembers.find(m => m.id === userId);
    const userName = user?.name || "User";
    
    const newBannedUser: BannedUser = {
      id: userId,
      name: userName,
      avatar: user?.avatar || userName.charAt(0).toUpperCase(),
      bannedDate: new Date().toISOString(),
      bannedBy: currentUser?.name || "Admin",
      reason: messageContent ? "Inappropriate message" : "Banned by admin",
      messageContent: messageContent,
      messageId: messageId
    };
    
    setBannedUsers(prev => [...prev, newBannedUser]);
    
    toast({
      title: "User Banned",
      description: `${userName} has been banned from the group`,
      variant: "destructive",
      duration: 3000
    });
    
    console.log(`Banning user: ${userId} (${userName})`);
  };

  const handleMuteUser = (userId: string, messageId?: string, messageContent?: string) => {
    const user = groupMembers.find(m => m.id === userId);
    const userName = user?.name || "User";
    
    setMuteTarget({
      userId,
      userName,
      messageId,
      messageContent
    });
    setShowMuteDurationModal(true);
  };

  const handleMuteConfirm = (durationHours: number | null) => {
    if (!muteTarget) return;
    
    const { userId, userName, messageId, messageContent } = muteTarget;
    const user = groupMembers.find(m => m.id === userId);
    
    let mutedUntil: string | undefined;
    let reason: string;
    
    if (durationHours === null) {
      // Permanent mute
      mutedUntil = undefined;
      reason = messageContent ? "Inappropriate message - Permanent mute" : "Permanently muted";
    } else {
      // Temporary mute
      const muteEndDate = new Date();
      muteEndDate.setHours(muteEndDate.getHours() + durationHours);
      mutedUntil = muteEndDate.toISOString();
      
      const days = Math.floor(durationHours / 24);
      if (days > 0) {
        reason = messageContent ? `Inappropriate message - ${days} day${days > 1 ? 's' : ''}` : `Muted for ${days} day${days > 1 ? 's' : ''}`;
      } else {
        reason = messageContent ? `Inappropriate message - ${durationHours} hour${durationHours > 1 ? 's' : ''}` : `Muted for ${durationHours} hour${durationHours > 1 ? 's' : ''}`;
      }
    }
    
    const newMutedUser: MutedUser = {
      id: userId,
      name: userName,
      avatar: user?.avatar || userName.charAt(0).toUpperCase(),
      mutedDate: new Date().toISOString(),
      mutedBy: currentUser?.name || "Admin",
      mutedUntil: mutedUntil,
      reason: reason,
      messageContent: messageContent,
      messageId: messageId
    };
    
    setMutedUsers(prev => [...prev, newMutedUser]);
    
    toast({
      title: "User Muted",
      description: durationHours === null 
        ? `${userName} has been permanently muted`
        : `${userName} has been muted for ${Math.floor(durationHours / 24) > 0 ? Math.floor(durationHours / 24) + ' days' : durationHours + ' hours'}`,
      variant: "default",
      duration: 3000
    });
    
    setMuteTarget(null);
    console.log(`Muting user: ${userId} (${userName}) ${durationHours === null ? 'permanently' : 'until ' + new Date(Date.now() + durationHours * 60 * 60 * 1000).toLocaleString()}`);
  };

  const handleDeleteMessageByMod = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    const userName = message?.user || "User";
    
    setMessages(messages.filter(m => m.id !== messageId));
    
    toast({
      title: "Message Deleted",
      description: `Message from ${userName} has been removed`,
      variant: "destructive",
      duration: 2000
    });
    
    console.log(`Moderator deleted message: ${messageId}`);
  };

  const handleUnbanUser = (userId: string) => {
    const user = bannedUsers.find(u => u.id === userId);
    setBannedUsers(prev => prev.filter(u => u.id !== userId));
    
    toast({
      title: "User Unbanned",
      description: `${user?.name || "User"} has been unbanned`,
      duration: 2000
    });
  };

  const handleUnmuteUser = (userId: string) => {
    const user = mutedUsers.find(u => u.id === userId);
    setMutedUsers(prev => prev.filter(u => u.id !== userId));
    
    toast({
      title: "User Unmuted",
      description: `${user?.name || "User"} can now send messages`,
      duration: 2000
    });
  };

  const handleReportUser = (userId: string, userName: string) => {
    setReportTarget({
      messageId: 'user-report',
      userId,
      userName
    });
    setShowReportModal(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Maximum image size is 1MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "File type not supported",
        description: "Only images are supported (JPEG, PNG, GIF, WebP)",
        variant: "destructive"
      });
      return;
    }

    // Set selected image for preview
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    
    // Focus the input
    const inputElement = document.querySelector('input[placeholder*="Type"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Default behavior: Send voice message automatically (when stopped via Stop button)
        const voiceMessage: Message = {
          id: Date.now().toString(),
          user: currentUser?.name || "You",
          message: `🎤 Voice message (${recordingTime}s)`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: currentUser?.avatar || currentUser?.name?.charAt(0).toUpperCase() || "Y",
          type: "text",
          userId: "current-user",
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, voiceMessage]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Voice message sent",
          description: `Recorded ${recordingTime} seconds`,
        });
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recorder.start();

      toast({ title: "Recording started" });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    // Check if user is muted
    if (isCurrentUserMuted()) {
      toast({
        title: "Cannot React",
        description: "You are muted and cannot react to messages",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    const currentUserId = "current-user";
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...(msg.reactions || {}) };
        
        // If reaction exists, toggle user's reaction
        if (reactions[emoji]) {
          const userIndex = reactions[emoji].indexOf(currentUserId);
          if (userIndex > -1) {
            // Remove user's reaction
            reactions[emoji] = reactions[emoji].filter(id => id !== currentUserId);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            // Add user's reaction
            reactions[emoji].push(currentUserId);
          }
        } else {
          // Create new reaction
          reactions[emoji] = [currentUserId];
        }
        
        return { ...msg, reactions };
      }
      return msg;
    }));

    toast({
      title: "Reaction added",
      description: `You reacted with ${emoji}`,
      duration: 1000
    });
  };

  const handleUpdateGroupSettings = (newSettings: GroupSettings) => {
    setGroupSettings(newSettings);
    toast({
      title: "Group settings updated",
      description: "Changes have been saved successfully."
    });
  };

  const handleUpdateGroupLogo = (logoUrl: string | undefined) => {
    setCurrentGroupLogo(logoUrl);
    setGroupSettings(prev => ({ ...prev, groupIcon: logoUrl }));
    toast({
      title: "Group logo updated",
      description: "Group appearance has been updated."
    });
  };

  const handleUpdateGroupName = (newName: string) => {
    setCurrentRoomName(newName);
    toast({
      title: "Group name updated",
      description: "Group name has been changed successfully."
    });
  };

  const handleUpdateMemberRole = (memberId: string, newRole: 'admin' | 'member') => {
    // In real app, this would update the backend
    console.log(`Updating ${memberId} role to ${newRole}`);
  };

  const handleRemoveMember = (memberId: string) => {
    // In real app, this would remove member from backend
    console.log(`Removing member ${memberId}`);
  };

  const getCurrentUserRole = (): 'owner' | 'admin' | 'member' => {
    const currentMember = groupMembers.find(m => m.id === 'current-user');
    return currentMember?.role || 'member';
  };

  const isCurrentUserMuted = () => {
    const currentUserId = 'current-user';
    const mutedUser = mutedUsers.find(u => u.id === currentUserId);
    
    if (!mutedUser) return null;
    
    // Check if permanent mute
    if (!mutedUser.mutedUntil) return mutedUser;
    
    // Check if mute has expired
    const now = new Date();
    const muteEnd = new Date(mutedUser.mutedUntil);
    
    if (now >= muteEnd) {
      // Auto-unmute if expired
      setMutedUsers(prev => prev.filter(u => u.id !== currentUserId));
      return null;
    }
    
    return mutedUser;
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // When clicked from mic button, show preview
      stopVoiceRecordingForPreview();
    } else {
      startVoiceRecording();
    }
  };

  const stopVoiceRecording = () => {
    // This function auto-sends the voice message (for Stop button in recording indicator)
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop(); // This will trigger the onstop handler which sends the message
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const stopVoiceRecordingForPreview = () => {
    // This function shows preview UI (for mic button)
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Override the onstop handler to show preview instead of auto-sending
      mediaRecorder.onstop = () => {
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      };
      
      // Override ondataavailable to capture for preview
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedAudio(event.data);
          const audioUrl = URL.createObjectURL(event.data);
          setRecordedAudioUrl(audioUrl);
        }
      };
      
      mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  // Send and Cancel functions for media
  const handleSendImage = () => {
    if (!selectedImage || !selectedImagePreview) return;

    // Add image message
    const message: Message = {
      id: Date.now().toString(),
      user: currentUser?.name || "You",
      message: `📷 Image: ${selectedImage.name}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: currentUser?.avatar || currentUser?.name?.charAt(0).toUpperCase() || "Y",
      type: "text",
      userId: "current-user",
      userRole: "owner",
      userIsPremium: false,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, message]);
    
    // Clear selection
    setSelectedImage(null);
    setSelectedImagePreview(null);
    
    toast({
      title: "Image sent",
      description: "Your image has been shared"
    });
  };

  const handleSendAudio = () => {
    if (!recordedAudio || !recordedAudioUrl) return;

    // Add voice message
    const message: Message = {
      id: Date.now().toString(),
      user: currentUser?.name || "You",
      message: `🎤 Voice message (${recordingTime}s)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: currentUser?.avatar || currentUser?.name?.charAt(0).toUpperCase() || "Y",
      type: "text",
      userId: "current-user",
      userRole: "owner",
      userIsPremium: false,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, message]);
    
    // Clear recording
    setRecordedAudio(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    
    toast({
      title: "Voice message sent",
      description: "Your voice message has been shared"
    });
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    if (selectedImagePreview) {
      setSelectedImagePreview(null);
    }
  };

  const handleCancelAudio = () => {
    setRecordedAudio(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
  };

  // Pin/Unpin message functions
  const handlePinMessage = (messageId: string) => {
    const userRole = getCurrentUserRole();
    if (userRole !== 'owner' && userRole !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins and owners can pin messages",
        variant: "destructive"
      });
      return;
    }

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Update message with pin info
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            pinned: true, 
            pinnedBy: currentUser?.name || "Admin",
            pinnedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        : msg
    ));

    // Add to pinned messages list
    const updatedMessage = { 
      ...message, 
      pinned: true, 
      pinnedBy: currentUser?.name || "Admin",
      pinnedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setPinnedMessages(prev => [...prev, updatedMessage]);

    toast({
      title: "Message pinned",
      description: "Message has been pinned to the top"
    });
  };

  const handleUnpinMessage = (messageId: string) => {
    const userRole = getCurrentUserRole();
    if (userRole !== 'owner' && userRole !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins and owners can unpin messages",
        variant: "destructive"
      });
      return;
    }

    // Update message to remove pin
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            pinned: false, 
            pinnedBy: undefined,
            pinnedAt: undefined
          }
        : msg
    ));

    // Remove from pinned messages list
    setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));

    toast({
      title: "Message unpinned",
      description: "Message has been unpinned"
    });
  };

  // Header menu functions
  const handleLeaveRoom = () => {
    toast({ title: "Left the room", description: "You have left the group" });
    onBack();
  };

  const handleShareRoom = () => {
    const roomLink = `${window.location.origin}/room/${roomName}`;
    navigator.clipboard.writeText(roomLink);
    toast({ title: "Link copied!", description: "Room link copied to clipboard" });
  };

  const handleClearAllMessages = () => {
    if (getCurrentUserRole() === 'owner' || getCurrentUserRole() === 'admin') {
      setMessages([{
        id: "system-clear",
        user: "System",
        message: `All messages have been cleared by ${currentUser?.name || 'Admin'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: "S",
        type: "system",
        userId: "system"
      }]);
      toast({ title: "Messages cleared", description: "All messages have been cleared" });
    }
  };

  const handleDeleteRoom = () => {
    if (getCurrentUserRole() === 'owner') {
      toast({ title: "Room deleted", description: "This room has been permanently deleted" });
      onBack();
    }
  };

  // Typing indicator functions
  const handleTypingStart = () => {
    // Simulate sending typing status to other users
    if (!isTyping) {
      setIsTyping(true);
      
      // Add other users typing (simulation)
      const otherTypingUsers = [
        { userId: 'user-alice', userName: 'Alice' },
        { userId: 'user-bob', userName: 'Bob' }
      ];
      
      // Randomly show someone else typing occasionally
      if (Math.random() > 0.7) {
        const randomUser = otherTypingUsers[Math.floor(Math.random() * otherTypingUsers.length)];
        setTypingUsers(prev => {
          const exists = prev.find(u => u.userId === randomUser.userId);
          if (!exists) {
            return [...prev, randomUser];
          }
          return prev;
        });
        
        // Stop their typing after 2-4 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== randomUser.userId));
        }, Math.random() * 2000 + 2000);
      }
    }
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTypingStart();
    handleTypingStop();
  };

  // Filter members based on search query
  const filteredOnlineMembers = groupMembers.filter(member => 
    member.status === 'online' && 
    member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const filteredOfflineMembers = groupMembers.filter(member => 
    member.status === 'offline' && 
    member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  // For DM rooms, create dummy members for search
  const dmMembers = [
    { id: 'current-user', name: 'You', status: 'online' },
    { id: 'dm-partner', name: 'Alex', status: 'online' }
  ];

  const filteredDMMembers = dmMembers.filter(member => 
    member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="border-b bg-card px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden p-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onBack} className="hidden md:flex">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                {currentGroupLogo && (
                  <AvatarImage src={currentGroupLogo} alt={currentRoomName} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentRoomName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-base md:text-lg truncate">{currentRoomName}</h2>
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="text-xs md:text-sm text-muted-foreground truncate">
                    {roomType !== 'dm' && groupSettings.groupDescription ? 
                      (groupSettings.groupDescription.length > 40 ? 
                        groupSettings.groupDescription.substring(0, 40) + "..." : 
                        groupSettings.groupDescription
                      ) : 
                      `${participants} members online`
                    }
                  </span>
                  {roomType === 'private' && (
                    <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Private</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Disappearing Messages Timer Icon */}
              {groupSettings.disappearingMessages.enabled && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full">
                  <Timer className="w-3 h-3 text-orange-600" />
                  <span className="text-xs text-orange-600 font-medium">
                    {groupSettings.disappearingMessages.duration}d
                  </span>
                </div>
              )}
              
              {roomType === 'dm' && (
                <>
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <Video className="w-4 h-4" />
                  </Button>
                </>
              )}
              {/* Next button for random chat */}
              {roomName.toLowerCase().includes('random') && onNextRandomChat && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onNextRandomChat}
                  className="chat-gradient text-white"
                  title="Find Next Random User"
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Next</span>
                </Button>
              )}
              {roomType !== 'dm' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowGroupRules(true)}
                  title="View Group Rules"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
              {roomType !== 'dm' && (getCurrentUserRole() === 'owner' || getCurrentUserRole() === 'admin') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowGroupSettings(true)}
                  title="Group Settings"
                >
                  <Info className="w-4 h-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-2"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Common options for all users - only show in group rooms */}
                  {roomType !== 'dm' && (
                    <>
                      <DropdownMenuItem onClick={() => setShowGroupRules(true)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Group Info
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareRoom}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Room Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* Staff options (Admin & Owner) - only in group rooms */}
                  {roomType !== 'dm' && (getCurrentUserRole() === 'owner' || getCurrentUserRole() === 'admin') && (
                    <>
                      <DropdownMenuItem onClick={handleClearAllMessages}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Messages
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* Owner only options - only in group rooms */}
                  {roomType !== 'dm' && getCurrentUserRole() === 'owner' && (
                    <>
                      <DropdownMenuItem 
                        onClick={handleDeleteRoom}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Room
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* Leave room for all users - different text for DM vs Group */}
                  <DropdownMenuItem 
                    onClick={handleLeaveRoom}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {roomType === 'dm' ? 'Close DM' : 'Leave Room'}
                  </DropdownMenuItem>

                  {/* DM-specific options */}
                  {roomType === 'dm' && (
                    <>
                      <DropdownMenuItem onClick={() => handleViewProfile(dmMembers.find(m => m.id !== 'current-user')?.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddFriend(dmMembers.find(m => m.id !== 'current-user')?.id)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBlockUser(dmMembers.find(m => m.id !== 'current-user')?.id)} className="text-red-600 focus:text-red-600">
                        <Ban className="w-4 h-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleClearAllMessages}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Messages
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Fixed Pinned Messages */}
        {roomType !== 'dm' && pinnedMessages.length > 0 && (
          <div 
            className="bg-accent/50 backdrop-blur-sm border-b border-accent px-3 md:px-4 py-2 cursor-pointer hover:bg-accent/60 transition-colors"
            onClick={() => setShowPinnedMessagesModal(true)}
          >
            <div className="flex items-center gap-2 text-sm">
              <Pin className="w-4 h-4 text-accent-foreground flex-shrink-0" />
              {(() => {
                const latestPinnedMsg = pinnedMessages[pinnedMessages.length - 1];
                return (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-medium text-primary flex-shrink-0">{latestPinnedMsg.user}:</span>
                    <span className="text-foreground/80 truncate">
                      {latestPinnedMsg.message}
                    </span>
                    {pinnedMessages.length > 1 && (
                      <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-xs flex-shrink-0">
                        +{pinnedMessages.length - 1}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea 
          className="flex-1 px-3 md:px-4 relative touch-pan-y"
          style={{
            backgroundImage: groupSettings.groupWallpaper ? `url(${groupSettings.groupWallpaper})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Light overlay only for better text readability - much more transparent */}
          {groupSettings.groupWallpaper && (
            <div className="absolute inset-0 bg-background/20" />
          )}
          <div className="py-3 md:py-4 space-y-3 md:space-y-4 relative z-10">
            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className="animate-scale-in group">{/* Added group class */}
                {msg.type === 'system' ? (
                  <div className="text-center">
                    <div className="inline-block bg-muted px-3 py-1 rounded-full text-xs md:text-sm text-muted-foreground">
                      {msg.message}
                    </div>
                  </div>
                ) : (
                  <div className={`group flex gap-2 md:gap-3 ${msg.userId === 'current-user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar 
                      className={`w-7 h-7 md:w-8 md:h-8 mt-1 flex-shrink-0 transition-all ${
                        msg.userId !== 'current-user' 
                          ? 'cursor-pointer hover:ring-2 hover:ring-primary hover:shadow-md' 
                          : ''
                      }`}
                      onClick={() => {
                        if (msg.userId !== 'current-user') {
                          handleStartDM(msg.userId);
                        }
                      }}
                      title={msg.userId !== 'current-user' ? `Click to DM ${msg.user}` : undefined}
                    >
                      {msg.userId === 'current-user' && currentUser?.avatar && (
                        <AvatarImage src={currentUser.avatar} alt={currentUser.name || 'User'} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {msg.avatar}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 max-w-[90%] md:max-w-[70%] ${msg.userId === 'current-user' ? 'text-right' : ''}`}>
                      {msg.userId !== 'current-user' && (
                        <div className="flex items-center gap-2 mb-1 justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleMentionUser(msg.userId)}
                              title="Click to mention in chat"
                            >
                              {msg.user}
                            </span>
                            {msg.userRole === 'owner' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Crown className="w-3 h-3 text-yellow-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Group Owner</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {msg.userRole === 'admin' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Shield className="w-3 h-3 text-blue-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Group Admin</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {msg.userIsPremium && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Star className="w-3 h-3 text-purple-500 fill-purple-500 premium-star cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Premium Member</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <span className="text-xs text-muted-foreground flex-shrink-0">{msg.time}</span>
                            {msg.edited && <span className="text-xs text-muted-foreground flex-shrink-0">(edited)</span>}
                          </div>
                          <div className="flex-shrink-0">
                            <MessageActions
                              messageId={msg.id}
                              isOwnMessage={msg.userId === 'current-user'}
                              onReply={handleReply}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onReport={handleReport}
                              onBlock={handleBlock}
                              onAddFriend={handleAddFriend}
                              onStartDM={handleStartDM}
                              onReaction={handleReaction}
                              onBanUser={roomType !== 'dm' ? handleBanUser : undefined}
                              onMuteUser={roomType !== 'dm' ? handleMuteUser : undefined}
                              onDeleteMessage={roomType !== 'dm' ? handleDeleteMessageByMod : undefined}
                              userId={msg.userId}
                              userName={msg.user}
                              messageContent={msg.message}
                              currentUserRole={roomType !== 'dm' ? getCurrentUserRole() : 'member'}
                              messageUserRole={msg.userRole}
                              isPinned={roomType !== 'dm' ? msg.pinned : false}
                              onPinMessage={roomType !== 'dm' ? handlePinMessage : undefined}
                              onUnpinMessage={roomType !== 'dm' ? handleUnpinMessage : undefined}
                              roomType={roomType}
                            />
                          </div>
                        </div>
                      )}
                      
                      {msg.replyTo && (
                        <div className="text-xs text-muted-foreground mb-1 p-2 bg-muted/50 rounded border-l-2 border-primary">
                          <div className="font-medium mb-1">
                            Replying to {messages.find(m => m.id === msg.replyTo)?.user}
                          </div>
                          <div className="truncate opacity-80">
                            {messages.find(m => m.id === msg.replyTo)?.message}
                          </div>
                        </div>
                      )}
                      
                      <div 
                        className={`message-bubble rounded-2xl px-2 md:px-4 py-2 text-sm md:text-base relative smooth-transition transition-all duration-200 ${
                          msg.userId === 'current-user' 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-muted'
                        } ${msg.pinned ? 'border-l-4 border-yellow-500' : ''}`}
                      >
                        {roomType !== 'dm' && msg.pinned && (
                          <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
                            <Pin className="w-3 h-3" />
                            <span>Pinned message</span>
                          </div>
                        )}
                        {msg.message}
                        {msg.userId === 'current-user' && (
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                            <MessageActions
                              messageId={msg.id}
                              isOwnMessage={true}
                              onReply={handleReply}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onReport={handleReport}
                              onBlock={handleBlock}
                              onAddFriend={handleAddFriend}
                              onStartDM={handleStartDM}
                              onReaction={handleReaction}
                              onBanUser={roomType !== 'dm' ? handleBanUser : undefined}
                              onMuteUser={roomType !== 'dm' ? handleMuteUser : undefined}
                              onDeleteMessage={roomType !== 'dm' ? handleDeleteMessageByMod : undefined}
                              userId={msg.userId}
                              userName={msg.user}
                              messageContent={msg.message}
                              currentUserRole={roomType !== 'dm' ? getCurrentUserRole() : 'member'}
                              messageUserRole={msg.userRole}
                              isPinned={roomType !== 'dm' ? msg.pinned : false}
                              onPinMessage={roomType !== 'dm' ? handlePinMessage : undefined}
                              onUnpinMessage={roomType !== 'dm' ? handleUnpinMessage : undefined}
                              roomType={roomType}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Reactions Display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 reaction-badge ${
                                users.includes('current-user')
                                  ? 'bg-primary/20 text-primary border border-primary/30'
                                  : 'bg-muted hover:bg-muted/80 border border-muted-foreground/20'
                              }`}
                              title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
                            >
                              <span className="reaction-btn">{emoji}</span>
                              <span>{users.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {msg.userId === 'current-user' && (
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-1 mr-2">
                          <div className="flex items-center gap-1">
                            {msg.userRole === 'owner' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Crown className="w-3 h-3 text-yellow-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Group Owner</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {msg.userRole === 'admin' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Shield className="w-3 h-3 text-blue-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Group Admin</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {msg.userIsPremium && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Star className="w-3 h-3 text-purple-500 fill-purple-500 premium-star cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Premium Member</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <span>{msg.time} {msg.edited && '(edited)'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="space-y-2">
                {typingUsers.map((user) => (
                  <div key={user.userId} className="flex gap-2 md:gap-3 animate-slide-up">
                    <Avatar className="w-7 h-7 md:w-8 md:h-8 mt-1 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{user.userName} is typing</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing"></div>
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-card p-3 md:p-4">
          {/* Image Preview */}
          {selectedImage && selectedImagePreview && (
            <div className="mb-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedImagePreview} 
                  alt="Selected image" 
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedImage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedImage.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelImage}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSendImage}
                    className="chat-gradient text-white"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Audio Preview */}
          {recordedAudio && recordedAudioUrl && (
            <div className="mb-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Voice Message</p>
                  <p className="text-xs text-muted-foreground">
                    Duration: {recordingTime}s
                  </p>
                  <audio 
                    src={recordedAudioUrl} 
                    controls 
                    className="w-full mt-2 h-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelAudio}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSendAudio}
                    className="chat-gradient text-white"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 dark:text-red-300 text-sm font-medium">
                  Recording... {recordingTime}s
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={stopVoiceRecording}
                className="text-red-600 hover:text-red-700"
              >
                Stop
              </Button>
            </div>
          )}
          
          {(replyingTo || editingMessage) && (
            <div className="mb-2 p-3 bg-muted rounded-lg border-l-4 border-primary">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {editingMessage ? 'Editing message' : `Replying to ${messages.find(m => m.id === replyingTo)?.user}`}
                  </div>
                  {replyingTo && (
                    <div className="text-sm text-muted-foreground truncate bg-background/50 p-2 rounded">
                      {messages.find(m => m.id === replyingTo)?.message}
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setReplyingTo(null);
                    setEditingMessage(null);
                    setNewMessage('');
                  }}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Mute Status Display */}
          {isCurrentUserMuted() && (
            <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    You are muted in this group
                  </span>
                </div>
                <MuteCountdown 
                  mutedUntil={isCurrentUserMuted()?.mutedUntil || null}
                />
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                You cannot send messages or react to messages while muted.
              </p>
            </div>
          )}
          
          <div className="flex items-end gap-2 md:gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-2 flex-shrink-0 p-2"
              onClick={handleFileUpload}
              disabled={!!isCurrentUserMuted()}
              title="Upload image (max 1MB)"
            >
              <Plus className="w-4 h-4" />
            </Button>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex-1 relative">
              <Input
                placeholder={
                  isRecording
                    ? "Recording voice message..."
                    : isCurrentUserMuted() 
                      ? "You are muted and cannot send messages..." 
                      : editingMessage 
                        ? "Edit your message..." 
                        : "Type your message..."
                }
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={!!isCurrentUserMuted() || isRecording}
                className="pr-16 md:pr-24 min-h-[40px] md:min-h-[44px] text-sm md:text-base"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowEmojiPicker(true)}
                  disabled={!!isCurrentUserMuted()}
                  title="Add emoji"
                  className="p-1.5 md:p-2"
                >
                  <Smile className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleVoiceRecord}
                  disabled={!!isCurrentUserMuted()}
                  title={isRecording ? "Stop recording" : "Record voice message"}
                  className={`p-1.5 md:p-2 ${isRecording ? "text-red-500 animate-pulse" : ""}`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !!isCurrentUserMuted() || isRecording}
              size="sm"
              className="mb-2 chat-gradient text-white flex-shrink-0 p-2 h-[40px] md:h-[44px]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* User List Sidebar - Hidden on mobile and DM rooms */}
      {roomType !== 'dm' && (
        <div className="hidden lg:flex w-64 border-l bg-card flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Members ({participants})</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search members..." 
                className="pl-10 h-8"
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Group Members by Status */}
            <>
              {/* Online Members */}
              <div className="mb-2">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    Online - {filteredOnlineMembers.length}
                  </div>
                  {filteredOnlineMembers.map((member) => (
                    <div key={member.id} className="group flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <div className="text-sm font-medium truncate">{member.name}</div>
                          {member.role === 'owner' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Crown className="w-3 h-3 text-yellow-500 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Group Owner</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {member.role === 'admin' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Shield className="w-3 h-3 text-blue-500 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Group Admin</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {member.isPremium && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Star className="w-3 h-3 text-purple-500 fill-purple-500 premium-star cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Premium Member</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Online</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {member.id === 'current-user' && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                        <UserActionsMenu
                          userId={member.id}
                          userName={member.name}
                          isCurrentUser={member.id === 'current-user'}
                          onViewProfile={handleViewProfile}
                          onStartDM={handleStartDM}
                          onAddFriend={handleAddFriend}
                          onBlockUser={handleBlockUser}
                          onReportUser={handleReportUser}
                          roomType={roomType}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Offline Members */}
                {filteredOfflineMembers.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      Offline - {filteredOfflineMembers.length}
                    </div>
                    {filteredOfflineMembers.map((member) => (
                      <div key={member.id} className="group flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer opacity-60">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-medium truncate">{member.name}</div>
                            {member.role === 'owner' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Crown className="w-3 h-3 text-yellow-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Group Owner</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {member.role === 'admin' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Shield className="w-3 h-3 text-blue-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Group Admin</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {member.isPremium && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Star className="w-3 h-3 text-purple-500 fill-purple-500 premium-star cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Premium Member</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">Last seen 2h ago</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserActionsMenu
                            userId={member.id}
                            userName={member.name}
                            isCurrentUser={member.id === 'current-user'}
                            onViewProfile={handleViewProfile}
                            onStartDM={handleStartDM}
                            onAddFriend={handleAddFriend}
                            onBlockUser={handleBlockUser}
                            onReportUser={handleReportUser}
                            roomType={roomType}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
          </div>
        </ScrollArea>
      </div>
      )}
      
      {/* Emoji Picker for Input */}
      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
      
      {/* Group Settings Modal */}
      {showGroupSettings && roomType !== 'dm' && (
        <GroupSettingsModal
          groupName={currentRoomName}
          groupSettings={groupSettings}
          members={groupMembers}
          bannedUsers={bannedUsers}
          mutedUsers={mutedUsers}
          currentUserRole={getCurrentUserRole()}
          onClose={() => setShowGroupSettings(false)}
          onUpdateSettings={handleUpdateGroupSettings}
          onUpdateMemberRole={handleUpdateMemberRole}
          onRemoveMember={handleRemoveMember}
          onUpdateGroupLogo={handleUpdateGroupLogo}
          onUpdateGroupName={handleUpdateGroupName}
          onUnbanUser={handleUnbanUser}
          onUnmuteUser={handleUnmuteUser}
        />
      )}

      {/* Group Info Modal */}
      {showGroupRules && roomType !== 'dm' && (
        <Dialog open={showGroupRules} onOpenChange={setShowGroupRules}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Group Information
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Group Header */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <Avatar className="w-16 h-16">
                  {currentGroupLogo && (
                    <AvatarImage src={currentGroupLogo} alt={currentRoomName} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {currentRoomName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{currentRoomName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {participants} members • {roomType === 'private' ? 'Private' : 'Public'} Group
                  </p>
                </div>
              </div>

              {/* Group Description */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    {groupSettings.groupDescription || "No description available for this group."}
                  </p>
                </div>
              </div>

              {/* Member Statistics */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Members
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {groupMembers.filter(m => m.status === 'online').length}
                    </div>
                    <div className="text-xs text-green-600/80 dark:text-green-400/80">Online Now</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {participants}
                    </div>
                    <div className="text-xs text-blue-600/80 dark:text-blue-400/80">Total Members</div>
                  </div>
                </div>
              </div>
              
              {/* Group Rules */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Community Guidelines
                </h3>
                {groupSettings.groupRules ? (
                  <div className="bg-card border rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                      {groupSettings.groupRules}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-muted/30 border border-dashed rounded-lg p-6 text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No specific rules have been set for this group yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please follow general community guidelines and be respectful.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Tip:</strong> Group rules help maintain a positive environment for everyone. 
                  If you have questions about these guidelines, feel free to ask the group admins.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mute Duration Modal */}
      {showMuteDurationModal && muteTarget && (
        <MuteDurationModal
          isOpen={showMuteDurationModal}
          onClose={() => {
            setShowMuteDurationModal(false);
            setMuteTarget(null);
          }}
          onConfirm={handleMuteConfirm}
          userName={muteTarget.userName}
        />
      )}

      {/* Report Modal */}
      {showReportModal && reportTarget && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
          messageId={reportTarget.messageId}
          userId={reportTarget.userId}
          userName={reportTarget.userName}
        />
      )}

      {/* Pinned Messages Modal */}
      <Dialog open={showPinnedMessagesModal} onOpenChange={setShowPinnedMessagesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pin className="w-5 h-5" />
              Pinned Messages ({pinnedMessages.length})
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {pinnedMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Pin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pinned messages yet</p>
                </div>
              ) : (
                pinnedMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {message.user.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.user}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        </div>
                        <div className="text-sm">{message.message}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(getCurrentUserRole() === 'owner' || getCurrentUserRole() === 'admin') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleUnpinMessage(message.id);
                              if (pinnedMessages.length === 1) {
                                setShowPinnedMessagesModal(false);
                              }
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Pin className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};