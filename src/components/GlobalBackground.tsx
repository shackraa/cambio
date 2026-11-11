export function GlobalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none">
      {/* 1. Üstten Sıcak Avize / Masa Işığı Spotu */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 15%, rgba(250, 225, 156, 0.08) 0%, rgba(28, 128, 88, 0.14) 45%, rgba(4, 24, 16, 0.72) 100%)',
        }}
      />

      {/* 2. İnce Klasik İskambil Çuha Baklava Dokusu (Ultra hafif vektör pattern) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.045]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="cambio-felt-diamond"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M24 2 L46 24 L24 46 L2 24 Z"
              fill="none"
              stroke="#fae19c"
              strokeWidth="0.9"
            />
            <circle cx="24" cy="24" r="1.4" fill="#fae19c" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cambio-felt-diamond)" />
      </svg>

      {/* 3. Merkezde Çok Zarif Dönen Altın Geometrik Masa Pusulası & Semboller */}
      <svg
        viewBox="0 0 600 600"
        className="absolute top-1/2 left-1/2 w-[min(92vw,760px)] h-[min(92vw,760px)] opacity-[0.08] animate-slow-compass"
        aria-hidden="true"
      >
        <circle
          cx="300"
          cy="300"
          r="268"
          fill="none"
          stroke="#e8c468"
          strokeWidth="1.2"
          strokeDasharray="6 10"
        />
        <circle
          cx="300"
          cy="300"
          r="228"
          fill="none"
          stroke="#f7e2ab"
          strokeWidth="1"
        />
        <circle
          cx="300"
          cy="300"
          r="158"
          fill="none"
          stroke="#e8c468"
          strokeWidth="0.8"
          strokeDasharray="3 7"
        />
        <polygon
          points="300,26 322,278 574,300 322,322 300,574 278,322 26,300 278,278"
          fill="none"
          stroke="#e8c468"
          strokeWidth="0.9"
        />
      </svg>

      {/* 4. Yumuşak Derinlik Halkaları */}
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#fae19c]/[0.04] blur-[90px]" />
      <div className="absolute -bottom-28 -right-20 w-[480px] h-[480px] rounded-full bg-emerald-400/[0.06] blur-[110px]" />
    </div>
  );
}
