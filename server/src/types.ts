export type ColorCarta = 'rojo' | 'amarillo' | 'verde' | 'azul';
export type TipoCarta = 'numero' | 'salto' | 'reverso' | 'mas2' | 'comodin' | 'comodin_mas4';
export type NivelBot = 'facil' | 'medio' | 'dificil';
export type FasePartida = 'lobby' | 'jugando' | 'finalizada';
export type Sentido = 1 | -1;
export type TipoPila = 'mas2' | 'comodin_mas4';

export interface Carta {
  id: string;
  color: ColorCarta | null;
  tipo: TipoCarta;
  valor?: number;
}

export interface ReglasCasa {
  apilarMas: boolean;
  robarHastaJugar: boolean;
  jumpIn: boolean;
  sieteCero: boolean;
}

export interface Jugador {
  id: string;
  nombre: string;
  esBot: boolean;
  nivelBot?: NivelBot;
  cartas: Carta[];
  conectado: boolean;
  socketId?: string;
  dijoUno: boolean;
  pin: string;
  puntos: number;
}

export interface EventoLog {
  id: string;
  texto: string;
  en: number;
}

export interface MensajeChat {
  id: string;
  jugadorId: string;
  nombre: string;
  texto: string;
  en: number;
}

export interface EstadoPartida {
  id: string;
  codigo: string;
  hostId: string;
  jugadores: Jugador[];
  mazo: Carta[];
  descarte: Carta[];
  colorActual: ColorCarta;
  sentido: Sentido;
  turnoIndex: number;
  fase: FasePartida;
  pendienteColorDe?: string;
  desafiarMas4?: {
    jugadorId: string;
    objetivoId: string;
    cartaId: string;
  };
  acabaDeRobarId?: string;
  pendienteIntercambioDe?: string;
  acumuladoMas: number;
  tipoPila?: TipoPila;
  ganadorId?: string;
  campeonId?: string;
  puntosRonda?: { id: string; nombre: string; puntos: number }[];
  unoHasta?: number;
  unoJugadorId?: string;
  turnoHasta: number;
  reglas: ReglasCasa;
  chat: MensajeChat[];
  log: EventoLog[];
  maxJugadores: number;
  creadoEn: number;
  actualizadoEn: number;
  pensandoId?: string;
  rondaAutoEn?: number;
}

export interface JugadorPublico {
  id: string;
  nombre: string;
  esBot: boolean;
  nivelBot?: NivelBot;
  cantidadCartas: number;
  conectado: boolean;
  dijoUno: boolean;
  puntos: number;
  pin?: string;
}

export interface EstadoPublico {
  id: string;
  codigo: string;
  hostId: string;
  jugadores: JugadorPublico[];
  tuMano: Carta[];
  tuId: string;
  tuPin: string;
  cima: Carta | null;
  colorActual: ColorCarta | null;
  sentido: Sentido;
  turnoIndex: number;
  turnoJugadorId: string | null;
  fase: FasePartida;
  pendienteColorDe?: string;
  desafiarMas4?: EstadoPartida['desafiarMas4'];
  acabaDeRobarId?: string;
  pendienteIntercambioDe?: string;
  acumuladoMas: number;
  tipoPila?: TipoPila;
  ganadorId?: string;
  ganadorNombre?: string;
  campeonId?: string;
  campeonNombre?: string;
  puntosRonda?: EstadoPartida['puntosRonda'];
  unoHasta?: number;
  unoJugadorId?: string;
  turnoHasta: number;
  reglas: ReglasCasa;
  chat: MensajeChat[];
  log: EventoLog[];
  maxJugadores: number;
  cartasMazo: number;
  descarteVisible: Carta[];
  pensandoId?: string;
  rondaAutoEn?: number;
}

export const COLORES: ColorCarta[] = ['rojo', 'amarillo', 'verde', 'azul'];
export const MAX_JUGADORES = 8;
export const MAX_PARTIDAS = 80;
export const CARTAS_INICIALES = 7;
export const PUERTO = 3010;
export const PUNTOS_META = 500;
export const TURNO_MS = 60_000;
export const UNO_MS = 8_000;

export function puertoEscucha(): number {
  const n = Number(process.env.PORT || process.env.PUERTO || PUERTO);
  return Number.isFinite(n) && n > 0 ? n : PUERTO;
}

export const REGLAS_DEFAULT: ReglasCasa = {
  apilarMas: true,
  robarHastaJugar: true,
  jumpIn: false,
  sieteCero: false,
};
