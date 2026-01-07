import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomService, type ChatRoom as ApiChatRoom } from '@/lib/app-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const parseRoomIdFromUrl = (raw: string): string | null => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  // Only allow previews for links to our own site (same origin)
  try {
    if (typeof window !== 'undefined' && window.location?.origin) {
      if (url.origin !== window.location.origin) return null;
    }
  } catch {
    return null;
  }

  // Only support /chat/<roomId>
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'chat') {
    return decodeURIComponent(parts[1]);
  }

  return null;
};

export function RoomLinkPreview({
  text,
  currentUserId,
  mentionUsers,
  onOpenDm,
}: {
  text: string;
  currentUserId: string;
  mentionUsers?: Array<{ id: string; name: string }>;
  onOpenDm?: (userId: string) => void;
}) {
  const navigate = useNavigate();
  const roomId = useMemo(() => parseRoomIdFromUrl(text), [text]);
  const [room, setRoom] = useState<ApiChatRoom | null>(null);
  const [loading, setLoading] = useState(false);

  const mentionIndex = useMemo(() => {
    const idx = new Map<string, string>();
    for (const u of mentionUsers || []) {
      const name = String(u?.name || '').trim();
      const id = String(u?.id || '').trim();
      if (!name || !id) continue;
      const key1 = name.toLowerCase();
      const key2 = name.toLowerCase().replace(/\s+/g, '');
      idx.set(key1, id);
      idx.set(key2, id);
    }
    return idx;
  }, [mentionUsers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!roomId) {
        setRoom(null);
        return;
      }
      setLoading(true);
      try {
        const info = await RoomService.getRoomById(roomId);
        if (!cancelled) setRoom(info || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const onJoinRoomId = async (id: string) => {
    const uid = String(currentUserId || '').trim();
    if (!uid || uid === 'current-user') {
      toast({ title: 'Login required', description: 'Please login to join rooms.', variant: 'destructive' });
      return;
    }
    try {
      const info = await RoomService.getRoomById(id);
      const title = (info?.displayName || info?.name || 'Room').toString();
      await RoomService.joinRoom(id, uid);
      toast({ title: 'Joined room', description: `Joined ${title}` });
      navigate(`/chat/${encodeURIComponent(id)}`);
    } catch (e: any) {
      toast({ title: 'Join failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const renderInlineText = (raw: string) => {
    const nodes: any[] = [];

    // Split out URLs first so we don't treat @mentions inside URLs
    const urlRe = /(https?:\/\/[^\s]+)/g;
    const parts = String(raw || '').split(urlRe);
    parts.forEach((part, partIdx) => {
      if (!part) return;

      // URL part (odd indexes with this split)
      if (partIdx % 2 === 1) {
        const rid = parseRoomIdFromUrl(part);
        if (rid) {
          nodes.push(
            <button
              key={`room-${partIdx}-${rid}`}
              type="button"
              className="text-primary underline"
              onClick={(e) => {
                e.preventDefault();
                onJoinRoomId(rid);
              }}
            >
              {part}
            </button>
          );
        } else {
          // Other links stay plain text (per spec)
          nodes.push(<span key={`url-${partIdx}`}>{part}</span>);
        }
        return;
      }

      // Non-URL text: render @mentions
      const mentionRe = /(^|\s)@([A-Za-z0-9_]{2,30})/g;
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = mentionRe.exec(part))) {
        const before = part.slice(last, m.index);
        if (before) nodes.push(<span key={`t-${partIdx}-${last}`}>{before}</span>);

        const leading = m[1] || '';
        const handle = m[2] || '';
        if (leading) nodes.push(<span key={`ws-${partIdx}-${m.index}`}>{leading}</span>);

        const resolvedId = mentionIndex.get(handle.toLowerCase()) || mentionIndex.get(handle.toLowerCase().replace(/\s+/g, ''));
        nodes.push(
          <span
            key={`m-${partIdx}-${m.index}-${handle}`}
            className={
              resolvedId
                ? 'text-foreground font-medium cursor-pointer hover:underline'
                : 'text-foreground font-medium'
            }
            onClick={() => {
              if (!resolvedId) {
                toast({ title: 'User not found', description: `@${handle} is not in this room.`, variant: 'destructive', duration: 2000 });
                return;
              }
              onOpenDm?.(resolvedId);
            }}
          >
            @{handle}
          </span>
        );

        last = m.index + m[0].length;
      }
      const rest = part.slice(last);
      if (rest) nodes.push(<span key={`r-${partIdx}-${last}`}>{rest}</span>);
    });

    return <>{nodes}</>;
  };

  // Not a valid room link, or room doesn't exist -> render as rich text (mentions + inline room links)
  if (!roomId || (!loading && !room)) {
    return renderInlineText(text);
  }

  const title = (room?.displayName || room?.name || 'Room').toString();
  const bio = (room?.description || '').toString().trim();

  const onJoin = async () => {
    await onJoinRoomId(roomId);
  };

  return (
    <Card className="border-border bg-background/70">
      <CardContent className="p-3 space-y-2">
        <div className="text-sm font-medium truncate">{title}</div>
        {bio ? (
          <div className="text-xs text-muted-foreground line-clamp-2">{bio}</div>
        ) : null}
        <div>
          <Button size="sm" onClick={onJoin}>
            Join Group
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
