import { useState, useEffect } from "react";
import { ChatHero } from "@/components/ChatHero";
import { LiveChatDemo } from "@/components/LiveChatDemo";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { ChatDashboard } from "@/components/ChatDashboard";
import { ChatRoom } from "@/components/ChatRoom";
import { SettingsPage } from "@/components/SettingsPage";
import { BannerAd, MobileAd } from "@/components/AdComponent";
import { useAuth } from "@/contexts/AuthContext-new";
import { ChatRoom as ApiRoom } from "@/lib/app-data";
import { AuthUser } from "@/lib/auth-new";

// Helper function to convert AuthUser to User format expected by components
const convertAuthUserToUser = (authUser: AuthUser) => ({
  name: authUser.name,
  type: authUser.isAnonymous ? 'guest' : 'email' as 'guest' | 'email',
  email: authUser.email,
  avatar: authUser.avatar,
  bio: authUser.bio || '',
  age: authUser.dob ? Math.max(0, new Date().getFullYear() - new Date(authUser.dob).getFullYear()) : undefined,
  gender: authUser.gender || undefined,
  location: authUser.location || undefined,
  dob: authUser.dob ? new Date(authUser.dob).toISOString() : undefined,
  settings: (authUser as any).settings || undefined,
  badges: [], // Default empty array
  joinedDate: authUser.createdAt ? authUser.createdAt.toISOString() : undefined,
  premiumStatus: authUser.premiumStatus || 'free' as 'free' | 'monthly' | 'yearly'
});

const Index = () => {
  const { user, signInAsGuest, signInWithGoogle, signUp, signIn, signOut, updateProfile, resendEmailVerification } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard' | 'chat' | 'profile'>('landing');
  const [currentRoom, setCurrentRoom] = useState<ApiRoom | null>(null);
  const [isRandomChatActive, setIsRandomChatActive] = useState(false);

  const handleUpdateUser = async (updatedUser: any) => {
    try {
      // Send full updated user payload so all profile fields persist
      await updateProfile({
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        age: updatedUser.age,
        gender: updatedUser.gender,
        location: updatedUser.location,
        lastUsernameChange: updatedUser.lastUsernameChange,
        // include settings if present
        settings: (updatedUser as any).settings || undefined,
        dob: (updatedUser as any).dob
      });
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleEnterChat = () => {
    setCurrentView('auth');
  };

  // Automatically navigate to dashboard when user logs in
  useEffect(() => {
    if (user && currentView === 'landing') {
      setCurrentView('dashboard');
    }
  }, [user, currentView]);

  const handleAuth = async (type: 'guest' | 'email', data?: any) => {
    try {
      if (type === 'guest') {
        console.log('Guest login attempt with name:', data?.name);
        await signInAsGuest(data?.name);
        console.log('Guest login successful, navigating to dashboard');
        setCurrentView('dashboard');
      } else {
        if (data.isSignUp) {
          await signUp(
            data.email,
            data.password,
            data.username || data.email.split('@')[0],
            data.requireEmailVerification
          );
          
          // If email verification is required, don't navigate to dashboard
          if (data.requireEmailVerification) {
            // Stay on auth modal to show email verification message
            return;
          }
        } else if (data.isResend) {
          await resendEmailVerification(
            data.email,
            data.password,
            data.username || data.email.split('@')[0]
          );
          return;
        } else {
          await signIn(data.emailOrUsername, data.password);
        }
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error; // Re-throw so AuthModal can handle the error
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Google authentication error:', error);
    }
  };

  const handleJoinRoom = (room: ApiRoom) => {
    if (room.category === 'random') {
      // For random chat, stay on dashboard but activate random chat mode
      setCurrentRoom(room);
      setIsRandomChatActive(true);
      setCurrentView('dashboard');
    } else {
      // For normal rooms, go to full chat view
      setCurrentRoom(room);
      setIsRandomChatActive(false);
      setCurrentView('chat');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentRoom(null);
    setIsRandomChatActive(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentRoom(null);
      setCurrentView('landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNextRandomChat = () => {
    // This will be handled by the ChatDashboard backend functions
    // For now, just reset the random chat state
    setIsRandomChatActive(false);
    setCurrentRoom(null);
  };

  const handleCloseRandomChat = () => {
    setIsRandomChatActive(false);
    setCurrentRoom(null);
  };

  const handleViewProfile = () => {
    setCurrentView('profile');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  if (currentView === 'auth') {
    const savedUsername = sessionStorage.getItem('chatUsername') || '';
    return <AuthModal onAuth={handleAuth} onBack={handleBackToLanding} initialUsername={savedUsername} />;
  }

  if (currentView === 'dashboard' && user) {
    return (
      <ChatDashboard 
        user={user} 
        onJoinRoom={handleJoinRoom}
        onLogout={handleLogout}
        onViewProfile={handleViewProfile}
        isRandomChatActive={isRandomChatActive}
        currentRandomRoom={isRandomChatActive ? currentRoom : null}
        onNextRandomChat={handleNextRandomChat}
        onCloseRandomChat={() => {
          setIsRandomChatActive(false);
          setCurrentRoom(null);
        }}
      />
    );
  }

  if (currentView === 'profile' && user) {
    return (
      <SettingsPage 
        user={convertAuthUserToUser(user)}
        onBack={handleBackToDashboard}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'chat' && currentRoom && user) {
    return (
      <ChatRoom
        roomId={currentRoom.id}
        roomName={currentRoom.name}
        roomType={currentRoom.category === 'dm' ? 'dm' : currentRoom.type}
        participants={currentRoom.members.length}
        onBack={handleBackToDashboard}
        currentUser={convertAuthUserToUser(user)}
        currentUserId={(user as any)?.id || (user as any)?.uid}
        roomImage={'/placeholder.svg'}
        onNextRandomChat={currentRoom.category === 'random' ? handleNextRandomChat : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar onEnterChat={handleEnterChat} />
      
      <div id="home">
        <ChatHero onEnterChat={handleEnterChat} />
      </div>
      
      {/* Banner Ad after Hero Section */}
      <div className="py-4 bg-gray-50 dark:bg-gray-900">
        <BannerAd className="hidden md:block" />
        <MobileAd className="md:hidden" />
      </div>
      
      <div id="demo">
        <LiveChatDemo onJoinChat={handleEnterChat} />
      </div>
      
      {/* Banner Ad after Demo Section */}
      <div className="py-4 bg-gray-50 dark:bg-gray-900">
        <BannerAd className="hidden md:block" />
        <MobileAd className="md:hidden" />
      </div>
      
      <div id="features">
        <Features />
      </div>
      
      <div id="contact">
        <Testimonials />
        <Footer />
      </div>
    </div>
  );
};

export default Index;