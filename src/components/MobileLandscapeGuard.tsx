import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLangStore } from '../store/useLangStore';

interface MobileLandscapeGuardProps {
  requireFullscreen?: boolean;
}

export function MobileLandscapeGuard({ requireFullscreen = true }: MobileLandscapeGuardProps) {
  const lang = useLangStore((s) => s.lang);
  const [state, setState] = useState<{
    isMobile: boolean;
    isPortrait: boolean;
    isFullscreen: boolean;
    supportsFullscreen: boolean;
  }>({
    isMobile: false,
    isPortrait: false,
    isFullscreen: false,
    supportsFullscreen: false,
  });

  useEffect(() => {
    const checkStatus = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const touchDevice =
        navigator.maxTouchPoints > 0 && Math.min(window.screen.width, window.screen.height) <= 920;
      const smallViewport = Math.min(w, h) <= 650 && w <= 1024;
      const isMobile = touchDevice || smallViewport;
      const isPortrait = h > w;
      const supportsFullscreen = Boolean(
        document.fullscreenEnabled && document.documentElement.requestFullscreen
      );
      const isFullscreen = Boolean(document.fullscreenElement);

      setState({
        isMobile,
        isPortrait,
        isFullscreen,
        supportsFullscreen,
      });
    };

    checkStatus();
    window.addEventListener('resize', checkStatus);
    window.addEventListener('orientationchange', checkStatus);
    document.addEventListener('fullscreenchange', checkStatus);
    return () => {
      window.removeEventListener('resize', checkStatus);
      window.removeEventListener('orientationchange', checkStatus);
      document.removeEventListener('fullscreenchange', checkStatus);
    };
  }, []);

  const handleEnterLandscapeFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
    try {
      // @ts-ignore
      if (screen.orientation && screen.orientation.lock) {
        // @ts-ignore
        await screen.orientation.lock('landscape');
      }
    } catch {}
  };

  // Mobilde dikey tutulduğunda VEYA (oyun içinde tam ekran destekleniyorsa ve tam ekranda değilse) zorunlu ekranı göster
  const needsPortraitFix = state.isMobile && state.isPortrait;
  const needsFullscreenFix =
    state.isMobile &&
    !state.isPortrait &&
    requireFullscreen &&
    state.supportsFullscreen &&
    !state.isFullscreen;

  const shouldShow = needsPortraitFix || needsFullscreenFix;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center select-none"
          style={{
            background:
              'radial-gradient(ellipse at center, #1b5643 0%, #0e2e23 65%, #071912 100%)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-sm w-full luxury-panel rounded-[28px] p-7 flex flex-col items-center gap-5 border border-[#e8c468]/45 shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
          >
            {/* Dönen Telefon / Monitör İkonu */}
            <motion.div
              animate={{ rotate: needsPortraitFix ? [0, -90, -90, 0] : [0, 5, -5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-[#e8c468]/15 border border-[#e8c468]/45 flex items-center justify-center text-3xl shadow-inner"
            >
              {needsPortraitFix ? '📱' : '🖥️'}
            </motion.div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#f7e2ab]">
                {lang === 'tr' ? 'MASAÜSTÜ MONİTÖR DENEYİMİ' : 'DESKTOP MONITOR EXPERIENCE'}
              </span>
              <h2 className="text-xl font-black text-white tracking-wide">
                {needsPortraitFix
                  ? lang === 'tr'
                    ? 'Telefonunuzu Yatay Çevirin'
                    : 'Rotate Your Phone to Landscape'
                  : lang === 'tr'
                    ? 'Tam Ekran Masa Görünümü'
                    : 'Fullscreen Table View'}
              </h2>
              <p className="text-xs text-emerald-100/75 leading-relaxed">
                {needsPortraitFix
                  ? lang === 'tr'
                    ? 'Cambio, tüm masayı, sohbeti ve rehberi bilgisayar monitörü gibi tek ekranda görebilmeniz için yatay tam ekran modunda oynanır.'
                    : 'Cambio is played in landscape fullscreen mode so you can see the entire table, chat, and guide just like a computer monitor.'
                  : lang === 'tr'
                    ? 'Tarayıcı çubuklarını gizleyip tam ekran bilgisayar monitörü görünümüne geçmek için aşağıdaki butona dokunun.'
                    : 'Tap the button below to hide browser bars and enter the full computer monitor table view.'}
              </p>
            </div>

            {state.supportsFullscreen && (
              <button
                type="button"
                onClick={handleEnterLandscapeFullscreen}
                className="w-full py-3.5 px-6 rounded-2xl btn-gold-3d font-black text-xs uppercase tracking-[0.14em] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⛶</span>
                <span>
                  {lang === 'tr'
                    ? 'TAM EKRAN YATAY MODA GEÇ'
                    : 'ENTER FULLSCREEN LANDSCAPE'}
                </span>
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
