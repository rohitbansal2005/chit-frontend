import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthModal } from '@/components/AuthModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext-new';

const Auth = () => {
  const navigate = useNavigate();
  const { currentUser, loading, signInAsGuest, signIn, signUp, resendEmailVerification } = useAuth();
  const location = useLocation();

  // Read optional mode query param to decide initial auth view
  const params = new URLSearchParams(location.search);
  const initialMode = params.get('mode') || undefined;
  const minimalSignUp = params.get('minimal') === '1' || params.get('from') === 'guest';

  // If user explicitly opened auth with mode=signup, avoid immediately redirecting
  // (e.g., guest users clicking "Register" should see the signup form)
  const [suppressAutoRedirect, setSuppressAutoRedirect] = useState(initialMode === 'signup');

  useEffect(() => {
    if (!loading && currentUser) {
      // If we just created an account that requires email verification,
      // keep the user on the auth page until they verify their email.
      if (suppressAutoRedirect) {
        // If the account has been verified, allow navigation again
        if (currentUser.email && currentUser.emailVerified) {
          setSuppressAutoRedirect(false);
          navigate('/dashboard');
        }
        return;
      }

      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate, suppressAutoRedirect]);

  const handleBack = () => {
    navigate('/');
  };

  const handleAuth = async (type: 'guest' | 'email', data?: any) => {
    try {
      if (type === 'guest') {
        await signInAsGuest(data?.name);
        navigate('/dashboard');
        return;
      }

      if (data?.isSignUp) {
        await signUp(
          data.email,
          data.password,
          data.username || data.email.split('@')[0],
          data.requireEmailVerification
        );

        if (data.requireEmailVerification) {
          // Prevent the auto-redirect from the auth effect while user verifies email
          setSuppressAutoRedirect(true);
          // Stay on auth to show verification instructions
          return;
        }
        // After a successful signup, send user to Settings to complete profile
        navigate('/settings');
        return;
      } else if (data?.isResend) {
        await resendEmailVerification(data.email);
        return;
      } else {
        await signIn(data.emailOrUsername, data.password);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <AuthModal 
        onAuth={handleAuth}
        onBack={handleBack}
        initialIsSignUp={initialMode === 'signup'}
        minimalSignUp={minimalSignUp}
      />
    </div>
  );
};

export default Auth;