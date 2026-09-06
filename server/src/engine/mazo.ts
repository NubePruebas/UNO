import { v4 as uuid } from 'uuid';
import { Carta, ColorCarta, COLORES } from '../types';

export function crearMazo(): Carta[] {
  const cartas: Carta[] = [];

  for (const color of COLORES) {
    cartas.push(carta(color, 'numero', 0));
    for (let n = 1; n <= 9; n++) {
      cartas.push(carta(color, 'numero', n));
      cartas.push(carta(color, 'numero', n));
    }
    for (let i = 0; i < 2; i++) {
      cartas.push(carta(color, 'salto'));
      cartas.push(carta(color, 'reverso'));
      cartas.push(carta(color, 'mas2'));
    }
  }

  for (let i = 0; i < 4; i++) {
    cartas.push(carta(null, 'comodin'));
    cartas.push(carta(null, 'comodin_mas4'));
  }

  return barajar(cartas);
}

function carta(color: ColorCarta | null, tipo: Carta['tipo'], valor?: number): Carta {
  return { id: uuid(), color, tipo, valor };
}

export function barajar(cartas: Carta[]): Carta[] {
  const copia = [...cartas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function reponerMazo(mazo: Carta[], descarte: Carta[]): { mazo: Carta[]; descarte: Carta[] } {
  if (mazo.length > 0) return { mazo, descarte };
  if (descarte.length <= 1) return { mazo, descarte };
  const cima = descarte[descarte.length - 1];
  const resto = barajar(descarte.slice(0, -1).map((c) =>
    c.tipo === 'comodin' || c.tipo === 'comodin_mas4' ? { ...c, color: null } : c,
  ));
  return { mazo: resto, descarte: [cima] };
}
