import { apiClient } from './apiClient';

// Chat Room Interface
export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  password?: string;
  icon?: string;
  createdBy: string;
  createdAt: string | Date;
  lastMessage?: {
    text: string;
    timestamp: string | Date;
    senderName: string;
  };
}

// Message Interface
export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  roomId: string;
  timestamp: string | Date;
  type: 'text' | 'image' | 'file';
  imageUrl?: string;
  reactions?: { [emoji: string]: string[] };
}

// Create new chat room
export const createChatRoom = async (roomData: Omit<ChatRoom, 'id' | 'createdAt' | 'memberCount'>) => {
  const created = await apiClient.post<ChatRoom>('/chat-rooms', roomData);
  return created.id;
};

// Get all chat rooms
export const getChatRooms = async () => {
  const rooms = await apiClient.get<ChatRoom[]>('/chat-rooms');
  return rooms;
};

// Listen to chat rooms real-time (placeholder using polling)
export const subscribeToChatRooms = (callback: (rooms: ChatRoom[]) => void) => {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const rooms = await getChatRooms();
      if (active) callback(rooms);
    } catch (err) {
      console.error('Room subscription polling failed', err);
    }
    if (active) setTimeout(poll, 5000);
  };

  poll();
  return () => {
    active = false;
  };
};

// Send message to room
export const sendMessage = async (messageData: Omit<Message, 'id' | 'timestamp'>) => {
  const created = await apiClient.post<Message>(`/chat-rooms/${messageData.roomId}/messages`, messageData);
  return created.id;
};

// Listen to messages in a room (placeholder using polling)
export const subscribeToMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const messages = await apiClient.get<Message[]>(`/chat-rooms/${roomId}/messages`, { limit: 100 });
      if (active) callback(messages);
    } catch (err) {
      console.error('Message subscription polling failed', err);
    }
    if (active) setTimeout(poll, 3000);
  };

  poll();
  return () => {
    active = false;
  };
};

// Add reaction to message
export const addReaction = async (messageId: string, emoji: string, userId: string) => {
  await apiClient.post(`/messages/${messageId}/reactions`, { emoji, userId });
};

// Join chat room (increment member count)
export const joinRoom = async (roomId: string) => {
  await apiClient.post(`/chat-rooms/${roomId}/join`, {});
};

// Leave chat room (decrement member count)
export const leaveRoom = async (roomId: string) => {
  await apiClient.post(`/chat-rooms/${roomId}/leave`, {});
};
