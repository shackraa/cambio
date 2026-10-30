// Tüm kart hareketleri için ortak transition — elle koyuluyormuş gibi pürüzsüz, fiziksel ağırlıklı ve net takip edilebilir his
export const CARD_TRANSITION = {
  layout: {
    type: 'spring' as const,
    stiffness: 135,
    damping: 22,
    mass: 1.0,
  },
};



