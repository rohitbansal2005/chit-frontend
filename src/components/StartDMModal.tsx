import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, MessageCircle, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { UserService, AppUser } from '@/lib/app-data';

interface StartDMModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStartDM: (username: string) => void;
}

export const StartDMModal = ({ isOpen, onOpenChange, onStartDM }: StartDMModalProps) => {
  const [username, setUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!username || username.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await UserService.searchUsers(username.trim());
        if (!cancelled) setResults(users || []);
      } catch (err) {
        console.warn('User search failed', err);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(handle); };
  }, [username]);

  const handleStartDM = async () => {
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username to start a DM",
        variant: "destructive"
      });
      return;
    }

    // Validate username format (basic validation)
    if (username.length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    try {
      // Simulate API call to check if user exists and start DM
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll always succeed
      // In real app, this would make an API call to:
      // 1. Check if user exists
      // 2. Check if user is not blocked
      // 3. Create or get existing DM room
      // 4. Navigate to the DM
      
      onStartDM(username.trim());
      setUsername("");
      onOpenChange(false);
      
      toast({
        title: "DM Started",
        description: `Started a conversation with @${username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start DM. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleStartDM();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Start New DM
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                placeholder="Enter username (e.g., john_doe)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isSearching}
              />
            </div>
            {/* Search results */}
            {results.length > 0 && (
              <div className="mt-2 max-h-48 overflow-auto border rounded bg-popover">
                {results.map((u) => (
                  <button
                    key={u.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted/60"
                    onClick={() => {
                      // prefer passing canonical user id to starter
                      setUsername(u.username || u.displayName || u.name || '');
                      onStartDM(u.id);
                      onOpenChange(false);
                      toast({ title: 'DM Started', description: `Started a conversation with ${u.displayName || uname}` });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-sm">{(u.displayName || u.name || '').charAt(0).toUpperCase()}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{u.displayName || u.name || u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.username ? `@${u.username}` : ''}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the username of the person you want to message
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSearching}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartDM}
              disabled={!username.trim() || isSearching}
              className="min-w-[100px]"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Start DM
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
