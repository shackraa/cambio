// Google Analytics 4 (index.html'de yüklü: G-2VP07LM8TH) için hafif özel olay (event) yardımcısı.
// GA yüklenemezse (reklam engelleyici vb.) oyun asla etkilenmez.
type GtagFn = (command: 'event', name: string, params?: Record<string, unknown>) => void;

export function track(eventName: string, params: Record<string, unknown> = {}) {
  try {
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
    if (typeof gtag === 'function') gtag('event', eventName, params);
  } catch {
    /* sessizce yok say */
  }
}

export function gameMode(): 'online' | 'bots' {
  return sessionStorage.getItem('roomId') ? 'online' : 'bots';
}
