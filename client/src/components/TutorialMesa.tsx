import { useState } from 'react';

const KEY = 'kroma.tutorial';

const PASOS = [
  {
    titulo: 'Tu mano',
    texto: 'Abajo están tus cartas, en abanico y ordenadas por color. Las que puedes jugar se levantan solas.',
  },
  {
    titulo: 'La mesa',
    texto: 'El descarte está en el centro. El anillo es el color actual. El reloj vive en quien tiene el turno.',
  },
  {
    titulo: '¡KROMA!',
    texto: 'Cuando te quede una carta, toca el botón amarillo grande. Si no, otro te puede cachar.',
  },
];

export function tutorialPendiente(): boolean {
  return localStorage.getItem(KEY) !== '1';
}

export function TutorialMesa({ onCerrar }: { onCerrar: () => void }) {
  const [paso, setPaso] = useState(0);
  const actual = PASOS[paso];

  function listo() {
    localStorage.setItem(KEY, '1');
    onCerrar();
  }

  return (
    <div className="tutorial-capa" role="dialog" aria-label="Cómo se juega en la mesa">
      <div className="tarjeta tutorial-tarjeta">
        <p className="tutorial-paso">
          {paso + 1} / {PASOS.length}
        </p>
        <h2>{actual.titulo}</h2>
        <p>{actual.texto}</p>
        <div className="fila-bots">
          {paso < PASOS.length - 1 ? (
            <button type="button" className="btn primario" onClick={() => setPaso(paso + 1)}>
              Siguiente
            </button>
          ) : (
            <button type="button" className="btn primario" onClick={listo}>
              A jugar
            </button>
          )}
          <button type="button" className="btn ghost" onClick={listo}>
            Saltar
          </button>
        </div>
      </div>
    </div>
  );
}
