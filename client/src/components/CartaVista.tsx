import type { Carta, ColorCarta } from '../types';
import { LETRA_COLOR } from '../juego/legal';

const NOMBRE_COLOR: Record<string, string> = {
  rojo: 'Rojo',
  amarillo: 'Amarillo',
  verde: 'Verde',
  azul: 'Azul',
};

export function CartaVista({
  carta,
  grande,
  dorso,
  etiquetaDorso,
  jugable,
  daltonico,
  onClick,
}: {
  carta?: Carta;
  grande?: boolean;
  dorso?: boolean;
  etiquetaDorso?: string;
  jugable?: boolean;
  daltonico?: boolean;
  onClick?: () => void;
}) {
  if (dorso || !carta) {
    return (
      <button type="button" className={`carta dorso ${grande ? 'grande' : ''}`} onClick={onClick}>
        <span>{etiquetaDorso ?? 'MAZO'}</span>
      </button>
    );
  }

  const color = carta.color ?? 'negro';
  const texto =
    carta.tipo === 'numero'
      ? String(carta.valor)
      : carta.tipo === 'salto'
        ? '⊘'
        : carta.tipo === 'reverso'
          ? '⇄'
          : carta.tipo === 'mas2'
            ? '+2'
            : carta.tipo === 'comodin'
              ? '★'
              : '+4';
  const letra = carta.color && daltonico ? LETRA_COLOR[carta.color] : '';

  return (
    <button
      type="button"
      className={`carta ${color} ${grande ? 'grande' : ''} ${jugable ? 'jugable' : ''} ${daltonico ? 'daltonico' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      title={carta.tipo === 'numero' ? `${NOMBRE_COLOR[color] ?? ''} ${carta.valor}` : texto}
    >
      {letra && <span className="carta-letra">{letra}</span>}
      <span className="carta-esquina">{texto}</span>
      <span className="carta-centro">{texto}</span>
      <span className="carta-esquina inf">{texto}</span>
    </button>
  );
}

export function ChipColor({ color, onClick }: { color: ColorCarta; onClick: () => void }) {
  return (
    <button type="button" className={`chip-color ${color}`} onClick={onClick} aria-label={color}>
      {LETRA_COLOR[color]}
    </button>
  );
}
