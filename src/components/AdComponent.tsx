import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface AdComponentProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdComponent = ({ 
  slot, 
  format = 'auto', 
  responsive = true, 
  className = '',
  style = {}
}: AdComponentProps) => {
  
  // Check if AdSense is enabled and we have a valid publisher ID
  const adsenseEnabled = import.meta.env.VITE_ADSENSE_ENABLED === 'true';
  const publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID;
  const shouldRenderAd = adsenseEnabled && publisherId && publisherId !== 'ca-pub-your_publisher_id';

  useEffect(() => {
    try {
      // Load AdSense script if not already loaded
      if (!window.adsbygoogle) {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID_HERE';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
        
        window.adsbygoogle = [];
      }

      // Push ad for rendering
      setTimeout(() => {
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
        }
      }, 100);
    } catch (error) {
      console.error('AdSense loading error:', error);
    }
  }, []);

  // Check if ads should be rendered
  if (!shouldRenderAd) {
    return (
      <Card className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-dashed ${className}`}>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ad Space</div>
          <div className="text-xs text-gray-500">Configure AdSense in production</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-2 bg-gray-50 dark:bg-gray-900 border-dashed ${className}`}>
      <div className="text-xs text-gray-400 text-center mb-1">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: '100px',
          ...style
        }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </Card>
  );
};

// Banner Ad Component (Top/Bottom)
export const BannerAd = ({ className = '' }: { className?: string }) => (
  <AdComponent
    slot="1234567890"
    format="horizontal"
    className={`w-full max-w-4xl mx-auto ${className}`}
    style={{ minHeight: '90px' }}
  />
);

// Square Ad Component (Sidebar)
export const SquareAd = ({ className = '' }: { className?: string }) => (
  <AdComponent
    slot="0987654321"
    format="rectangle"
    className={`w-full max-w-xs ${className}`}
    style={{ minHeight: '250px' }}
  />
);

// Mobile Banner Ad
export const MobileAd = ({ className = '' }: { className?: string }) => (
  <AdComponent
    slot="1122334455"
    format="auto"
    className={`w-full ${className}`}
    style={{ minHeight: '50px' }}
  />
);

// In-feed Ad (Between content)
export const InFeedAd = ({ className = '' }: { className?: string }) => (
  <AdComponent
    slot="5566778899"
    format="auto"
    responsive={true}
    className={`w-full my-4 ${className}`}
    style={{ minHeight: '120px' }}
  />
);
