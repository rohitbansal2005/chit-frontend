import { Button } from "@/components/ui/button";
import { MessageCircle, Shield, Lock, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import HeroLiveIndicator from "@/components/HeroLiveIndicator";

export const ChatHero = ({ onEnterChat }: { onEnterChat: () => void }) => {
  return (
    <section className="relative min-h-[70vh] md:min-h-screen flex items-center overflow-hidden pt-12 md:pt-16">
      {/* Background image with subtle blur and dark overlay for a professional look */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:filter md:blur-sm"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-black/55" />

      {/* Layout: left indicator + main content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
        {/* Main Content */}
        <div
          className="relative flex-1 text-center md:text-left max-w-3xl mx-auto"
          style={{
            ['--primary' as any]: '200 80% 45%',
            ['--chat-primary' as any]: '200 80% 45%',
            ['--gradient-primary' as any]: 'linear-gradient(135deg, hsl(200 80% 45%), hsl(195 70% 40%))'
          }}
        >
          <div className="animate-scale-in">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold mb-3 text-white">ChitZ</h1>
            <h2 className="text-lg md:text-xl font-medium mb-3 text-slate-200">Real-time conversations — simple, safe, private.</h2>
            <p className="text-sm md:text-base text-slate-300 mb-6 md:mb-8 max-w-lg md:max-w-xl">
              Start chatting instantly in public rooms or create private conversations. Create an account to save preferences and history.
            </p>
          </div>

          {/* Primary CTA */}
          <div className="mb-8">
            <Button variant="hero" size="hero" onClick={onEnterChat} className="px-6 py-3 text-sm md:text-base">
              <MessageCircle className="mr-2" />
              Get Started
            </Button>
          </div>

          {/* Features Row on md+; compact chat indicator on small screens */}
          <div className="mt-2">
            <div className="hidden sm:flex flex-row items-center gap-4 md:justify-start justify-center text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-200" />
                <span className="hidden sm:inline">Secure & Moderated</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-200" />
                <span className="hidden sm:inline">Private Conversations</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-slate-200" />
                <span className="hidden sm:inline">Instant Connections</span>
              </div>
            </div>

            {/* Mobile: compact live indicator under CTA */}
            <div className="sm:hidden mt-3 flex items-center justify-center">
              <div className="inline-flex items-center gap-3 bg-background/20 px-3 py-2 rounded-full shadow-sm">
                <div className="-space-x-1 flex items-center">
                  <div className="w-7 h-7 rounded-full bg-chat-primary text-white flex items-center justify-center text-xs">A</div>
                  <div className="w-7 h-7 rounded-full bg-chat-secondary text-white flex items-center justify-center text-xs">P</div>
                  <div className="w-7 h-7 rounded-full bg-chat-accent text-white flex items-center justify-center text-xs">M</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing" />
                  <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-chat-primary rounded-full animate-typing" style={{ animationDelay: '0.4s' }} />
                </div>
                <div className="text-xs text-slate-200">Live • 245</div>
              </div>
            </div>
          </div>
        </div>
        {/* Right: live indicator positioned full-height on md+ screens */}
        <div className="hidden md:flex absolute right-6 top-0 bottom-0 items-start">
          <HeroLiveIndicator />
        </div>
      </div>
    </section>
  );
};