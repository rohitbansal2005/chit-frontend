import { Navbar } from "@/components/Navbar";
import { ChatHero } from "@/components/ChatHero";
import { Features } from "@/components/Features";
import { LiveChatDemo } from "@/components/LiveChatDemo";
import { Footer } from "@/components/Footer";
import { AdComponent } from "@/components/AdComponent";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleEnterChat = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar onEnterChat={handleEnterChat} />
      
      {/* Hero Section */}
      <ChatHero onEnterChat={handleEnterChat} />
      
      {/* Ad Space - Banner */}
      <div className="container mx-auto px-4 py-4">
        <AdComponent
          slot={import.meta.env.VITE_ADSENSE_BANNER_SLOT || ""}
          format="horizontal"
          className="max-w-4xl mx-auto"
        />
      </div>
      
      {/* Features Section */}
      <Features />
      
      {/* Live Chat Demo */}
      <LiveChatDemo />
      
      {/* Ad Space - Square */}
      <div className="container mx-auto px-4 py-8">
        <AdComponent
          slot={import.meta.env.VITE_ADSENSE_SQUARE_SLOT || ""}
          format="rectangle"
          className="max-w-sm mx-auto"
        />
      </div>
      
      <Footer />
    </div>
  );
};

export default Landing;