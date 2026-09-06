let ctx: AudioContext | null = null;
let activo = localStorage.getItem('uno.sonido') !== '0';

export function sonidoActivo(): boolean {
  return activo;
}

export function setSonidoActivo(v: boolean) {
  activo = v;
  localStorage.setItem('uno.sonido', v ? '1' : '0');
}

function audio(): AudioContext | null {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.05) {
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

export function sonido(tipo: 'carta' | 'robar' | 'uno' | 'win' | 'tick' | 'chat' | 'error') {
  if (!activo) return;
  if (tipo === 'carta') {
    beep(440, 0.08);
    setTimeout(() => beep(660, 0.1), 70);
  } else if (tipo === 'robar') beep(220, 0.12, 'triangle');
  else if (tipo === 'uno') {
    beep(880, 0.12);
    setTimeout(() => beep(1174, 0.18), 100);
  } else if (tipo === 'win') {
    beep(523, 0.12);
    setTimeout(() => beep(659, 0.12), 120);
    setTimeout(() => beep(784, 0.25), 240);
  } else if (tipo === 'tick') beep(980, 0.04, 'sine', 0.03);
  else if (tipo === 'chat') beep(700, 0.05, 'sine', 0.03);
  else beep(140, 0.15, 'sawtooth', 0.04);
}
