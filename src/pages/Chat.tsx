import { useAuth } from '@/contexts/AuthContext-new';
import { ChatRoom } from '@/components/ChatRoom';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';

const Chat = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

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
        roomName={`Room ${roomId}`}
        roomType="public"
        participants={1}
        currentUser={mappedUser}
        onBack={handleBackToDashboard}
      />
    </div>
  );
};

export default Chat;