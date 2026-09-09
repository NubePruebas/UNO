import { io, type Socket } from 'socket.io-client';
import type { ColorCarta, NivelBot, ReglasCasa } from './types';

function urlServidor(): string {
  const env = import.meta.env.VITE_API_URL as string | undefined;
  if (env) return env.replace(/\/$/, '');
  const puerto = window.location.port;
  if (puerto === '5174' || puerto === '5175') {
    return `${window.location.protocol}//${window.location.hostname}:3010`;
  }
  return window.location.origin;
}

export const URL_API = urlServidor();

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL_API, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

function emitir<T>(evento: string, payload?: unknown): Promise<T> {
  return new Promise((resolve) => {
    const t = window.setTimeout(() => {
      resolve({ ok: false, error: 'Sin respuesta del servidor.' } as T);
    }, 8000);
    getSocket().emit(evento, payload ?? {}, (res: T) => {
      window.clearTimeout(t);
      resolve(res);
    });
  });
}

export type Respuesta = {
  ok: boolean;
  error?: string;
  partidaId?: string;
  jugadorId?: string;
  codigo?: string;
  pin?: string;
};

export const api = {
  crearSala: (nombre: string) => emitir<Respuesta>('crearSala', { nombre }),
  unirseSala: (codigo: string, nombre: string, jugadorId?: string) =>
    emitir<Respuesta>('unirseSala', { codigo, nombre, jugadorId }),
  reanudarPin: (codigo: string, pin: string, nombre?: string) =>
    emitir<Respuesta>('reanudarPin', { codigo, pin, nombre }),
  reconectar: (partidaId: string, jugadorId: string) =>
    emitir<Respuesta>('reconectar', { partidaId, jugadorId }),
  agregarBot: (nivel: NivelBot) => emitir<Respuesta>('agregarBot', { nivel }),
  quitarBot: (jugadorId: string) => emitir<Respuesta>('quitarBot', { jugadorId }),
  echarJugador: (jugadorId: string) => emitir<Respuesta>('echarJugador', { jugadorId }),
  salirSala: () => emitir<Respuesta>('salirSala'),
  iniciarPartida: () => emitir<Respuesta>('iniciarPartida'),
  partidaRapida: (nombre: string, nivel?: NivelBot, bots?: number, reglas?: Partial<ReglasCasa>) =>
    emitir<Respuesta>('partidaRapida', { nombre, nivel, bots, reglas }),
  actualizarReglas: (reglas: Partial<ReglasCasa>) => emitir<Respuesta>('actualizarReglas', reglas),
  jugarCarta: (cartaId: string, color?: ColorCarta, objetivoId?: string) =>
    emitir<Respuesta>('jugarCarta', { cartaId, color, objetivoId }),
  robar: () => emitir<Respuesta>('robar'),
  pasar: () => emitir<Respuesta>('pasar'),
  decirUno: () => emitir<Respuesta>('decirUno'),
  acusarUno: (objetivoId: string) => emitir<Respuesta>('acusarUno', { objetivoId }),
  resolverMas4: (desafiar: boolean) => emitir<Respuesta>('resolverMas4', { desafiar }),
  intercambiar: (objetivoId: string) => emitir<Respuesta>('intercambiar', { objetivoId }),
  nuevaRonda: () => emitir<Respuesta>('nuevaRonda'),
  nuevaPartida: () => emitir<Respuesta>('nuevaPartida'),
  chat: (texto: string) => emitir<Respuesta>('chat', { texto }),
};

export async function infoLan(): Promise<{ ip: string | null; puertoJuego: number }> {
  try {
    const r = await fetch(`${URL_API}/api/lan`);
    return r.json();
  } catch {
    return { ip: null, puertoJuego: Number(window.location.port) || 80 };
  }
}

export type SalaLan = { codigo: string; jugadores: number; nombres: string[] };

export async function salasLan(): Promise<SalaLan[]> {
  try {
    const r = await fetch(`${URL_API}/api/salas`);
    const d = (await r.json()) as { salas?: SalaLan[] };
    return d.salas ?? [];
  } catch {
    return [];
  }
}
