let audioContext: AudioContext | null = null;

export function playNotificationSound() {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(1108, now + 0.1);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.35);
  } catch {
    // audio not available (e.g. no user interaction yet) — fail silently
  }
}
