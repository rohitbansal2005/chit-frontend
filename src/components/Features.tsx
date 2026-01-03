import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Globe, 
  Smartphone, 
  MessageSquare, 
  Users, 
  Clock,
  Heart,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "100% Anonymous",
    description: "Chat without revealing your identity. No registration required, jump right in.",
    color: "text-chat-primary"
  },
  {
    icon: Globe,
    title: "Global Community", 
    description: "Connect with people from over 150 countries speaking multiple languages.",
    color: "text-chat-secondary"
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Perfect experience on any device - desktop, tablet, or mobile.",
    color: "text-chat-accent"
  },
  {
    icon: MessageSquare,
    title: "Instant Messaging",
    description: "Real-time chat with lightning-fast message delivery worldwide.",
    color: "text-chat-warning"
  },
  {
    icon: Users,
    title: "Private Rooms",
    description: "Create your own private chat rooms and invite friends to join.",
    color: "text-chat-primary"
  },
  {
    icon: Clock,
    title: "24/7 Active",
    description: "Someone is always online. Chat anytime, day or night.",
    color: "text-chat-secondary"
  },
  {
    icon: Heart,
    title: "Safe Environment",
    description: "Moderated rooms ensure a friendly and respectful community.",
    color: "text-chat-accent"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed with instant loading and smooth performance.",
    color: "text-chat-warning"
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-chat-accent via-chat-primary to-chat-secondary bg-clip-text text-transparent">
            Why Choose ChitZ ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The most advanced and user-friendly chat platform with features designed for everyone
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.title}
                className="card-gradient border-border/50 hover:border-chat-primary/30 transition-all duration-300 hover:scale-105 group text-center animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="mx-auto mb-4 p-4 rounded-2xl bg-background/50 w-fit group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="card-gradient rounded-2xl p-8 max-w-3xl mx-auto border border-border/50">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Join Over 50,000 Daily Active Users
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Experience the most vibrant online community where conversations never stop. 
              Whether you're looking for friendship, learning, entertainment, or just casual chat - 
              you'll find your perfect match here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};