import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext-new";
import { logApiStatus } from "@/lib/api-health";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import FeatureHub from "./pages/FeatureHub";
import AccountSettings from "./pages/AccountSettings";
import Support from "./pages/Support";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Test backend connection on app load
    logApiStatus();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<AccountSettings />} />
              <Route path="/support" element={<Support />} />
              <Route path="/feature-hub" element={<FeatureHub />} />
              <Route path="/chat/:roomId" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
