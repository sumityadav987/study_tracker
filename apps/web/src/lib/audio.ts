class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Resume context if suspended (required by browsers)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (this.sounds.has(name)) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound ${name}:`, error);
    }
  }

  async playSound(name: string, volume = 0.5): Promise<void> {
    if (!this.audioContext || !this.sounds.has(name)) return;

    try {
      const audioBuffer = this.sounds.get(name)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);
    } catch (error) {
      console.error(`Failed to play sound ${name}:`, error);
    }
  }

  async playPing(): Promise<void> {
    await this.playSound('ping', 0.3);
  }
}

export const audioManager = new AudioManager();