import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  UserMinus, 
  Flag, 
  Eye, 
  UserPlus,
  MoreVertical 
} from "lucide-react";

interface UserActionsMenuProps {
  userId: string;
  userName: string;
  isCurrentUser?: boolean;
  onViewProfile: (userId: string) => void;
  onStartDM: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  onBlockUser: (userId: string) => void;
  onReportUser: (userId: string, userName: string) => void;
  roomType?: 'public' | 'private' | 'dm';
}

export const UserActionsMenu = ({
  userId,
  userName,
  isCurrentUser = false,
  onViewProfile,
  onStartDM,
  onAddFriend,
  onBlockUser,
  onReportUser,
  roomType = 'public',
}: UserActionsMenuProps) => {
  // Don't show menu for current user
  if (isCurrentUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onViewProfile(userId)}>
          <Eye className="w-4 h-4 mr-2" />
          View Profile
        </DropdownMenuItem>
        
        {/* Hide Send DM option in DM rooms since you're already in a DM */}
        {roomType !== 'dm' && (
          <DropdownMenuItem onClick={() => onStartDM(userId)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Send Direct Message
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => onAddFriend(userId)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onReportUser(userId, userName)}
          className="text-orange-600 focus:text-orange-600"
        >
          <Flag className="w-4 h-4 mr-2" />
          Report User
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onBlockUser(userId)}
          className="text-red-600 focus:text-red-600"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Block User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
