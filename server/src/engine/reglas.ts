import { v4 as uuid } from 'uuid';
import {
  Carta,
  ColorCarta,
  EstadoPartida,
  Jugador,
  PUNTOS_META,
  TURNO_MS,
  UNO_MS,
} from '../types';
import { barajar, crearMazo, reponerMazo } from './mazo';

export function cartaLegal(carta: Carta, estado: EstadoPartida, _mano: Carta[]): boolean {
  if ((estado.acumuladoMas ?? 0) > 0 && estado.tipoPila) {
    return carta.tipo === estado.tipoPila;
  }
  const cima = estado.descarte[estado.descarte.length - 1];
  if (!cima) return false;
  const colorActual = estado.colorActual;
  if (carta.tipo === 'comodin' || carta.tipo === 'comodin_mas4') return true;
  if (carta.color && carta.color === colorActual) return true;
  if (carta.tipo === 'numero' && cima.tipo === 'numero' && carta.valor === cima.valor) return true;
  if (
    (carta.tipo === 'salto' || carta.tipo === 'reverso' || carta.tipo === 'mas2') &&
    carta.tipo === cima.tipo
  ) {
    return true;
  }
  return false;
}

export function cartaIdentica(carta: Carta, cima: Carta): boolean {
  if (carta.tipo !== cima.tipo) return false;
  if (carta.tipo === 'numero') return carta.valor === cima.valor && carta.color === cima.color;
  if (carta.tipo === 'comodin' || carta.tipo === 'comodin_mas4') return true;
  return carta.color === cima.color;
}

export function legalesDe(jugador: Jugador, estado: EstadoPartida): Carta[] {
  return jugador.cartas.filter((c) => cartaLegal(c, estado, jugador.cartas));
}

export function siguienteIndice(estado: EstadoPartida, desde = estado.turnoIndex, saltos = 1): number {
  const n = estado.jugadores.length;
  if (n === 0) return 0;
  let i = desde;
  for (let s = 0; s < saltos; s++) {
    i = (i + estado.sentido + n) % n;
  }
  return i;
}

export function log(estado: EstadoPartida, texto: string): void {
  estado.log.push({ id: uuid(), texto, en: Date.now() });
  if (estado.log.length > 80) estado.log.splice(0, estado.log.length - 80);
}

function jugadorActual(estado: EstadoPartida): Jugador {
  return estado.jugadores[estado.turnoIndex];
}

function marcarTurno(estado: EstadoPartida): void {
  estado.turnoHasta = Date.now() + TURNO_MS;
  estado.actualizadoEn = Date.now();
}

export function robarUna(estado: EstadoPartida, jugador: Jugador): Carta | null {
  const repo = reponerMazo(estado.mazo, estado.descarte);
  estado.mazo = repo.mazo;
  estado.descarte = repo.descarte;
  const carta = estado.mazo.shift();
  if (!carta) return null;
  jugador.cartas.push(carta);
  if (jugador.cartas.length !== 1) {
    jugador.dijoUno = false;
    if (estado.unoJugadorId === jugador.id) {
      estado.unoHasta = undefined;
      estado.unoJugadorId = undefined;
    }
  }
  return carta;
}

function robarN(estado: EstadoPartida, jugador: Jugador, n: number): void {
  for (let i = 0; i < n; i++) robarUna(estado, jugador);
}

export function puntosCarta(carta: Carta): number {
  if (carta.tipo === 'numero') return carta.valor ?? 0;
  if (carta.tipo === 'comodin' || carta.tipo === 'comodin_mas4') return 50;
  return 20;
}

function puntosMano(cartas: Carta[]): number {
  return cartas.reduce((s, c) => s + puntosCarta(c), 0);
}

function cerrarRonda(estado: EstadoPartida, ganador: Jugador): void {
  const detalle = estado.jugadores.map((j) => ({
    id: j.id,
    nombre: j.nombre,
    puntos: j.id === ganador.id ? 0 : puntosMano(j.cartas),
  }));
  const suma = detalle.reduce((s, d) => s + (d.id === ganador.id ? 0 : d.puntos), 0);
  ganador.puntos += suma;
  estado.puntosRonda = detalle.map((d) =>
    d.id === ganador.id ? { ...d, puntos: suma } : d,
  );
  estado.fase = 'finalizada';
  estado.ganadorId = ganador.id;
  estado.turnoHasta = 0;
  estado.acumuladoMas = 0;
  estado.tipoPila = undefined;
  estado.desafiarMas4 = undefined;
  estado.pendienteIntercambioDe = undefined;
  log(estado, `🏁 ${ganador.nombre} cierra la ronda y suma ${suma} puntos (total ${ganador.puntos}).`);
  if (ganador.puntos >= PUNTOS_META) {
    estado.campeonId = ganador.id;
    log(estado, `🏆 ${ganador.nombre} gana la partida al llegar a ${ganador.puntos} puntos.`);
  }
}

export function repartir(estado: EstadoPartida): void {
  estado.mazo = crearMazo();
  estado.descarte = [];
  estado.sentido = 1;
  estado.turnoIndex = 0;
  estado.pendienteColorDe = undefined;
  estado.desafiarMas4 = undefined;
  estado.acabaDeRobarId = undefined;
  estado.pendienteIntercambioDe = undefined;
  estado.acumuladoMas = 0;
  estado.tipoPila = undefined;
  estado.ganadorId = undefined;
  estado.unoHasta = undefined;
  estado.unoJugadorId = undefined;
  estado.fase = 'jugando';

  for (const j of estado.jugadores) {
    j.cartas = [];
    j.dijoUno = false;
    for (let i = 0; i < 7; i++) robarUna(estado, j);
  }

  let inicial = estado.mazo.shift();
  while (inicial && inicial.tipo === 'comodin_mas4') {
    estado.mazo.push(inicial);
    estado.mazo = barajar(estado.mazo);
    inicial = estado.mazo.shift();
  }
  if (!inicial) throw new Error('Mazo vacío al iniciar');
  estado.descarte.push(inicial);

  if (inicial.tipo === 'comodin') {
    const colores: ColorCarta[] = ['rojo', 'amarillo', 'verde', 'azul'];
    estado.colorActual = colores[Math.floor(Math.random() * 4)];
    log(estado, `La primera carta es comodín. Color inicial: ${estado.colorActual}.`);
  } else {
    estado.colorActual = inicial.color as ColorCarta;
  }

  if (inicial.tipo === 'salto') {
    estado.turnoIndex = siguienteIndice(estado, 0, 1);
    log(estado, `Empieza ${jugadorActual(estado).nombre}: la primera carta es un salto.`);
  } else if (inicial.tipo === 'reverso') {
    estado.sentido = -1;
    if (estado.jugadores.length === 2) {
      estado.turnoIndex = 0;
      log(estado, 'Reverso inicial (2 jugadores): empieza el anfitrión otra vez.');
    } else {
      estado.turnoIndex = siguienteIndice(estado, 0, 1);
      log(estado, `Reverso inicial. Empieza ${jugadorActual(estado).nombre}.`);
    }
  } else if (inicial.tipo === 'mas2') {
    if (estado.reglas.apilarMas) {
      estado.acumuladoMas = 2;
      estado.tipoPila = 'mas2';
      estado.turnoIndex = 0;
      log(estado, `+2 inicial. ${jugadorActual(estado).nombre} puede apilar o tomar 2.`);
    } else {
      const victima = estado.jugadores[0];
      robarN(estado, victima, 2);
      estado.turnoIndex = siguienteIndice(estado, 0, 1);
      log(estado, `${victima.nombre} toma 2 por el +2 inicial. Empieza ${jugadorActual(estado).nombre}.`);
    }
  } else {
    log(estado, `Ronda empezada. Turno de ${jugadorActual(estado).nombre}.`);
  }

  marcarTurno(estado);
}

export function avanzarTurno(estado: EstadoPartida, saltos = 1): void {
  estado.turnoIndex = siguienteIndice(estado, estado.turnoIndex, saltos);
  estado.desafiarMas4 = undefined;
  estado.acabaDeRobarId = undefined;
  estado.pendienteIntercambioDe = undefined;
  marcarTurno(estado);
}

function avisarUno(estado: EstadoPartida, jugador: Jugador): void {
    if (jugador.esBot) {
      const nivel = jugador.nivelBot ?? 'facil';
      const p = nivel === 'dificil' ? 1 : nivel === 'medio' ? 0.82 : 0.28;
      jugador.dijoUno = Math.random() < p;
      if (jugador.dijoUno) {
        log(estado, `${jugador.nombre}: ¡Kroma!`);
        estado.unoHasta = undefined;
        estado.unoJugadorId = undefined;
      } else {
        jugador.dijoUno = false;
        estado.unoJugadorId = jugador.id;
        estado.unoHasta = Date.now() + UNO_MS;
      }
      return;
    }
  jugador.dijoUno = false;
  estado.unoJugadorId = jugador.id;
  estado.unoHasta = Date.now() + UNO_MS;
  log(estado, `${jugador.nombre} se quedó con una carta. ¡Que grite Kroma!`);
}

export function aplicarEfecto(estado: EstadoPartida, carta: Carta, jugadorId: string): void {
  const n = estado.jugadores.length;
  const idxJugador = estado.jugadores.findIndex((j) => j.id === jugadorId);
  if (idxJugador >= 0) estado.turnoIndex = idxJugador;

  if (estado.reglas.sieteCero && carta.tipo === 'numero' && carta.valor === 0) {
    const manos = estado.jugadores.map((j) => j.cartas);
    for (let i = 0; i < n; i++) {
      const destino = (i + estado.sentido + n) % n;
      estado.jugadores[destino].cartas = manos[i];
      estado.jugadores[destino].dijoUno = estado.jugadores[destino].cartas.length === 1;
    }
    log(estado, 'Cero: todas las manos rotan.');
    avanzarTurno(estado, 1);
    return;
  }

  if (carta.tipo === 'salto') {
    const saltado = estado.jugadores[siguienteIndice(estado, estado.turnoIndex, 1)];
    log(estado, `${saltado.nombre} se queda sin turno.`);
    avanzarTurno(estado, 2);
    return;
  }

  if (carta.tipo === 'reverso') {
    if (n === 2) {
      log(estado, 'Reverso: en 2 jugadores funciona como salto.');
      avanzarTurno(estado, 2);
      return;
    }
    estado.sentido = (estado.sentido === 1 ? -1 : 1) as 1 | -1;
    log(estado, `Cambia el sentido (${estado.sentido === 1 ? 'horario' : 'antihorario'}).`);
    avanzarTurno(estado, 1);
    return;
  }

  if (carta.tipo === 'mas2') {
    if (estado.reglas.apilarMas) {
      estado.acumuladoMas = (estado.acumuladoMas || 0) + 2;
      estado.tipoPila = 'mas2';
      log(estado, `Pila +${estado.acumuladoMas}. El siguiente apila o toma.`);
      avanzarTurno(estado, 1);
      return;
    }
    const victima = estado.jugadores[siguienteIndice(estado, estado.turnoIndex, 1)];
    robarN(estado, victima, 2);
    log(estado, `${victima.nombre} toma 2 cartas y pierde el turno.`);
    avanzarTurno(estado, 2);
    return;
  }

  if (carta.tipo === 'comodin_mas4') {
    const victimaIdx = siguienteIndice(estado, estado.turnoIndex, 1);
    const victima = estado.jugadores[victimaIdx];
    if (estado.reglas.apilarMas) {
      estado.acumuladoMas = (estado.acumuladoMas || 0) + 4;
      estado.tipoPila = 'comodin_mas4';
      log(estado, `Pila +${estado.acumuladoMas}. ${victima.nombre} puede apilar, desafiar o tomar.`);
    } else {
      log(estado, `${victima.nombre} puede desafiar el +4 o tomarlo.`);
    }
    estado.desafiarMas4 = {
      jugadorId: victima.id,
      objetivoId: jugadorId,
      cartaId: carta.id,
    };
    estado.turnoIndex = victimaIdx;
    estado.acabaDeRobarId = undefined;
    marcarTurno(estado);
    return;
  }

  avanzarTurno(estado, 1);
}

export function resolverMas4(
  estado: EstadoPartida,
  jugadorId: string,
  desafiar: boolean,
): { ok: boolean; error?: string } {
  const reto = estado.desafiarMas4;
  if (!reto || reto.jugadorId !== jugadorId) {
    return { ok: false, error: 'No hay un +4 para resolver.' };
  }
  const victima = estado.jugadores.find((j) => j.id === reto.jugadorId);
  const lanzador = estado.jugadores.find((j) => j.id === reto.objetivoId);
  if (!victima || !lanzador) return { ok: false, error: 'Jugadores no encontrados.' };

  const pila = estado.acumuladoMas > 0 ? estado.acumuladoMas : 4;
  const colorAntes = colorAntesDeComodin(estado);
  if (desafiar) {
    const eraIlegal = lanzador.cartas.some((c) => c.color === colorAntes);
    if (eraIlegal) {
      robarN(estado, lanzador, pila);
      log(estado, `¡Desafío ganado! ${lanzador.nombre} sí tenía ${colorAntes} y toma ${pila}.`);
    } else {
      robarN(estado, victima, pila + 2);
      log(estado, `Desafío fallido. ${victima.nombre} toma ${pila + 2}.`);
    }
  } else {
    robarN(estado, victima, pila);
    log(estado, `${victima.nombre} toma ${pila} y pierde el turno.`);
  }

  estado.desafiarMas4 = undefined;
  estado.acumuladoMas = 0;
  estado.tipoPila = undefined;
  const idxLanzador = estado.jugadores.findIndex((j) => j.id === lanzador.id);
  estado.turnoIndex = idxLanzador;
  avanzarTurno(estado, 2);
  return { ok: true };
}

function colorAntesDeComodin(estado: EstadoPartida): ColorCarta {
  for (let i = estado.descarte.length - 2; i >= 0; i--) {
    const c = estado.descarte[i];
    if (c.color) return c.color;
  }
  return estado.colorActual;
}

export function intercambiarManos(estado: EstadoPartida, deId: string, aId: string): { ok: boolean; error?: string } {
  if (estado.pendienteIntercambioDe !== deId) return { ok: false, error: 'No toca intercambiar.' };
  const de = estado.jugadores.find((j) => j.id === deId);
  const a = estado.jugadores.find((j) => j.id === aId);
  if (!de || !a || de.id === a.id) return { ok: false, error: 'Elige a otro jugador.' };
  const tmp = de.cartas;
  de.cartas = a.cartas;
  a.cartas = tmp;
  de.dijoUno = de.cartas.length === 1;
  a.dijoUno = a.cartas.length === 1;
  estado.pendienteIntercambioDe = undefined;
  log(estado, `${de.nombre} intercambia la mano con ${a.nombre}.`);
  if (de.cartas.length === 0) {
    cerrarRonda(estado, de);
    return { ok: true };
  }
  avanzarTurno(estado, 1);
  return { ok: true };
}

export function jugarCarta(
  estado: EstadoPartida,
  jugadorId: string,
  cartaId: string,
  extras?: { color?: ColorCarta; objetivoId?: string },
): { ok: boolean; error?: string } {
  if (estado.fase !== 'jugando') return { ok: false, error: 'La partida no está en curso.' };
  if (estado.pendienteIntercambioDe && estado.pendienteIntercambioDe !== jugadorId) {
    return { ok: false, error: 'Espera el intercambio del 7.' };
  }
  if (estado.desafiarMas4 && !(estado.reglas.apilarMas && estado.tipoPila === 'comodin_mas4')) {
    return { ok: false, error: 'Hay que resolver el desafío del +4.' };
  }

  const jugador = estado.jugadores.find((j) => j.id === jugadorId);
  if (!jugador) return { ok: false, error: 'Jugador no encontrado.' };

  const esTurno = jugadorActual(estado).id === jugadorId;
  const cima = estado.descarte[estado.descarte.length - 1];
  const idx = jugador.cartas.findIndex((c) => c.id === cartaId);
  if (idx < 0) return { ok: false, error: 'No tienes esa carta.' };
  const carta = jugador.cartas[idx];

  if (!esTurno) {
    if (!estado.reglas.jumpIn) return { ok: false, error: 'No es tu turno.' };
    if (estado.desafiarMas4) return { ok: false, error: 'No se puede entrar en un +4.' };
    if ((estado.acumuladoMas || 0) > 0) return { ok: false, error: 'No se puede entrar sobre una pila.' };
    if (!cima || !cartaIdentica(carta, cima)) return { ok: false, error: 'Para entrar así tiene que ser la misma carta.' };
    log(estado, `⚡ ${jugador.nombre} entra con la misma carta.`);
    estado.turnoIndex = estado.jugadores.findIndex((j) => j.id === jugadorId);
  } else {
    if (estado.pendienteColorDe) return { ok: false, error: 'Falta elegir color.' };
    if (estado.acabaDeRobarId && estado.acabaDeRobarId !== jugadorId) {
      return { ok: false, error: 'Espera a que juegue o pase quien robó.' };
    }
    if (!cartaLegal(carta, estado, jugador.cartas)) {
      return { ok: false, error: 'Esa carta no se puede jugar.' };
    }
  }

  const colorElegido = extras?.color;
  if ((carta.tipo === 'comodin' || carta.tipo === 'comodin_mas4') && !colorElegido) {
    return { ok: false, error: 'Elige un color.' };
  }

  if (estado.reglas.sieteCero && carta.tipo === 'numero' && carta.valor === 7 && !extras?.objetivoId) {
    jugador.cartas.splice(idx, 1);
    estado.descarte.push(carta);
    estado.colorActual = carta.color as ColorCarta;
    estado.acabaDeRobarId = undefined;
    estado.pendienteIntercambioDe = jugadorId;
    log(estado, `${jugador.nombre} juega un 7. Elige con quién intercambiar.`);
    if (jugador.cartas.length === 1) avisarUno(estado, jugador);
    marcarTurno(estado);
    return { ok: true };
  }

  jugador.cartas.splice(idx, 1);
  estado.acabaDeRobarId = undefined;
  const jugada: Carta =
    carta.tipo === 'comodin' || carta.tipo === 'comodin_mas4'
      ? { ...carta, color: colorElegido as ColorCarta }
      : carta;
  estado.descarte.push(jugada);
  estado.colorActual = (jugada.color ?? colorElegido) as ColorCarta;
  log(estado, `${jugador.nombre} juega ${nombreCarta(jugada)}.`);

  if (estado.reglas.sieteCero && carta.tipo === 'numero' && carta.valor === 7 && extras?.objetivoId) {
    if (jugador.cartas.length === 1) avisarUno(estado, jugador);
    estado.pendienteIntercambioDe = jugadorId;
    const swap = intercambiarManos(estado, jugadorId, extras.objetivoId);
    estado.actualizadoEn = Date.now();
    return swap;
  }

  if (jugador.cartas.length === 1) avisarUno(estado, jugador);
  else if (jugador.cartas.length !== 0) {
    jugador.dijoUno = false;
    if (estado.unoJugadorId === jugador.id) {
      estado.unoHasta = undefined;
      estado.unoJugadorId = undefined;
    }
  }

  aplicarEfecto(estado, carta, jugador.id);

  if (jugador.cartas.length === 0 && estado.fase === 'jugando') {
    cerrarRonda(estado, jugador);
  }
  estado.actualizadoEn = Date.now();
  return { ok: true };
}

export function robarCarta(
  estado: EstadoPartida,
  jugadorId: string,
): { ok: boolean; error?: string; carta?: Carta } {
  if (estado.fase !== 'jugando') return { ok: false, error: 'La partida no está en curso.' };
  if (estado.desafiarMas4) return { ok: false, error: 'Hay que resolver el +4.' };
  const jugador = estado.jugadores.find((j) => j.id === jugadorId);
  if (!jugador) return { ok: false, error: 'Jugador no encontrado.' };
  if (jugadorActual(estado).id !== jugadorId) return { ok: false, error: 'No es tu turno.' };
  if (estado.acabaDeRobarId === jugadorId) {
    return { ok: false, error: 'Ya tomaste. Juégala o pasa.' };
  }

  if ((estado.acumuladoMas || 0) > 0) {
    const n = estado.acumuladoMas;
    robarN(estado, jugador, n);
    log(estado, `${jugador.nombre} toma la pila (${n}) y pierde el turno.`);
    estado.acumuladoMas = 0;
    estado.tipoPila = undefined;
    avanzarTurno(estado, 1);
    return { ok: true };
  }

  if (estado.reglas.robarHastaJugar) {
    const carta = robarUna(estado, jugador);
    if (!carta) return { ok: false, error: 'No hay cartas para robar.' };
    const puede = cartaLegal(carta, estado, jugador.cartas);
    if (puede) {
      estado.acabaDeRobarId = jugadorId;
      log(estado, `${jugador.nombre} toma una y sí se puede tirar.`);
    } else {
      log(estado, `${jugador.nombre} toma una. No pega: sigue tomando.`);
    }
    estado.actualizadoEn = Date.now();
    return { ok: true, carta };
  }

  const carta = robarUna(estado, jugador);
  if (!carta) return { ok: false, error: 'No hay cartas para robar.' };
  log(estado, `${jugador.nombre} toma una carta.`);
  const puede = cartaLegal(carta, estado, jugador.cartas);
  if (!puede) {
    avanzarTurno(estado, 1);
    log(estado, `${jugador.nombre} no puede jugarla. Pasa.`);
  } else {
    estado.acabaDeRobarId = jugadorId;
    log(estado, `${jugador.nombre} puede jugar la carta tomada o pasar.`);
  }
  estado.actualizadoEn = Date.now();
  return { ok: true, carta };
}

export function pasarTurno(
  estado: EstadoPartida,
  jugadorId: string,
): { ok: boolean; error?: string } {
  if (estado.fase !== 'jugando') return { ok: false, error: 'La partida no está en curso.' };
  if (estado.acabaDeRobarId !== jugadorId) {
    return { ok: false, error: 'Solo puedes pasar después de tomar una carta jugable.' };
  }
  const jugador = estado.jugadores.find((j) => j.id === jugadorId);
  log(estado, `${jugador?.nombre ?? 'Alguien'} pasa.`);
  avanzarTurno(estado, 1);
  return { ok: true };
}

export function decirUno(estado: EstadoPartida, jugadorId: string): { ok: boolean; error?: string } {
  const jugador = estado.jugadores.find((j) => j.id === jugadorId);
  if (!jugador) return { ok: false, error: 'Jugador no encontrado.' };
  if (jugador.cartas.length !== 1) return { ok: false, error: 'Solo se grita Kroma con una carta.' };
  jugador.dijoUno = true;
  estado.unoHasta = undefined;
  estado.unoJugadorId = undefined;
  log(estado, `${jugador.nombre}: ¡Kroma!`);
  estado.actualizadoEn = Date.now();
  return { ok: true };
}

export function acusarUno(
  estado: EstadoPartida,
  acusadorId: string,
  objetivoId: string,
): { ok: boolean; error?: string } {
  if (acusadorId === objetivoId) return { ok: false, error: 'No puedes acusarte a ti mismo.' };
  const objetivo = estado.jugadores.find((j) => j.id === objetivoId);
  const acusador = estado.jugadores.find((j) => j.id === acusadorId);
  if (!objetivo || !acusador) return { ok: false, error: 'Jugador no encontrado.' };
  if (objetivo.cartas.length !== 1) return { ok: false, error: 'Ese jugador no tiene una sola carta.' };
  if (objetivo.dijoUno) return { ok: false, error: `${objetivo.nombre} ya gritó Kroma.` };
  if (estado.unoJugadorId === objetivo.id && estado.unoHasta && Date.now() < estado.unoHasta) {
    return { ok: false, error: 'Todavía está a tiempo de gritar Kroma.' };
  }
  robarN(estado, objetivo, 2);
  objetivo.dijoUno = false;
  estado.unoHasta = undefined;
  estado.unoJugadorId = undefined;
  log(estado, `${acusador.nombre} cachó a ${objetivo.nombre} sin gritar Kroma. Toma 2.`);
  estado.actualizadoEn = Date.now();
  return { ok: true };
}

export function forzarTimeoutTurno(estado: EstadoPartida): void {
  if (estado.fase !== 'jugando') return;
  if (estado.desafiarMas4) {
    resolverMas4(estado, estado.desafiarMas4.jugadorId, false);
    log(estado, 'Se acabó el minuto: se toma el +4.');
    return;
  }
  if (estado.pendienteIntercambioDe) {
    const de = estado.jugadores.find((j) => j.id === estado.pendienteIntercambioDe);
    const otro = estado.jugadores.find((j) => j.id !== de?.id);
    if (de && otro) intercambiarManos(estado, de.id, otro.id);
    return;
  }
  const actual = jugadorActual(estado);
  if (estado.acabaDeRobarId === actual.id) {
    log(estado, `Se acabó el minuto de ${actual.nombre}. Pasa.`);
    pasarTurno(estado, actual.id);
    return;
  }
  log(estado, `Se acabó el minuto de ${actual.nombre}. Toma carta.`);
  let guardas = 0;
  while (guardas++ < 40) {
    const id = jugadorActual(estado).id;
    if (id !== actual.id) break;
    robarCarta(estado, actual.id);
    if (estado.fase !== 'jugando') break;
    if (estado.acabaDeRobarId === actual.id) {
      pasarTurno(estado, actual.id);
      break;
    }
    if (jugadorActual(estado).id !== actual.id) break;
    if (!estado.reglas.robarHastaJugar) break;
  }
}

export function nombreCarta(carta: Carta): string {
  const color = carta.color ? carta.color : 'comodín';
  if (carta.tipo === 'numero') return `${color} ${carta.valor}`;
  const nombres: Record<string, string> = {
    salto: 'salto',
    reverso: 'reverso',
    mas2: '+2',
    comodin: 'comodín',
    comodin_mas4: '+4',
  };
  return `${nombres[carta.tipo]} ${carta.tipo.startsWith('comodin') ? `(${color})` : color}`;
}

export function pinAleatorio(usados: string[]): string {
  let pin = '';
  do {
    pin = String(1000 + Math.floor(Math.random() * 9000));
  } while (usados.includes(pin));
  return pin;
}
