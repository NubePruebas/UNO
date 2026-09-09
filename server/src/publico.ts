import os from 'os';
import { EstadoPartida, EstadoPublico, JugadorPublico } from './types';

export function ipLan(): string | null {
  const ifaces = os.networkInterfaces();
  for (const lista of Object.values(ifaces)) {
    if (!lista) continue;
    for (const red of lista) {
      if (red.family === 'IPv4' && !red.internal) return red.address;
    }
  }
  return null;
}

export function estadoPublico(partida: EstadoPartida, jugadorId: string): EstadoPublico {
  const yo = partida.jugadores.find((j) => j.id === jugadorId);
  const jugadores: JugadorPublico[] = partida.jugadores.map((j) => ({
    id: j.id,
    nombre: j.nombre,
    esBot: j.esBot,
    nivelBot: j.nivelBot,
    cantidadCartas: j.cartas.length,
    conectado: j.esBot ? true : j.conectado,
    dijoUno: j.dijoUno,
    puntos: j.puntos,
    pin: j.id === jugadorId ? j.pin : undefined,
  }));
  const turno = partida.jugadores[partida.turnoIndex];
  const ganador = partida.jugadores.find((j) => j.id === partida.ganadorId);
  const campeon = partida.jugadores.find((j) => j.id === partida.campeonId);

  return {
    id: partida.id,
    codigo: partida.codigo,
    hostId: partida.hostId,
    jugadores,
    tuMano: yo?.cartas ?? [],
    tuId: jugadorId,
    tuPin: yo?.pin ?? '',
    cima: partida.descarte[partida.descarte.length - 1] ?? null,
    colorActual: partida.fase === 'lobby' ? null : partida.colorActual,
    sentido: partida.sentido,
    turnoIndex: partida.turnoIndex,
    turnoJugadorId: partida.fase === 'jugando' ? turno?.id ?? null : null,
    fase: partida.fase,
    pendienteColorDe: partida.pendienteColorDe,
    desafiarMas4: partida.desafiarMas4,
    acabaDeRobarId: partida.acabaDeRobarId,
    pendienteIntercambioDe: partida.pendienteIntercambioDe,
    acumuladoMas: partida.acumuladoMas,
    tipoPila: partida.tipoPila,
    ganadorId: partida.ganadorId,
    ganadorNombre: ganador?.nombre,
    campeonId: partida.campeonId,
    campeonNombre: campeon?.nombre,
    puntosRonda: partida.puntosRonda,
    unoHasta: partida.unoHasta,
    unoJugadorId: partida.unoJugadorId,
    turnoHasta: partida.turnoHasta,
    reglas: partida.reglas,
    chat: partida.chat.slice(-40),
    log: partida.log.slice(-25),
    maxJugadores: partida.maxJugadores,
    cartasMazo: partida.mazo.length,
    descarteVisible: partida.descarte.slice(-3),
    pensandoId: partida.pensandoId,
    rondaAutoEn: partida.rondaAutoEn,
  };
}

export function codigoSala(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}
