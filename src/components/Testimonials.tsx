import React from 'react';

const testimonials = [
  { id: 't1', name: 'Sonia', text: 'Found great people to chat with — quick and friendly.', avatar: 'S', country: 'IN' },
  { id: 't2', name: 'Carlos', text: 'Love the random rooms. Easy to jump in and meet new people.', avatar: 'C', country: 'ES' },
  { id: 't3', name: 'Aisha', text: 'Safe and moderated — I feel comfortable chatting here.', avatar: 'A', country: 'AE' },
  { id: 't4', name: 'Liam', text: 'Simple UI and great performance on mobile.', avatar: 'L', country: 'UK' },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-10">
      <div className="max-w-6xl mx-auto px-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground text-center">What people are saying</h3>

        <div className="relative overflow-hidden testimonials-wrapper rounded-lg px-2 py-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <style>{`
            @keyframes scroll-horizontal {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-scroll-horizontal {
              animation: scroll-horizontal 30s linear infinite;
            }
            .testimonials-wrapper:hover .animate-scroll-horizontal {
              animation-play-state: paused;
            }
          `}</style>

          <div className="flex items-center">
            <div className="w-full overflow-hidden">
              <div className="flex gap-6 animate-scroll-horizontal" style={{ minWidth: '200%' }}>
                {/* render two copies for seamless loop */}
                {[...testimonials, ...testimonials].map((t, idx) => (
                  <div key={`${t.id}-${idx}`} className="min-w-[280px] bg-background/40 rounded-lg px-4 py-4 shadow-sm mx-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-chat-primary text-white flex items-center justify-center font-medium">{t.avatar}</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{t.name} <span className="text-xs text-muted-foreground">• {t.country}</span></div>
                        <div className="text-sm text-muted-foreground mt-1">{t.text}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
