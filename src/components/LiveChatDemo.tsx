import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, ThumbsUp, Smile } from "lucide-react";

interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
  avatar: string;
  country: string;
}

interface LiveChatDemoProps {
  onJoinChat?: () => void;
}

const demoMessages: Message[] = [
  { id: "1", user: "Alex", message: "Hey everyone! How's everyone doing today?", time: "2:30 PM", avatar: "A", country: "US" },
  { id: "2", user: "Priya", message: "Great! Just finished my morning workout 💪", time: "2:31 PM", avatar: "P", country: "IN" },
  { id: "3", user: "Miguel", message: "Good morning from Spain! ☀️", time: "2:32 PM", avatar: "M", country: "ES" },
  { id: "4", user: "Yuki", message: "こんにちは！Nice to meet you all", time: "2:33 PM", avatar: "Y", country: "JP" },
  { id: "5", user: "Emma", message: "Anyone here into music? Looking for new songs to listen to", time: "2:34 PM", avatar: "E", country: "UK" }
];

export const LiveChatDemo = ({ onJoinChat }: LiveChatDemoProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex < demoMessages.length) {
        setMessages(prev => [...prev, demoMessages[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      } else {
        // Reset after showing all messages
        setTimeout(() => {
          setMessages([]);
          setCurrentIndex(0);
        }, 3000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Auto-scroll to bottom whenever messages change
  const messagesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    // Smooth scroll to bottom
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        user: "You",
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: "Y",
        country: "XX"
      };
      setMessages(prev => [...prev, message]);
      setNewMessage("");
    }
  };

  return (
    <section className="py-20 px-6 bg-muted/10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-chat-secondary to-chat-accent bg-clip-text text-transparent">
            Live Chat Experience
          </h2>
          <p className="text-xl text-muted-foreground">
            See real conversations happening right now
          </p>
        </div>

        <Card className="card-gradient border-border/50 max-w-2xl mx-auto">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-chat-accent rounded-full animate-pulse"></div>
                General Chat
              </CardTitle>
              <Badge variant="secondary" className="bg-chat-primary/20 text-chat-primary">
                {245 + messages.length} online
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Messages Area */}
            <div ref={messagesRef} className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className="flex items-start gap-3 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-chat-primary text-white text-xs">
                      {msg.avatar}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{msg.user}</span>
                      <span className="text-xs text-muted-foreground">{msg.country}</span>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-sm">
                      {msg.message}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Typing Indicator */}
              {currentIndex < demoMessages.length && (
                <div className="flex items-center gap-3 animate-slide-up">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-muted text-xs">
                      ...
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing"></div>
                    <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-xs text-muted-foreground ml-2">Someone is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border/50 p-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-background/50"
                />
                <Button variant="ghost" size="sm">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button 
                  variant="chat" 
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button variant="hero" size="lg" onClick={onJoinChat}>
            Join the Conversation
          </Button>
        </div>
      </div>
    </section>
  );
};