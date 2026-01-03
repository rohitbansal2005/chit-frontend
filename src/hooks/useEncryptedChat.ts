// Encrypted Chat Hook for ChitZ
import { useState, useEffect, useCallback } from 'react';
import { EncryptedMessageService, EncryptedMessage } from '@/lib/encryptedMessaging';
import { KeyManager } from '@/lib/encryption';

export interface DecryptedMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  timestamp: Date;
  isEdited?: boolean;
  editedAt?: Date;
  reactions?: { [userId: string]: string };
  replyTo?: string;
  isEncrypted: boolean;
  decryptionFailed?: boolean;
  fileData?: {
    name: string;
    size: number;
    mimeType: string;
  };
}

export const useEncryptedChat = (roomId: string, userId: string) => {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);

  // Check if room has encryption enabled
  useEffect(() => {
    const roomKey = KeyManager.getRoomKey(roomId);
    setEncryptionEnabled(!!roomKey);
  }, [roomId]);

  // Listen to encrypted messages
  useEffect(() => {
    if (!roomId || !encryptionEnabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = EncryptedMessageService.listenToRoomMessages(
      roomId,
      (encryptedMessages: EncryptedMessage[]) => {
        try {
          const decryptedMessages: DecryptedMessage[] = encryptedMessages.map((msg) => {
            try {
              const { decryptedContent } = EncryptedMessageService.decryptMessage(msg, roomId);
              
              return {
                id: msg.id,
                roomId: msg.roomId,
                senderId: msg.senderId,
                senderName: msg.senderName,
                content: decryptedContent,
                messageType: msg.messageType,
                timestamp: msg.timestamp,
                isEdited: msg.isEdited,
                editedAt: msg.editedAt,
                reactions: msg.reactions,
                replyTo: msg.replyTo,
                isEncrypted: true,
                decryptionFailed: false,
                ...(msg.encryptedFileData && {
                  fileData: {
                    name: msg.encryptedFileData.originalName,
                    size: msg.encryptedFileData.size,
                    mimeType: msg.encryptedFileData.mimeType
                  }
                })
              };
            } catch (decryptError) {
              console.error('Failed to decrypt message:', decryptError);
              return {
                id: msg.id,
                roomId: msg.roomId,
                senderId: msg.senderId,
                senderName: msg.senderName,
                content: '[Failed to decrypt message]',
                messageType: msg.messageType,
                timestamp: msg.timestamp,
                isEncrypted: true,
                decryptionFailed: true
              };
            }
          });

          setMessages(decryptedMessages);
          setLoading(false);
        } catch (err) {
          console.error('Error processing messages:', err);
          setError('Failed to load messages');
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, [roomId, encryptionEnabled]);

  // Send encrypted text message
  const sendMessage = useCallback(async (content: string, replyTo?: string) => {
    try {
      if (!encryptionEnabled) {
        throw new Error('Encryption not enabled for this room');
      }

      await EncryptedMessageService.sendTextMessage(
        roomId,
        userId,
        'Current User', // This should come from user context
        content,
        replyTo
      );
    } catch (err) {
      console.error('Failed to send encrypted message:', err);
      throw err;
    }
  }, [roomId, userId, encryptionEnabled]);

  // Send encrypted file message
  const sendFileMessage = useCallback(async (
    file: File,
    messageType: 'image' | 'file' | 'audio' | 'video' = 'file'
  ) => {
    try {
      if (!encryptionEnabled) {
        throw new Error('Encryption not enabled for this room');
      }

      await EncryptedMessageService.sendFileMessage(
        roomId,
        userId,
        'Current User', // This should come from user context
        file,
        messageType
      );
    } catch (err) {
      console.error('Failed to send encrypted file:', err);
      throw err;
    }
  }, [roomId, userId, encryptionEnabled]);

  // Edit encrypted message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      if (!encryptionEnabled) {
        throw new Error('Encryption not enabled for this room');
      }

      await EncryptedMessageService.editMessage(messageId, newContent, roomId);
    } catch (err) {
      console.error('Failed to edit encrypted message:', err);
      throw err;
    }
  }, [roomId, encryptionEnabled]);

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await EncryptedMessageService.addReaction(messageId, userId, emoji);
    } catch (err) {
      console.error('Failed to add reaction:', err);
      throw err;
    }
  }, [userId]);

  // Remove reaction from message
  const removeReaction = useCallback(async (messageId: string) => {
    try {
      await EncryptedMessageService.removeReaction(messageId, userId);
    } catch (err) {
      console.error('Failed to remove reaction:', err);
      throw err;
    }
  }, [userId]);

  // Download encrypted file
  const downloadFile = useCallback(async (messageId: string): Promise<File | null> => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message || !message.fileData) {
        throw new Error('File message not found');
      }

      // Find the original encrypted message
      const encryptedMessage = await new Promise<EncryptedMessage>((resolve, reject) => {
        const unsubscribe = EncryptedMessageService.listenToRoomMessages(
          roomId,
          (msgs) => {
            const targetMsg = msgs.find(m => m.id === messageId);
            if (targetMsg) {
              unsubscribe();
              resolve(targetMsg);
            }
          }
        );
        
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          reject(new Error('Timeout finding message'));
        }, 5000);
      });

      return await EncryptedMessageService.decryptAndDownloadFile(encryptedMessage, roomId);
    } catch (err) {
      console.error('Failed to download file:', err);
      return null;
    }
  }, [messages, roomId]);

  // Enable encryption for current room
  const enableEncryption = useCallback(() => {
    try {
      // Generate and store room key
      const roomKey = KeyManager.generateUserKey(`room_${roomId}`);
      KeyManager.storeRoomKey(roomId, roomKey);
      setEncryptionEnabled(true);
    } catch (err) {
      console.error('Failed to enable encryption:', err);
      throw err;
    }
  }, [roomId]);

  // Disable encryption for current room
  const disableEncryption = useCallback(() => {
    try {
      // Remove room key
      const keys = JSON.parse(localStorage.getItem('chitz_encryption_keys') || '{}');
      if (keys.rooms) {
        delete keys.rooms[roomId];
        localStorage.setItem('chitz_encryption_keys', JSON.stringify(keys));
      }
      setEncryptionEnabled(false);
      setMessages([]); // Clear encrypted messages
    } catch (err) {
      console.error('Failed to disable encryption:', err);
      throw err;
    }
  }, [roomId]);

  return {
    messages,
    loading,
    error,
    encryptionEnabled,
    sendMessage,
    sendFileMessage,
    editMessage,
    addReaction,
    removeReaction,
    downloadFile,
    enableEncryption,
    disableEncryption
  };
};
