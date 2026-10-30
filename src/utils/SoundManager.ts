class SoundManagerClass {
  private context: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted() {
    return this.isMuted;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Gerçekçi kağıt / kart sürtünme sesi (Filtered White/Pink Noise)
  private playPaperSlide(duration: number, startFreq: number, endFreq: number, volume: number = 0.14) {
    if (this.isMuted) return;
    try {
      this.init();
      const ctx = this.context;
      if (!ctx) return;

      const now = ctx.currentTime;
      const sampleRate = ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Yumuşak pembe-beyaz gürültü karışımı (kağıt dokusu için)
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.25;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(2.2, now);
      filter.frequency.setValueAtTime(startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + duration * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // ignore audio errors
    }
  }

  // Yumuşak ahşap/keçe masa dokunuş sesi (Soft Low Thump)
  private playFeltTap(freq: number = 115, duration: number = 0.08, volume: number = 0.16) {
    if (this.isMuted) return;
    try {
      this.init();
      const ctx = this.context;
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + duration);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // ignore
    }
  }

  public playCardDraw() {
    // Desteden kart çekme: zarif kağıt kayma sesi ("shhhk")
    this.playPaperSlide(0.14, 900, 2200, 0.13);
  }

  public playCardFlip() {
    // Kart çevirme / bakma sesi: hafif kıvrak kağıt sesi
    this.playPaperSlide(0.11, 1400, 2800, 0.10);
  }

  public playCardDrop() {
    // Masaya kart bırakma: hafif kağıt rüzgarı + tok keçe dokunuşu
    this.playPaperSlide(0.10, 1600, 750, 0.11);
    setTimeout(() => this.playFeltTap(105, 0.075, 0.15), 35);
  }

  public playStick() {
    // Kart yapıştırma: net kart şaklaması + sıcak uyumlu akor
    this.playPaperSlide(0.09, 2000, 1100, 0.15);
    this.playFeltTap(130, 0.08, 0.18);
    if (this.isMuted) return;
    try {
      this.init();
      const ctx = this.context;
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.055);
        gain.gain.setValueAtTime(0.06, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.18);
      });
    } catch {}
  }

  public playCambio() {
    // Cambio çağrısı: sıcak, zarif kristal çan akoru (C5 - E5 - G5 - B5)
    if (this.isMuted) return;
    try {
      this.init();
      const ctx = this.context;
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 987.77];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + i * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {}
  }

  public playError() {
    // Yanlış hamle: kulak tırmalamayan, yumuşak çift tok uyarı
    this.playFeltTap(95, 0.11, 0.18);
    setTimeout(() => this.playFeltTap(72, 0.14, 0.18), 110);
  }
}

export const SoundManager = new SoundManagerClass();
