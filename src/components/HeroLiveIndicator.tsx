import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const demoUsers = [
  { id: '1', name: 'Alex', avatar: 'A', country: 'US' },
  { id: '2', name: 'Priya', avatar: 'P', country: 'IN' },
  { id: '3', name: 'Miguel', avatar: 'M', country: 'ES' },
  { id: '4', name: 'Yuki', avatar: 'Y', country: 'JP' },
];

export const HeroLiveIndicator: React.FC<{ online?: number }> = ({ online = 245 }) => {
  return (
    <div className="w-64 h-full flex-shrink-0">
      <Card className="h-full flex flex-col bg-background/40 border-border/40 backdrop-blur-md">
        <CardHeader className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-chat-accent rounded-full animate-pulse inline-block" />
              Live Now
            </CardTitle>
            <Badge variant="secondary" className="text-xs bg-chat-primary/15 text-chat-primary">
              {online}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-3 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3">
            {demoUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-chat-primary text-white text-sm">{u.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.country}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Joined • 2m</div>
                </div>
              </div>
            ))}

            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing" />
              <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing" style={{ animationDelay: '0.4s' }} />
              <span>Someone is typing...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeroLiveIndicator;
