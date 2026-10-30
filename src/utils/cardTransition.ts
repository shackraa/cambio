// Tüm kart hareketleri için ortak transition — insan gözünün rahatça takip edebileceği, elle koyuluyormuş gibi pürüzsüz ve ağırbaşlı fizik
export const CARD_TRANSITION = {
  layout: {
    type: 'tween' as const,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    duration: 0.95,
  },
};
