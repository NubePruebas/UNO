let ctx: AudioContext | null = null;
let activo = localStorage.getItem('kroma.sonido') !== '0';

export function sonidoActivo(): boolean {
  return activo;
}

export function setSonidoActivo(v: boolean) {
  activo = v;
  localStorage.setItem('kroma.sonido', v ? '1' : '0');
}

export function haptico(ms = 14) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sin motor de vibración */
  }
}

function audio(): AudioContext | null {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType = 'triangle', gain = 0.045) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(a.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.stop(a.currentTime + dur);
}

function ruidoCorta(dur = 0.05, gain = 0.03) {
  const a = audio();
  if (!a) return;
  const n = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  const g = a.createGain();
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1800;
  src.buffer = n;
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(a.destination);
  src.start();
}

export function sonido(tipo: 'carta' | 'robar' | 'kroma' | 'win' | 'tick' | 'chat' | 'error' | 'barajar') {
  if (!activo) return;
  if (tipo === 'carta') {
    ruidoCorta(0.04, 0.04);
    beep(390, 0.07, 'triangle', 0.04);
    setTimeout(() => beep(520, 0.08, 'triangle', 0.035), 50);
    haptico(10);
  } else if (tipo === 'robar') {
    ruidoCorta(0.06, 0.035);
    beep(210, 0.1, 'sine', 0.04);
  } else if (tipo === 'kroma') {
    beep(784, 0.1, 'square', 0.05);
    setTimeout(() => beep(1046, 0.2, 'square', 0.05), 90);
    haptico(30);
  } else if (tipo === 'win') {
    beep(523, 0.12);
    setTimeout(() => beep(659, 0.12), 110);
    setTimeout(() => beep(784, 0.28), 220);
    haptico(40);
  } else if (tipo === 'tick') beep(980, 0.035, 'sine', 0.025);
  else if (tipo === 'chat') beep(700, 0.04, 'sine', 0.025);
  else if (tipo === 'barajar') {
    ruidoCorta(0.08, 0.05);
    setTimeout(() => ruidoCorta(0.06, 0.04), 70);
    setTimeout(() => ruidoCorta(0.05, 0.03), 130);
  } else beep(140, 0.14, 'sawtooth', 0.035);
}
