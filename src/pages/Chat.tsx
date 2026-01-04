import { useAuth } from '@/contexts/AuthContext-new';
import { ChatRoom } from '@/components/ChatRoom';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RoomService } from '@/lib/app-data';

interface RoomInfo {
  id: string;
  name?: string;
  type?: string;
  participants?: string[];
}

const Chat = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  // Load room info (hook must run on every render to keep hooks count stable)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!roomId) return;
      try {
        const info = await RoomService.getRoomById(roomId);
        if (mounted) setRoomInfo(info || null);
      } catch (err) {
        console.warn('Could not load room info', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [roomId]);

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
        roomName={roomInfo?.name || `Room ${roomId}`}
        roomType={(roomInfo?.type as any) || 'public'}
        participants={roomInfo?.participants?.length || 1}
        currentUser={mappedUser}
        onBack={handleBackToDashboard}
      />
    </div>
  );
};

export default Chat;