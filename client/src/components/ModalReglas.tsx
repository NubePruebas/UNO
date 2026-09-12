import { PUNTOS_META, REGLAS_LABEL, type ReglasCasa } from '../types';

export function ModalReglas({
  reglas,
  onCerrar,
}: {
  reglas?: ReglasCasa;
  onCerrar: () => void;
}) {
  return (
    <div className="modal" role="dialog" aria-label="Reglas">
      <div className="tarjeta reglas-modal">
        <header className="modal-cab">
          <h2>Cómo se juega</h2>
          <button type="button" className="btn mini" onClick={onCerrar}>
            Cerrar
          </button>
        </header>
        <div className="reglas-cuerpo">
          <ul className="reglas-oficiales">
            <li>108 cartas, 7 a cada uno.</li>
            <li>Salto, reverso y +2 hacen lo que dice la carta. En 2 jugadores el reverso es un salto.</li>
            <li>
              Coincide color, número o el mismo especial (salto, reverso, +2). El comodín y el +4 siempre se pueden
              tirar: tú eliges. Si tiras +4 y sí tenías el color, te pueden desafiar.
            </li>
            <li>
              Una carta: grita <strong>Kroma</strong> (8 s). Turno de 1 min. Gana quien llega a {PUNTOS_META} pts.
            </li>
          </ul>
          <h3>De esta partida</h3>
          {reglas ? (
            <ul className="reglas-casa-lista">
              {REGLAS_LABEL.map((r) => (
                <li key={r.key}>
                  <strong>{r.titulo}:</strong> {reglas[r.key] ? 'sí' : 'no'}
                </li>
              ))}
            </ul>
          ) : (
            <p>Las eliges en partida rápida o el anfitrión en la sala.</p>
          )}
        </div>
      </div>
    </div>
  );
}
