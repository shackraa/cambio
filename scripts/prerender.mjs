import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_HTML_PATH = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(BASE_HTML_PATH)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf8');

const ROUTES = [
  {
    outPath: 'index.html',
    lang: 'en',
    canonical: 'https://playcambio.com/',
    title: 'PlayCambio — Play Cambio Card Game Online Free | Cambio Oyna',
    description:
      'Play Cambio card game online free with friends or AI bots in your browser — no download or signup needed. Çevrimiçi ücretsiz Cambio kart oyunu oyna!',
    bodyHtml: `
      <main style="max-width:860px;margin:0 auto;padding:32px;color:#fdf6e3;font-family:sans-serif">
        <h1>PlayCambio — Free Online Cambio Memory &amp; Strategy Card Game</h1>
        <p>Play Cambio online free in your browser with friends or smart AI bots. Start with 4 face-down cards, peek at 2, swap away high scores, trigger special card powers (7–8 peek own, 9–10 peek opponent, J–Q blind swap, Black King spy &amp; swap), match discards rapidly with Sticking, and call CAMBIO to lock your hand!</p>
        <h2>Cambio Nasıl Oynanır? (Türkçe Özet)</h2>
        <p>Herkese 4 kapalı kart dağıtılır ve en başta sadece 2 tanesine bakarsın. Kırmızı Papaz (-1 puan) oyunun en iyi kartıdır, Joker 0 puandır. En düşük puana ulaştığında CAMBIO butonuna bas!</p>
        <nav>
          <a href="/rules">How to Play Cambio (Full English Rules)</a> |
          <a href="/nasil-oynanir">Cambio Nasıl Oynanır? (Türkçe Kurallar)</a> |
          <a href="/play-cabo-online">Play Cabo Online</a> |
          <a href="/play-dutch-online">Play Dutch / Tamalou Online</a> |
          <a href="/play-golf-card-game">Play 4-Card Golf Online</a>
        </nav>
      </main>`,
  },
  {
    outPath: 'rules/index.html',
    lang: 'en',
    canonical: 'https://playcambio.com/rules',
    title: 'How to Play Cambio Card Game — Official Rules, Points & Powers | PlayCambio',
    description:
      'Learn how to play the Cambio card game in 1 minute! Complete card scoring guide (Red King -1, Joker 0), special card powers, sticking rules, and free online play.',
    bodyHtml: `
      <main style="max-width:860px;margin:0 auto;padding:32px;color:#fdf6e3;font-family:sans-serif">
        <h1>How to Play Cambio — Official Rules, Card Powers &amp; Scoring</h1>
        <p>Cambio is a fast-paced 2–4 player memory and strategy card game played with a standard 54-card deck. Lowest total score wins.</p>
        <h2>Card Values</h2>
        <ul>
          <li>Red King (Hearts / Diamonds): -1 point (best card, keep hidden!)</li>
          <li>Joker: 0 points</li>
          <li>Ace: 1 point · 2–10: face value · Jack, Queen, Black King: 10 points</li>
        </ul>
        <h2>Special Powers (Discard From Deck)</h2>
        <ul>
          <li>7 or 8: Peek 1 own face-down card</li>
          <li>9 or 10: Peek 1 opponent card</li>
          <li>Jack or Queen: Blind swap 1 card with a non-locked opponent</li>
          <li>Black King (Spades / Clubs): Spy on 1 opponent card and optionally swap</li>
        </ul>
        <p>Call CAMBIO at the start of your turn when you hold the lowest score — your hand locks against swaps/sticks while opponents get one last turn.</p>
        <nav><a href="/">Play Cambio Online Free</a> · <a href="/nasil-oynanir">Türkçe Kurallar</a></nav>
      </main>`,
  },
  {
    outPath: 'nasil-oynanir/index.html',
    lang: 'tr',
    canonical: 'https://playcambio.com/nasil-oynanir',
    title: 'Cambio Nasıl Oynanır? Kurallar, Kart Puanları ve Güçleri | PlayCambio',
    description:
      'Cambio kart oyunu resmi kuralları, kart değerleri (Kırmızı Papaz -1, Joker 0), özel kart güçleri ve 1 dakikalık interaktif öğretici. Ücretsiz çevrimiçi oyna!',
    bodyHtml: `
      <main style="max-width:860px;margin:0 auto;padding:32px;color:#fdf6e3;font-family:sans-serif">
        <h1>Cambio Nasıl Oynanır? (Kart Puanları, Güçler ve Strateji)</h1>
        <p>Cambio, 54 kartlık iskambil destesiyle 2 ila 4 kişi arasında oynanan heyecanlı bir hafıza ve strateji kart oyunudur. En düşük toplam puan kazanır.</p>
        <h2>Kart Puanları</h2>
        <ul>
          <li>Kırmızı Papaz (Kupa / Karo K): -1 puan (oyunun en iyi kartı!)</li>
          <li>Joker: 0 puan · As: 1 puan · 2–10: kendi değeri · J, Q ve Siyah K: 10 puan</li>
        </ul>
        <h2>Özel Kart Güçleri</h2>
        <ul>
          <li>7 ve 8: Kendi kapalı 1 kartına bak</li>
          <li>9 ve 10: Rakibin 1 kartına bak</li>
          <li>Vale (J) ve Kız (Q): Kör takas yap</li>
          <li>Siyah Papaz: Rakip kartını gör ve istersen takasla</li>
        </ul>
        <nav><a href="/">Hemen Ücretsiz Oyna</a> · <a href="/rules">English Rules</a></nav>
      </main>`,
  },
  {
    outPath: 'play-cabo-online/index.html',
    lang: 'en',
    canonical: 'https://playcambio.com/play-cabo-online',
    title: 'Play Cabo / Cambio Online Free — Multiplayer Browser Card Game | PlayCambio',
    description:
      'Looking to play Cabo card game online? Try PlayCambio free in your browser — identical fast-paced 4-card memory, peeking, swapping & matching mechanics with friends or AI bots.',
    bodyHtml: `
      <main style="max-width:860px;margin:0 auto;padding:32px;color:#fdf6e3;font-family:sans-serif">
        <h1>Play Cabo &amp; Cambio Card Game Online Free (No Download)</h1>
        <p>Fans of Cabo feel right at home in PlayCambio: 4 face-down cards, initial 2-card peek, special peek and swap cards, real-time Sticking, and free rooms with friends or bots.</p>
        <nav><a href="/">Play Now Free</a> · <a href="/rules">Full Rules</a></nav>
      </main>`,
  },
  {
    outPath: 'play-dutch-online/index.html',
    lang: 'en',
    canonical: 'https://playcambio.com/play-dutch-online',
    title: 'Play Dutch (Tamalou / Kaboo) Online Free — Card Game in Browser | PlayCambio',
    description:
      'Play Dutch / Tamalou online free! Real-time 4-card memory gameplay with Red King -1, special powers (7/8 peek, 9/10 spy, J/Q swap, Black K), and instant sticking.',
    bodyHtml: `
      <main style="max-width:860px;margin:0 auto;padding:32px;color:#fdf6e3;font-family:sans-serif">
        <h1>Play Dutch &amp; Tamalou Style Card Game Online Free</h1>
        <p>Known globally as Dutch, Tamalou, Kaboo, Pablo, or Cambio — enjoy instant multiplayer rooms and AI bots directly in your browser on PlayCambio.</p>
        <nav><a href="/">Play Now Free</a> · <a href="/rules">Full Rules</a></nav>
      </main>`,
  },
  {
    outPath: 'play-golf-card-game/index.html',
    lang: 'en',
    canonical: 'https://playcambio.com/play-golf-card-game',
    title: 'Play 4-Card Golf / Cambio Online Free — Memory Card Game | PlayCambio',
    description:
      'Love 4-Card Golf? Try Cambio online free — faster, deeper 4-card memory action with card powers (7-10, J, Q, K), live sticking, and multiplayer rooms.',
    bodyHtml: `
      <main style="max-width:860px;margin:0 auto;padding:32px;color:#fdf6e3;font-family:sans-serif">
        <h1>Love 4-Card Golf? Play Cambio Free Online With Special Powers</h1>
        <p>Take 4-Card Golf to the next level with special peeking/swapping card powers and real-time sticking on PlayCambio.</p>
        <nav><a href="/">Play Now Free</a> · <a href="/rules">Full Rules</a></nav>
      </main>`,
  },
];

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

for (const route of ROUTES) {
  let html = baseHtml;
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${route.lang}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(route.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeAttr(route.description)}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${route.canonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${route.canonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeAttr(route.title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeAttr(route.description)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${route.canonical}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeAttr(route.title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`
  );
  // Inject static SEO HTML inside #root; React's createRoot().render() immediately replaces it cleanly for users.
  html = html.replace('<div id="root"></div>', `<div id="root">${route.bodyHtml}</div>`);

  const target = path.join(DIST_DIR, route.outPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, 'utf8');
  console.log(`Prerendered SEO snapshot: ${route.outPath}`);
}
