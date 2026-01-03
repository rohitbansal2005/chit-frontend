// Encrypted Message Service for ChitZ (Node/Express + Mongo backend)
import { apiClient } from './apiClient';
import { EncryptionService, KeyManager } from './encryption';

export interface EncryptedMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  encryptedContent: string;
  iv: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  timestamp: Date | string;
  isEdited?: boolean;
  editedAt?: Date | string;
  reactions?: { [userId: string]: string };
  replyTo?: string;
  encryptedFileData?: {
    encryptedData: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export class EncryptedMessageService {
  // Send encrypted text message
  static async sendTextMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    plaintext: string,
    replyTo?: string
  ): Promise<string> {
    const roomKey = KeyManager.getRoomKey(roomId);
    if (!roomKey) {
      throw new Error('Room encryption key not found');
    }

    const { encrypted, iv } = EncryptionService.encryptMessage(plaintext, roomKey);
    const payload = {
      roomId,
      senderId,
      senderName,
      encryptedContent: encrypted,
      iv,
      messageType: 'text' as const,
      replyTo
    };

    const created = await apiClient.post<EncryptedMessage>('/encrypted/messages', payload);
    return created.id;
  }

  // Send encrypted file/media message
  static async sendFileMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    file: File,
    messageType: 'image' | 'file' | 'audio' | 'video' = 'file'
  ): Promise<string> {
    const roomKey = KeyManager.getRoomKey(roomId);
    if (!roomKey) {
      throw new Error('Room encryption key not found');
    }

    const encryptedFileData = await EncryptionService.encryptFile(file, roomKey);
    const payload = {
      roomId,
      senderId,
      senderName,
      encryptedContent: `[Encrypted ${messageType.toUpperCase()}]`,
      iv: encryptedFileData.iv,
      messageType,
      encryptedFileData: {
        encryptedData: encryptedFileData.encryptedData,
        originalName: encryptedFileData.originalName,
        mimeType: encryptedFileData.mimeType,
        size: encryptedFileData.size
      }
    };

    const created = await apiClient.post<EncryptedMessage>('/encrypted/messages', payload);
    return created.id;
  }

  // Listen to encrypted messages in a room (poll-based placeholder)
  static listenToRoomMessages(
    roomId: string,
    callback: (messages: EncryptedMessage[]) => void
  ): () => void {
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const messages = await apiClient.get<EncryptedMessage[]>('/encrypted/messages', { roomId, order: 'asc' });
        if (active) callback(messages);
      } catch (err) {
        console.error('Failed to fetch encrypted messages', err);
      }
      if (active) setTimeout(poll, 3000);
    };

    poll();
    return () => {
      active = false;
    };
  }

  // Decrypt message content
  static decryptMessage(message: EncryptedMessage, roomId: string): {
    decryptedContent: string;
    decryptedFile?: File;
  } {
    try {
      const roomKey = KeyManager.getRoomKey(roomId);
      if (!roomKey) {
        throw new Error('Room encryption key not found');
      }

      let decryptedContent = '';

      if (message.messageType === 'text') {
        decryptedContent = EncryptionService.decryptMessage(
          message.encryptedContent,
          roomKey,
          message.iv
        );
      } else if (message.encryptedFileData) {
        decryptedContent = `📎 ${message.encryptedFileData.originalName}`;
      }

      return {
        decryptedContent
      };
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return {
        decryptedContent: '[Failed to decrypt message]'
      };
    }
  }

  static async decryptAndDownloadFile(
    message: EncryptedMessage,
    roomId: string
  ): Promise<File> {
    if (!message.encryptedFileData) {
      throw new Error('No encrypted file data found');
    }

    const roomKey = KeyManager.getRoomKey(roomId);
    if (!roomKey) {
      throw new Error('Room encryption key not found');
    }

    return EncryptionService.decryptFile(
      message.encryptedFileData.encryptedData,
      roomKey,
      message.iv,
      message.encryptedFileData.originalName,
      message.encryptedFileData.mimeType
    );
  }

  static async editMessage(
    messageId: string,
    newContent: string,
    roomId: string
  ): Promise<void> {
    const roomKey = KeyManager.getRoomKey(roomId);
    if (!roomKey) {
      throw new Error('Room encryption key not found');
    }

    const { encrypted, iv } = EncryptionService.encryptMessage(newContent, roomKey);
    await apiClient.patch(`/encrypted/messages/${messageId}`, {
      encryptedContent: encrypted,
      iv,
      isEdited: true
    });
  }

  static async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    await apiClient.post(`/encrypted/messages/${messageId}/reactions`, { userId, emoji });
  }

  static async removeReaction(messageId: string, userId: string): Promise<void> {
    await apiClient.delete(`/encrypted/messages/${messageId}/reactions`, { body: { userId } } as any);
  }
}

// Room Key Management for E2E Encryption
export class EncryptedRoomService {
  static async createEncryptedRoom(
    roomData: any,
    creatorId: string,
    memberIds: string[]
  ): Promise<string> {
    const roomKey = EncryptionService.generateRoomKey();

    const created = await apiClient.post<{ id: string; roomKey?: string }>('/encrypted/rooms', {
      ...roomData,
      createdBy: creatorId,
      members: memberIds,
      roomKey
    });

    KeyManager.storeRoomKey(created.id, created.roomKey || roomKey);
    return created.id;
  }

  static async joinEncryptedRoom(roomId: string, userId: string): Promise<void> {
    // In a real system, the server should send back an encrypted room key for the user.
    const response = await apiClient.post<{ roomKey?: string }>(`/encrypted/rooms/${roomId}/join`, { userId });
    const roomKey = response.roomKey || EncryptionService.generateRoomKey();
    KeyManager.storeRoomKey(roomId, roomKey);
  }

  static leaveEncryptedRoom(roomId: string): void {
    const keys = JSON.parse(localStorage.getItem('chitz_encryption_keys') || '{}');
    if (keys.rooms) {
      delete keys.rooms[roomId];
      localStorage.setItem('chitz_encryption_keys', JSON.stringify(keys));
    }
  }
}
