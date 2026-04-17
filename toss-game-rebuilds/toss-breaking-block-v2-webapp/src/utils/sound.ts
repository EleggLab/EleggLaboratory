import type { BattleEvent } from '../game/types';

type OscillatorShape = OscillatorType;

function getAudioCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.AudioContext ?? null;
}

export class MagicSoundController {
  private context: AudioContext | null = null;
  private enabled = true;

  private ensureContext() {
    const AudioCtor = getAudioCtor();
    if (!AudioCtor) {
      return null;
    }

    if (!this.context) {
      this.context = new AudioCtor();
    }

    return this.context;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;

    if (!enabled) {
      void this.context?.suspend();
    } else if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void this.context?.resume();
    }
  }

  setAppActive(active: boolean) {
    if (!this.context) {
      return;
    }

    if (!this.enabled) {
      void this.context.suspend();
      return;
    }

    if (active) {
      void this.context.resume();
    } else {
      void this.context.suspend();
    }
  }

  emit(events: BattleEvent[]) {
    if (!this.enabled || events.length === 0) {
      return;
    }

    for (const event of events.slice(0, 3)) {
      switch (event.type) {
        case 'cast':
          this.playTone(440, 0.04, 'triangle', 0.018);
          break;
        case 'enemy-defeated':
          this.playTone(680, 0.05, 'sine', 0.016);
          break;
        case 'barrier-hit':
          this.playTone(180, 0.07, 'square', 0.02);
          break;
        case 'level-up':
          this.playTone(520, 0.08, 'triangle', 0.024);
          this.playTone(760, 0.1, 'sine', 0.014, 0.05);
          break;
        case 'victory':
          this.playTone(540, 0.1, 'sine', 0.03);
          this.playTone(860, 0.16, 'triangle', 0.02, 0.08);
          break;
        case 'defeat':
          this.playTone(200, 0.14, 'sawtooth', 0.024);
          break;
        default:
          break;
      }
    }
  }

  private playTone(
    frequency: number,
    durationSeconds: number,
    shape: OscillatorShape,
    gainAmount: number,
    delaySeconds = 0,
  ) {
    const context = this.ensureContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended' && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime + delaySeconds;

    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(120, frequency * 0.82), startAt + durationSeconds);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(gainAmount, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + durationSeconds + 0.02);
  }
}

