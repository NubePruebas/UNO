import type { Carta, ColorCarta } from '../types';
import { LETRA_COLOR } from '../juego/legal';
import { haptico } from '../juego/sonidos';

const NOMBRE_COLOR: Record<string, string> = {
  rojo: 'Rojo',
  amarillo: 'Amarillo',
  verde: 'Verde',
  azul: 'Azul',
};

export function textoCarta(carta: Carta): string {
  if (carta.tipo === 'numero') return String(carta.valor);
  if (carta.tipo === 'salto') return '⊘';
  if (carta.tipo === 'reverso') return '⇄';
  if (carta.tipo === 'mas2') return '+2';
  if (carta.tipo === 'comodin') return '★';
  return '+4';
}

export function CartaVista({
  carta,
  grande,
  mini,
  dorso,
  etiquetaDorso,
  jugable,
  daltonico,
  apilada,
  onClick,
}: {
  carta?: Carta;
  grande?: boolean;
  mini?: boolean;
  dorso?: boolean;
  etiquetaDorso?: string;
  jugable?: boolean;
  daltonico?: boolean;
  apilada?: boolean;
  onClick?: () => void;
}) {
  function click() {
    if (!onClick) return;
    haptico(12);
    onClick();
  }

  if (dorso || !carta) {
    return (
      <button
        type="button"
        className={`carta dorso ${grande ? 'grande' : ''} ${mini ? 'mini' : ''}`}
        onClick={onClick ? click : undefined}
      >
        <span className="dorso-ovalo">
          <span>{etiquetaDorso ?? 'KROMA'}</span>
        </span>
      </button>
    );
  }

  const color = carta.color ?? 'negro';
  const texto = textoCarta(carta);
  const letra = carta.color && daltonico ? LETRA_COLOR[carta.color] : '';
  const titulo =
    carta.tipo === 'numero'
      ? `${NOMBRE_COLOR[color] ?? ''} ${carta.valor}`
      : `${NOMBRE_COLOR[color] ?? 'Comodín'} ${texto}`;

  return (
    <button
      type="button"
      className={`carta ${color} ${grande ? 'grande' : ''} ${mini ? 'mini' : ''} ${jugable ? 'jugable' : ''} ${daltonico ? 'daltonico' : ''} ${apilada ? 'apilada' : ''}`}
      onClick={onClick ? click : undefined}
      disabled={!onClick}
      title={titulo}
    >
      {letra && <span className="carta-letra">{letra}</span>}
      <span className="carta-esquina">{texto}</span>
      <span className="carta-centro">
        <span className="carta-ovalo">{texto}</span>
      </span>
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
