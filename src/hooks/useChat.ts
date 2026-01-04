import { useState, useCallback, useRef, useEffect } from 'react';
import { playNotificationSound } from '@/lib/notificationSound';

export interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
  avatar: string;
  type: 'text' | 'system' | 'emoji';
  userId: string;
  replyTo?: string;
  edited?: boolean;
  reactions?: { [emoji: string]: { count: number; users: string[] } };
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  replyingTo: string | null;
  editingMessage: string | null;
}

export const useChat = (roomName: string) => {
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: "welcome",
        user: "System",
        message: `Welcome to ${roomName}! Be respectful and have fun chatting.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: "S",
        type: "system",
        userId: "system"
      }
    ],
    isTyping: false,
    replyingTo: null,
    editingMessage: null
  });

  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const addMessage = useCallback((message: Omit<Message, 'id' | 'time'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    try {
      // Play sound for incoming messages not sent by current user and not system messages
      const alertsEnabled = localStorage.getItem('chitz_alerts_enabled');
      const enabled = alertsEnabled === null ? true : alertsEnabled === '1';
      if (enabled && newMessage.userId !== 'current-user' && newMessage.type !== 'system') {
        const vol = Number(localStorage.getItem('chitz_alert_volume') || '70') / 100;
        playNotificationSound(Number.isFinite(vol) ? vol : 0.7);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const simulateTyping = useCallback(() => {
    setState(prev => ({ ...prev, isTyping: true }));
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isTyping: false }));
      
      // Add simulated response
      const responses = [
        "That's interesting! Tell me more 😊",
        "I agree with that point of view",
        "Thanks for sharing that!",
        "Great conversation topic!",
        "What's your experience with that?",
        "Absolutely! 💯",
        "I haven't thought about it that way",
        "That's a good point 👍"
      ];
      
      addMessage({
        user: "Alex",
        message: responses[Math.floor(Math.random() * responses.length)],
        avatar: "A",
        type: "text",
        userId: "alex-123"
      });
    }, 1500 + Math.random() * 1000);
  }, [addMessage]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const { editingMessage, replyingTo } = state;

    if (editingMessage) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === editingMessage 
            ? { ...msg, message: content.trim(), edited: true }
            : msg
        ),
        editingMessage: null
      }));
    } else {
      addMessage({
        user: "You",
        message: content.trim(),
        avatar: "Y",
        type: "text",
        userId: "current-user",
        replyTo: replyingTo || undefined
      });

      // Simulate others typing
      simulateTyping();
    }

    setState(prev => ({
      ...prev,
      replyingTo: null,
      editingMessage: null
    }));
  }, [state.editingMessage, state.replyingTo, addMessage, simulateTyping]);

  const editMessage = useCallback((messageId: string) => {
    const message = state.messages.find(m => m.id === messageId);
    if (message && message.userId === "current-user") {
      setState(prev => ({
        ...prev,
        editingMessage: messageId
      }));
      return message.message;
    }
    return '';
  }, [state.messages]);

  const deleteMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.id !== messageId)
    }));
  }, []);

  const replyToMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      replyingTo: messageId
    }));
  }, []);

  const cancelAction = useCallback(() => {
    setState(prev => ({
      ...prev,
      replyingTo: null,
      editingMessage: null
    }));
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string, userId: string = 'current-user') => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          if (reactions[emoji]) {
            if (reactions[emoji].users.includes(userId)) {
              reactions[emoji].users = reactions[emoji].users.filter(u => u !== userId);
              reactions[emoji].count--;
              if (reactions[emoji].count === 0) {
                delete reactions[emoji];
              }
            } else {
              reactions[emoji].users.push(userId);
              reactions[emoji].count++;
            }
          } else {
            reactions[emoji] = { count: 1, users: [userId] };
          }
          return { ...msg, reactions };
        }
        return msg;
      })
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    sendMessage,
    editMessage,
    deleteMessage,
    replyToMessage,
    cancelAction,
    addReaction
  };
};