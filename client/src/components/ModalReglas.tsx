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
          <h2>Reglas de esta partida</h2>
          <button type="button" className="btn mini" onClick={onCerrar}>
            Cerrar
          </button>
        </header>
        <div className="reglas-cuerpo">
          <h3>Oficiales</h3>
          <ul>
            <li>Mazo de 108 cartas. Se reparte 7 a cada uno.</li>
            <li>Hay que coincidir en color o número (o jugar un comodín).</li>
            <li>Salto, reverso y +2 hacen lo que dice la carta. En 2 jugadores el reverso es un salto.</li>
            <li>El +4 solo si no tenés el color actual. El siguiente puede desafiar: si era trampa, el que lo tiró toma 4; si era legal, el que desafió toma 6.</li>
            <li>Al quedarte con una carta tenés que decir <strong>Uno</strong> (8 segundos). Si te pillan después, tomás 2.</li>
            <li>Cada turno dura <strong>1 minuto</strong>. Si se acaba, tomás y pasás.</li>
            <li>Al vaciar la mano sumás los puntos de las cartas ajenas (números = valor, especiales 20, comodines 50). Gana la partida quien llega a <strong>{PUNTOS_META}</strong>.</li>
          </ul>
          <h3>De esta sala</h3>
          {reglas ? (
            <ul>
              {REGLAS_LABEL.map((r) => (
                <li key={r.key}>
                  <strong>{r.titulo}:</strong> {reglas[r.key] ? 'sí. ' : 'no. '}
                  {r.texto}
                </li>
              ))}
            </ul>
          ) : (
            <p>El anfitrión las elige en el lobby.</p>
          )}
        </div>
      </div>
    </div>
  );
}
