const MUTE_STORAGE_KEY = "rugobu-sound-muted-v1";
const ASSET_PATHS = {
  "place-ramp": "./assets/sounds/place-ramp.wav",
  "place-domino": "./assets/sounds/place-domino.wav",
  "place-seesaw": "./assets/sounds/place-seesaw.wav",
  "ball-start": "./assets/sounds/ball-start.wav",
  star: "./assets/sounds/star.wav",
};
const SOUND_PRESETS = {
  "place-ramp": {
    notes: [{ frequency: 360, endFrequency: 480, duration: 0.1, waveform: "triangle" }],
  },
  "place-domino": {
    notes: [{ frequency: 250, endFrequency: 175, duration: 0.08, waveform: "square" }],
  },
  "place-seesaw": {
    notes: [{ frequency: 225, endFrequency: 330, duration: 0.16, waveform: "sine" }],
  },
  "ball-start": {
    notes: [{ frequency: 390, endFrequency: 620, duration: 0.22, waveform: "sine" }],
  },
  star: {
    notes: [
      { frequency: 660, duration: 0.18, waveform: "sine" },
      { frequency: 880, duration: 0.22, offset: 0.09, waveform: "sine" },
    ],
  },
};

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.audioUnavailable = false;
    this.audioBuffers = new Map();
    this.pendingAssets = new Set();
    this.unlocked = false;
    this.lastPlacementSoundAt = -Infinity;
    this.muted = this.readMutePreference();
    this.volume = 0.35;
    this.unlockOnGesture = () => this.unlock();

    window.addEventListener("pointerdown", this.unlockOnGesture, { capture: true });
    window.addEventListener("keydown", this.unlockOnGesture, { capture: true });
  }

  readMutePreference() {
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
    } catch (error) {
      console.warn("Could not load the saved sound setting; sounds will be enabled.", error);
      return false;
    }
  }

  createAudioContext() {
    const AudioContextConstructor = window.AudioContext;
    if (this.audioUnavailable || this.audioContext) {
      return;
    }
    if (!AudioContextConstructor) {
      this.audioUnavailable = true;
      return;
    }

    try {
      this.audioContext = new AudioContextConstructor();
    } catch (error) {
      this.audioUnavailable = true;
      console.warn("Web Audio is unavailable; sound effects will be disabled.", error);
    }
  }

  unlock() {
    if (this.unlocked) {
      return;
    }
    this.unlocked = true;
    window.removeEventListener("pointerdown", this.unlockOnGesture, { capture: true });
    window.removeEventListener("keydown", this.unlockOnGesture, { capture: true });
    this.createAudioContext();
    this.resumeAudio();
  }

  resumeAudio() {
    if (!this.audioContext || this.audioContext.state !== "suspended") {
      return Promise.resolve();
    }

    try {
      return this.audioContext.resume().catch(() => {});
    } catch {
      return Promise.resolve();
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    } catch (error) {
      console.warn("Could not save the sound setting; it will reset after reload.", error);
    }
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  setVolume(volume) {
    if (!Number.isFinite(volume)) {
      throw new TypeError("Sound volume must be a finite number.");
    }
    this.volume = Math.min(1, Math.max(0, volume));
    return this.volume;
  }

  play(name) {
    if (!Object.hasOwn(SOUND_PRESETS, name)) {
      throw new Error(`Unknown sound effect: ${name}`);
    }
    if (this.muted || !this.unlocked) {
      return;
    }

    this.createAudioContext();
    if (!this.audioContext) {
      return;
    }

    if (name.startsWith("place-")) {
      const now = performance.now();
      if (now - this.lastPlacementSoundAt < 80) {
        return;
      }
      this.lastPlacementSoundAt = now;
    }
    this.loadAudioAsset(name);

    void this.resumeAudio().then(() => {
      if (this.muted || !this.audioContext) {
        return;
      }
      const buffer = this.audioBuffers.get(name);
      if (buffer) {
        this.playBuffer(buffer);
      } else {
        this.playSynth(name);
      }
    });
  }

  loadAudioAsset(name) {
    if (this.audioBuffers.has(name) || this.pendingAssets.has(name)) {
      return;
    }

    this.pendingAssets.add(name);
    void fetch(ASSET_PATHS[name])
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Audio request failed with status ${response.status}.`);
        }
        return response.arrayBuffer();
      })
      .then((audioData) => (
        audioData ? this.audioContext.decodeAudioData(audioData) : null
      ))
      .then((buffer) => {
        if (buffer) {
          this.audioBuffers.set(name, buffer);
        }
      })
      .catch((error) => {
        console.warn(`Could not load ${ASSET_PATHS[name]}; using its synthesized sound.`, error);
      })
      .finally(() => this.pendingAssets.delete(name));
  }

  playBuffer(buffer) {
    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    source.buffer = buffer;
    gain.gain.value = this.volume;
    source.connect(gain);
    gain.connect(this.audioContext.destination);
    source.start();
  }

  playSynth(name) {
    const preset = SOUND_PRESETS[name];
    const startedAt = this.audioContext.currentTime;
    for (const note of preset.notes) {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const noteStart = startedAt + (note.offset ?? 0);
      const noteEnd = noteStart + note.duration;
      oscillator.type = note.waveform;
      oscillator.frequency.setValueAtTime(note.frequency, noteStart);
      if (note.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, noteEnd);
      }
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(this.volume * 0.24, noteStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    }
  }
}
