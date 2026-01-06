// Shared API models and service wrappers for the MERN backend
import { apiClient } from './apiClient';

export interface AppUser {
  id: string;
  name: string;
  displayName: string;
  username?: string;
  email: string;
  avatar?: string;
  photoURL?: string;
  userType: 'guest' | 'registered' | 'premium';
  isOnline: boolean;
  lastSeen: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  bio?: string;
  age?: number;
  gender?: string;
  location?: string;
  dob?: Date | string | null;
  country?: string;
  language?: string;
  friends?: string[];
  blockedUsers?: string[];
  settings?: any;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    soundEnabled: boolean;
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  type: 'public' | 'private' | 'dm';
  owner: string;
  createdBy: string;
  participants: string[];
  members?: string[];
  admins?: string[];
  moderators?: string[];
  settings?: any;
  createdBySystem?: boolean;
  bannedUsers?: string[];
  mutedUsers?: { userId: string; until: Date | string }[];
  maxParticipants?: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastActivity: Date | string;
  messageCount: number;
  memberCount?: number;
  category?: string;
  tags?: string[];
  roomImage?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date | string;
  editedAt?: Date | string;
  isEdited: boolean;
  isDeleted: boolean;
  reactions?: { [emoji: string]: string[] };
  replyTo?: string;
  attachments?: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }[];
  mentions?: string[];
  isSystemMessage?: boolean;
  metadata?: any;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  fromUserId: string;
  receiverId: string;
  toUserId: string;
  senderName: string;
  senderAvatar?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date | string;
  respondedAt?: Date | string;
  message?: string;
}

export class UserService {
  static async createUser(userId: string, userData: Partial<AppUser>) {
    await apiClient.post('/users', { id: userId, ...userData });
    return userId;
  }

  static async updateUser(userId: string, updates: any) {
    await apiClient.patch(`/users/${userId}`, updates);
  }

  static async getUserById(userId: string): Promise<AppUser | null> {
    try {
      return await apiClient.get<AppUser>(`/users/${userId}`);
    } catch {
      return null;
    }
  }

  static async searchUsers(searchTerm: string): Promise<AppUser[]> {
    try {
      return await apiClient.get<AppUser[]>('/users', { search: searchTerm });
    } catch {
      return [];
    }
  }

  static async getOnlineUsers(): Promise<AppUser[]> {
    try {
      return await apiClient.get<AppUser[]>('/users', { online: true });
    } catch {
      return [];
    }
  }

  // Record that `viewerId` viewed `targetUserId`'s profile
  static async recordProfileView(targetUserId: string, viewerId?: string): Promise<number | null> {
    try {
      const resp = await apiClient.post<{ profileViews: number }>(`/users/${targetUserId}/view`, { viewerId });
      return resp.profileViews ?? null;
    } catch (err) {
      return null;
    }
  }

  static async blockUser(userId: string, blockedUserId: string) {
    await apiClient.post(`/users/${userId}/block`, { blockedUserId });
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chitz:blocked-users-updated'));
      }
    } catch (e) {}
  }

  static async unblockUser(userId: string, unblockedUserId: string) {
    await apiClient.post(`/users/${userId}/unblock`, { unblockedUserId });
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chitz:blocked-users-updated'));
      }
    } catch (e) {}
  }
  
  static async reportUser(reporterId: string, targetId: string, reason?: string) {
    try {
      return await apiClient.post('/reports', { reporterId, targetId, reason });
    } catch {
      return null;
    }
  }
}

export class RoomService {
  static async createRoom(roomData: Partial<ChatRoom>): Promise<string> {
    const room = await apiClient.post<ChatRoom>('/rooms', roomData);
    return room.id;
  }

  static async updateRoom(roomId: string, updates: Partial<ChatRoom>) {
    await apiClient.patch(`/rooms/${roomId}`, updates);
  }

  static async getUserRooms(userId: string): Promise<ChatRoom[]> {
    try {
      return await apiClient.get<ChatRoom[]>('/rooms', { member: userId });
    } catch {
      return [];
    }
  }

  static async getPublicRooms(): Promise<ChatRoom[]> {
    try {
      return await apiClient.get<ChatRoom[]>('/rooms', { type: 'public' });
    } catch {
      return [];
    }
  }

  static async getRoomById(roomId: string): Promise<ChatRoom | null> {
    try {
      return await apiClient.get<ChatRoom>(`/rooms/${roomId}`);
    } catch {
      return null;
    }
  }

  static async joinRoom(roomId: string, userId: string) {
    await apiClient.post(`/rooms/${roomId}/join`, { userId });
  }

  static async leaveRoom(roomId: string, userId: string) {
    await apiClient.post(`/rooms/${roomId}/leave`, { userId });
  }

  static async createDMRoom(userId1: string, userId2: string): Promise<string> {
    const room = await apiClient.post<ChatRoom>('/rooms/dm', { userId1, userId2 });
    return room.id;
  }

  static async createRandomChatRoom(userId: string, preferences?: any): Promise<string> {
    const room = await apiClient.post<ChatRoom>('/rooms/random', { userId, preferences });
    return room.id;
  }

  static async deleteRoom(roomId: string) {
    await apiClient.delete(`/rooms/${roomId}`);
  }

  static async hideRoom(roomId: string) {
    await apiClient.post(`/rooms/${roomId}/hide`, {});
  }
}

export class MessageService {
  static async sendMessage(messageData: Partial<ChatMessage>): Promise<string> {
    const { roomId, ...payload } = messageData;
    if (!roomId) throw new Error('roomId is required');
    const message = await apiClient.post<ChatMessage>(`/rooms/${roomId}/messages`, payload);
    return message.id;
  }

  // Record chat activity for a user (used to increment message counters / streaks)
  static async recordActivityMessage(userId: string, count: number = 1) {
    try {
      const resp = await apiClient.post(`/users/${userId}/activity/message`, { count });
      return resp;
    } catch (err) {
      return null;
    }
  }

  static async getRoomMessages(roomId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      return await apiClient.get<ChatMessage[]>(`/rooms/${roomId}/messages`, { limit: limitCount });
    } catch {
      return [];
    }
  }

  static async updateMessage(messageId: string, updates: Partial<ChatMessage>) {
    await apiClient.patch(`/messages/${messageId}`, updates);
  }

  static async deleteMessage(messageId: string) {
    await apiClient.delete(`/messages/${messageId}`);
  }

  static async addReaction(messageId: string, emoji: string, userId: string) {
    await apiClient.post(`/messages/${messageId}/reactions`, { emoji, userId });
  }

  static async removeReaction(messageId: string, emoji: string, userId: string) {
    await apiClient.delete(`/messages/${messageId}/reactions`, { body: { emoji, userId } } as any);
  }
}

export class FriendService {
  static async sendFriendRequest(
    senderId: string,
    receiverId: string,
    message?: string
  ): Promise<{ id?: string; message?: string; status?: string; fromUserId?: string; toUserId?: string }> {
    // Backend derives sender from auth; we still pass senderId for compatibility.
    const resp = await apiClient.post<any>('/friends/requests', { senderId, receiverId, message });
    if (!resp || typeof resp !== 'object') return { message: 'unknown response' };
    return {
      id: resp.id ? String(resp.id) : undefined,
      message: resp.message ? String(resp.message) : undefined,
      status: resp.status ? String(resp.status) : undefined,
      fromUserId: resp.fromUserId ? String(resp.fromUserId) : undefined,
      toUserId: resp.toUserId ? String(resp.toUserId) : undefined
    };
  }

  static async acceptFriendRequest(requestId: string) {
    await apiClient.post(`/friends/requests/${requestId}/accept`, {});
  }

  static async declineFriendRequest(requestId: string) {
    await apiClient.post(`/friends/requests/${requestId}/decline`, {});
  }

  static async rejectFriendRequest(requestId: string) {
    return this.declineFriendRequest(requestId);
  }

  static async removeFriend(userId: string, friendId: string) {
    await apiClient.post(`/users/${userId}/friends/remove`, { friendId });
  }

  static async getUserFriendRequests(_userId?: string): Promise<FriendRequest[]> {
    try {
      return await apiClient.get<FriendRequest[]>('/friends/requests');
    } catch {
      return [];
    }
  }
}
