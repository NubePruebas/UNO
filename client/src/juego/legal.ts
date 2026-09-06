import type { Carta, ColorCarta, EstadoPublico } from '../types';

export function cartaLegal(carta: Carta, estado: EstadoPublico): boolean {
  if ((estado.acumuladoMas ?? 0) > 0 && estado.tipoPila) {
    return carta.tipo === estado.tipoPila;
  }
  const cima = estado.cima;
  if (!cima || !estado.colorActual) return false;
  const colorActual = estado.colorActual;
  const mano = estado.tuMano;
  if (carta.tipo === 'comodin') return true;
  if (carta.tipo === 'comodin_mas4') {
    return !mano.some((c) => c.id !== carta.id && c.color === colorActual);
  }
  if (carta.color === colorActual) return true;
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

export const LETRA_COLOR: Record<ColorCarta, string> = {
  rojo: 'R',
  amarillo: 'A',
  verde: 'V',
  azul: 'Z',
};
