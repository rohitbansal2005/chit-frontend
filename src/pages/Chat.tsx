import { useAuth } from '@/contexts/AuthContext-new';
import { ChatRoom } from '@/components/ChatRoom';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RoomService } from '@/lib/app-data';
import { UserService } from '@/lib/app-data';

interface RoomInfo {
  id: string;
  name?: string;
  type?: string;
  category?: string;
  participants?: string[];
  members?: string[];
}

const isTechnicalDmName = (name?: string | null) => {
  if (!name) return false;
  const s = String(name);
  return s.startsWith('DM:') || s.includes('guest-') || s.includes('dm-');
};

const Chat = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [dmDisplayName, setDmDisplayName] = useState<string | null>(null);

  // Load room info (hook must run on every render to keep hooks count stable)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!roomId) return;
      try {
        const info = await RoomService.getRoomById(roomId);
        if (!mounted) return;
        setRoomInfo(info || null);

        // If this is a DM, prefer showing the partner name instead of backend's technical name
        try {
          const isDm = (info as any)?.type === 'dm' || (info as any)?.category === 'dm';
          if (isDm) {
            const participants: string[] = ((info as any)?.participants || (info as any)?.members || []) as any;
            const partnerId = Array.isArray(participants) ? participants.find(p => p && p !== currentUser?.id) : undefined;
            if (partnerId) {
              const partner = await UserService.getUserById(partnerId);
              const name = partner?.displayName || partner?.username || partner?.name;
              if (name) setDmDisplayName(name);
            }
          }
        } catch {
          // ignore
        }
      } catch (err) {
        console.warn('Could not load room info', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [roomId, currentUser?.id]);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/auth');
    }
  }, [currentUser, loading, navigate]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !roomId) {
    return null;
  }

  // Map currentUser to ChatRoom expected format
  const mappedUser = {
    id: currentUser.id,
    name: currentUser.displayName,
    type: currentUser.userType === 'guest' ? 'guest' as const : 'email' as const
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <ChatRoom 
        roomId={roomId}
        roomName={(() => {
          if (dmDisplayName) return dmDisplayName;
          const name = roomInfo?.name;
          const isDm = roomInfo?.type === 'dm' || roomInfo?.category === 'dm';
          if (isDm && isTechnicalDmName(name)) return 'Direct message';
          return name || `Room ${roomId}`;
        })()}
        roomType={(roomInfo?.type as any) || 'public'}
        participants={(roomInfo?.participants || roomInfo?.members)?.length || 1}
        currentUser={mappedUser}
        currentUserId={currentUser.id}
        onBack={handleBackToDashboard}
      />
    </div>
  );
};

export default Chat;