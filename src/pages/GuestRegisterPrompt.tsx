import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GuestRegisterPrompt = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleRegister = useCallback(() => {
    const next = encodeURIComponent(location.pathname + location.search);
    // Open auth page and show signup form by default (minimal signup for guests)
    navigate(`/auth?mode=signup&next=${next}&minimal=1`);
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="border border-border/70 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Upgrade to access settings</CardTitle>
            <p className="text-sm text-muted-foreground">Create a free account to unlock full settings and save your preferences across devices.</p>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-sm">You are currently using a guest session. To change profile, privacy, or session settings, register a free account.</p>
            <div className="flex gap-3">
              <Button onClick={handleRegister} className="chat-gradient text-white">Register / Sign up</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
            </div>
            <p className="text-xs text-muted-foreground">After registering you'll be redirected back here to manage your settings.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestRegisterPrompt;
