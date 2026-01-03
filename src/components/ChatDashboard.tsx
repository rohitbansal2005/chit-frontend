import { useState, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";
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
  const { signInAsGuest } = useAuth();
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
  const randomPartnerName = activeRandomPartner?.displayName || activeRandomPartner?.name || 'Stranger';
  const activeDMConversation = activeDMRoom ? dmConversations[activeDMRoom.id] || [] : [];
  const activeDMPartnerName = activeDMRoom?.name || 'Direct Message';

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
        // Load user's rooms
        const userRooms = await RoomService.getUserRooms(user.uid);
        setPublicRooms(userRooms.filter(room => room.type === 'public'));
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
      const roomId = await RoomService.createRoom({
        name: roomData.name,
        description: roomData.description,
        type: roomData.type,
        category: roomData.category,
        owner: user.uid,
        members: [user.uid],
        admins: [user.uid],
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

  // Check user premium status (to be filled from backend user profile)
  const isPremium = false; // TODO: Implement premium status on backend user profile

  // Handle sending random chat messages
  const handleSendRandomMessage = () => {
    if (!randomChatMessage.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: randomChatMessage,
      sender: 'user' as const,
      timestamp: new Date(),
      senderName: user?.name || user?.email || 'You'
    };
    
    setRandomChatMessages(prev => [...prev, newMessage]);
    setRandomChatMessage("");
    
    // Simulate stranger response after a delay
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
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  // Handle Enter key press for message sending
  const handleRandomChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendRandomMessage();
    }
  };

  // Reset random chat messages when starting a new chat
  const handleNewRandomChat = async () => {
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
  };

  // Handle explore rooms view
  const handleExploreRooms = () => {
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
  };

  const handleCloseDMView = () => {
    setActiveDMRoom(null);
    setDmInputMessage('');
    if (!isExploreRoomsActive && !isRandomExperienceActive) {
      setShowMobileContent(false);
    }
  };

  const handleMessageFriend = (friendId: string) => {
    const friend = friendsList.find(f => f.id === friendId);
    const friendName = friend?.name || friend?.username || 'New conversation';
    const existingRoom = directMessages.find(dm => dm.participants?.includes(friendId) || dm.members?.includes(friendId));
    if (existingRoom) {
      focusDMWithRoom(existingRoom);
      return;
    }

    const syntheticRoom: ChatRoom = {
      id: `dm-${friendId}`,
      name: friendName,
      description: 'Direct conversation',
      type: 'dm',
      owner: user?.uid || friendId,
      createdBy: user?.uid || friendId,
      participants: [user?.uid || 'me', friendId],
      members: [user?.uid || 'me', friendId],
      admins: [user?.uid || 'me'],
      moderators: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      category: 'dm'
    };

    setDirectMessages(prev => [...prev, syntheticRoom]);
    focusDMWithRoom(syntheticRoom);
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
      // Find user by username
      const users = await UserService.searchUsers(username);
      const targetUser = users.find(u => u.username === username);
      
      if (targetUser) {
        // Create or find existing DM room
        const dmRoomId = await RoomService.createDMRoom(user.uid, targetUser.id);
        const dmRoom = await RoomService.getRoomById(dmRoomId);
        if (dmRoom) {
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
      const onlineUsers = await UserService.getOnlineUsers();
      const availableUsers = onlineUsers.filter(u => u.id !== user.uid);
      
      if (availableUsers.length === 0) {
        setIsRandomChatSearching(false);
        return;
      }

      const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
      const friendlyName = randomUser.displayName || randomUser.name || 'Stranger';

      const randomChatRoom: ChatRoom = {
        id: `random-${Date.now()}`,
        name: `Chat with ${friendlyName}`,
        description: 'Private one-to-one random chat',
        type: 'dm',
        owner: user.uid,
        createdBy: user.uid,
        participants: [user.uid, randomUser.id],
        members: [user.uid, randomUser.id],
        admins: [user.uid],
        moderators: [],
        settings: {
          matchType: 'one-to-one',
          matchUserId: randomUser.id,
          matchUserName: friendlyName,
          matchUserAvatar: randomUser.photoURL || randomUser.avatar || ''
        },
        category: 'random',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0
      } as ChatRoom & { matchedUser?: AppUser };

      (randomChatRoom as any).matchedUser = randomUser;

      setLocalRandomRoom(randomChatRoom);
      setLocalRandomPartner(randomUser);
      setRandomChatMessages([]);
      setIsRandomChatSearching(false);

      if (onNextRandomChat || onCloseRandomChat) {
        onJoinRoom(randomChatRoom);
      }
    } catch (error) {
      console.error('Error starting random chat:', error);
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
                  {user.name.charAt(0).toUpperCase()}
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
              <Button size="sm" variant="outline" onClick={() => setShowCreateRoom(true)} className="text-xs">
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
                                {room.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2 min-w-0 flex-1">
                                 <h4 className="font-medium text-sm truncate">{room.name}</h4>
                                 {room.type === 'private' && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                                 {room.owner === user?.uid && <Badge variant="outline" className="text-xs flex-shrink-0">Owner</Badge>}
                               </div>
                               <div className="flex items-center gap-2">
                                 <Badge variant="secondary" className="text-xs flex-shrink-0">
                                   {room.members}
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
                    className="professional-card cursor-pointer hover:bg-muted/50 transition-colors animate-scale-in"
                    onClick={() => focusDMWithRoom(dm)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {dm.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online status is handled by the backend presence service */}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{dm.name}</h4>
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
                                  {friend.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {friend.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-sm">{friend.name}</h4>
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
                                  {requestUser.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm">{requestUser.name}</h4>
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
                                {blocked.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-sm opacity-75">{blocked.name}</h4>
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
      <div className={`${showMobileContent ? 'w-full' : 'hidden'} md:flex-1 bg-muted/5 h-screen flex md:flex overflow-hidden`}>
        {/* Mobile Navigation */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          {showMobileContent && !isRandomChatActive && !isExploreRoomsActive ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMobileBackToSidebar}
              className="bg-background/90 backdrop-blur-sm shadow-md"
            >
              ← Back
            </Button>
          ) : !showMobileContent ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShowMobileSidebar}
              className="bg-background/90 backdrop-blur-sm shadow-md"
            >
              ☰ Menu
            </Button>
          ) : null}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center h-full overflow-hidden">
          {activeDMRoom ? (
            /* Direct Message Component */
            <div className="w-full h-full flex flex-col bg-card border-l border-r pt-0 md:pt-0 max-h-screen overflow-hidden">
              <div className="border-b bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {activeDMPartnerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{activeDMPartnerName}</h3>
                    <p className="text-sm text-muted-foreground">Private direct message</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCloseDMView}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4 h-full overflow-y-auto">
                  <div className="space-y-4">
                    {activeDMConversation.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Say hello and start the conversation!
                      </div>
                    )}
                    {activeDMConversation.map((message) => {
                      if (message.sender === 'system') {
                        return (
                          <div key={message.id} className="flex justify-center">
                            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                              {message.text}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={message.id} className={`flex gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className={`text-white text-sm ${message.sender === 'user' ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-muted text-foreground'}`}>
                              {message.sender === 'user' ? 'Y' : activeDMPartnerName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                            <div className={`p-3 rounded-lg text-sm inline-block max-w-xs ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              {message.text}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="border-t p-4 bg-card sticky bottom-0 z-40">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Write a message..."
                      className="flex-1"
                      value={dmInputMessage}
                      onChange={(e) => setDmInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendDMMessage();
                        }
                      }}
                    />
                    <Button size="sm" className="chat-gradient text-white" onClick={handleSendDMMessage} disabled={!dmInputMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
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
                    <Avatar className="w-10 h-10">
                      {activeRandomPartner?.photoURL || activeRandomPartner?.avatar ? (
                        <AvatarImage src={activeRandomPartner?.photoURL || activeRandomPartner?.avatar || ''} alt={randomPartnerName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {randomPartnerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">Talking with {randomPartnerName}</h3>
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
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className={`text-white text-sm ${
                            message.sender === 'user' 
                              ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}>
                            {message.sender === 'user' ? 'Y' : '?'}
                          </AvatarFallback>
                        </Avatar>
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
                            {randomPartnerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{randomPartnerName}</span>
                            <span className="text-xs text-muted-foreground">just now</span>
                          </div>
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            Hey! How's it going? 👋
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Random Chat Input */}
                <div className="border-t p-4 bg-card sticky bottom-0 z-40">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type a message..." 
                      className="flex-1"
                      value={randomChatMessage}
                      onChange={(e) => setRandomChatMessage(e.target.value)}
                      onKeyPress={handleRandomChatKeyPress}
                    />
                    <Button 
                      size="sm" 
                      className="chat-gradient text-white"
                      onClick={handleSendRandomMessage}
                      disabled={!randomChatMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      Click "Next" to chat with a different person
                    </span>
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
                <Button variant="outline" className="w-full" onClick={() => setShowCreateRoom(true)}>
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