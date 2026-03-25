# 🎴 Cambio Online — Oyun Tasarım Dokümanı

**Versiyon:** 1.0  
**Tarih:** Mart 2026  
**Stack:** React + Supabase Realtime  
**Oyuncu Sayısı:** 4  

---

## 📋 İçindekiler

1. [Oyun Hakkında](#oyun-hakkinda)
2. [Kurallar](#kurallar)
3. [Teknik Mimari](#teknik-mimari)
4. [Veri Modeli](#veri-modeli)
5. [Oyun Durumu & Akışı](#oyun-durumu)
6. [UI/UX Tasarımı](#ui-ux)
7. [Supabase Yapılandırması](#supabase)
8. [React Bileşen Ağacı](#react-bilesenleri)
9. [Geliştirme Aşamaları](#gelistirme-asamalari)
10. [Cowork Görevleri](#cowork-gorevleri)

---

## 1. Oyun Hakkında {#oyun-hakkinda}

**Cambio**, hafıza ve strateji temelli bir kart oyunudur. Amaç, elindeki 4 kartın toplamını mümkün olduğunca düşük tutmak ve doğru anda **"Cambio!"** diyerek turu kazanmaktır.

### Temel Özellikler

- 2–4 oyuncu (bu projede 4 oyuncu)
- Standart 52 kart + 2 Joker (54 kart)
- Online, gerçek zamanlı çok oyunculu
- Sıra tabanlı (turn-based) oynanış
- Hafıza odaklı: kartların yüzü aşağı, sadece belirli anlarda bakılabilir

---

## 2. Kurallar {#kurallar}

### 2.1 Kurulum

1. Her oyuncuya **4 kart** yüz aşağı dağıtılır, **2×2 dizilimde**.
2. Kalan kartlar ortaya **demet (deck)** olarak konur.
3. Oyun başlamadan her oyuncu **kendine en yakın 2 kartına** bir kez bakabilir ve ezberlemelidir. Sonra bir daha bakamaz.
4. Oyuncu sırası: ilk olarak dağıtıcının sağındaki oyuncu başlar.

### 2.2 Tur Akışı

Sırası gelen oyuncu şunlardan birini yapar:

**A) Demetten kart çek**
- Çekilen kartı elindeki kartlardan biriyle **takas** edebilir (aldığını atar, elindekini tutar).
- Ya da takas yapmadan çektiği kartı **doğrudan atar** (çöpe).
- Attığı kart **özel kart** ise gücünü kullanabilir (aşağıya bak).

**B) Çöp destesinden al**
- En üstteki kartı alıp kendi kartlarından biriyle takas edebilir.
- Takas ettiği kart tekrar çöp destesine gider.

### 2.3 Yapıştırma (Sticking)

- Çöp destesine atılan bir kart, herhangi bir oyuncunun elindeki **aynı değerdeki** bir kartla eşleşiyorsa, o oyuncu kartını **anında yapıştırabilir** (stick).
- Yapıştırma **sıra beklenmeden**, hızlı davranılarak yapılır.
- **Başarılı yapıştırma:** Kart elinden çıkar → 1 kart az olur.
- **Başkasının kartını yapıştırma:** Doğruysa, o kartı ona verebilirsin (sen 1 kart azalırsın, rakip 1 kart artar). Yanlışsa: kartı geri alırsın + 1 ceza kartı.
- **Yanlış yapıştırma:** Kart elinde kalır + 1 ceza kartı alırsın.
- Bir kart için sadece **1 oyuncu** yapıştırabilir (kim hızlı davranırsa).
- Kendi attığın kartı yapıştıramazsın.

### 2.4 Puan Sistemi

| Kart | Puan |
|------|------|
| A (As) | 1 |
| 2–10 | Yüz değeri |
| J, Q | 10 |
| Siyah K | 10 |
| Kırmızı K ♥♦ | **-1** |
| Joker | **0** |

> **Hedef:** En az puan toplamak.

### 2.5 Özel Kart Güçleri

Bir kart **çöpe atıldığında** (oynanınca) şu güçler devreye girer:

| Kart | Güç |
|------|-----|
| 7 veya 8 | Kendi kartlarından birine gizlice bak |
| 9 veya 10 | Başka bir oyuncunun kartına gizlice bak |
| J veya Q | **Kör takas:** Bakmadan, herhangi iki kartı takas et (kendi ya da rakip) |
| Siyah K ♠♣ | Herhangi bir kartı gör + istediğin kartı kendinle takas et |

> ⚠️ Güç kullanımı **isteğe bağlıdır** — kullanmayabilirsin.

### 2.6 Cambio Çağırma & Bitiş

- Sırası gelen bir oyuncu, kart çekmeden önce **"Cambio!"** diyebilir.
- Cambio diyen oyuncu o turda kart oynayamaz.
- Geri kalan **3 oyuncunun** birer turu daha olur.
- Sonra herkes kartlarını açar, puanlar toplanır.
- **En az puan kazanır.**

### 2.7 Beraberlik

- Berabere kalınırsa, Cambio demeyen oyuncu kazanır.
- İkisi de Cambio dememişse, toplam değeri düşük olan kazanır (As, Joker, Kırmızı K öncelikli).

### 2.8 Ceza Kartları

Şu durumlarda **1 ceza kartı** alınır (yüz aşağı, bakılmadan):
- İki el kullanmak
- Yanlış yapıştırma girişimi

---

## 3. Teknik Mimari {#teknik-mimari}

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│         React + TypeScript + Tailwind            │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Lobby   │  │  Game    │  │   Results    │  │
│  │  Screen  │  │  Board   │  │   Screen     │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ Supabase Client (JS SDK)
┌────────────────────▼────────────────────────────┐
│                  SUPABASE                        │
│                                                  │
│  ┌─────────────┐   ┌──────────────────────────┐ │
│  │  PostgreSQL │   │    Realtime Channels      │ │
│  │  (game DB)  │   │  (broadcast + presence)  │ │
│  └─────────────┘   └──────────────────────────┘ │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │         Row Level Security (RLS)            │ │
│  │   → Oyuncular sadece kendi kartlarını görür │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Neden Supabase Realtime?

- **Broadcast:** Oyun aksiyonlarını tüm oyunculara anlık iletir
- **Presence:** Hangi oyuncuların online olduğunu takip eder
- **PostgreSQL:** Oyun state'ini kalıcı olarak saklar
- **RLS:** Her oyuncu sadece kendi gizli kartlarını görebilir

---

## 4. Veri Modeli {#veri-modeli}

### `rooms` tablosu
```sql
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,       -- 4 haneli oda kodu (örn: "K4F2")
  status      TEXT DEFAULT 'waiting',     -- waiting | playing | finished
  created_at  TIMESTAMPTZ DEFAULT now(),
  host_id     UUID REFERENCES players(id)
);
```

### `players` tablosu
```sql
CREATE TABLE players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID REFERENCES rooms(id),
  nickname    TEXT NOT NULL,
  seat        INT NOT NULL,              -- 0, 1, 2, 3 (oturma sırası)
  score       INT DEFAULT 0,
  is_online   BOOLEAN DEFAULT true,
  joined_at   TIMESTAMPTZ DEFAULT now()
);
```

### `game_state` tablosu
```sql
CREATE TABLE game_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID REFERENCES rooms(id) UNIQUE,
  deck            JSONB NOT NULL,         -- Karıştırılmış deste (kart listesi)
  discard_pile    JSONB DEFAULT '[]',     -- Çöp destesi
  current_turn    INT DEFAULT 0,          -- Sıradaki oyuncunun seat numarası
  drawn_card      JSONB,                  -- Şu an çekilmiş kart (varsa)
  phase           TEXT DEFAULT 'draw',    -- draw | action | stick_window | cambio_round
  cambio_caller   INT,                    -- Cambio diyen oyuncunun seat'i
  remaining_turns INT,                    -- Cambio sonrası kalan tur sayısı
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### `player_cards` tablosu
```sql
CREATE TABLE player_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID REFERENCES rooms(id),
  player_id   UUID REFERENCES players(id),
  position    INT NOT NULL,              -- 0,1,2,3 (2x2 grid pozisyonu)
  card_value  INT NOT NULL,              -- Kartın gerçek değeri (puan)
  card_suit   TEXT NOT NULL,             -- hearts | diamonds | clubs | spades | joker
  card_rank   TEXT NOT NULL,             -- A,2..10,J,Q,K,Joker
  is_revealed BOOLEAN DEFAULT false,    -- Açık mı?
  is_penalty  BOOLEAN DEFAULT false     -- Ceza kartı mı?
);
```

### RLS Politikaları (Güvenlik)
```sql
-- Oyuncular sadece kendi kartlarını görebilir
CREATE POLICY "players_see_own_cards" ON player_cards
  FOR SELECT USING (player_id = auth.uid());

-- Game state herkese açık (sadece public bilgiler)
CREATE POLICY "anyone_can_read_game_state" ON game_state
  FOR SELECT USING (true);
```

---

## 5. Oyun Durumu & Akışı {#oyun-durumu}

### Faz Diyagramı

```
[WAITING / LOBBY]
       │
       ▼ (4 oyuncu hazır → host başlatır)
[PEEK PHASE]  ← Herkes 2 kartına bakar (5 sn)
       │
       ▼
[DRAW PHASE]  ← Sıradaki oyuncu kart çeker
       │
       ├── Özel kart (7/8/9/10/J/Q/K) → [POWER PHASE]
       │                                       │
       │                                       ▼
       │                              [Power kullan/geç]
       │                                       │
       ├── Normal kart → [DISCARD] ────────────┘
       │                    │
       │              [STICK WINDOW]  ← 2 sn içinde yapıştırma
       │                    │
       ▼                    ▼
[NEXT TURN] ◄──────────────┘
       │
       │ (Bir oyuncu "Cambio!" der)
       ▼
[CAMBIO ROUND]  ← Kalan 3 oyuncu 1'er tur daha oynar
       │
       ▼
[REVEAL & SCORE]  ← Kartlar açılır, puanlar hesaplanır
       │
       ▼
[RESULTS SCREEN]
```

### Realtime Event Tipleri

```typescript
type GameEvent =
  | { type: 'DRAW_FROM_DECK' }
  | { type: 'DRAW_FROM_DISCARD' }
  | { type: 'SWAP_CARD'; ownPosition: number }
  | { type: 'DISCARD_DRAWN' }
  | { type: 'USE_POWER'; power: PowerType; targetPlayer?: number; targetPosition?: number; swapWith?: number }
  | { type: 'SKIP_POWER' }
  | { type: 'STICK_CARD'; position: number; playerId: string }
  | { type: 'CALL_CAMBIO' }
  | { type: 'END_GAME' }
```

---

## 6. UI/UX Tasarımı {#ui-ux}

### Ekranlar

#### 6.1 Ana Menü
- Oyun logosu
- **"Oda Oluştur"** butonu → 4 haneli oda kodu üret
- **"Odaya Katıl"** butonu + kod girişi
- Nickname giriş alanı

#### 6.2 Lobi Ekranı
- Oda kodu göster (paylaşım için)
- 4 oyuncu slotu (dolu/boş)
- Hazır/Hazır Değil toggle
- Host için "Oyunu Başlat" butonu (4 kişi dolunca aktif)

#### 6.3 Oyun Tahtası

```
┌─────────────────────────────────────────────────────┐
│  [Oyuncu 2 - Karşı]                                 │
│  🂠 🂠   🂠 🂠   (4 kart, ters)                        │
│                                                     │
│  [Oyuncu 1]          [ORTA]         [Oyuncu 3]      │
│  🂠 🂠               📦 🃏            🂠 🂠             │
│  🂠 🂠             (Deste) (Çöp)      🂠 🂠             │
│                                                     │
│  [SEN - Alt]                                        │
│  🂡 🂠   🂠 🂠   (kendi kartlarını biliyorsun)          │
│                                                     │
│  [🎯 CAMBIO!]  [Sıra: Sen]  [⏱ 30sn]               │
└─────────────────────────────────────────────────────┘
```

#### 6.4 Sonuç Ekranı
- Kartlar yavaşça açılır (animasyon)
- Her oyuncunun puanı teker teker hesaplanır
- Kazanan büyük gösterilir
- "Tekrar Oyna" / "Lobi'ye Dön" butonları

### Animasyonlar
- Kart dağıtma (cascade)
- Kart çevirme (flip 3D)
- Yapıştırma (slide + glow)
- Cambio çağırma (pulse + ses)
- Ceza kartı (drop)

---

## 7. Supabase Yapılandırması {#supabase}

### Kurulum Adımları

1. [supabase.com](https://supabase.com) → yeni proje oluştur
2. Yukarıdaki SQL ile tabloları oluştur
3. RLS politikalarını uygula
4. Realtime'ı etkinleştir: `ALTER TABLE game_state REPLICA IDENTITY FULL;`
5. `.env` dosyasına ekle:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx
```

### Realtime Kanal Yapısı

```typescript
// Her oda için ayrı kanal
const channel = supabase.channel(`room:${roomId}`)

// Broadcast: oyun aksiyonları
channel.on('broadcast', { event: 'game_action' }, ({ payload }) => {
  handleGameAction(payload)
})

// Presence: online oyuncular
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  updateOnlinePlayers(state)
})

await channel.subscribe()
```

---

## 8. React Bileşen Ağacı {#react-bilesenleri}

```
<App>
├── <Router>
│   ├── / → <HomeScreen>
│   │         ├── <CreateRoomButton>
│   │         └── <JoinRoomForm>
│   │
│   ├── /lobby/:roomCode → <LobbyScreen>
│   │         ├── <RoomCode>
│   │         ├── <PlayerSlot> × 4
│   │         └── <StartButton>
│   │
│   ├── /game/:roomCode → <GameScreen>
│   │         ├── <OpponentArea> × 3  (karşı oyuncular)
│   │         │   └── <CardGrid>
│   │         │       └── <Card> × 4
│   │         ├── <CenterArea>
│   │         │   ├── <Deck>
│   │         │   └── <DiscardPile>
│   │         ├── <PlayerArea>  (sen)
│   │         │   └── <CardGrid>
│   │         │       └── <Card> × 4
│   │         ├── <TurnIndicator>
│   │         ├── <Timer>
│   │         ├── <CambioButton>
│   │         └── <PowerModal>   (özel kart güçleri)
│   │
│   └── /results/:roomCode → <ResultsScreen>
│             ├── <ScoreReveal>
│             └── <WinnerAnnouncement>
│
└── <SupabaseProvider>  (context)
```

### Ana State Yönetimi (Zustand önerilir)

```typescript
interface GameStore {
  // Oyun durumu
  gameState: GameState | null
  myCards: PlayerCard[]
  knownCards: Record<string, CardValue>  // Hafıza: bildiğimiz kartlar
  
  // Aksiyonlar
  drawCard: () => Promise<void>
  swapCard: (position: number) => Promise<void>
  stickCard: (position: number) => void
  callCambio: () => Promise<void>
  usePower: (power: PowerAction) => Promise<void>
}
```

---

## 9. Geliştirme Aşamaları {#gelistirme-asamalari}

### Faz 1 — Temel Yapı (Frontend, ~3 gün)
- [ ] React + Vite + TypeScript kurulumu
- [ ] Tailwind CSS yapılandırması
- [ ] Kart bileşeni (flip animasyonu)
- [ ] Oyun tahtası layout
- [ ] Mock data ile statik görsel test

### Faz 2 — Oyun Mantığı (Logic, ~4 gün)
- [ ] Deste oluşturma ve karıştırma (Fisher-Yates)
- [ ] Kart dağıtma algoritması
- [ ] Tur yönetimi (state machine)
- [ ] Özel kart güçleri
- [ ] Yapıştırma sistemi
- [ ] Cambio çağırma ve bitiş
- [ ] Puan hesaplama

### Faz 3 — Supabase Entegrasyonu (~3 gün)
- [ ] Supabase projesi kurulumu
- [ ] Tablo oluşturma + RLS
- [ ] Oda oluşturma / katılma
- [ ] Realtime broadcast entegrasyonu
- [ ] Presence (online göstergesi)
- [ ] Oyun state senkronizasyonu

### Faz 4 — Cila & Test (~2 gün)
- [ ] Animasyonlar (Framer Motion)
- [ ] Ses efektleri
- [ ] Hata durumları (bağlantı kopması, vb.)
- [ ] Mobil uyumluluk
- [ ] 4 oyuncuyla gerçek test

### Faz 5 — Deploy (~1 gün)
- [ ] Vercel'e deploy (veya Netlify)
- [ ] Environment variable'ları ayarla
- [ ] Domain bağla

---

## 10. Cowork Görevleri {#cowork-gorevleri}

Cowork'te şu görevleri oluşturabilirsin:

### Backend / Supabase
- [ ] Supabase projesi kur ve tabloları oluştur
- [ ] RLS politikalarını yaz ve test et
- [ ] Realtime kanalını test et

### Frontend
- [ ] React + Vite + Tailwind projesini kur
- [ ] Kart bileşenini yaz (flip animasyonu)
- [ ] Oyun tahtası layout'unu yaz
- [ ] Zustand store'u kur
- [ ] Supabase client entegrasyonunu yap

### Oyun Mantığı
- [ ] `gameEngine.ts` dosyasını yaz (tüm oyun kuralları)
- [ ] Yapıştırma (stick) logic'ini yaz
- [ ] Özel kart güçlerini yaz
- [ ] Puan hesaplama fonksiyonunu yaz

### Test
- [ ] Birim testler (oyun logic'i için)
- [ ] Gerçek 4 oyuncuyla test oturumu

---

## 📦 Önerilen Paketler

```json
{
  "dependencies": {
    "react": "^18",
    "react-router-dom": "^6",
    "@supabase/supabase-js": "^2",
    "zustand": "^4",
    "framer-motion": "^11",
    "tailwindcss": "^3",
    "clsx": "^2"
  },
  "devDependencies": {
    "vite": "^5",
    "typescript": "^5",
    "vitest": "^1"
  }
}
```

---

## 🚀 Hızlı Başlangıç

```bash
# Proje oluştur
npm create vite@latest cambio-online -- --template react-ts
cd cambio-online

# Paketleri yükle
npm install @supabase/supabase-js zustand framer-motion
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# .env dosyası oluştur
echo "VITE_SUPABASE_URL=..." > .env
echo "VITE_SUPABASE_ANON_KEY=..." >> .env

# Başlat
npm run dev
```

---

*Cambio Online — Oyun Tasarım Dokümanı v1.0*
