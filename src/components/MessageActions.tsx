import { useState } from "react";
import { MoreVertical, Reply, Edit, Trash2, Flag, Ban, Copy, UserPlus, MessageCircle, VolumeX, UserX, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MessageActionsProps {
  messageId: string;
  isOwnMessage: boolean;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onReport: (messageId: string) => void;
  onBlock: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  onStartDM: (userId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onBanUser?: (userId: string, messageId: string, messageContent: string) => void;
  onMuteUser?: (userId: string, messageId: string, messageContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
  userId: string;
  userName?: string;
  messageContent?: string;
  currentUserRole?: 'owner' | 'admin' | 'member';
  messageUserRole?: 'owner' | 'admin' | 'member';
  isPinned?: boolean;
  roomType?: 'public' | 'private' | 'dm';
}

export const MessageActions = ({ 
  messageId, 
  isOwnMessage, 
  onReply, 
  onEdit, 
  onDelete, 
  onReport, 
  onBlock,
  onAddFriend,
  onStartDM,
  onReaction,
  onBanUser,
  onMuteUser,
  onDeleteMessage,
  onPinMessage,
  onUnpinMessage,
  userId,
  userName,
  messageContent = '',
  currentUserRole = 'member',
  messageUserRole = 'member',
  isPinned = false,
  roomType = 'public'
}: MessageActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Check if current user can moderate this message
  const canModerate = (currentUserRole === 'owner' || currentUserRole === 'admin') && 
                     !isOwnMessage && 
                     messageUserRole !== 'owner' && 
                     !(currentUserRole === 'admin' && messageUserRole === 'admin');

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-52 bg-popover border border-border z-50">
        {/* Quick Reactions */}
        <div className="p-2 border-b border-border quick-reaction-menu">
          <div className="flex justify-center gap-1">
            {['❤️', '😂', '👍', '😮', '😢'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleAction(() => onReaction(messageId, emoji))}
                className="w-8 h-8 rounded-full hover:bg-muted transition-all duration-200 flex items-center justify-center text-lg"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        <DropdownMenuItem onClick={() => handleAction(() => onReply(messageId))}>
          <Reply className="w-4 h-4 mr-2" />
          Reply
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction(() => navigator.clipboard.writeText('Message copied'))}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Text
        </DropdownMenuItem>

        {/* Pin/Unpin option for staff - only in group rooms */}
        {roomType !== 'dm' && (currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <>
            <DropdownMenuSeparator />
            {isPinned ? (
              <DropdownMenuItem onClick={() => handleAction(() => onUnpinMessage?.(messageId))}>
                <PinOff className="w-4 h-4 mr-2" />
                Unpin Message
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleAction(() => onPinMessage?.(messageId))}>
                <Pin className="w-4 h-4 mr-2" />
                Pin Message
              </DropdownMenuItem>
            )}
          </>
        )}

        {isOwnMessage ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => onEdit(messageId))}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleAction(() => onDelete(messageId))}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => onAddFriend(userId))}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </DropdownMenuItem>
            {/* Hide Send DM option in DM rooms since you're already in a DM */}
            {roomType !== 'dm' && (
              <DropdownMenuItem onClick={() => handleAction(() => onStartDM(userId))}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Send DM
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => onReport(messageId))}>
              <Flag className="w-4 h-4 mr-2" />
              Report
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleAction(() => onBlock(userId))}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="w-4 h-4 mr-2" />
              Block User
            </DropdownMenuItem>
          </>
        )}

        {/* Moderation Actions for Admins/Owners - only in group rooms */}
        {roomType !== 'dm' && canModerate && (
          <>
            <DropdownMenuSeparator />
            {onDeleteMessage && (
              <DropdownMenuItem 
                onClick={() => handleAction(() => onDeleteMessage(messageId))}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Message
              </DropdownMenuItem>
            )}
            {onMuteUser && (
              <DropdownMenuItem 
                onClick={() => handleAction(() => onMuteUser(userId, messageId, messageContent))}
                className="text-orange-600 focus:text-orange-600"
              >
                <VolumeX className="w-4 h-4 mr-2" />
                Mute User
              </DropdownMenuItem>
            )}
            {onBanUser && (
              <DropdownMenuItem 
                onClick={() => handleAction(() => onBanUser(userId, messageId, messageContent))}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="w-4 h-4 mr-2" />
                Ban User
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};