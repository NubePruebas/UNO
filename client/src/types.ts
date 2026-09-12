export type ColorCarta = 'rojo' | 'amarillo' | 'verde' | 'azul';
export type TipoCarta = 'numero' | 'salto' | 'reverso' | 'mas2' | 'comodin' | 'comodin_mas4';
export type NivelBot = 'facil' | 'medio' | 'dificil';
export type FasePartida = 'lobby' | 'jugando' | 'finalizada';
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
  sentido: 1 | -1;
  turnoIndex: number;
  turnoJugadorId: string | null;
  fase: FasePartida;
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
  ganadorNombre?: string;
  campeonId?: string;
  campeonNombre?: string;
  puntosRonda?: { id: string; nombre: string; puntos: number }[];
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

export interface Sesion {
  partidaId: string;
  jugadorId: string;
  codigo: string;
  nombre: string;
  pin?: string;
}

export const COLORES: ColorCarta[] = ['rojo', 'amarillo', 'verde', 'azul'];
export const PUNTOS_META = 500;

export const REGLAS_DEFAULT: ReglasCasa = {
  apilarMas: false,
  robarHastaJugar: true,
  jumpIn: false,
  sieteCero: false,
};

export const REGLAS_LABEL: { key: keyof ReglasCasa; titulo: string; texto: string }[] = [
  { key: 'apilarMas', titulo: 'Apilar +2 / +4', texto: 'Puedes responder un +2 con otro +2 (o un +4 con +4) y la pila crece.' },
  { key: 'robarHastaJugar', titulo: 'Robar hasta poder', texto: 'Tomas una por una. Si no se puede tirar, sigues tomando hasta que sí.' },
  { key: 'jumpIn', titulo: 'Entrar igual', texto: 'Si tienes exactamente la misma carta que está arriba, puedes tirarla aunque no sea tu turno.' },
  { key: 'sieteCero', titulo: '7 y 0', texto: 'El 7 intercambia tu mano con otro jugador. El 0 rota todas las manos.' },
];
