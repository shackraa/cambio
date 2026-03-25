class SoundManagerClass {
  private context: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.context.currentTime);

      gain.gain.setValueAtTime(vol, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.context.destination);

      osc.start();
      osc.stop(this.context.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  public playCardDraw() {
    // Kısa, tok bir "zip" sesi
    this.playTone(300, 'sine', 0.1, 0.2);
    setTimeout(() => this.playTone(400, 'sine', 0.1, 0.1), 50);
  }

  public playCardDrop() {
    // Masaya koyma sesi "thud"
    this.playTone(150, 'square', 0.1, 0.3);
  }

  public playStick() {
    // Yapıştırma, sivri ve dikkat çekici
    this.playTone(800, 'triangle', 0.1, 0.2);
    setTimeout(() => this.playTone(1200, 'triangle', 0.2, 0.2), 100);
  }

  public playCambio() {
    // Cambio çağrısı: alarm / çan gibi
    this.playTone(440, 'sine', 0.3, 0.3);
    setTimeout(() => this.playTone(554, 'sine', 0.3, 0.3), 150);
    setTimeout(() => this.playTone(659, 'sine', 0.5, 0.3), 300);
  }

  public playError() {
    // Yanlış hamle
    this.playTone(200, 'sawtooth', 0.2, 0.2);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.3, 0.3), 100);
  }
}

export const SoundManager = new SoundManagerClass();
