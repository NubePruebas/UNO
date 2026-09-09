import fs from 'fs';
import path from 'path';
import { EstadoPartida, REGLAS_DEFAULT } from './types';
import { pinAleatorio } from './engine/reglas';

const DIR = path.join(__dirname, '..', 'data');
const ARCHIVO = path.join(DIR, 'partidas.json');

export function normalizarPartida(p: EstadoPartida): EstadoPartida {
  p.reglas = { ...REGLAS_DEFAULT, ...p.reglas };
  p.chat = p.chat ?? [];
  p.acumuladoMas = p.acumuladoMas ?? 0;
  p.turnoHasta = p.turnoHasta ?? 0;
  const pines = p.jugadores.map((j) => j.pin).filter(Boolean);
  for (const j of p.jugadores) {
    j.puntos = j.puntos ?? 0;
    j.pin = j.pin || pinAleatorio(pines);
    pines.push(j.pin);
    j.socketId = undefined;
    if (!j.esBot) j.conectado = false;
  }
  return p;
}

export function cargarPartidas(): Record<string, EstadoPartida> {
  try {
    if (!fs.existsSync(ARCHIVO)) return {};
    const raw = fs.readFileSync(ARCHIVO, 'utf8');
    const data = JSON.parse(raw) as Record<string, EstadoPartida>;
    const ahora = Date.now();
    const out: Record<string, EstadoPartida> = {};
    for (const [id, p] of Object.entries(data)) {
      const edad = ahora - (p.actualizadoEn || p.creadoEn || 0);
      if (edad > 48 * 3600 * 1000) continue;
      if (p.fase === 'lobby' && edad > 6 * 3600 * 1000) continue;
      out[id] = normalizarPartida(p);
    }
    return out;
  } catch {
    return {};
  }
}

export function guardarPartidas(partidas: Record<string, EstadoPartida>): void {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  const ahora = Date.now();
  const limpio: Record<string, EstadoPartida> = {};
  for (const [id, p] of Object.entries(partidas)) {
    const edad = ahora - (p.actualizadoEn || p.creadoEn || 0);
    if (edad > 48 * 3600 * 1000) continue;
    if (p.fase === 'lobby' && edad > 6 * 3600 * 1000) continue;
    limpio[id] = {
      ...p,
      pensandoId: undefined,
      jugadores: p.jugadores.map((j) => ({ ...j, socketId: undefined })),
    };
  }
  const tmp = `${ARCHIVO}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(limpio, null, 2), 'utf8');
  fs.renameSync(tmp, ARCHIVO);
}
