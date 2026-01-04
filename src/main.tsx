import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initNotificationSound, unlockAudio } from './lib/notificationSound';

// Initialize theme on page load
const initializeTheme = () => {
  const stored = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored === 'dark' || stored === 'light' ? stored : (systemPrefersDark ? 'dark' : 'light');
  
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

// Initialize theme immediately
initializeTheme();

// Initialize notification sound (public path)
initNotificationSound('/sounds/chime.mp3');

// Try to unlock audio on first user gesture — fallback: call unlockAudio manually after user interaction
window.addEventListener('pointerdown', function once() {
  unlockAudio();
  window.removeEventListener('pointerdown', once);
}, { once: true });

createRoot(document.getElementById("root")!).render(<App />);
