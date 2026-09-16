import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Carta, EstadoPartida, Jugador, REGLAS_DEFAULT } from '../types';
import { cartaIdentica, cartaLegal, jugarCarta, puntosCarta, robarCarta } from './reglas';

function carta(p: Partial<Carta> & Pick<Carta, 'id' | 'tipo'>): Carta {
  return { color: p.color ?? 'rojo', ...p };
}

function jugador(id: string, cartas: Carta[], extra?: Partial<Jugador>): Jugador {
  return {
    id,
    nombre: id,
    esBot: false,
    cartas,
    conectado: true,
    dijoUno: false,
    pin: '1111',
    puntos: 0,
    ...extra,
  };
}

function estado(p: Partial<EstadoPartida> & { jugadores: Jugador[]; descarte: Carta[] }): EstadoPartida {
  return {
    id: 'p',
    codigo: 'ABCD',
    hostId: p.jugadores[0].id,
    mazo: [],
    colorActual: 'rojo',
    sentido: 1,
    turnoIndex: 0,
    fase: 'jugando',
    acumuladoMas: 0,
    turnoHasta: Date.now() + 60_000,
    reglas: { ...REGLAS_DEFAULT },
    chat: [],
    log: [],
    maxJugadores: 8,
    creadoEn: 1,
    actualizadoEn: Date.now(),
    ...p,
  };
}

test('carta legal: mismo color', () => {
  const cima = carta({ id: 'c', tipo: 'numero', valor: 3, color: 'rojo' });
  const mano = [carta({ id: 'a', tipo: 'numero', valor: 9, color: 'rojo' })];
  const e = estado({ jugadores: [jugador('yo', mano)], descarte: [cima] });
  assert.equal(cartaLegal(mano[0], e, mano), true);
});

test('carta legal: mismo número otro color', () => {
  const cima = carta({ id: 'c', tipo: 'numero', valor: 3, color: 'rojo' });
  const mano = [carta({ id: 'a', tipo: 'numero', valor: 3, color: 'azul' })];
  const e = estado({ jugadores: [jugador('yo', mano)], descarte: [cima], colorActual: 'rojo' });
  assert.equal(cartaLegal(mano[0], e, mano), true);
});

test('+4 se puede tirar aunque tengas el color (farol)', () => {
  const cima = carta({ id: 'c', tipo: 'numero', valor: 3, color: 'rojo' });
  const mano = [
    carta({ id: 'a', tipo: 'numero', valor: 9, color: 'rojo' }),
    carta({ id: 'w', tipo: 'comodin_mas4', color: null }),
  ];
  const e = estado({ jugadores: [jugador('yo', mano)], descarte: [cima], colorActual: 'rojo' });
  assert.equal(cartaLegal(mano[1], e, mano), true);
});

test('comodín se puede tirar aunque tengas el color', () => {
  const cima = carta({ id: 'c', tipo: 'numero', valor: 3, color: 'rojo' });
  const mano = [
    carta({ id: 'a', tipo: 'numero', valor: 9, color: 'rojo' }),
    carta({ id: 'w', tipo: 'comodin', color: null }),
  ];
  const e = estado({ jugadores: [jugador('yo', mano)], descarte: [cima], colorActual: 'rojo' });
  assert.equal(cartaLegal(mano[1], e, mano), true);
});

test('+4 legal si no tienes el color', () => {
  const cima = carta({ id: 'c', tipo: 'numero', valor: 3, color: 'rojo' });
  const mano = [
    carta({ id: 'a', tipo: 'numero', valor: 9, color: 'azul' }),
    carta({ id: 'w', tipo: 'comodin_mas4', color: null }),
  ];
  const e = estado({ jugadores: [jugador('yo', mano)], descarte: [cima], colorActual: 'rojo' });
  assert.equal(cartaLegal(mano[1], e, mano), true);
});

test('pila +2 acepta +2 o +4', () => {
  const cima = carta({ id: 'c', tipo: 'mas2', color: 'rojo' });
  const mas2 = carta({ id: 'a', tipo: 'mas2', color: 'azul' });
  const mas4 = carta({ id: 'w', tipo: 'comodin_mas4', color: null });
  const num = carta({ id: 'b', tipo: 'numero', valor: 4, color: 'rojo' });
  const e = estado({
    jugadores: [jugador('yo', [mas2, mas4, num])],
    descarte: [cima],
    acumuladoMas: 2,
    tipoPila: 'mas2',
    reglas: { ...REGLAS_DEFAULT, apilarMas: true },
  });
  assert.equal(cartaLegal(mas2, e, [mas2, mas4, num]), true);
  assert.equal(cartaLegal(mas4, e, [mas2, mas4, num]), true);
  assert.equal(cartaLegal(num, e, [mas2, mas4, num]), false);
});

test('pila +4 acepta +2 o +4', () => {
  const cima = carta({ id: 'c', tipo: 'comodin_mas4', color: 'verde' });
  const mas2 = carta({ id: 'a', tipo: 'mas2', color: 'azul' });
  const mas4 = carta({ id: 'w', tipo: 'comodin_mas4', color: null });
  const e = estado({
    jugadores: [jugador('yo', [mas2, mas4])],
    descarte: [cima],
    acumuladoMas: 4,
    tipoPila: 'comodin_mas4',
    reglas: { ...REGLAS_DEFAULT, apilarMas: true },
  });
  assert.equal(cartaLegal(mas2, e, [mas2, mas4]), true);
  assert.equal(cartaLegal(mas4, e, [mas2, mas4]), true);
});

test('jump-in: carta idéntica', () => {
  const a = carta({ id: 'a', tipo: 'numero', valor: 7, color: 'verde' });
  const b = carta({ id: 'b', tipo: 'numero', valor: 7, color: 'verde' });
  assert.equal(cartaIdentica(a, b), true);
  assert.equal(cartaIdentica(carta({ id: 'c', tipo: 'numero', valor: 7, color: 'rojo' }), b), false);
});

test('jugar carta avanza y deja el descarte', () => {
  const cima = carta({ id: 'c', tipo: 'numero', valor: 2, color: 'rojo' });
  const mano1 = [
    carta({ id: 'a', tipo: 'numero', valor: 5, color: 'rojo' }),
    carta({ id: 'x', tipo: 'numero', valor: 1, color: 'azul' }),
  ];
  const mano2 = [carta({ id: 'b', tipo: 'numero', valor: 8, color: 'azul' })];
  const e = estado({
    jugadores: [jugador('yo', mano1), jugador('otro', mano2)],
    descarte: [cima],
    turnoIndex: 0,
  });
  const r = jugarCarta(e, 'yo', 'a');
  assert.equal(r.ok, true);
  assert.equal(e.descarte[e.descarte.length - 1].id, 'a');
  assert.equal(e.turnoIndex, 1);
});

test('robar hasta poder: una por una y sigues si no pega', () => {
  const cima = carta({ id: 'c', tipo: 'numero', valor: 2, color: 'rojo' });
  const mano = [carta({ id: 'x', tipo: 'numero', valor: 9, color: 'azul' })];
  const noPega = carta({ id: 'n', tipo: 'numero', valor: 4, color: 'verde' });
  const siPega = carta({ id: 's', tipo: 'numero', valor: 2, color: 'amarillo' });
  const e = estado({
    jugadores: [jugador('yo', mano), jugador('otro', [carta({ id: 'o', tipo: 'numero', valor: 1, color: 'azul' })])],
    descarte: [cima],
    colorActual: 'rojo',
    mazo: [noPega, siPega],
    turnoIndex: 0,
    reglas: { ...REGLAS_DEFAULT, robarHastaJugar: true },
  });
  const a = robarCarta(e, 'yo');
  assert.equal(a.ok, true);
  assert.equal(e.jugadores[0].cartas.length, 2);
  assert.equal(e.turnoIndex, 0);
  assert.equal(e.acabaDeRobarId, undefined);
  const b = robarCarta(e, 'yo');
  assert.equal(b.ok, true);
  assert.equal(e.jugadores[0].cartas.length, 3);
  assert.equal(e.acabaDeRobarId, 'yo');
});

test('después de tomar una jugable no puedes tomar otra', () => {
  const cima = carta({ id: 'c', tipo: 'numero', valor: 2, color: 'rojo' });
  const mano = [carta({ id: 'x', tipo: 'numero', valor: 9, color: 'azul' })];
  const tomada = carta({ id: 'r', tipo: 'numero', valor: 2, color: 'verde' });
  const e = estado({
    jugadores: [jugador('yo', mano), jugador('otro', [carta({ id: 'o', tipo: 'numero', valor: 1, color: 'azul' })])],
    descarte: [cima],
    colorActual: 'rojo',
    mazo: [tomada],
    turnoIndex: 0,
  });
  const a = robarCarta(e, 'yo');
  assert.equal(a.ok, true);
  assert.equal(e.jugadores[0].cartas.length, 2);
  const b = robarCarta(e, 'yo');
  assert.equal(b.ok, false);
  assert.equal(e.jugadores[0].cartas.length, 2);
});

test('puntos de cartas', () => {
  assert.equal(puntosCarta(carta({ id: '1', tipo: 'numero', valor: 7, color: 'rojo' })), 7);
  assert.equal(puntosCarta(carta({ id: '2', tipo: 'salto', color: 'azul' })), 20);
  assert.equal(puntosCarta(carta({ id: '3', tipo: 'comodin_mas4', color: null })), 50);
});
