// Encrypted Chat Component for ChitZ
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useEncryptedChat } from '@/hooks/useEncryptedChat';
import { 
  Send, 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Paperclip, 
  Download,
  Edit2,
  Heart,
  Smile,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';

interface EncryptedChatProps {
  roomId: string;
  userId: string;
  userName: string;
  onBack?: () => void;
}

export const EncryptedChat: React.FC<EncryptedChatProps> = ({
  roomId,
  userId,
  userName,
  onBack
}) => {
  const {
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
  } = useEncryptedChat(roomId, userId);

  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let messageType: 'image' | 'file' | 'audio' | 'video' = 'file';
      
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('audio/')) messageType = 'audio';
      else if (file.type.startsWith('video/')) messageType = 'video';

      await sendFileMessage(file, messageType);
    } catch (err) {
      console.error('Failed to send file:', err);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle edit message
  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;

    try {
      await editMessage(messageId, editingContent.trim());
      setEditingMessageId(null);
      setEditingContent('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  // Handle download file
  const handleDownloadFile = async (messageId: string, fileName: string) => {
    try {
      const file = await downloadFile(messageId);
      if (file) {
        // Create download link
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading encrypted chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                ←
              </Button>
            )}
            <div>
              <h2 className="font-semibold text-lg">Encrypted Chat</h2>
              <div className="flex items-center space-x-2">
                {encryptionEnabled ? (
                  <Badge variant="default" className="bg-green-600">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    End-to-End Encrypted
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <ShieldOff className="w-3 h-3 mr-1" />
                    Encryption Disabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Encryption Toggle */}
          <div className="flex items-center space-x-2">
            {encryptionEnabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={disableEncryption}
                className="text-red-600 hover:text-red-700"
              >
                <Unlock className="w-4 h-4 mr-1" />
                Disable Encryption
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={enableEncryption}
                className="text-green-600 hover:text-green-700"
              >
                <Lock className="w-4 h-4 mr-1" />
                Enable Encryption
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="m-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!encryptionEnabled && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Encryption is disabled. Enable encryption to secure your messages.
            </AlertDescription>
          </Alert>
        )}

        {messages.map((message) => (
          <Card
            key={message.id}
            className={`max-w-xs ${
              message.senderId === userId
                ? 'ml-auto bg-blue-600 text-white'
                : 'mr-auto bg-white dark:bg-gray-800'
            }`}
          >
            <CardContent className="p-3">
              {/* Message Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium opacity-75">
                  {message.senderId === userId ? 'You' : message.senderName}
                </span>
                <div className="flex items-center space-x-1">
                  {message.isEncrypted && (
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                  )}
                  {message.decryptionFailed && (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>

              {/* Message Content */}
              {editingMessageId === message.id ? (
                <div className="space-y-2">
                  <Input
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleEditMessage(message.id);
                      }
                    }}
                    className="text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditMessage(message.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingMessageId(null);
                        setEditingContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm break-words">{message.content}</p>
                  
                  {/* File Download Button */}
                  {message.fileData && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadFile(message.id, message.fileData!.name)}
                      className="mt-2 w-full"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download {message.fileData.name}
                    </Button>
                  )}
                </>
              )}

              {/* Message Footer */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-60">
                  {formatTime(message.timestamp)}
                  {message.isEdited && ' (edited)'}
                </span>
                
                {/* Message Actions */}
                {message.senderId === userId && editingMessageId !== message.id && (
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingMessageId(message.id);
                        setEditingContent(message.content);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Reactions */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(message.reactions).map(([reactUserId, emoji]) => (
                    <Button
                      key={reactUserId}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (reactUserId === userId) {
                          removeReaction(message.id);
                        }
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {encryptionEnabled && (
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type an encrypted message..."
              disabled={sending}
              className="flex-1"
            />

            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Messages are end-to-end encrypted
          </p>
        </div>
      )}
    </div>
  );
};
