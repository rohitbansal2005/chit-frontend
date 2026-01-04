let audio: HTMLAudioElement | null = null;

export const initNotificationSound = (url: string) => {
  try {
    audio = new Audio(url);
    audio.preload = 'auto';
  } catch (e) {
    console.warn('Failed to init notification sound', e);
  }
};

export const playNotificationSound = (volume = 0.7) => {
  try {
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Play may be blocked by browser autoplay policy until user interaction
    });
  } catch (e) {
    // ignore
  }
};

export const unlockAudio = async () => {
  try {
    if (!audio) return;
    audio.muted = true;
    await audio.play().catch(() => {});
    audio.pause();
    audio.muted = false;
  } catch {}
};
