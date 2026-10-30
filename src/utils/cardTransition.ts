// Tüm kart hareketleri için ortak transition — pürüzsüz, fiziksel ağırlıklı ve net takip edilebilir his
export const CARD_TRANSITION = {
  layout: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 24,
    mass: 0.9,
  },
};


