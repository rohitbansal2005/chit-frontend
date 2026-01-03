import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, X, MessageCircle, Users, Heart, Trophy, Settings } from "lucide-react";

interface Notification {
  id: string;
  type: 'message' | 'mention' | 'join' | 'like' | 'achievement' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'New message from Alex',
    message: 'Hey! How are you doing?',
    time: '2 minutes ago',
    read: false,
    avatar: 'A'
  },
  {
    id: '2',
    type: 'mention',
    title: 'Sarah mentioned you',
    message: 'in General Chat: "@you check this out!"',
    time: '5 minutes ago',
    read: false,
    avatar: 'S'
  },
  {
    id: '3',
    type: 'join',
    title: 'New member joined',
    message: 'Mike joined Gaming Hub',
    time: '15 minutes ago',
    read: true,
    avatar: 'M'
  },
  {
    id: '4',
    type: 'achievement',
    title: 'Achievement unlocked!',
    message: 'You earned the "Active Chatter" badge',
    time: '1 hour ago',
    read: true
  },
  {
    id: '5',
    type: 'system',
    title: 'System update',
    message: 'New features have been added to the chat platform',
    time: '2 hours ago',
    read: true
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
    case 'mention':
      return MessageCircle;
    case 'join':
      return Users;
    case 'like':
      return Heart;
    case 'achievement':
      return Trophy;
    case 'system':
      return Settings;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'message':
      return 'text-blue-500';
    case 'mention':
      return 'text-orange-500';
    case 'join':
      return 'text-green-500';
    case 'like':
      return 'text-pink-500';
    case 'achievement':
      return 'text-yellow-500';
    case 'system':
      return 'text-purple-500';
    default:
      return 'text-muted-foreground';
  }
};

export const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-start justify-center pt-16 z-50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationColor(notification.type);
                  
                  return (
                    <div key={notification.id}>
                      <div 
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.read ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};