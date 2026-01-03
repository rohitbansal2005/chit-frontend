import { useAuth } from '@/contexts/AuthContext-new';
import { ChatDashboard } from '@/components/ChatDashboard';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Dashboard = () => {
  const { currentUser, loading, signOut, updateUserProfile, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [externalAction, setExternalAction] = useState<'random-chat' | 'explore-rooms' | 'start-dm' | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/auth');
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    if (location.state && (location.state as any).action) {
      const action = (location.state as any).action as 'random-chat' | 'explore-rooms' | 'start-dm';
      setExternalAction(action);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleJoinRoom = (room: any) => {
    // Handle both roomId string and room object
    const roomId = typeof room === 'string' ? room : room.id;
    navigate(`/chat/${roomId}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
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

  if (!currentUser) {
    return null; // Will redirect to auth
  }

  // Map currentUser to expected AuthUser format
  const mappedUser = {
    ...currentUser,
    uid: currentUser.id, // Add uid property
    type: currentUser.type,
    isAnonymous: currentUser.type === 'guest'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <ChatDashboard 
        user={mappedUser}
        onJoinRoom={handleJoinRoom}
        onLogout={handleLogout}
        onViewProfile={handleNavigateToSettings}
        onOpenSettings={handleNavigateToSettings}
        externalAction={externalAction ?? undefined}
        onExternalActionHandled={() => setExternalAction(null)}
      />
    </div>
  );
};

export default Dashboard;