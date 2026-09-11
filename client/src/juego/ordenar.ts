import type { Carta } from '../types';

const COLOR_ORD: Record<string, number> = { rojo: 0, amarillo: 1, verde: 2, azul: 3 };
const TIPO_ORD: Record<string, number> = {
  numero: 0,
  salto: 1,
  reverso: 2,
  mas2: 3,
  comodin: 4,
  comodin_mas4: 5,
};

export function ordenarMano(cartas: Carta[]): Carta[] {
  return [...cartas].sort((a, b) => {
    const ca = a.color ? COLOR_ORD[a.color] : 9;
    const cb = b.color ? COLOR_ORD[b.color] : 9;
    if (ca !== cb) return ca - cb;
    const ta = TIPO_ORD[a.tipo] ?? 9;
    const tb = TIPO_ORD[b.tipo] ?? 9;
    if (ta !== tb) return ta - tb;
    return (a.valor ?? 0) - (b.valor ?? 0);
  });
}

export function abanico(i: number, n: number, compacto = false): { rot: number; y: number } {
  if (n <= 1) return { rot: 0, y: 0 };
  const t = i / (n - 1) - 0.5;
  const rotMax = compacto ? Math.min(12, 3 + n * 0.9) : Math.min(28, 8 + n * 2);
  const yMax = compacto ? Math.min(6, 2 + n * 0.3) : Math.min(18, 5 + n * 0.7);
  return {
    rot: t * rotMax,
    y: Math.abs(t) * yMax,
  };
}

/** Solape y escala para ver cada carta, sin scroll. */
export function layoutMano(
  n: number,
  ancho: number,
  cartaW: number,
  compacto = false,
): { solape: number; escala: number } {
  if (n <= 1) return { solape: 0, escala: 1 };
  if (ancho < 80) return { solape: Math.round(cartaW * 0.25), escala: 1 };
  const visibleMin = Math.round(cartaW * (compacto ? 0.42 : 0.5));
  const solapeIdeal = Math.round(cartaW * (compacto ? 0.28 : 0.2));
  const maxSolape = cartaW - visibleMin;
  const margen = compacto ? 40 : 24;
  const disponible = Math.max(cartaW, ancho - margen);
  const anchoIdeal = cartaW + (n - 1) * (cartaW - solapeIdeal);
  if (anchoIdeal <= disponible) {
    return { solape: solapeIdeal, escala: 1 };
  }
  const solape = cartaW - (disponible - cartaW) / (n - 1);
  if (solape <= maxSolape) {
    return { solape, escala: 1 };
  }
  const anchoMin = cartaW + (n - 1) * visibleMin;
  return { solape: maxSolape, escala: Math.min(1, disponible / anchoMin) };
}

export function asientosRivales(n: number, compacto = false): { left: string; top: string }[] {
  const rx = compacto ? (n >= 3 ? 32 : 34) : 44;
  const ry = compacto ? (n >= 3 ? 24 : 26) : 36;
  const cy = compacto ? 38 : 46;
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / (n + 1);
    const a = Math.PI + t * Math.PI;
    return {
      left: `${50 + rx * Math.cos(a)}%`,
      top: `${cy + ry * Math.sin(a)}%`,
    };
  });
}
