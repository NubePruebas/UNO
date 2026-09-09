export type PartidaHist = {
  cuando: number;
  campeon: string;
  puntos: number;
  rivales: string[];
};

const KEY = 'kroma.historial';

export function leerHistorial(): PartidaHist[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PartidaHist[]) : [];
  } catch {
    return [];
  }
}

export function guardarHistorial(entrada: PartidaHist): void {
  const prev = leerHistorial().filter((h) => h.cuando !== entrada.cuando);
  localStorage.setItem(KEY, JSON.stringify([entrada, ...prev].slice(0, 8)));
}
