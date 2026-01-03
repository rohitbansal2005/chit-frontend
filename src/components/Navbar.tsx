import { useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { MessageCircle, Menu, X, Users, Home, Info, Mail } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface NavbarProps {
  onEnterChat: () => void;
}

export const Navbar = ({ onEnterChat }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Add offset for fixed navbar
      const navbarHeight = 64; // 16 * 4 = 64px
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-chat-primary to-chat-secondary">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-foreground">
              ChitZ
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('home')}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Info className="w-4 h-4" />
              Features
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Users className="w-4 h-4" />
              Live Demo
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Mail className="w-4 h-4" />
              Contact
            </button>
            <button
              onClick={() => navigate('/support')}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Support
            </button>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {!isLanding && <DarkModeToggle />}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {!isLanding && <DarkModeToggle />}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <div className="py-4 space-y-3">
              <button
                onClick={() => scrollToSection('home')}
                className="w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
              >
                <Info className="w-4 h-4" />
                Features
              </button>
              <button
                onClick={() => scrollToSection('demo')}
                className="w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
              >
                <Users className="w-4 h-4" />
                Live Demo
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
              >
                <Mail className="w-4 h-4" />
                Contact
              </button>
              <button
                onClick={() => { setIsMenuOpen(false); navigate('/support'); }}
                className="w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                Support
              </button>
              {/* Join Chat removed from mobile menu per request */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
