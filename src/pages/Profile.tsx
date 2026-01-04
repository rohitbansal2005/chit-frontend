import { useAuth } from '@/contexts/AuthContext-new';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserService, AppUser, RoomService, FriendService } from '@/lib/app-data';
import { apiClient } from '@/lib/apiClient';

const Profile = () => {
  const { user, currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/auth');
    }
  }, [currentUser, loading, navigate]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    if (userId) {
      // Load requested user's profile
      (async () => {
        const u = await UserService.getUserById(userId);
        setViewUser(u);
      })();
    } else {
      setViewUser(null);
    }
  }, [location.search]);

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
    return null;
  }

  // Minimal profile view: show avatar, name, optional age/country/gender/bio and simple badges
  const display = viewUser || currentUser;
  const showAge = (display as any).age !== undefined && (display as any).age !== null;
  const showCountry = (display as any).country;
  const showGender = (display as any).gender;
  const showBio = (display as any).bio;
  const isGuest = (display as any).userType === 'guest' || (display as any).isAnonymous;
  const isRegistered = !isGuest;
  const isVerified = (display as any).emailVerified === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-md mx-auto">
        <button 
          onClick={handleBack}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center relative">
          <div className="flex flex-col items-center">
            {/** action menu / settings in top-right corner */}
            {(() => {
              const isOwn = !viewUser || (display.id && (display.id === user?.uid || display.id === currentUser?.id));
              return (
                <div className="absolute top-3 right-3">
                  {isOwn ? (
                    <button title="Edit profile" onClick={() => navigate('/settings')} className="p-2 rounded hover:bg-muted" aria-label="Edit profile">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <title>Edit profile</title>
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.6 1.04l.94-.54a1.724 1.724 0 012.4.7l.45.98a1.724 1.724 0 001.46 1.03l1.04.12a1.724 1.724 0 01.97 2.94l-.7.74a1.724 1.724 0 000 2.44l.7.74a1.724 1.724 0 01-.97 2.94l-1.04.12a1.724 1.724 0 00-1.46 1.03l-.45.98a1.724 1.724 0 01-2.4.7l-.94-.54a1.724 1.724 0 00-2.6 1.04c-.299.921-1.603.921-1.902 0a1.724 1.724 0 00-2.6-1.04l-.94.54a1.724 1.724 0 01-2.4-.7l-.45-.98a1.724 1.724 0 00-1.46-1.03l-1.04-.12a1.724 1.724 0 01-.97-2.94l.7-.74a1.724 1.724 0 000-2.44l-.7-.74a1.724 1.724 0 01.97-2.94l1.04-.12c.62-.07 1.1-.47 1.46-1.03l.45-.98a1.724 1.724 0 012.4-.7l.94.54a1.724 1.724 0 002.6-1.04z" />
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  ) : (
                    <div className="relative">
                      <button onClick={() => setMenuOpen((s) => !s)} className="p-2 rounded hover:bg-muted" title="Actions">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-700 border rounded shadow-md z-50">
                          <button title="Private message" className="w-full text-left px-3 py-2 hover:bg-muted" onClick={async () => {
                            setMenuOpen(false);
                            try {
                              const roomId = await RoomService.createDMRoom(user?.uid || '', display.id);
                              navigate(`/rooms/${roomId}`);
                            } catch (e) {
                              setActionMsg('Could not start private message');
                            }
                          }}>Private message</button>
                          <button title="Add friend" className="w-full text-left px-3 py-2 hover:bg-muted" onClick={async () => {
                            setMenuOpen(false);
                            try {
                              await FriendService.sendFriendRequest(user?.uid || '', display.id);
                              setActionMsg('Friend request sent');
                            } catch (e) { setActionMsg('Could not send friend request'); }
                          }}>Add friend</button>
                          <button title="Block user" className="w-full text-left px-3 py-2 hover:bg-muted" onClick={async () => {
                            setMenuOpen(false);
                            try {
                              await UserService.blockUser(user?.uid || '', display.id);
                              setActionMsg('User blocked');
                            } catch (e) { setActionMsg('Could not block user'); }
                          }}>Block</button>
                          <button title="Report user" className="w-full text-left px-3 py-2 hover:bg-muted text-red-600" onClick={async () => {
                            setMenuOpen(false);
                            try {
                              await UserService.reportUser(user?.uid || '', display.id, 'Reported from profile');
                              setActionMsg('Report submitted');
                            } catch (e) { setActionMsg('Could not submit report'); }
                          }}>Report</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="w-28 h-28 mb-4">
              <button title="View profile photo" onClick={() => {
                const settings = (display as any).settings || {};
                const visibility = settings.profilePhotoVisibility || 'everyone';
                const viewerId = currentUser?.id || user?.uid || null;
                const isOwner = !viewUser || (display.id && (display.id === viewerId));
                const isFriend = viewerId && Array.isArray((display as any).friends) && (display as any).friends.includes(viewerId);
                const canSeePhoto = isOwner || visibility === 'everyone' || (visibility === 'friends' && !!isFriend);
                if (canSeePhoto && (display.photoURL || (display as any).avatar)) {
                  setPreviewUrl(display.photoURL || (display as any).avatar);
                  setIsPreviewOpen(true);
                }
              }} className="w-28 h-28 rounded-full overflow-hidden mx-auto bg-muted flex items-center justify-center">
                {(() => {
                  const settings = (display as any).settings || {};
                  const visibility = settings.profilePhotoVisibility || 'everyone';
                  const viewerId = currentUser?.id || user?.uid || null;
                  const isOwner = !viewUser || (display.id && (display.id === viewerId));
                  const isFriend = viewerId && Array.isArray((display as any).friends) && (display as any).friends.includes(viewerId);
                  const canSeePhoto = isOwner || visibility === 'everyone' || (visibility === 'friends' && !!isFriend);

                  if (canSeePhoto && (display.photoURL || (display as any).avatar)) {
                    return <img src={display.photoURL || (display as any).avatar} alt="profile" className="w-full h-full object-cover" />;
                  }

                  return (
                    <div className="text-xl font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center">
                      {(display.displayName || display.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  );
                })()}
              </button>
            </div>

            <div className="w-full flex items-center justify-center">
              <h2 className="text-2xl font-semibold mb-1">{display.displayName || display.name}</h2>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {isGuest && <span className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded">Guest</span>}
              {isRegistered && <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Registered</span>}
              {isVerified && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Verified</span>}
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              {showAge && <div>Age: {(display as any).age}</div>}
              {showCountry && <div>Country: {(display as any).country}</div>}
              {showGender && <div>Gender: {(display as any).gender}</div>}
            </div>

            <div className="text-sm text-muted-foreground mb-3">
              <div>Profile views: {(display as any).profileViews?.count ?? 0}</div>
              <div>Level: {(display as any).chatStats?.level ?? 0} — Messages: {(display as any).chatStats?.totalMessages ?? 0}</div>
            </div>

            {showBio && (
              <div className="mt-2 text-left w-full">
                <h3 className="text-sm font-medium mb-1">About</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{(display as any).bio}</p>
              </div>
            )}
          </div>
        </div>
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Profile photo</DialogTitle>
            </DialogHeader>
            {previewUrl ? (
              <img src={previewUrl} alt="Profile large" className="w-full h-auto rounded-md object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">No image to preview.</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;