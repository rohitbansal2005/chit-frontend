import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Mail, Globe, Shield, FileText, Users } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted/5 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg chat-gradient">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-chat-primary to-chat-secondary bg-clip-text text-transparent">
                ChitZO
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The world's most popular free chat platform. Connect, share, and make friends globally without any barriers.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Globe className="w-4 h-4 mr-2" />
                50+ Languages
              </Button>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                150+ Countries
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <div className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-chat-primary transition-colors">
                Join Chat Rooms
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-primary transition-colors">
                Create Private Room
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-primary transition-colors">
                Mobile App
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-primary transition-colors">
                Help Center
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-primary transition-colors">
                Community Guidelines
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Popular Categories</h3>
            <div className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-chat-secondary transition-colors">
                Singles Chat
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-secondary transition-colors">
                Music Discussions
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-secondary transition-colors">
                Gaming Community
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-secondary transition-colors">
                Study Groups
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-secondary transition-colors">
                International Chat
              </a>
            </div>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Support</h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-chat-accent transition-colors">
                <Mail className="w-4 h-4" />
                Contact Us
              </a>
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-chat-accent transition-colors">
                <Shield className="w-4 h-4" />
                Privacy Policy
              </a>
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-chat-accent transition-colors">
                <FileText className="w-4 h-4" />
                Terms of Service
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-accent transition-colors">
                Safety Tips
              </a>
              <a href="#" className="block text-muted-foreground hover:text-chat-accent transition-colors">
                Report Abuse
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-border/50" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-muted-foreground text-sm">
            © 2025 ChitZO. All rights reserved. Made with ❤️ for global connections.
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-chat-primary">
              English
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-chat-primary">
              Español
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-chat-primary">
              Français
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-chat-primary">
              हिंदी
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};