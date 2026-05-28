import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

export function RulesPanel() {
  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  const CARD_POWERS = [
    { cards: 'A',      value: '1 puan',    power: null, color: '#e5e7eb' },
    { cards: '2 – 6',  value: '2–6 puan',  power: null, color: '#9ca3af' },
    { cards: '7 – 8',  value: '7–8 puan',  power: t.power_7_8, color: '#818cf8', powerColor: '#a78bfa' },
    { cards: '9 – 10', value: '9–10 puan', power: t.power_9_10, color: '#34d399', powerColor: '#6ee7b7' },
    { cards: 'J – Q',  value: '10 puan',   power: t.power_J_Q, color: '#fb923c', powerColor: '#fdba74' },
    { cards: 'K ♠♣',   value: '10 puan',   power: t.power_K_black, color: '#f87171', powerColor: '#fca5a5' },
    { cards: 'K ♥♦',   value: '−1 puan',   power: null, note: t.note_valuable, color: '#fbbf24' },
    { cards: 'Joker',  value: '0 puan',    power: null, note: t.note_zero, color: '#c084fc' },
  ];

  const RULES = [
    t.rule_1, t.rule_2, t.rule_3, t.rule_4, t.rule_5, t.rule_6
  ];

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.3) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Başlık */}
      <div
        className="px-6 py-5 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="w-1.5 h-5 rounded-full bg-[var(--gold)]"></div>
        <div>
          <h3 className="text-white font-bold text-base tracking-wide">{t.rulesTitle}</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {/* Kart Güçleri */}
        <p className="text-base font-bold text-white/60 tracking-widest uppercase px-6 py-2">
          {t.powersSubtitle}
        </p>

        <div className="px-4 space-y-1">
          {CARD_POWERS.map((row, i) => (
            <div
              key={i}
              className="flex flex-col px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-xl font-bold shrink-0"
                  style={{ color: row.color }}
                >
                  {row.cards}
                </span>
                <span className="text-base text-white/60">— {row.value}</span>
              </div>
              {row.power && (
                <p
                  className="text-base font-bold mt-1.5"
                  style={{ color: row.powerColor ?? '#fff' }}
                >
                  {row.power}
                </p>
              )}
              {row.note && (
                <p className="text-sm font-bold text-yellow-300/90 uppercase mt-1.5">{row.note}</p>
              )}
            </div>
          ))}
        </div>

        {/* Ayraç */}
        <div className="mx-4 my-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

        {/* Temel Kurallar */}
        <p className="text-base font-bold text-white/60 tracking-widest uppercase px-6 py-2">
          {t.howToPlaySubtitle}
        </p>

        <div className="px-8 mt-3">
          <ul className="list-disc list-outside space-y-4 marker:text-[var(--gold)]">
            {RULES.map((rule, i) => (
              <li key={i} className="text-base text-white/80 font-medium leading-relaxed tracking-wide pl-2">
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
