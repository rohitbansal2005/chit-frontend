import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { VolumeX, Clock } from "lucide-react";

interface MuteCountdownProps {
  mutedUntil: string | null; // ISO string or null for permanent
  className?: string;
}

export const MuteCountdown = ({ mutedUntil, className = "" }: MuteCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!mutedUntil) {
      setTimeLeft("Permanent");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const muteEnd = new Date(mutedUntil);
      const difference = muteEnd.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [mutedUntil]);

  if (!mutedUntil) {
    return (
      <Badge variant="destructive" className={`${className} flex items-center gap-1`}>
        <VolumeX className="w-3 h-3" />
        Muted Permanently
      </Badge>
    );
  }

  if (isExpired) {
    return (
      <Badge variant="secondary" className={`${className} flex items-center gap-1`}>
        <Clock className="w-3 h-3" />
        Mute Expired
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`${className} flex items-center gap-1 border-orange-300 text-orange-700 bg-orange-50`}>
      <Clock className="w-3 h-3" />
      Muted for {timeLeft}
    </Badge>
  );
};
