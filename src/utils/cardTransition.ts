// Tüm kart hareketleri için ortak transition — insan elinin kartı masada süzerek taşıması gibi yumuşak hızlanan ve yumuşak konan 60 FPS eğri
export const CARD_TRANSITION = {
  type: 'tween' as const,
  ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
  duration: 1.25,
  layout: {
    type: 'tween' as const,
    ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
    duration: 1.25,
  },
};
