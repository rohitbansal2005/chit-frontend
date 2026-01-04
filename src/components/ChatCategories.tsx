import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Heart, 
  Music, 
  Gamepad2, 
  GraduationCap, 
  Coffee,
  Car,
  Utensils,
  TvIcon,
  Users,
  Globe,
  Star
} from "lucide-react";

const categories = [
  {
    id: "singles",
    title: "Singles Chat",
    description: "Meet new people and find connections",
    icon: Heart,
    color: "bg-pink-500",
    users: "2.5K",
    trending: true
  },
  {
    id: "music", 
    title: "Music Chat",
    description: "Discuss your favorite artists and songs",
    icon: Music,
    color: "bg-purple-500",
    users: "1.8K"
  },
  {
    id: "gaming",
    title: "Gaming Hub",
    description: "Connect with fellow gamers worldwide",
    icon: Gamepad2,
    color: "bg-blue-500", 
    users: "3.2K",
    trending: true
  },
  {
    id: "education",
    title: "Study Groups",
    description: "Learn together and share knowledge",
    icon: GraduationCap,
    color: "bg-green-500",
    users: "950"
  },
  {
    id: "casual",
    title: "Casual Chat", 
    description: "Random conversations and daily talk",
    icon: Coffee,
    color: "bg-orange-500",
    users: "4.1K"
  },
  {
    id: "cars",
    title: "Car Enthusiasts",
    description: "Everything about automobiles",
    icon: Car,
    color: "bg-red-500",
    users: "720"
  },
  {
    id: "food",
    title: "Food & Recipes",
    description: "Share recipes and cooking tips",
    icon: Utensils,
    color: "bg-yellow-500",
    users: "1.3K"
  },
  {
    id: "movies",
    title: "Movies & TV",
    description: "Discuss latest shows and films",
    icon: TvIcon,
    color: "bg-indigo-500",
    users: "2.1K"
  },
  {
    id: "international",
    title: "International",
    description: "Global discussions in multiple languages",
    icon: Globe,
    color: "bg-teal-500",
    users: "5.8K",
    trending: true
  }
];

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext-new';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export const ChatCategories = () => {
  const navigate = useNavigate();
  const { user, resendEmailVerification } = useAuth();
  const { toast } = useToast();

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-chat-primary to-chat-secondary bg-clip-text text-transparent">
            Choose Your Community
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of conversations happening right now across different interests and topics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id} 
                className="card-gradient border-border/50 hover:border-chat-primary/50 transition-all duration-300 hover:scale-105 group animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-3 rounded-xl ${category.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    {category.trending && (
                      <Badge className="bg-chat-accent text-background">
                        <Star className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-semibold">{category.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {category.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{category.users} online</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 fill-chat-warning text-chat-warning" />
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    variant="chat" 
                    className="w-full group-hover:bg-chat-primary group-hover:text-white"
                    onClick={() => {
                      if (!user || user.type === 'guest') {
                        toast({ title: 'Registration required', description: 'Register to create rooms.', action: (
                          <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => navigate('/settings')}>Go to Settings</button>
                        ) });
                        return;
                      }
                      if (!user.emailVerified) {
                        toast({ title: 'Email verification required', description: 'Please verify your email to create rooms.', action: (
                          <button className="px-3 py-1 bg-primary text-white rounded" onClick={async () => { if (user?.email) { await resendEmailVerification(user.email); toast({ title: 'Verification sent', description: 'Check your inbox' }); } }}>Resend verification</button>
                        ) });
                        return;
                      }
                      navigate('/create-room');
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Join Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-6 text-foreground">
            Quick Access
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" className="border-chat-primary text-chat-primary hover:bg-chat-primary hover:text-white">
              Random Room
            </Button>
            <Button variant="outline" className="border-chat-secondary text-chat-secondary hover:bg-chat-secondary hover:text-white">
              Most Popular
            </Button>
            <Button
              variant="outline"
              className="border-chat-accent text-chat-accent hover:bg-chat-accent hover:text-background"
              onClick={() => {
                if (!user || user.type === 'guest' || !user.emailVerified) {
                  toast({ title: 'Registration required', description: 'Register and verify your email to create rooms.', action: (
                    <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => navigate('/settings')}>Go to Settings</button>
                  ) });
                  return;
                }
                navigate('/create-room');
              }}
            >
              Create Room
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};