import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Share2, Copy, MessageSquare, Shuffle, Compass, ArrowLeft, Info, Wrench } from "lucide-react";

const getShareUrl = () => {
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return "https://chitz.app";
};

const FeatureHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const handleCopyShareLink = async () => {
    const shareUrl = getShareUrl();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback("Invite link copied to clipboard");
      } else {
        setShareFeedback("Copy this link: " + shareUrl);
      }
    } catch (error) {
      console.error("Unable to copy link", error);
      setShareFeedback("Copy this link: " + shareUrl);
    }
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleShareOnPlatform = (platform: "twitter" | "whatsapp") => {
    if (typeof window === "undefined") return;
    const shareUrl = getShareUrl();
    const text = encodeURIComponent(`Join me on ChitZ! ${shareUrl}`);
    const links: Record<'twitter' | 'whatsapp', string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      whatsapp: `https://wa.me/?text=${text}`,
    };
    window.open(links[platform], "_blank", "noopener,noreferrer");
  };

  const navigateToDashboard = (action: "random-chat" | "explore-rooms" | "start-dm") => {
    navigate("/dashboard", { state: { action } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary font-semibold">Command Center</p>
            <h1 className="text-3xl font-bold mt-1">Feature Hub</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Manage sharing, promotion, and productivity tools for your ChitZ workspace from one dedicated surface.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card id="about" className="shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">About & Share</h2>
                <p className="text-sm text-muted-foreground">Tell your community why ChitZ feels different and invite them in.</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="secondary" className="justify-center" onClick={handleCopyShareLink}>
                <Copy className="w-4 h-4 mr-2" />Copy invite link
              </Button>
              <Button variant="secondary" className="justify-center" onClick={() => handleShareOnPlatform("twitter")}>
                <Share2 className="w-4 h-4 mr-2" />Share on X
              </Button>
              <Button variant="secondary" className="justify-center" onClick={() => handleShareOnPlatform("whatsapp")}>
                <MessageSquare className="w-4 h-4 mr-2" />Share on WhatsApp
              </Button>
            </div>
            {shareFeedback && (
              <p className="text-xs text-green-600" role="status">
                {shareFeedback}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Privacy-first</Badge>
              <Badge variant="outline">Instant Rooms</Badge>
              <Badge variant="outline">Zero Ads (Premium)</Badge>
            </div>
          </CardContent>
        </Card>

        <Card id="tools" className="shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Productivity Tools</h2>
                <p className="text-sm text-muted-foreground">Jump straight into powerful chat actions inside your dashboard.</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-3">
              <Button className="justify-center" onClick={() => navigateToDashboard("random-chat")}>
                <Shuffle className="w-4 h-4 mr-2" />Start Random Chat
              </Button>
              <Button variant="outline" className="justify-center" onClick={() => navigateToDashboard("explore-rooms")}>
                <Compass className="w-4 h-4 mr-2" />Explore Rooms
              </Button>
              <Button variant="outline" className="justify-center" onClick={() => navigateToDashboard("start-dm")}>
                <MessageSquare className="w-4 h-4 mr-2" />Start a DM
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Actions open in the dashboard and will auto-launch the requested experience.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeatureHub;
