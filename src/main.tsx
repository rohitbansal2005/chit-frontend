import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize theme on page load
const initializeTheme = () => {
  const stored = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored === 'dark' || stored === 'light' ? stored : (systemPrefersDark ? 'dark' : 'light');
  
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

// Initialize theme immediately
initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
