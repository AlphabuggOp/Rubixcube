let ctx = null;

function context() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const audio = context();
  if (audio?.state === 'suspended') audio.resume();
}

export function playTick(accent = false) {
  const audio = context();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(accent ? 420 : 310, now);
  osc.frequency.exponentialRampToValueAtTime(accent ? 180 : 140, now + 0.07);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.045 : 0.028, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

export function playSolved() {
  const audio = context();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume();
  const notes = [392, 494, 587, 784];
  notes.forEach((freq, i) => {
    const now = audio.currentTime + i * 0.07;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  });
}
