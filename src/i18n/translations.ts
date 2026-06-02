export const translations = {
  tr: {
    // HomeScreen
    hs_player_name: 'Oyuncu Adı',
    hs_placeholder: 'Örn. Asil',
    hs_create_room: 'YENİ ODA KUR',
    hs_creating: 'OLUŞTURULUYOR...',
    hs_join_room: 'ODAYA KATIL',
    hs_with_bots: 'BOTLARLA',
    hs_join_code: 'Katılım Kodu',
    hs_cancel: 'İPTAL',
    hs_sit_table: 'MASAYA OTUR',
    hs_joining: 'KATILINIYOR...',
    hs_rules: 'KURALLAR',

    // General
    fullScreen: 'TAM EKRAN',
    demoMode: '📴 Demo Modu',
    playAgain: 'Tekrar Oyna',
    reset: 'Reset',
    resetIn: (sec: number) => `${sec}s’de reset...`,
    chooseLanguage: 'Dil Seç',
    
    // GameBoard Actions
    banner_peek_own: 'KENDİ KARTINA BAK',
    banner_peek_other: 'RAKİP KARTINA BAK',
    banner_spy_swap: 'CASUS TAKASI',
    banner_blind_swap: 'KÖR TAKAS',
    banner_opponent_power: (name: string) => `${name} GÜÇ KULLANIYOR`,
    
    hint_peek_own: 'Aşağıdan kendi kartlarından birine tıkla 👇',
    hint_peek_other: 'Rakiplerinin kartlarından birine tıkla 👆',
    hint_spy_swap_1: 'Önce rakip karta tıkla 👆',
    hint_spy_swap_2: 'Şimdi kendi kartını seçerek takasla veya pas geç 👇',
    hint_blind_swap_1: 'Önce kendi kartına tıkla 👇',
    hint_blind_swap_2: 'Şimdi rakibin kartına tıkla 👆',
    hint_waiting: 'Hamle yapması bekleniyor... ⏳',
    hint_skip: '⏭️ TAKAS YAPMADAN GEÇ',
    hint_give_card: 'Rakibine vermek için kendi kartlarından birini seç 👇',
    
    // Peek Phase Overlays
    peek_dealing: 'KARTLAR DAĞITILIYOR',
    peek_dealing_sub: 'Lütfen bekleyin...',
    peek_starting: 'OYUN BAŞLIYOR',
    peek_starting_sub: 'Hazır ol!',
    peek_waiting: 'BEKLENİYOR...',
    peek_waiting_sub: 'Diğer oyuncuların seçimi bekleniyor',
    peek_select: 'KARTLARINI SEÇ',
    peek_select_sub: 'Hafızana kazımak için kendi 2 kartına tıkla',
    peek_highlight: 'SEÇİMLER',
    peek_highlight_sub: 'Herkesin baktığı kartları izle',
    peek_reveal: 'HAFIZANA KAZI',
    peek_reveal_sub: 'Seçtiğin kartlar açıldı, iyice ezberle!',
    
    // Player Area
    cambioSuccess: '🏆 Başarılı Cambio (-10 Ödül)',
    cambioFail: '❌ Hatalı Cambio (+10 Ceza)',
    cardCount: (count: number) => `${count} kart`,
    drawnAction_addOrDiscard: 'Kartına ekle ya da at',
    drawnAction_discard: '🗑 Çöpe At',
    drawnAction_orClickBottom: 'ya da alttaki karta tıkla',
    discardPile: 'Çöp',
    
    // TurnIndicator
    turn: 'Sıra',
    round: 'Tur',
    phase: 'Faz',
    time: 'Süre',
    yourTurn: 'Senin sıran!',
    
    // Phases
    phase_waiting: 'Bekleniyor...',
    phase_peek: 'Kartlarına bak!',
    phase_draw: 'Kart çek',
    phase_action: 'İşlem yap',
    phase_stick_window: 'Yapıştır!',
    phase_power: 'Güç kullan',
    phase_give_card: 'Kart ver',
    phase_cambio_round: 'Cambio Turu!',
    phase_reveal: 'Açılıyor...',
    phase_results: 'Sonuçlar',
    passingTurn: '⏵ SIRA GEÇİYOR... ⏵',

    // GameBoard Cambio info
    cambioCalled: 'CAMBIO!',
    cambioRoundTurnsLeft: (turns: number) => `CAMBIO Turu! Kalan: ${turns} tur`,

    // GameLog
    logTitle: 'Hamle Logu',
    logMoves: (count: number) => `${count} hamle`,
    logEmpty: 'Henüz hamle yapılmadı',
    log_draw_deck: 'Deste',
    log_draw_discard: 'Çöp',
    log_swap: 'Takas',
    log_discard: 'At',
    log_power_peek_own: 'Bak',
    log_power_peek_other: 'Bak',
    log_power_blind_swap: 'Kör Takas',
    log_power_spy_swap: 'Spy',
    log_power_skip: 'Geç',
    log_cambio: 'CAMBIO',
    log_stick_ok: 'Yapıştır',
    log_stick_opponent_ok: 'Yapıştır',
    log_stick_fail: 'Hata',

    // Leaderboard
    leaderboardTitle: 'Liderlik Tablosu',
    roundScores: 'Tur Skorları:',
    totalScore: 'Toplam Puan:',
    noGamesPlayed: 'Henüz oynanmış bir el yok. İlk eli bitirdiğinizde sonuçlar burada görünecek.',
    
    // Chat
    chatTitle: 'Sohbet',
    chatPlaceholder: 'Bir mesaj yaz...',
    chatSend: 'Gönder',

    // Rules
    rulesTitle: 'Kart Güçleri ve Nasıl Oynanır',
    powersSubtitle: 'Kart Güçleri',
    howToPlaySubtitle: 'Nasıl Oynanır',
    
    power_7_8: 'Kendi kartına bak',
    power_9_10: 'Rakip kartına bak',
    power_J_Q: 'Kör takas yap',
    power_K_black: 'Rakip kartını gör + takas',
    note_valuable: 'En değerli kart!',
    note_zero: 'Sıfır puan',
    
    rule_1: 'Hedef: En az puana sahip olmak',
    rule_2: 'Başta 2 kartına bakabilirsin (ön 2)',
    rule_3: 'Kart çek → elindeki biriyle değiştir ya da çöpe at',
    rule_4: "Hazır olunca CAMBIO de — diğerleri 1'er tur daha oynar",
    rule_5: 'Çöpteki kart elindeyle aynıysa yapıştır (kart elden çıkar)',
    rule_6: 'Yanlış yapıştırırsan ceza kartı alırsın',
  },
  
  en: {
    // HomeScreen
    hs_player_name: 'Player Name',
    hs_placeholder: 'e.g. Asil',
    hs_create_room: 'CREATE NEW ROOM',
    hs_creating: 'CREATING...',
    hs_join_room: 'JOIN ROOM',
    hs_with_bots: 'WITH BOTS',
    hs_join_code: 'Join Code',
    hs_cancel: 'CANCEL',
    hs_sit_table: 'JOIN TABLE',
    hs_joining: 'JOINING...',
    hs_rules: 'RULES',

    // General
    fullScreen: 'FULL SCREEN',
    demoMode: '📴 Demo Mode',
    playAgain: 'Play Again',
    reset: 'Reset',
    resetIn: (sec: number) => `Reset in ${sec}s...`,
    chooseLanguage: 'Choose Language',
    
    // GameBoard Actions
    banner_peek_own: 'PEEK AT YOUR CARD',
    banner_peek_other: "PEEK AT OPPONENT'S CARD",
    banner_spy_swap: 'SPY SWAP',
    banner_blind_swap: 'BLIND SWAP',
    banner_opponent_power: (name: string) => `${name} IS USING A POWER`,
    
    hint_peek_own: 'Click one of your own cards below 👇',
    hint_peek_other: "Click one of the opponent's cards 👆",
    hint_spy_swap_1: "First click an opponent's card 👆",
    hint_spy_swap_2: 'Now click your card to swap, or skip 👇',
    hint_blind_swap_1: 'First click your card 👇',
    hint_blind_swap_2: "Now click an opponent's card 👆",
    hint_waiting: 'Waiting for their move... ⏳',
    hint_skip: '⏭️ SKIP WITHOUT SWAP',
    hint_give_card: 'Select one of your cards to give to an opponent 👇',
    
    // Peek Phase Overlays
    peek_dealing: 'DEALING CARDS',
    peek_dealing_sub: 'Please wait...',
    peek_starting: 'GAME STARTING',
    peek_starting_sub: 'Get ready!',
    peek_waiting: 'WAITING...',
    peek_waiting_sub: 'Waiting for other players to select',
    peek_select: 'SELECT YOUR CARDS',
    peek_select_sub: 'Click your 2 cards to memorize them',
    peek_highlight: 'SELECTIONS',
    peek_highlight_sub: "Watch everyone's selected cards",
    peek_reveal: 'MEMORIZE',
    peek_reveal_sub: 'Your selected cards are revealed, memorize them!',
    
    // Player Area
    cambioSuccess: '🏆 Successful Cambio (-10 Reward)',
    cambioFail: '❌ Failed Cambio (+10 Penalty)',
    cardCount: (count: number) => `${count} cards`,
    drawnAction_addOrDiscard: 'Add to your cards or discard',
    drawnAction_discard: '🗑 Discard',
    drawnAction_orClickBottom: 'or click a card below',
    discardPile: 'Discard',
    
    // TurnIndicator
    turn: 'Turn',
    round: 'Round',
    phase: 'Phase',
    time: 'Time',
    yourTurn: 'Your turn!',
    
    // Phases
    phase_waiting: 'Waiting...',
    phase_peek: 'Peek at your cards!',
    phase_draw: 'Draw card',
    phase_action: 'Take action',
    phase_stick_window: 'Stick window!',
    phase_power: 'Use power',
    phase_give_card: 'Give card',
    phase_cambio_round: 'Cambio Round!',
    phase_reveal: 'Revealing...',
    phase_results: 'Results',
    passingTurn: '⏵ PASSING TURN... ⏵',

    // GameBoard Cambio info
    cambioCalled: 'CAMBIO!',
    cambioRoundTurnsLeft: (turns: number) => `CAMBIO Round! Left: ${turns} turn(s)`,

    // GameLog
    logTitle: 'Game Log',
    logMoves: (count: number) => `${count} move(s)`,
    logEmpty: 'No moves yet',
    log_draw_deck: 'Deck',
    log_draw_discard: 'Discard',
    log_swap: 'Swap',
    log_discard: 'Discard',
    log_power_peek_own: 'Peek',
    log_power_peek_other: 'Peek',
    log_power_blind_swap: 'Blind Swap',
    log_power_spy_swap: 'Spy',
    log_power_skip: 'Skip',
    log_cambio: 'CAMBIO',
    log_stick_ok: 'Stick',
    log_stick_opponent_ok: 'Stick',
    log_stick_fail: 'Fail',

    // Leaderboard
    leaderboardTitle: 'Leaderboard',
    roundScores: 'Round Scores:',
    totalScore: 'Total Score:',
    noGamesPlayed: 'No hands played played yet. Results will appear here after the first hand.',
    
    // Chat
    chatTitle: 'Chat',
    chatPlaceholder: 'Type a message...',
    chatSend: 'Send',

    // Rules
    rulesTitle: 'Card Powers & How To Play',
    powersSubtitle: 'Card Powers',
    howToPlaySubtitle: 'How To Play',
    
    power_7_8: 'Peek at your own card',
    power_9_10: "Peek at opponent's card",
    power_J_Q: 'Blind swap',
    power_K_black: "See opponent's card + swap",
    note_valuable: 'Most valuable card!',
    note_zero: 'Zero points',
    
    rule_1: 'Goal: Have the lowest score',
    rule_2: 'Peek at 2 of your cards at the start (front 2)',
    rule_3: 'Draw a card → swap with yours or discard',
    rule_4: 'Call CAMBIO when ready — others play 1 more turn',
    rule_5: 'Stick a matching card onto the discard pile to get rid of it',
    rule_6: 'Wrong stick means you draw a penalty card',
  }
};
