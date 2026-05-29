// Tüm kart hareketleri için ortak transition — ağır, fiziksel his
export const CARD_TRANSITION = {
  layout: {
    type: 'spring' as const,
    stiffness: 80,
    damping: 18,
    mass: 2.0,
  },
};

