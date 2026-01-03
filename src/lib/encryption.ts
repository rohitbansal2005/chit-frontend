// End-to-End Encryption Service for ChitZ
import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  // Generate a secure random key
  static generateKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  // Generate secure random IV
  static generateIV(): string {
    return CryptoJS.lib.WordArray.random(12).toString();
  }

  // Encrypt text message
  static encryptMessage(plaintext: string, key: string): {
    encrypted: string;
    iv: string;
  } {
    try {
      const iv = this.generateIV();
      const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }).toString();

      return {
        encrypted,
        iv
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt text message
  static decryptMessage(encrypted: string, key: string, iv: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Encrypt file/media data
  static async encryptFile(file: File, key: string): Promise<{
    encryptedData: string;
    iv: string;
    originalName: string;
    mimeType: string;
    size: number;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
          const iv = this.generateIV();
          
          const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          }).toString();

          resolve({
            encryptedData: encrypted,
            iv,
            originalName: file.name,
            mimeType: file.type,
            size: file.size
          });
        } catch (error) {
          reject(new Error('Failed to encrypt file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Decrypt file/media data
  static async decryptFile(
    encryptedData: string,
    key: string,
    iv: string,
    originalName: string,
    mimeType: string
  ): Promise<File> {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const typedArray = this.wordArrayToUint8Array(decrypted);
      const blob = new Blob([typedArray as any], { type: mimeType });
      
      return new File([blob], originalName, { type: mimeType });
    } catch (error) {
      console.error('File decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  }

  // Convert WordArray to Uint8Array
  private static wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
    const arrayOfWords = wordArray.words;
    const length = wordArray.sigBytes;
    const uInt8Array = new Uint8Array(length);
    
    let index = 0;
    for (let i = 0; i < length; i++) {
      const word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
    }
    
    return uInt8Array;
  }

  // Generate room encryption key (shared key for group chats)
  static generateRoomKey(): string {
    return this.generateKey();
  }

  // Encrypt room key with user's public key (for key exchange)
  static encryptRoomKey(roomKey: string, userKey: string): {
    encryptedKey: string;
    iv: string;
  } {
    const iv = this.generateIV();
    const encrypted = CryptoJS.AES.encrypt(roomKey, userKey, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    return {
      encryptedKey: encrypted,
      iv
    };
  }

  // Decrypt room key with user's private key
  static decryptRoomKey(encryptedKey: string, userKey: string, iv: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedKey, userKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Room key decryption error:', error);
      throw new Error('Failed to decrypt room key');
    }
  }

  // Hash password for secure storage
  static hashPassword(password: string, salt?: string): {
    hash: string;
    salt: string;
  } {
    const finalSalt = salt || CryptoJS.lib.WordArray.random(16).toString();
    const hash = CryptoJS.PBKDF2(password, finalSalt, {
      keySize: 256/32,
      iterations: 10000
    }).toString();

    return {
      hash,
      salt: finalSalt
    };
  }

  // Verify password against hash
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 10000
    }).toString();

    return computed === hash;
  }
}

// Key Management Service
export class KeyManager {
  private static readonly STORAGE_KEY = 'chitz_encryption_keys';

  // Store user's encryption key securely
  static storeUserKey(userId: string, key: string): void {
    try {
      const keys = this.getAllKeys();
      keys[userId] = key;
      
      // Store in secure localStorage (in production, use more secure storage)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to store user key:', error);
    }
  }

  // Retrieve user's encryption key
  static getUserKey(userId: string): string | null {
    try {
      const keys = this.getAllKeys();
      return keys[userId] || null;
    } catch (error) {
      console.error('Failed to retrieve user key:', error);
      return null;
    }
  }

  // Store room encryption key
  static storeRoomKey(roomId: string, key: string): void {
    try {
      const keys = this.getAllKeys();
      const roomKeys = keys.rooms || {};
      roomKeys[roomId] = key;
      keys.rooms = roomKeys;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to store room key:', error);
    }
  }

  // Retrieve room encryption key
  static getRoomKey(roomId: string): string | null {
    try {
      const keys = this.getAllKeys();
      const roomKeys = keys.rooms || {};
      return roomKeys[roomId] || null;
    } catch (error) {
      console.error('Failed to retrieve room key:', error);
      return null;
    }
  }

  // Get all stored keys
  private static getAllKeys(): any {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  // Clear all encryption keys (logout)
  static clearAllKeys(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear encryption keys:', error);
    }
  }

  // Generate and store new user key
  static generateUserKey(userId: string): string {
    const key = EncryptionService.generateKey();
    this.storeUserKey(userId, key);
    return key;
  }
}
