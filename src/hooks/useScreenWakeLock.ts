import { useEffect } from 'react';

/**
 * Oyun açıkken telefon/tablet ekranının kararmasını ve kapanmasını önler.
 * 1) Modern tarayıcılarda (Android Chrome, iOS 16.4+ Safari, Edge) W3C Screen Wake Lock API (`navigator.wakeLock.request('screen')`) kullanır.
 * 2) Sekme arka plana gidip geri geldiğinde (`visibilitychange`) veya ilk dokunuşta kilidi otomatik yeniler.
 */
export function useScreenWakeLock() {
  useEffect(() => {
    let wakeLockSentinel: any = null;
    let isMounted = true;

    const requestWakeLock = async () => {
      if (!isMounted) return;
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          if (wakeLockSentinel && !wakeLockSentinel.released) return;
          // @ts-ignore
          wakeLockSentinel = await navigator.wakeLock.request('screen');
          wakeLockSentinel?.addEventListener?.('release', () => {
            wakeLockSentinel = null;
          });
        }
      } catch {
        // Bazı mobil tarayıcılar ilk kullanıcı etkileşimini (pointerdown/touchstart) bekler
      }
    };

    // Hemen dene
    requestWakeLock();

    // Kullanıcı ekrana dokunduğunda veya tıkladığında kilit düşmüşse tekrar al
    const handleUserInteraction = () => {
      if (!wakeLockSentinel || wakeLockSentinel.released) {
        requestWakeLock();
      }
    };

    // Sekme tekrar görünür olduğunda kilidi yenile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });

    // Her 20 saniyede bir kilit durumunu kontrol eden güvenlik döngüsü
    const keepAliveInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && (!wakeLockSentinel || wakeLockSentinel.released)) {
        requestWakeLock();
      }
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(keepAliveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      if (wakeLockSentinel) {
        wakeLockSentinel.release?.().catch(() => {});
        wakeLockSentinel = null;
      }
    };
  }, []);
}
