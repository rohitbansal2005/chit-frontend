import { useAuth } from '@/contexts/AuthContext-new';
// import { ProfilePage } from '@/components/ProfilePage';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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

  // Temporary placeholder - ProfilePage will be fixed later
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={handleBack}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Profile functionality will be restored after build is complete.
          </p>
          <div className="mt-4">
            <p><strong>Name:</strong> {currentUser.displayName}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Type:</strong> {currentUser.userType}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;