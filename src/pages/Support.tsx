import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="border border-border/70 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Support</CardTitle>
            <p className="text-sm text-muted-foreground">How can we help you?</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">If you need help, email us at <strong>support@chitz.example</strong> or use the chat widget below.</p>
            <div className="rounded-lg border border-dashed p-4 bg-muted">
              <p className="text-sm">Quick support:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Account & billing</li>
                <li>Technical issues</li>
                <li>Reporting abuse</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(-1)} variant="outline">Back</Button>
              <Button onClick={() => alert('Opening support chat (placeholder)')} className="chat-gradient text-white">Open Support Chat</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
