// Tüm kart hareketleri için ortak transition — ağırlık ve net takip edilebilir (no teleport) his
export const CARD_TRANSITION = {
  layout: {
    type: 'tween' as const,
    ease: [0.25, 1, 0.5, 1] as [number, number, number, number], // İvmelenerek kalkış, yavaşlayarak duruş
    duration: 0.8, // Takasların gözle takip edilebilmesi için süre artırıldı
  },
};

