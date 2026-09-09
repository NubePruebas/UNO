import { Carta, ColorCarta, COLORES, EstadoPartida, Jugador, NivelBot } from '../types';
import {
  cartaLegal,
  intercambiarManos,
  legalesDe,
  jugarCarta,
  resolverMas4,
  robarCarta,
} from './reglas';

const NOMBRES_BOT: Record<NivelBot, string[]> = {
  facil: ['Pepe Bot', 'Lucho Bot', 'Nico Bot'],
  medio: ['Marta Bot', 'Rulo Bot', 'Vero Bot'],
  dificil: ['Doña Rosa', 'El Profe', 'La Jefa'],
};

export function nombreBot(nivel: NivelBot, usados: string[]): string {
  const base = NOMBRES_BOT[nivel];
  for (const n of base) {
    if (!usados.includes(n)) return n;
  }
  let i = 2;
  while (usados.includes(`${base[0]} ${i}`)) i++;
  return `${base[0]} ${i}`;
}

function coloresDescartados(estado: EstadoPartida): Record<ColorCarta, number> {
  const c: Record<ColorCarta, number> = { rojo: 0, amarillo: 0, verde: 0, azul: 0 };
  for (const carta of estado.descarte) {
    if (carta.color) c[carta.color]++;
  }
  return c;
}

function colorMasFrecuente(jugador: Jugador): ColorCarta {
  const conteo: Record<ColorCarta, number> = { rojo: 0, amarillo: 0, verde: 0, azul: 0 };
  for (const c of jugador.cartas) {
    if (c.color) conteo[c.color]++;
  }
  return COLORES.slice().sort((a, b) => conteo[b] - conteo[a])[0];
}

export function delayPensar(nivel: NivelBot | undefined): number {
  const n = nivel ?? 'facil';
  if (n === 'facil') return 700 + Math.floor(Math.random() * 700);
  if (n === 'medio') return 1000 + Math.floor(Math.random() * 800);
  return 1300 + Math.floor(Math.random() * 900);
}

function coloresRestantes(estado: EstadoPartida, jugador: Jugador): Record<ColorCarta, number> {
  const total: Record<ColorCarta, number> = { rojo: 25, amarillo: 25, verde: 25, azul: 25 };
  for (const carta of [...estado.descarte, ...jugador.cartas]) {
    if (carta.color) total[carta.color]--;
  }
  return total;
}

function colorInteligente(jugador: Jugador, estado: EstadoPartida): ColorCarta {
  const mio = colorMasFrecuente(jugador);
  const desc = coloresDescartados(estado);
  const porMano: Record<ColorCarta, number> = { rojo: 0, amarillo: 0, verde: 0, azul: 0 };
  for (const c of jugador.cartas) {
    if (c.color) porMano[c.color]++;
  }
  if (jugador.nivelBot === 'dificil') {
    const rest = coloresRestantes(estado, jugador);
    return COLORES.slice().sort((a, b) => porMano[b] - porMano[a] || rest[b] - rest[a] || desc[a] - desc[b])[0] ?? mio;
  }
  return COLORES.slice().sort((a, b) => porMano[b] - porMano[a] || desc[a] - desc[b])[0] ?? mio;
}

function rivalSiguiente(estado: EstadoPartida): Jugador | undefined {
  const n = estado.jugadores.length;
  const i = (estado.turnoIndex + estado.sentido + n) % n;
  return estado.jugadores[i];
}

export function elegirJugadaBot(estado: EstadoPartida, jugador: Jugador): {
  carta: Carta;
  color?: ColorCarta;
  objetivoId?: string;
} | null {
  const legales = legalesDe(jugador, estado);
  if (legales.length === 0) return null;
  const nivel = jugador.nivelBot ?? 'facil';
  const color = nivel === 'facil' ? COLORES[Math.floor(Math.random() * 4)] : colorInteligente(jugador, estado);

  if (nivel === 'facil') {
    const carta = legales[Math.floor(Math.random() * legales.length)];
    return { carta, color, objetivoId: objetivo7(estado, jugador, carta) };
  }

  const siguiente = rivalSiguiente(estado);
  const rivalConPocas = (siguiente?.cartas.length ?? 99) <= 2;

  if (nivel === 'medio') {
    const especiales = legales.filter((c) => c.tipo !== 'numero' && c.tipo !== 'comodin' && c.tipo !== 'comodin_mas4');
    const numeros = legales.filter((c) => c.tipo === 'numero');
    const comodines = legales.filter((c) => c.tipo === 'comodin' || c.tipo === 'comodin_mas4');
    let carta: Carta;
    if (rivalConPocas && especiales.length) carta = especiales[0];
    else if (numeros.length) carta = numeros.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0))[0];
    else if (especiales.length) carta = especiales[0];
    else carta = comodines[0];
    return { carta, color, objetivoId: objetivo7(estado, jugador, carta) };
  }

  const mas4 = legales.filter((c) => c.tipo === 'comodin_mas4');
  const saltos = legales.filter((c) => c.tipo === 'salto' || c.tipo === 'mas2' || c.tipo === 'reverso');
  const delColor = legales.filter(
    (c) => c.color === estado.colorActual && c.tipo !== 'comodin' && c.tipo !== 'comodin_mas4',
  );
  const otros = legales.filter((c) => c.tipo === 'numero' && c.color !== estado.colorActual);
  const rest = coloresRestantes(estado, jugador);
  const wildsRestantes =
    8 -
    [...estado.descarte, ...jugador.cartas].filter((c) => c.tipo === 'comodin' || c.tipo === 'comodin_mas4').length;

  if (rivalConPocas && (saltos.length || mas4.length)) {
    const carta = saltos[0] ?? mas4[0];
    return { carta, color, objetivoId: objetivo7(estado, jugador, carta) };
  }
  if (delColor.length) {
    const especialesColor = delColor.filter((c) => c.tipo !== 'numero');
    const carta = especialesColor[0] ?? delColor.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0))[0];
    return { carta, color, objetivoId: objetivo7(estado, jugador, carta) };
  }
  if (otros.length) {
    const mejor = [...otros].sort((a, b) => (rest[b.color as ColorCarta] ?? 0) - (rest[a.color as ColorCarta] ?? 0))[0];
    return { carta: mejor, color, objetivoId: objetivo7(estado, jugador, mejor) };
  }
  const comodin = legales.find((c) => c.tipo === 'comodin');
  if (comodin && (wildsRestantes > 2 || !mas4.length)) return { carta: comodin, color };
  if (mas4.length) return { carta: mas4[0], color };
  return { carta: legales[0], color, objetivoId: objetivo7(estado, jugador, legales[0]) };
}

function objetivo7(estado: EstadoPartida, jugador: Jugador, carta: Carta): string | undefined {
  if (!estado.reglas.sieteCero || carta.tipo !== 'numero' || carta.valor !== 7) return undefined;
  const otros = estado.jugadores.filter((j) => j.id !== jugador.id);
  if (!otros.length) return undefined;
  const peor = [...otros].sort((a, b) => a.cartas.length - b.cartas.length)[0];
  const mejor = [...otros].sort((a, b) => b.cartas.length - a.cartas.length)[0];
  return jugador.cartas.length > 4 ? peor.id : mejor.id;
}

function juegaComoBot(jugador: Jugador): boolean {
  return jugador.esBot || !jugador.conectado;
}

export function ejecutarTurnoBot(estado: EstadoPartida): boolean {
  if (estado.fase !== 'jugando') return false;

  if (estado.pendienteIntercambioDe) {
    const de = estado.jugadores.find((j) => j.id === estado.pendienteIntercambioDe);
    if (!de || !juegaComoBot(de)) return false;
    const objetivo = objetivo7(estado, de, { id: '', color: 'rojo', tipo: 'numero', valor: 7 });
    if (objetivo) intercambiarManos(estado, de.id, objetivo);
    return true;
  }

  if (estado.desafiarMas4) {
    const victima = estado.jugadores.find((j) => j.id === estado.desafiarMas4?.jugadorId);
    if (!victima || !juegaComoBot(victima)) return false;
    if (estado.reglas.apilarMas) {
      const plus = victima.cartas.find((c) => c.tipo === 'comodin_mas4');
      if (plus && (victima.nivelBot === 'dificil' || Math.random() < 0.4)) {
        jugarCarta(estado, victima.id, plus.id, { color: colorInteligente(victima, estado) });
        return true;
      }
    }
    const desafiar = victima.esBot && victima.nivelBot === 'dificil' && Math.random() < 0.4;
    resolverMas4(estado, victima.id, desafiar);
    return true;
  }

  const jugador = estado.jugadores[estado.turnoIndex];
  if (!jugador || !juegaComoBot(jugador)) return false;

  if ((estado.acumuladoMas || 0) > 0) {
    const pila = jugador.cartas.find((c) => c.tipo === estado.tipoPila);
    if (pila && (jugador.nivelBot !== 'facil' || Math.random() < 0.55)) {
      const color = pila.tipo === 'comodin_mas4' ? colorInteligente(jugador, estado) : undefined;
      jugarCarta(estado, jugador.id, pila.id, { color });
      return true;
    }
    robarCarta(estado, jugador.id);
    return true;
  }

  if (estado.acabaDeRobarId === jugador.id) {
    const ultima = jugador.cartas[jugador.cartas.length - 1];
    if (ultima && cartaLegal(ultima, estado, jugador.cartas)) {
      const color =
        ultima.tipo === 'comodin' || ultima.tipo === 'comodin_mas4'
          ? colorInteligente(jugador, estado)
          : undefined;
      jugarCarta(estado, jugador.id, ultima.id, { color, objetivoId: objetivo7(estado, jugador, ultima) });
      return true;
    }
  }

  const jugada = elegirJugadaBot(estado, jugador);
  if (jugada) {
    const color =
      jugada.carta.tipo === 'comodin' || jugada.carta.tipo === 'comodin_mas4' ? jugada.color : undefined;
    const r = jugarCarta(estado, jugador.id, jugada.carta.id, { color, objetivoId: jugada.objetivoId });
    if (!r.ok && legalesDe(jugador, estado).length === 0) {
      robarYTalVezJugar(estado, jugador);
    }
    return true;
  }

  robarYTalVezJugar(estado, jugador);
  return true;
}

function robarYTalVezJugar(estado: EstadoPartida, jugador: Jugador): void {
  const antes = new Set(jugador.cartas.map((c) => c.id));
  const r = robarCarta(estado, jugador.id);
  if (!r.ok) return;
  if (estado.jugadores[estado.turnoIndex]?.id !== jugador.id) return;
  const robada = jugador.cartas.find((c) => !antes.has(c.id));
  if (!robada) return;
  if (cartaLegal(robada, estado, jugador.cartas)) {
    const color =
      robada.tipo === 'comodin' || robada.tipo === 'comodin_mas4'
        ? colorInteligente(jugador, estado)
        : undefined;
    jugarCarta(estado, jugador.id, robada.id, { color, objetivoId: objetivo7(estado, jugador, robada) });
  }
}
