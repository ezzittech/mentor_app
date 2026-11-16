import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/poppins/900.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource/tajawal/900.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Auto-update (same mechanism as LLC): when the tab regains focus after a new deploy, reload once.
const current = [...document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')].map((s) => s.src.split('/').pop()).join();
async function checkVersion() {
  try {
    const html = await fetch(`${import.meta.env.BASE_URL}index.html`, { cache: 'no-store' }).then((r) => r.text());
    const latest = [...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)].map((m) => m[1].split('/').pop()).join();
    if (current && latest && latest !== current && sessionStorage.getItem('murshid-reloaded-for') !== latest) {
      sessionStorage.setItem('murshid-reloaded-for', latest);
      location.reload();
    }
  } catch { /* offline */ }
}
if (import.meta.env.PROD) {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkVersion(); });
}
