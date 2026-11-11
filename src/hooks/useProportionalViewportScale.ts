import { useLayoutEffect } from 'react';

// Büyük masaüstü monitördeki ideal oranları referans alır (1480x820 -> 16px root font).
// 15 inç veya daha kompakt dizüstü ekranlara geçildiğinde tüm rem tabanlı ölçüler
// (kartlar, yazılar, yan paneller, boşluklar) birebir aynı oranda küçülür; böylece masa her monitörde aynı görünür.
const REF_W = 1480;
const REF_H = 820;

export function useProportionalViewportScale(enabled = true) {
  useLayoutEffect(() => {
    if (!enabled) {
      document.documentElement.style.fontSize = '';
      return;
    }

    const applyScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Telefon / çok küçük pencerelerde yerel 16px mobil düzen korunur
      if (w < 900 || h < 500) {
        document.documentElement.style.fontSize = '';
        return;
      }
      const scale = Math.max(0.68, Math.min(1, w / REF_W, h / REF_H));
      document.documentElement.style.fontSize = `${(16 * scale).toFixed(2)}px`;
    };

    applyScale();
    window.addEventListener('resize', applyScale);
    window.addEventListener('fullscreenchange', applyScale);
    return () => {
      window.removeEventListener('resize', applyScale);
      window.removeEventListener('fullscreenchange', applyScale);
      document.documentElement.style.fontSize = '';
    };
  }, [enabled]);
}
