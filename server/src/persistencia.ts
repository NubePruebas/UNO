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
    const out: Record<string, EstadoPartida> = {};
    for (const [id, p] of Object.entries(data)) {
      out[id] = normalizarPartida(p);
    }
    return out;
  } catch {
    return {};
  }
}

export function guardarPartidas(partidas: Record<string, EstadoPartida>): void {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  const limpio: Record<string, EstadoPartida> = {};
  for (const [id, p] of Object.entries(partidas)) {
    limpio[id] = {
      ...p,
      jugadores: p.jugadores.map((j) => ({ ...j, socketId: undefined })),
    };
  }
  fs.writeFileSync(ARCHIVO, JSON.stringify(limpio, null, 2), 'utf8');
}
