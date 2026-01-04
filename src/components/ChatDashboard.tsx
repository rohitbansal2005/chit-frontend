import { useState, useEffect, useRef } from "react";
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useNavigate, useLocation } from "react-router-dom";
import { PremiumModal } from "@/components/PremiumModal";
import { StartDMModal } from "@/components/StartDMModal";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { SquareAd, InFeedAd } from "@/components/AdComponent";
import {
  RoomService,
  MessageService,
  UserService,
  FriendService,
  ChatRoom,
  ChatMessage,
  AppUser,
  FriendRequest
} from "@/lib/app-data";
import { EmojiPicker } from '@/components/EmojiPicker';
import { ChatRoom as ChatRoomComponent } from '@/components/ChatRoom';
import { io } from 'socket.io-client';
import { AuthUser } from "@/lib/auth-new";
import { 
  Search, 
  Plus, 
  Hash, 
  Lock, 
  Users, 
  MessageCircle,
  Globe,
  Heart,
  Music,
  Gamepad2,
  Shuffle,
  Coffee,
  Settings,
  User,
  LogOut,
  Star,
  Crown,
  UserPlus,
  UserX,
  UserCheck,
  Clock,
  Shield,
  MessageSquare,
  X,
  SkipForward,
  Send,
  Compass,
  Menu,
  Info,
  Smile,
  Wrench
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext-new';


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

interface Room {
  id: string;
  name: string;
  description: string;
  members: number;
  type: 'public' | 'private';
  category: string;
  isOnline?: boolean;
  lastMessage?: string;
  unread?: number;
  isOwner?: boolean;
  image?: string;
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  mutualFriends?: number;
  status?: string;
}

interface BlockedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  blockedDate: string;
  reason?: string;
}

interface DMMessage {
  id: string;
  text: string;
  sender: 'user' | 'partner' | 'system';
  timestamp: Date;
}

interface ChatDashboardProps {
  user: AuthUser;
  onJoinRoom: (room: ChatRoom) => void;
  onLogout: () => void;
  onViewProfile?: () => void;
  onOpenSettings?: () => void;
  isRandomChatActive?: boolean;
  currentRandomRoom?: ChatRoom | null;
  onNextRandomChat?: () => void;
  onCloseRandomChat?: () => void;
  externalAction?: 'random-chat' | 'explore-rooms' | 'start-dm';
  onExternalActionHandled?: () => void;
}

const categoryIcons = {
  general: MessageCircle,
  music: Music,
  gaming: Gamepad2,
  education: Users,
  casual: Coffee,
  international: Globe,
  fanclub: Star,
  dm: User
};

export const ChatDashboard = ({ 
  user, 
  onJoinRoom, 
  onLogout, 
  onViewProfile, 
  onOpenSettings,
  isRandomChatActive = false, 
  currentRandomRoom = null, 
  onNextRandomChat, 
  onCloseRandomChat,
  externalAction,
  onExternalActionHandled
}: ChatDashboardProps) => {
  const { signInAsGuest, resendEmailVerification } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("public");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showStartDMModal, setShowStartDMModal] = useState(false);
  const [customRooms, setCustomRooms] = useState<ChatRoom[]>([]);
  const [joinedPrivateRooms, setJoinedPrivateRooms] = useState<string[]>([]);
  const [joinedPublicRooms, setJoinedPublicRooms] = useState<string[]>(['general', 'random']); // Start with some default joined rooms
  const [selectedPeopleTab, setSelectedPeopleTab] = useState("friends");
  const [isRandomChatSearching, setIsRandomChatSearching] = useState(false);
  const [isExploreRoomsActive, setIsExploreRoomsActive] = useState(false);
  const [showMobileContent, setShowMobileContent] = useState(false); // Mobile content toggle
  const [isFeatureDrawerOpen, setIsFeatureDrawerOpen] = useState(false);
  const [randomChatMessage, setRandomChatMessage] = useState("");
  const [localRandomRoom, setLocalRandomRoom] = useState<ChatRoom | null>(null);
  const [localRandomPartner, setLocalRandomPartner] = useState<AppUser | null>(null);
  const [activeDMRoom, setActiveDMRoom] = useState<ChatRoom | null>(null);
  const [dmInputMessage, setDmInputMessage] = useState("");
  const [dmConversations, setDmConversations] = useState<Record<string, DMMessage[]>>({});
  
  // Backend data states
  const [publicRooms, setPublicRooms] = useState<ChatRoom[]>([]);
  const [directMessages, setDirectMessages] = useState<ChatRoom[]>([]);
  const [dmPartners, setDmPartners] = useState<Record<string, AppUser>>({});
  const [friendsList, setFriendsList] = useState<AppUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<AppUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [friendRequestUsers, setFriendRequestUsers] = useState<Record<string, AppUser>>({});
  const navigate = useNavigate();

  const activeRandomRoom = currentRandomRoom || localRandomRoom;
  const isRandomExperienceActive = isRandomChatActive || !!localRandomRoom;
  const activeRandomPartner = (activeRandomRoom as any)?.matchedUser || localRandomPartner || null;

  // Poll messages for active random DM room using a single managed poller
  const randomPollerRef = useRef<{ roomId?: string; intervalId?: any } | null>(null);
  useEffect(() => {
    const room = activeRandomRoom as any;
    const roomId = room?.id;
    // Only poll DM rooms
    if (!roomId || room.type !== 'dm') {
      if (randomPollerRef.current?.intervalId) {
        clearInterval(randomPollerRef.current.intervalId);
        randomPollerRef.current = null;
      }
      return;
    }

    // If we're already polling this room, do nothing
    if (randomPollerRef.current?.roomId === roomId) return;

    // Clear any previous poller
    if (randomPollerRef.current?.intervalId) {
      clearInterval(randomPollerRef.current.intervalId);
      randomPollerRef.current = null;
    }

    let cancelled = false;

    const fetchAndMerge = async () => {
      if (cancelled) return;
      try {
        const msgs = await MessageService.getRoomMessages(roomId, 100);
        const mapped = msgs.map((m: any) => ({
          id: m.id,
          text: m.content || m.body || m.message || m.payload || m.text || '',
          sender: m.senderId === user?.uid ? 'user' : 'partner',
          timestamp: new Date(m.timestamp || m.createdAt || Date.now()),
          senderName: m.senderName || (m.senderId === user?.uid ? (user?.displayName || user?.name) : (activeRandomPartner?.displayName || activeRandomPartner?.name || 'Stranger'))
        }));

        setRandomChatMessages(prev => {
          const existing = new Map(prev.map(p => [p.id, p]));
          const newList = [...prev];

          mapped.forEach((mm: any) => {
            if (existing.has(mm.id)) return;

            const matchIndex = newList.findIndex(p => (
              p.id?.toString().startsWith('temp-') &&
              p.sender === mm.sender &&
              p.text === mm.text &&
              Math.abs(new Date(p.timestamp).getTime() - new Date(mm.timestamp).getTime()) < 5000
            ));

            if (matchIndex !== -1) {
              newList[matchIndex] = mm;
            } else {
              newList.push(mm);
            }
          });

          return newList;
        });
      } catch (err) {
        // ignore and retry
      }
    };

    // do initial fetch, then poll every 5000ms
    const shouldPollNow = () => {
      try {
        if (typeof document !== 'undefined') {
          // Avoid polling when tab is hidden
          if (document.hidden) return false;
        }
        // avoid polling when window not focused (helps when user switched tab)
        // @ts-ignore
        if (typeof window !== 'undefined' && window?.document && typeof window.document.hasFocus === 'function') {
          // @ts-ignore
          if (!window.document.hasFocus()) return false;
        }
      } catch (e) {
        // ignore
      }
      return true;
    };

    if (shouldPollNow()) fetchAndMerge();
    const intervalId = setInterval(() => {
      if (shouldPollNow()) fetchAndMerge();
    }, 5000);
    randomPollerRef.current = { roomId, intervalId };

    return () => {
      cancelled = true;
      if (randomPollerRef.current?.intervalId) {
        clearInterval(randomPollerRef.current.intervalId);
        randomPollerRef.current = null;
      }
    };
  }, [activeRandomRoom && (activeRandomRoom as any).id, user?.uid, activeRandomPartner && (activeRandomPartner as any).id]);
  const randomPartnerName = activeRandomPartner?.displayName || activeRandomPartner?.name || 'Stranger';
  const activeDMConversation = activeDMRoom ? dmConversations[activeDMRoom.id] || [] : [];
  const activeDMPartnerName = (
    activeDMRoom && (
      activeDMRoom.name || dmPartners[activeDMRoom.id]?.displayName || dmPartners[activeDMRoom.id]?.name
    )
  ) || 'Direct Message';

  // Load user data for friend requests
  useEffect(() => {
    const loadFriendRequestUsers = async () => {
      const userMap: Record<string, AppUser> = {};
      for (const request of friendRequests) {
        if (!userMap[request.fromUserId]) {
          const userData = await UserService.getUserById(request.fromUserId);
          if (userData) {
            userMap[request.fromUserId] = userData;
          }
        }
      }
      setFriendRequestUsers(userMap);
    };

    if (friendRequests.length > 0) {
      loadFriendRequestUsers();
    }
  }, [friendRequests]);

  // Load backend data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load public rooms (all) and user's rooms separately
        const publicRoomsFromApi = await RoomService.getPublicRooms();
        setPublicRooms(publicRoomsFromApi || []);

        // Load user's rooms (for DMs/private view)
        const userRooms = await RoomService.getUserRooms(user.uid);
        setDirectMessages(userRooms.filter(room => room.type === 'private' || room.type === 'dm'));

        // Load friends - using user's friends array
        const userProfile = await UserService.getUserById(user.uid);
        const friendIds = userProfile?.friends ?? [];
        const blockedIds = userProfile?.blockedUsers ?? [];

        const friends = await Promise.all(friendIds.map(id => UserService.getUserById(id)));
        setFriendsList(friends.filter(Boolean) as AppUser[]);
        
        const blocked = await Promise.all(blockedIds.map(id => UserService.getUserById(id)));
        setBlockedUsers(blocked.filter(Boolean) as AppUser[]);

        // Load friend requests
        const requests = await FriendService.getUserFriendRequests(user.uid);
        setFriendRequests(requests);

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Room operations
  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;
    try {
      await RoomService.joinRoom(roomId, user.uid);
      setJoinedPublicRooms(prev => [...prev, roomId]);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!user) return;
    try {
      await RoomService.leaveRoom(roomId, user.uid);
      setJoinedPublicRooms(prev => prev.filter(id => id !== roomId));
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    if (!user) return;
    try {
      await FriendService.acceptFriendRequest(requestId);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    if (!user) return;
    try {
      await FriendService.rejectFriendRequest(requestId);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!user) return;
    try {
      await UserService.blockUser(user.uid, userId);
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!user) return;
    try {
      await UserService.unblockUser(user.uid, userId);
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const handleCreateRoom = async (roomData: any) => {
    if (!user) return;
    try {
      const ownerId = user.uid || (user as any).id;
      const roomId = await RoomService.createRoom({
        name: roomData.name,
        description: roomData.description,
        type: roomData.type,
        category: roomData.category,
        owner: ownerId,
        members: [ownerId],
        admins: [ownerId],
        settings: {
          allowInvites: true,
          muteNewMembers: false,
          requireApproval: roomData.type === 'private'
        }
      });
      
      // Get the created room to add to state
      const createdRoom = await RoomService.getRoomById(roomId);
      if (createdRoom) {
        setCustomRooms(prev => [...prev, createdRoom]);
        onJoinRoom(createdRoom);
      }
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };
  const [randomChatMessages, setRandomChatMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'stranger';
    timestamp: Date;
    senderName: string;
  }>>([]);
  const socketRef = useRef<any>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [mutedUntil, setMutedUntil] = useState<number | null>(null);
  const [randomPartnerConnected, setRandomPartnerConnected] = useState(true);
  const [showEmojiPickerRandom, setShowEmojiPickerRandom] = useState(false);

  // Check user premium status (to be filled from backend user profile)
  const isPremium = false; // TODO: Implement premium status on backend user profile

  // Handle sending random chat messages
  const handleSendRandomMessage = async () => {
    if (!randomChatMessage.trim()) return;

    const outgoingText = randomChatMessage.trim();
    setRandomChatMessage("");

    // If we're in a real DM/random room, send the message through the MessageService
    const room = activeRandomRoom;
    if (room && room.id) {
      // local echo (temp id)
      const tempId = `temp-${Date.now()}`;
      const newMessage = {
        id: tempId,
        text: outgoingText,
        sender: 'user' as const,
        timestamp: new Date(),
        senderName: user?.name || user?.displayName || 'You'
      };
      setRandomChatMessages(prev => [...prev, newMessage]);

      // If socket connected, emit; otherwise fall back to MessageService
      if (socketRef.current && socketConnected && (room as any).type === 'dm') {
        try {
          socketRef.current.emit('room:message', { roomId: room.id, senderId: user.uid, senderName: user.displayName || user.name, content: outgoingText });
        } catch (err) {
          console.error('socket emit failed, falling back to API:', err);
          try {
            await MessageService.sendMessage({ roomId: room.id, senderId: user.uid, senderName: user.displayName || user.name, content: outgoingText, type: 'text' });
          } catch (e) { console.error('Failed to send random chat message via API:', e); }
        }
      } else {
        (async () => {
          try {
            await MessageService.sendMessage({ roomId: room.id, senderId: user.uid, senderName: user.displayName || user.name, content: outgoingText, type: 'text' });
          } catch (err) {
            console.error('Failed to send random chat message:', err);
          }
        })();
      }
      return;
    }

    // Fallback to local simulated conversation when no real room exists
    const newMessage = {
      id: Date.now().toString(),
      text: outgoingText,
      sender: 'user' as const,
      timestamp: new Date(),
      senderName: user?.name || user?.email || 'You'
    };
    setRandomChatMessages(prev => [...prev, newMessage]);
    
    // Simulate stranger response after a delay for fallback
    setTimeout(() => {
      const responses = [
        "Hey! Nice to meet you! 😊",
        "How's your day going?",
        "That's interesting! Tell me more",
        "I'm doing well, thanks for asking!",
        "What are your hobbies?",
        "Nice chatting with you!",
        "Where are you from?",
        "What do you like to do for fun?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const strangerMessage = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'stranger' as const,
        timestamp: new Date(),
        senderName: 'Stranger'
      };
      setRandomChatMessages(prev => [...prev, strangerMessage]);
    }, 1000 + Math.random() * 2000);
  };

  // Handle Enter key press for message sending
  const handleRandomChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendRandomMessage();
    }
  };

  const handleRandomEmojiSelect = (emoji: string) => {
    setRandomChatMessage((prev) => prev + emoji);
    setShowEmojiPickerRandom(false);
  };

  // Reset random chat messages when starting a new chat
  const handleNewRandomChat = async () => {
    // If we're currently in a real DM/random room, tell server to end it
    try {
      const room = activeRandomRoom as any;
      if (room?.id && socketRef.current && socketConnected) {
        socketRef.current.emit('room:end', { roomId: room.id });
      }
    } catch (e) {}

    setRandomChatMessages([]);
    if (onNextRandomChat) {
      onNextRandomChat();
    } else {
      await handleRandomChat();
    }
  };

  const resetLocalRandomState = () => {
    setLocalRandomRoom(null);
    setLocalRandomPartner(null);
    setRandomChatMessages([]);
  };

  useEffect(() => {
    if (!isRandomChatActive && !currentRandomRoom) {
      setLocalRandomRoom(null);
      setLocalRandomPartner(null);
      setRandomChatMessages([]);
    }
  }, [isRandomChatActive, currentRandomRoom]);

  const handleCloseRandomChat = () => {
    setShowMobileContent(false); // Back to sidebar on mobile
    if (onCloseRandomChat) {
      onCloseRandomChat();
    }
    resetLocalRandomState();
    // remove random params from URL
    try {
      const params = new URLSearchParams(location.search || '');
      params.delete('random');
      params.delete('partner');
      const newPath = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      navigate(newPath, { replace: true });
    } catch (e) {
      // ignore
    }
  };

  // Handle explore rooms view
  const handleExploreRooms = () => {
    // Navigate to the dedicated explore URL so the browser shows /explore
    try {
      navigate('/explore');
    } catch (e) {}
    setIsExploreRoomsActive(true);
    setShowMobileContent(true); // Show content area on mobile
    setActiveDMRoom(null);
    setDmInputMessage('');
    setIsFeatureDrawerOpen(false);
  };

  const handleCloseExploreRooms = () => {
    setIsExploreRoomsActive(false);
    setShowMobileContent(false); // Back to sidebar on mobile
    setDmInputMessage('');
    // If we're on the /explore URL, navigate back to dashboard
    try { if (location.pathname === '/explore') navigate('/dashboard'); } catch (e) {}
  };

  // Mobile handlers
  const handleMobileRandomChat = () => {
    handleRandomChat();
    setShowMobileContent(true);
  };

  const handleMobileBackToSidebar = () => {
    setShowMobileContent(false);
    setIsExploreRoomsActive(false);
    setActiveDMRoom(null);
    setDmInputMessage('');
    setIsFeatureDrawerOpen(false);
    resetLocalRandomState();
  };

  const handleShowMobileSidebar = () => {
    setShowMobileContent(false);
  };

  const handleShowMobileContent = () => {
    setShowMobileContent(true);
  };

  // Filter rooms based on visibility rules
  const getVisibleRooms = () => {
    const allRooms = [...publicRooms, ...customRooms];
    
    return allRooms.filter(room => {
      // For public rooms, only show if user has joined them
      if (room.type === 'public') {
        return joinedPublicRooms.includes(room.id);
      }
      
      // For private rooms, only show if user has joined them or is the owner
      if (room.type === 'private') {
        return room.owner === user?.uid || joinedPrivateRooms.includes(room.id);
      }
      
      return true;
    });
  };

  // Get all public rooms for explore view
  const getAllPublicRooms = () => {
    const allRooms = [...publicRooms, ...customRooms];
    return allRooms.filter(room => room.type === 'public');
  };

  const visibleRooms = getVisibleRooms();
  const normalizedSearchQuery = searchQuery.toLowerCase();
  
  const filteredRooms = visibleRooms.filter(room => {
    const roomName = (room.name || '').toLowerCase();
    const roomDescription = (room.description || '').toLowerCase();
    return roomName.includes(normalizedSearchQuery) || roomDescription.includes(normalizedSearchQuery);
  });

  const filteredDMs = directMessages.filter(dm =>
    (dm.name || '').toLowerCase().includes(normalizedSearchQuery)
  );

  // Resolve DM partner profiles (avatar / displayName) for better list rendering
  useEffect(() => {
    let cancelled = false;
    const loadPartners = async () => {
      if (!directMessages || directMessages.length === 0 || !user) return;
      const map: Record<string, AppUser> = {};
      for (const dm of directMessages) {
        try {
          const members: string[] = (dm.participants || dm.members || []) as any;
          const partnerId = members && Array.isArray(members) ? members.find(m => m !== user.uid) : undefined;
          if (partnerId) {
            const u = await UserService.getUserById(partnerId).catch(() => null);
            if (u && !cancelled) map[dm.id] = u;
          } else if ((dm as any).matchedUser) {
            map[dm.id] = (dm as any).matchedUser;
          }
        } catch (e) {
          // ignore per-room failures
        }
      }
      if (!cancelled) setDmPartners(prev => ({ ...prev, ...map }));
    };

    loadPartners();
    return () => { cancelled = true; };
  }, [directMessages, user?.uid]);

  // Filter people data based on search
  const filteredFriends = friendsList.filter(friend => {
    const friendName = (friend.name || '').toLowerCase();
    const friendUsername = (friend.username || '').toLowerCase();
    return friendName.includes(normalizedSearchQuery) || friendUsername.includes(normalizedSearchQuery);
  });

  const filteredFriendRequests = friendRequests.filter(() => {
    // Friend requests currently only carry IDs; user details are loaded separately
    return true;
  });

  const filteredBlockedUsers = blockedUsers.filter(blocked => {
    const blockedName = (blocked.name || '').toLowerCase();
    const blockedUsername = (blocked.username || '').toLowerCase();
    return blockedName.includes(normalizedSearchQuery) || blockedUsername.includes(normalizedSearchQuery);
  });

  const handleCreateGroup = async (newGroup: Room) => {
    if (!user) return;
    
    // Check if trying to create private group without premium
    if (newGroup.type === 'private' && !isPremium) {
      setShowPremiumModal(true);
      return;
    }

    try {
      const roomId = await RoomService.createRoom({
        name: newGroup.name,
        description: newGroup.description || '',
        type: newGroup.type,
        category: newGroup.category,
        owner: user.uid,
        members: [user.uid],
        admins: [user.uid],
        settings: {
          allowInvites: true,
          muteNewMembers: false,
          requireApproval: newGroup.type === 'private'
        }
      });
      
      // Get the created room to add to state
      const createdRoom = await RoomService.getRoomById(roomId);
      if (createdRoom) {
        setCustomRooms(prev => [...prev, createdRoom]);
        
        // If creating a private room, automatically add user to joined private rooms
        if (createdRoom.type === 'private') {
          setJoinedPrivateRooms(prev => [...prev, createdRoom.id]);
        }
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
    
    setShowCreateRoom(false);
  };

  const handleSubscribe = (plan: 'monthly' | 'yearly') => {
    // Here you would integrate with payment system
    console.log(`Subscribing to ${plan} plan`);
    // For demo, we'll just close the modal
    setShowPremiumModal(false);
  };

  const handleOpenFeatureDrawer = () => {
    setIsFeatureDrawerOpen(true);
  };

  const handleCloseFeatureDrawer = () => {
    setIsFeatureDrawerOpen(false);
  };

  const handleOpenFeatureHubSection = (section: 'about' | 'tools') => {
    setIsFeatureDrawerOpen(false);
    navigate(`/feature-hub${section ? `#${section}` : ''}`);
  };

  const handleOpenSettingsPanel = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      onViewProfile?.();
    }
    setIsFeatureDrawerOpen(false);
  };

  const handleDrawerLogout = () => {
    setIsFeatureDrawerOpen(false);
    onLogout();
  };

  const handleOpenSupport = () => {
    setIsFeatureDrawerOpen(false);
    navigate('/support');
  };


  // People handlers - using backend helpers defined above

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    try {
      await FriendService.removeFriend(user.uid, friendId);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const focusDMWithRoom = (dmRoom: ChatRoom) => {
    setDirectMessages(prev => {
      const exists = prev.some(room => room.id === dmRoom.id);
      return exists ? prev : [...prev, dmRoom];
    });
    setDmConversations(prev => {
      if (prev[dmRoom.id]) return prev;
      const partnerLabel = dmRoom.name || 'this user';
      return {
        ...prev,
        [dmRoom.id]: [{
          id: `system-${dmRoom.id}`,
          text: `You're now connected with ${partnerLabel}.`,
          sender: 'system',
          timestamp: new Date()
        }]
      };
    });
    setActiveDMRoom(dmRoom);
    setIsExploreRoomsActive(false);
    setShowMobileContent(true);
    setSelectedTab('dms');
    setLocalRandomRoom(null);
    setLocalRandomPartner(null);
    setRandomChatMessages([]);
    setIsRandomChatSearching(false);
    setIsFeatureDrawerOpen(false);
    try {
      const params = new URLSearchParams(location.search || '');
      params.set('dm', dmRoom.id);
      // remove random query when opening DM
      params.delete('random');
      params.delete('partner');
      const newPath = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      navigate(newPath, { replace: true });
    } catch (e) {
      // ignore
    }
  };

  const handleCloseDMView = () => {
    setActiveDMRoom(null);
    setDmInputMessage('');
    try {
      const params = new URLSearchParams(location.search || '');
      params.delete('dm');
      const newPath = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      navigate(newPath, { replace: true });
    } catch (e) {}
    if (!isExploreRoomsActive && !isRandomExperienceActive) {
      setShowMobileContent(false);
    }
  };

  const handleMessageFriend = (friendId: string) => {
    (async () => {
      try {
        // Prefer creating / finding a real DM room on the server
        const dmRoomId = await RoomService.createDMRoom(user.uid, friendId);
        const dmRoom = await RoomService.getRoomById(dmRoomId);
        if (dmRoom) {
          focusDMWithRoom(dmRoom);
          return;
        }
      } catch (err) {
        console.error('Failed to create/fetch DM room from server:', err);
      }

      // Fallback: if we already have a local DM with that participant, focus it
      const existingRoom = directMessages.find(dm => (dm.participants || dm.members || []).includes(friendId));
      if (existingRoom) {
        focusDMWithRoom(existingRoom);
        return;
      }

      // If nothing works, show a message to the user instead of creating a dummy
      try { toast({ title: 'Unable to start DM', description: 'Could not create a direct message at this time. Try again later.' }); } catch (e) {}
    })();
  };

  const handleSendDMMessage = () => {
    if (!activeDMRoom || !dmInputMessage.trim()) return;

    const roomId = activeDMRoom.id;
    const trimmedMessage = dmInputMessage.trim();
    const outgoing: DMMessage = {
      id: `${roomId}-${Date.now()}`,
      text: trimmedMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setDmConversations(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), outgoing]
    }));
    setDmInputMessage('');

    const replies = [
      "Sounds good!",
      "Haha, true!",
      "Let me think about that.",
      "Appreciate the update!",
      "Let's catch up soon.",
      "Totally agree with you.",
    ];
    const delayedReply = replies[Math.floor(Math.random() * replies.length)];

    setTimeout(() => {
      setDmConversations(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), {
          id: `${roomId}-reply-${Date.now()}`,
          text: delayedReply,
          sender: 'partner',
          timestamp: new Date()
        }]
      }));
    }, 900 + Math.random() * 1500);
  };

  const handleStartDM = async (username: string) => {
    if (!user) return;
    try {
      // Try searching by username first
      let targetUser = null;
      try {
        const users = await UserService.searchUsers(username);
        targetUser = users.find(u => u.username === username) || users[0] || null;
      } catch (err) {
        // ignore
      }

      // If not found, try direct lookup by id (StartDMModal may pass user id)
      if (!targetUser) {
        try {
          const maybe = await UserService.getUserById(username);
          if (maybe) targetUser = maybe;
        } catch (err) {}
      }

      if (targetUser) {
        // Create or find existing DM room
        const dmRoomId = await RoomService.createDMRoom(user.uid, targetUser.id);
        const dmRoom = await RoomService.getRoomById(dmRoomId);
        if (dmRoom) {
          // If server did not set a readable name for the DM, derive it from the partner's profile
          if (!dmRoom.name) {
            dmRoom.name = targetUser.displayName || targetUser.username || targetUser.name || 'Direct message';
          }
          focusDMWithRoom(dmRoom);
        }
      }
    } catch (error) {
      console.error('Error starting DM:', error);
    }
  };

  const handleRandomChat = async () => {
    // If no signed-in user, create a guest session automatically
    if (!user) {
      try {
        const guestName = `guest_${Math.random().toString(36).slice(2,8)}`;
        await signInAsGuest(guestName);
        // small delay to allow context to update
        await new Promise((res) => setTimeout(res, 250));
      } catch (error) {
        console.error('Failed to sign in as guest for random chat:', error);
        return;
      }
    }
    
    setIsRandomChatSearching(true);
    setShowMobileContent(true); // Show content area on mobile
    setIsExploreRoomsActive(false);
    setActiveDMRoom(null);
    setDmInputMessage('');
    setIsFeatureDrawerOpen(false);
    
    try {
      // Initialize socket if not present
      if (!socketRef.current) {
        const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/api$/, '');
        try {
          socketRef.current = io(apiBase, { transports: ['websocket'], auth: { userId: user?.uid } });
        } catch (e) {
          // fallback: try connecting to same origin
          socketRef.current = io(undefined as any, { transports: ['websocket'], auth: { userId: user?.uid } });
        }

        socketRef.current.on('connect', () => setSocketConnected(true));
        socketRef.current.on('disconnect', () => setSocketConnected(false));

        socketRef.current.on('random:matched', async (payload: any) => {
          const partnerId = payload.partnerId;
          const roomId = payload.roomId;
          const partner = await UserService.getUserById(partnerId).catch(() => null);
          const dmRoom: ChatRoom = {
            id: roomId,
            name: `Chat with ${partner?.displayName || partner?.name || 'Stranger'}`,
            type: 'dm',
            owner: user?.uid || 'guest',
            createdBy: user?.uid || 'guest',
            participants: [user?.uid || 'guest', partnerId],
            members: [user?.uid || 'guest', partnerId],
            admins: [user?.uid || 'guest'],
            moderators: [],
            settings: {},
            category: 'random',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0
          } as ChatRoom & { matchedUser?: AppUser };
          (dmRoom as any).matchedUser = partner || { id: partnerId, name: 'Stranger', displayName: 'Stranger' };
          setLocalRandomRoom(dmRoom as ChatRoom & { matchedUser?: AppUser });
          setLocalRandomPartner((dmRoom as any).matchedUser);
          setRandomChatMessages([]);
          setRandomPartnerConnected(true);
          setIsRandomChatSearching(false);

          try {
            const params = new URLSearchParams(location.search || '');
            params.set('random', '1');
            params.set('partner', partnerId);
            const newPath = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
            navigate(newPath, { replace: true });
          } catch (e) {}

          if (onNextRandomChat || onCloseRandomChat) onJoinRoom(dmRoom as ChatRoom);
        });

        socketRef.current.on('random:timeout', () => {
          setIsRandomChatSearching(false);
        });

        socketRef.current.on('room:message', (msg: any) => {
          const mapped = {
            id: msg.id,
            text: msg.content || msg.message || msg.body || '',
            sender: msg.senderId === user?.uid ? 'user' : 'partner',
            timestamp: new Date(msg.timestamp || Date.now()),
            senderName: msg.senderName || (msg.senderId === user?.uid ? (user?.displayName || user?.name) : 'Stranger')
          };
          setRandomChatMessages(prev => {
            if (prev.find(p => p.id === mapped.id)) return prev;
            const idx = prev.findIndex(p => (
              p.id?.toString().startsWith('temp-') && p.sender === mapped.sender && p.text === mapped.text
            ));
            if (idx !== -1) { const copy = [...prev]; copy[idx] = mapped; return copy; }
            return [...prev, mapped];
          });
        });

        socketRef.current.on('muted', (payload: any) => {
          const { mutedUntil } = payload || {};
          setMutedUntil(mutedUntil || Date.now() + 5 * 60 * 1000);
          setRandomChatMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            text: 'You have been muted for spamming. You will be able to send messages again later.',
            sender: 'stranger',
            timestamp: new Date(),
            senderName: 'System'
          }]);
        });

        socketRef.current.on('room:partner-left', (payload: any) => {
          const { roomId, userId: leftId } = payload || {};
          setRandomPartnerConnected(false);
          // push a system message to inform user
          setRandomChatMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            text: 'The other user has left the chat. Click "Find New Partner" to start again.',
            sender: 'stranger',
            timestamp: new Date(),
            senderName: 'System'
          }]);
        });

        socketRef.current.on('room:ended', (payload: any) => {
          const { roomId } = payload || {};
          setRandomPartnerConnected(false);
          setRandomChatMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            text: 'Chat ended.',
            sender: 'stranger',
            timestamp: new Date(),
            senderName: 'System'
          }]);
        });
      }

      // emit join request for random pairing
      socketRef.current.emit('random:join', { userId: user?.uid });
    } catch (err) {
      console.error('Error starting random chat (socket):', err);
      setIsRandomChatSearching(false);
    }
  };

  useEffect(() => {
    if (!externalAction) return;

    if (externalAction === 'random-chat') {
      handleRandomChat();
    } else if (externalAction === 'explore-rooms') {
      handleExploreRooms();
    } else if (externalAction === 'start-dm') {
      setShowStartDMModal(true);
      setShowMobileContent(true);
      setIsExploreRoomsActive(false);
      setActiveDMRoom(null);
    }

    if (onExternalActionHandled) {
      onExternalActionHandled();
    }
  }, [externalAction, onExternalActionHandled]);

  // Restore DM view from URL `dm` param on mount / when location changes
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const dmId = params.get('dm');
      if (dmId && activeDMRoom?.id !== dmId) {
        (async () => {
          try {
            const dmRoom = await RoomService.getRoomById(dmId);
            if (dmRoom) {
              // ensure readable name
              if (!dmRoom.name) {
                const members: string[] = (dmRoom.participants || dmRoom.members || []) as any;
                const partnerId = members && Array.isArray(members) ? members.find(m => m !== user?.uid) : undefined;
                if (partnerId) {
                  const partner = await UserService.getUserById(partnerId).catch(() => null);
                  dmRoom.name = partner?.displayName || partner?.name || 'Direct message';
                  (dmRoom as any).matchedUser = partner || undefined;
                }
              }
              focusDMWithRoom(dmRoom);
            }
          } catch (err) {
            // ignore and do not throw
          }
        })();
      }
    } catch (e) {
      // ignore
    }
  }, [location.search, user?.uid]);

  // Restore random chat state from URL on mount / when location changes
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const isRandom = params.get('random');
      const partnerId = params.get('partner');
      if (isRandom && !isRandomExperienceActive) {
        // If partner id present, try to restore that partner
        (async () => {
          if (partnerId) {
            try {
              const partner = await UserService.getUserById(partnerId);
              if (partner) {
                const friendlyName = partner.displayName || partner.name || 'Stranger';
                const restoredRoom: ChatRoom = {
                  id: `random-restored-${Date.now()}`,
                  name: `Chat with ${friendlyName}`,
                  description: 'Restored random chat',
                  type: 'dm',
                  owner: user?.uid || 'guest',
                  createdBy: user?.uid || 'guest',
                  participants: [user?.uid || 'guest', partner.id],
                  members: [user?.uid || 'guest', partner.id],
                  admins: [user?.uid || 'guest'],
                  moderators: [],
                  settings: {
                    matchType: 'one-to-one',
                    matchUserId: partner.id,
                    matchUserName: friendlyName,
                    matchUserAvatar: partner.photoURL || partner.avatar || ''
                  },
                  category: 'random',
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  lastActivity: new Date(),
                  messageCount: 0
                } as ChatRoom & { matchedUser?: AppUser };
                (restoredRoom as any).matchedUser = partner;
                setLocalRandomRoom(restoredRoom);
                setLocalRandomPartner(partner);
                setRandomChatMessages([]);
                setShowMobileContent(true);
              } else {
                // fallback: start normal random chat
                await handleRandomChat();
              }
            } catch (err) {
              await handleRandomChat();
            }
          } else {
            await handleRandomChat();
          }
        })();
      }
    } catch (e) {
      // ignore
    }
  }, [location.search, user]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className={`${showMobileContent ? 'hidden' : 'w-full'} md:w-80 border-r bg-card flex flex-col h-screen md:flex`}>
        {/* Header */}
        <div className="p-3 md:p-4 border-b flex-shrink-0">
          {/* Mobile Content Access Button */}
          <div className="md:hidden mb-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShowMobileContent}
              className="w-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open Chat
            </Button>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenFeatureDrawer}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Menu className="w-4 h-4" />
                <span className="sr-only">Open feature drawer</span>
              </Button>
              <Avatar className="w-8 h-8 flex-shrink-0">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {(user.name || user.displayName || '').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm truncate">{user.name}</div>
                  {isPremium && (
                    <div title="Premium User" className="flex-shrink-0">
                      <Crown className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {isPremium ? `Premium` : user.isAnonymous ? 'Guest User' : 'Free User'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isPremium && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPremiumModal(true)}
                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                >
                  <Crown className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
          <div className="px-3 md:px-4 mb-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="public">Rooms</TabsTrigger>
              <TabsTrigger value="dms">Messages</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="public" className="flex-1 px-3 md:px-4 pb-4 space-y-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Public Rooms</h3>
              <Button size="sm" variant="outline" onClick={() => {
                if (!user || user.type === 'guest') {
                  toast({ title: 'Registration required', description: 'Please register to create rooms.', action: (
                    <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => navigate('/settings')}>Go to Settings</button>
                  ) });
                  return;
                }
                if (!user.emailVerified) {
                  toast({ title: 'Email verification required', description: 'Please verify your email to create rooms.', action: (
                    <button className="px-3 py-1 bg-primary text-white rounded" onClick={async () => { if (user?.email) { await resendEmailVerification(user.email); toast({ title: 'Verification sent', description: 'Check your inbox' }); } }}>Resend verification</button>
                  ) });
                  return;
                }
                setShowCreateRoom(true);
              }} className="text-xs">
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {filteredRooms.map((room) => {
                  const IconComponent = categoryIcons[room.category as keyof typeof categoryIcons] || Hash;
                  return (
                    <Card 
                      key={room.id}
                      className="professional-card cursor-pointer hover:bg-muted/50 transition-colors animate-scale-in"
                      onClick={() => onJoinRoom(room)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="flex-shrink-0">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {(room.name || room.displayName || '').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2 min-w-0 flex-1">
                                 <h4 className="font-medium text-sm truncate">{room.name}</h4>
                                 {room.type === 'private' && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                                 {room.owner === user?.uid && <Badge variant="outline" className="text-xs flex-shrink-0">Owner</Badge>}
                                 {room.createdBySystem && <Badge variant="outline" className="text-xs flex-shrink-0">System</Badge>}
                               </div>
                               <div className="flex items-center gap-2">
                                 <Badge variant="secondary" className="text-xs flex-shrink-0">
                                   {room.memberCount ?? (Array.isArray(room.members) ? room.members.length : room.members || 0)}
                                 </Badge>
                                 {joinedPublicRooms.includes(room.id) && (
                                   <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                       <Button
                                         size="sm"
                                         variant="ghost"
                                         onClick={(e) => e.stopPropagation()}
                                         className="h-7 px-2 text-xs text-red-600"
                                       >
                                         Leave
                                       </Button>
                                     </AlertDialogTrigger>
                                     <AlertDialogContent>
                                       <AlertDialogHeader>
                                         <AlertDialogTitle className="flex items-center gap-2">
                                           <UserX className="w-5 h-5 text-red-500" />
                                           Leave room
                                         </AlertDialogTitle>
                                         <AlertDialogDescription>
                                           Are you sure you want to leave <span className="font-medium">{room.name}</span>? You can re-join anytime from Explore.
                                         </AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter>
                                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                                         <AlertDialogAction onClick={() => handleLeaveRoom(room.id)} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                                           Leave
                                         </AlertDialogAction>
                                       </AlertDialogFooter>
                                     </AlertDialogContent>
                                   </AlertDialog>
                                 )}
                               </div>
                             </div>
                             <div className="flex items-center justify-between">
                               <p className="text-xs text-muted-foreground truncate">
                                 {room.description}
                               </p>
                               {room.type === 'private' && (
                                 <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">Private</span>
                               )}
                             </div>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dms" className="flex-1 px-3 md:px-4 pb-4 space-y-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Direct Messages</h3>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => setShowStartDMModal(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">New DM</span>
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {filteredDMs.map((dm) => (
                  <Card 
                    key={dm.id} 
                    className={`professional-card cursor-pointer hover:bg-muted/50 transition-colors animate-scale-in ${activeDMRoom?.id === dm.id ? 'ring-2 ring-primary bg-muted/20' : ''}`}
                    onClick={() => focusDMWithRoom(dm)}
                    aria-current={activeDMRoom?.id === dm.id}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            {dmPartners[dm.id]?.avatar || dmPartners[dm.id]?.photoURL ? (
                              <AvatarImage src={dmPartners[dm.id]?.avatar || dmPartners[dm.id]?.photoURL} alt={dmPartners[dm.id]?.displayName || dm.name} />
                            ) : null}
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {((dmPartners[dm.id]?.displayName || dm.name || dm.displayName) || '').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online status is handled by the backend presence service */}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{dmPartners[dm.id]?.displayName || dm.name || dm.displayName}</h4>
                            {/* Unread count will be implemented with message service */}
                          </div>
                          {/* Last message will be fetched from message service */}
                          <p className="text-xs text-muted-foreground truncate">
                            Direct message
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people" className="flex-1 px-3 md:px-4 pb-4 space-y-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">People</h3>
            </div>
            
            {/* People Sub-tabs */}
            <Tabs value={selectedPeopleTab} onValueChange={setSelectedPeopleTab} className="flex-1 flex flex-col">
              <div className="mb-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="friends" className="text-xs">
                    Friends
                    {filteredFriends.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {filteredFriends.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="text-xs">
                    Requests
                    {filteredFriendRequests.filter(r => r.toUserId === user?.uid).length > 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs">
                        {filteredFriendRequests.filter(r => r.toUserId === user?.uid).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="blocked" className="text-xs">
                    Blocked
                    {filteredBlockedUsers.length > 0 && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        {filteredBlockedUsers.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Friends List */}
              <TabsContent value="friends" className="flex-1">
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => (
                      <Card 
                        key={friend.id} 
                        className="professional-card hover:bg-muted/50 transition-colors animate-scale-in"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                    {(friend.name || friend.displayName || '').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                              </Avatar>
                              {friend.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-sm">{friend.displayName || friend.name}</h4>
                                  <p className="text-xs text-muted-foreground">@{friend.username}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleMessageFriend(friend.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveFriend(friend.id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-1">
                                {friend.isOnline ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs text-green-600">Online</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Last seen {friend.lastSeen instanceof Date ? friend.lastSeen.toLocaleDateString() : new Date(friend.lastSeen).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredFriends.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No friends found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Friend Requests */}
              <TabsContent value="requests" className="flex-1">
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {filteredFriendRequests.map((request) => {
                      const requestUser = friendRequestUsers[request.fromUserId];
                      if (!requestUser) return null;
                      
                      return (
                        <Card 
                          key={request.id} 
                          className="professional-card hover:bg-muted/50 transition-colors animate-scale-in"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                    {(requestUser.name || requestUser.displayName || '').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm">{requestUser.displayName || requestUser.name}</h4>
                                    <p className="text-xs text-muted-foreground">@{requestUser.username}</p>
                                    <span className="text-xs text-muted-foreground">
                                      Received {request.createdAt instanceof Date ? request.createdAt.toLocaleDateString() : new Date(request.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-2 flex-shrink-0 ml-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleAcceptFriendRequest(request.id)}
                                      className="h-7 px-3 text-xs w-20"
                                    >
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRejectFriendRequest(request.id)}
                                      className="h-7 px-3 text-xs w-20"
                                    >
                                      <UserX className="w-3 h-3 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {filteredFriendRequests.length === 0 && (
                      <div className="text-center py-8">
                        <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No friend requests</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Blocked Users */}
              <TabsContent value="blocked" className="flex-1">
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {filteredBlockedUsers.map((blocked) => (
                      <Card 
                        key={blocked.id} 
                        className="professional-card hover:bg-muted/50 transition-colors animate-scale-in"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 flex-shrink-0 opacity-50">
                              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                                {(blocked.name || blocked.displayName || '').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-sm opacity-75">{blocked.displayName || blocked.name}</h4>
                                  <p className="text-xs text-muted-foreground">@{blocked.username}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnblockUser(blocked.id)}
                                  className="h-8 px-3 text-xs"
                                >
                                  Unblock
                                </Button>
                              </div>
                              <div className="mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Blocked recently
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredBlockedUsers.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No blocked users</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
        
        {/* Bottom Ad - Subtle placement */}
        <div className="p-3 border-t">
          <div className="mb-2">
            <InFeedAd />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`${showMobileContent ? 'w-full' : 'hidden'} md:flex-1 bg-muted/5 h-screen flex md:flex overflow-hidden pt-16 md:pt-0 text-sm md:text-base`}>
        {/* Mobile Navigation */}
        <div className="md:hidden fixed top-3 left-3 z-50">
          {showMobileContent && !isRandomChatActive && !isExploreRoomsActive ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMobileBackToSidebar}
              className="bg-background/90 backdrop-blur-sm shadow-md px-3 py-1 text-sm"
            >
              ← Back
            </Button>
          ) : !showMobileContent ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShowMobileSidebar}
              className="bg-background/90 backdrop-blur-sm shadow-md px-3 py-1 text-sm"
            >
              ☰ Menu
            </Button>
          ) : null}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center h-full overflow-hidden">
          {activeDMRoom ? (
            <div className="w-full h-full flex flex-col bg-card border-l border-r pt-0 md:pt-0 max-h-screen overflow-hidden">
              <ChatRoomComponent
                roomName={activeDMRoom.name || (dmPartners[activeDMRoom.id]?.displayName || 'Direct message')}
                roomId={activeDMRoom.id}
                roomType={'dm'}
                participants={((activeDMRoom.members || activeDMRoom.participants) && (activeDMRoom.members || activeDMRoom.participants).length) || 2}
                onBack={handleCloseDMView}
                currentUser={{
                  name: user?.displayName || user?.name || 'You',
                  type: user?.isAnonymous ? 'guest' : 'email',
                  email: user?.email,
                  avatar: user?.avatar || user?.photoURL
                }}
                roomImage={dmPartners[activeDMRoom.id]?.avatar || (activeDMRoom.settings && (activeDMRoom.settings.matchUserAvatar || ''))}
                dmPartnerId={(activeDMRoom.participants || activeDMRoom.members || [])[1] || (activeDMRoom.settings && activeDMRoom.settings.matchUserId)}
                dmPartnerName={dmPartners[activeDMRoom.id]?.displayName || activeDMRoom.name}
                dmPartnerAvatar={dmPartners[activeDMRoom.id]?.avatar || (activeDMRoom.settings && activeDMRoom.settings.matchUserAvatar)}
              />
            </div>
          ) : isExploreRoomsActive ? (
            /* Explore Rooms Component */
            <div className="w-full h-full flex flex-col bg-card border-l border-r max-h-screen overflow-hidden pt-0 md:pt-0">
              {/* Explore Rooms Header */}
              <div className="border-b bg-card px-4 py-3 flex-shrink-0 sticky top-0 z-40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Compass className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Explore Public Rooms</h3>
                      <p className="text-sm text-muted-foreground">Discover and join public chat rooms</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCloseExploreRooms}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="border-b p-4 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search public rooms..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Public Rooms List */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4 overflow-y-auto">
                  <div className="grid gap-3">
                    {getAllPublicRooms()
                      .filter(room => {
                        const roomName = (room.name || '').toLowerCase();
                        const roomDescription = (room.description || '').toLowerCase();
                        return roomName.includes(normalizedSearchQuery) || roomDescription.includes(normalizedSearchQuery);
                      })
                      .map((room) => {
                        const IconComponent = categoryIcons[room.category as keyof typeof categoryIcons] || Hash;
                        const isJoined = joinedPublicRooms.includes(room.id);
                        return (
                          <Card 
                            key={room.id} 
                            className="professional-card hover:bg-muted/50 transition-all duration-200 cursor-pointer hover:scale-[1.02] animate-scale-in"
                            onClick={() => onJoinRoom(room)}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                                    <h3 className="font-semibold text-xs sm:text-sm truncate">{room.name}</h3>
                                    <Badge variant="secondary" className="text-xs">
                                      {room.category}
                                    </Badge>
                                    {room.createdBySystem && (
                                      <Badge variant="outline" className="text-xs">
                                        System
                                      </Badge>
                                    )}
                                    {isJoined && (
                                      <Badge variant="default" className="text-xs bg-green-500">
                                        Joined
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1 sm:mb-2">
                                    {room.description}
                                  </p>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">{room.members}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                  <Button 
                                    variant={isJoined ? "secondary" : "default"}
                                    size="sm"
                                    className={`${isJoined ? "" : "chat-gradient text-white"} text-xs px-3 py-1 min-w-[50px]`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isJoined) {
                                        // open the room using parent handler
                                        try { onJoinRoom(room); } catch (err) {}
                                      } else {
                                        handleJoinRoom(room.id);
                                      }
                                    }}
                                  >
                                    {isJoined ? "Open" : "Join"}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    }
                    {getAllPublicRooms().filter(room => {
                      const roomName = (room.name || '').toLowerCase();
                      const roomDescription = (room.description || '').toLowerCase();
                      return roomName.includes(normalizedSearchQuery) || roomDescription.includes(normalizedSearchQuery);
                    }).length === 0 && (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-medium text-muted-foreground mb-1">No public rooms found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or create a new room</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : isRandomExperienceActive && activeRandomRoom ? (
            /* Random Chat Component */
            <div className="w-full h-full flex flex-col bg-card border-l border-r pt-0 md:pt-0 max-h-screen overflow-hidden">
              {/* Random Chat Header */}
              <div className="border-b bg-card px-4 py-3 sticky top-0 z-40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          try {
                            if (activeRandomPartner?.id) {
                              await UserService.recordProfileView(activeRandomPartner.id, user?.uid);
                            }
                          } catch {}
                          navigate(`/profile?userId=${activeRandomPartner?.id || ''}`);
                        }}
                        title={`View ${randomPartnerName} profile`}
                        className="rounded-full p-0"
                      >
                        <Avatar className="w-10 h-10 cursor-pointer">
                          {activeRandomPartner?.photoURL || activeRandomPartner?.avatar ? (
                            <AvatarImage src={activeRandomPartner?.photoURL || activeRandomPartner?.avatar || ''} alt={randomPartnerName} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {(randomPartnerName || '').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    <div>
                      <h3 className="font-semibold">Talking with {randomPartnerName || 'Stranger'}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>One-to-one match · private session</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleNewRandomChat}
                      className="flex items-center gap-1"
                      disabled={isRandomChatSearching}
                    >
                      <SkipForward className="w-4 h-4" />
                      {isRandomChatSearching ? 'Matching...' : 'New partner'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleCloseRandomChat}
                    >
                      End chat
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Random Chat Messages Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4 h-full overflow-y-auto">
                  <div className="space-y-4">
                    {/* System Message */}
                    <div className="flex justify-center">
                      <div className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">
                        You're matched with {randomPartnerName}. Be respectful and have fun!
                      </div>
                    </div>
                    
                    {/* Dynamic Random Chat Messages */}
                    {randomChatMessages.map((message) => (
                      <div key={message.id} className={`flex gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        <button
                          onClick={async () => {
                            try {
                              if (message.sender === 'user') {
                                await UserService.recordProfileView(user?.uid || '', user?.uid);
                                navigate('/profile');
                              } else {
                                if (activeRandomPartner?.id) {
                                  await UserService.recordProfileView(activeRandomPartner.id, user?.uid);
                                }
                                navigate(`/profile?userId=${activeRandomPartner?.id || ''}`);
                              }
                            } catch {}
                          }}
                          title={message.sender === 'user' ? 'View your profile' : `View ${randomPartnerName} profile`}
                          className="rounded-full p-0"
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer">
                            <AvatarFallback className={`text-white text-sm ${
                              message.sender === 'user' 
                                ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }`}>
                              {message.sender === 'user' ? 'Y' : '?'}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                        <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                            <span className="font-medium text-sm">{message.senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <div className={`p-3 rounded-lg text-sm max-w-xs ${
                            message.sender === 'user' 
                              ? 'bg-primary text-primary-foreground ml-auto' 
                              : 'bg-muted'
                          }`}>
                            {message.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show initial message if no messages yet */}
                    {randomChatMessages.length === 0 && (
                      <div className="flex gap-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                            {(randomPartnerName || '').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{randomPartnerName}</span>
                            <span className="text-xs text-muted-foreground">just now</span>
                          </div>
                          <div className="bg-muted p-3 rounded-lg text-sm inline-block break-words w-max max-w-[70%]">
                            Hey! How's it going? 👋
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Random Chat Input */}
                <div className="border-t p-4 bg-card sticky bottom-0 z-40">
                  <div className="flex gap-2 items-center">
                    <Input 
                      placeholder="Type a message..." 
                      className="flex-1"
                      value={randomChatMessage}
                      onChange={(e) => setRandomChatMessage(e.target.value)}
                      onKeyPress={handleRandomChatKeyPress}
                    />
                    <Button variant="ghost" size="sm" onClick={() => setShowEmojiPickerRandom(prev => !prev)} title="Emoji">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Button 
                      size="sm" 
                      className="chat-gradient text-white"
                      onClick={handleSendRandomMessage}
                      disabled={!randomChatMessage.trim() || !randomPartnerConnected || (mutedUntil && mutedUntil > Date.now())}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {showEmojiPickerRandom && (
                    <div className="mt-2">
                      <EmojiPicker onEmojiSelect={handleRandomEmojiSelect} onClose={() => setShowEmojiPickerRandom(false)} />
                    </div>
                  )}

                  <div className="flex justify-center mt-2">
                    {randomPartnerConnected ? (
                      <span className="text-xs text-muted-foreground">Click "Next" to chat with a different person</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Partner disconnected.</span>
                        <Button size="sm" onClick={handleNewRandomChat} className="ml-2">Find New Partner</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Default Welcome Screen */
            <div className="text-center max-w-md mx-auto p-8 pt-8 md:pt-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Select a room to start chatting</h2>
              <p className="text-muted-foreground mb-6">
                Choose from public rooms or start a private conversation with someone
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full chat-gradient text-white" 
                  onClick={handleRandomChat}
                  disabled={isRandomChatSearching}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {isRandomChatSearching ? 'Finding a match...' : '1:1 Random Chat'}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleExploreRooms}>
                  <Compass className="w-4 h-4 mr-2" />
                  Explore Rooms
                </Button>
                <Button variant="outline" className="w-full" onClick={async () => {
                  if (!user || user.type === 'guest') {
                    toast({ title: 'Registration required', description: 'Please register to create rooms.', action: (
                      <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => navigate('/settings')}>Go to Settings</button>
                    ) });
                    return;
                  }

                  if (!user.emailVerified) {
                    toast({ title: 'Email verification required', description: 'Please verify your email to create rooms.', action: (
                      <button className="px-3 py-1 bg-primary text-white rounded" onClick={async () => { if (user?.email) { await resendEmailVerification(user.email); toast({ title: 'Verification sent', description: 'Check your inbox' }); } }}>Resend verification</button>
                    ) });
                    return;
                  }

                  setShowCreateRoom(true);
                }}>
                  Create New Room
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Sidebar with Ads - Hidden on Mobile */}
        <div className="hidden md:flex md:flex-col w-80 border-l bg-card h-screen">
          {/* Top section with ads */}
          <div className="flex-1 p-4 space-y-4">
            <div className="text-sm font-medium text-muted-foreground mb-3">Sponsored</div>
            
            {/* First Ad - Larger */}
            <div className="h-60 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Advertisement</span>
            </div>
            
            {/* Second Ad - Larger */}
            <div className="h-60 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Advertisement</span>
            </div>
          </div>
          
          {/* Bottom Premium Card - Compact */}
          {!isPremium ? (
            <div className="p-3 border-t border-border bg-background">
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="p-3">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <div className="font-semibold text-xs mb-1 text-primary">💎 Upgrade to Premium</div>
                    <div className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Unlock exclusive features & ad-free experience!
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium text-xs py-1.5"
                      onClick={() => setShowPremiumModal(true)}
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      Upgrade Now
                    </Button>
                    <div className="text-xs text-muted-foreground mt-1.5">
                      Starting from ₹99/month
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-3 border-t border-border bg-background">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div className="font-medium text-xs text-primary">Premium Active</div>
                <div className="text-xs text-muted-foreground">
                  Thank you for supporting ChitZ! 🎉
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateGroupModal 
          onClose={() => setShowCreateRoom(false)}
          onCreateGroup={handleCreateGroup}
          isPremium={isPremium}
        />
      )}

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscribe={handleSubscribe}
        currentPlan={isPremium ? 'monthly' : 'free'}
      />

      {/* Start DM Modal */}
      <StartDMModal 
        isOpen={showStartDMModal}
        onOpenChange={setShowStartDMModal}
        onStartDM={handleStartDM}
      />

      <Sheet open={isFeatureDrawerOpen} onOpenChange={setIsFeatureDrawerOpen}>
        <SheetContent side="left" className="w-[320px] sm:w-[360px]">
          <SheetHeader>
            <SheetTitle>Quick Actions</SheetTitle>
            <SheetDescription>
              Curate shortcuts and feature toggles for power users right from the dashboard.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Feature Hub</p>
              <div className="grid gap-2">
                <Button variant="secondary" className="justify-between" onClick={() => handleOpenFeatureHubSection('about')}>
                  <span>About & Share</span>
                  <Info className="w-4 h-4" />
                </Button>
                <Button variant="secondary" className="justify-between" onClick={() => handleOpenFeatureHubSection('tools')}>
                  <span>Power Tools</span>
                  <Wrench className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Account</p>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-between" onClick={handleOpenSettingsPanel}>
                  <span>Profile & settings</span>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="justify-between" onClick={handleOpenSupport}>
                  <span>Support</span>
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="justify-between">
                      <span>Logout</span>
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <LogOut className="w-5 h-5 text-red-500" />
                        Confirm Logout
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to logout from <span className="font-medium">{user.name}</span>'s account? You will be signed out and redirected to the login page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDrawerLogout}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Yes, Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Appearance</p>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm">Theme</span>
                <DarkModeToggle />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseFeatureDrawer}>
              Close drawer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};