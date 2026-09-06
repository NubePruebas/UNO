import { useState } from 'react';
import { ChatPanel } from '../components/ChatPanel';
import { ModalReglas } from '../components/ModalReglas';
import { QrSala } from '../components/QrSala';
import { api } from '../socket';
import { PUNTOS_META, REGLAS_LABEL, type EstadoPublico, type NivelBot, type ReglasCasa } from '../types';

const NIVELES: { id: NivelBot; etiqueta: string }[] = [
  { id: 'facil', etiqueta: 'Fácil' },
  { id: 'medio', etiqueta: 'Medio' },
  { id: 'dificil', etiqueta: 'Difícil' },
];

export function Lobby({
  estado,
  ip,
  onError,
  onSalir,
}: {
  estado: EstadoPublico;
  ip: string | null;
  onError: (m: string) => void;
  onSalir: () => void;
}) {
  const soyHost = estado.hostId === estado.tuId;
  const [nivel, setNivel] = useState<NivelBot>('medio');
  const [reglas, setReglas] = useState(false);
  const [copiado, setCopiado] = useState('');
  const puerto = window.location.port || '5174';
  const url = ip ? `http://${ip}:${puerto}` : window.location.origin;

  async function copiar(texto: string, etiqueta: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(etiqueta);
      setTimeout(() => setCopiado(''), 1500);
    } catch {
      onError('No se pudo copiar.');
    }
  }

  async function toggle(key: keyof ReglasCasa) {
    const r = await api.actualizarReglas({ [key]: !estado.reglas[key] });
    if (!r.ok) onError(r.error ?? 'No se pudieron cambiar las reglas.');
  }

  return (
    <div className="pantalla lobby amplia">
      <header className="barra">
        <h1>Sala {estado.codigo}</h1>
        <div className="fila-bots">
          <button type="button" className="btn ghost" onClick={() => setReglas(true)}>
            Reglas
          </button>
          <button type="button" className="btn mini" onClick={() => void api.salirSala().then(onSalir)}>
            Salir
          </button>
        </div>
      </header>

      <div className="lobby-grid">
        <div className="tarjeta">
          <p className="hint">
            Misma red: <strong>{url}</strong> · código <strong>{estado.codigo}</strong>
          </p>
          <div className="qr-bloque">
            <QrSala url={`${url}?sala=${estado.codigo}`} />
            <div className="qr-acciones">
              <button type="button" className="btn mini" onClick={() => void copiar(estado.codigo, 'código')}>
                Copiar código
              </button>
              <button type="button" className="btn mini" onClick={() => void copiar(url, 'link')}>
                Copiar link
              </button>
              <p className="pin-box">
                Tu PIN: <strong>{estado.tuPin}</strong>
                <button type="button" className="btn mini" onClick={() => void copiar(estado.tuPin, 'PIN')}>
                  Copiar PIN
                </button>
              </p>
              {copiado && <p className="ok-copia">Copié el {copiado}</p>}
            </div>
          </div>

          <ul className="lista-jugadores">
            {estado.jugadores.map((j) => (
              <li key={j.id} className={j.conectado ? '' : 'off'}>
                <span>
                  {j.nombre}
                  {j.id === estado.hostId ? ' · anfitrión' : ''}
                  {j.esBot ? ` · bot ${j.nivelBot}` : ''}
                  {!j.esBot && !j.conectado ? ' · desconectado' : ''}
                  {j.pin ? ` · PIN ${j.pin}` : ''}
                  <em className="pts"> {j.puntos} pts</em>
                </span>
                {soyHost && j.id !== estado.tuId && (
                  <button
                    type="button"
                    className="btn mini"
                    onClick={() => void (j.esBot ? api.quitarBot(j.id) : api.echarJugador(j.id))}
                  >
                    Quitar
                  </button>
                )}
              </li>
            ))}
          </ul>

          {soyHost ? (
            <>
              <h3 className="subtit">Reglas de casa</h3>
              <div className="toggles">
                {REGLAS_LABEL.map((r) => (
                  <label key={r.key} className={`toggle ${estado.reglas[r.key] ? 'on' : ''}`}>
                    <input type="checkbox" checked={estado.reglas[r.key]} onChange={() => void toggle(r.key)} />
                    {r.titulo}
                  </label>
                ))}
              </div>
              <div className="fila-bots">
                {NIVELES.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`chip ${nivel === n.id ? 'activo' : ''}`}
                    onClick={() => setNivel(n.id)}
                  >
                    {n.etiqueta}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn"
                  onClick={() => void api.agregarBot(nivel)}
                  disabled={estado.jugadores.length >= estado.maxJugadores}
                >
                  Sumar bot
                </button>
              </div>
              <button type="button" className="btn primario" onClick={() => void api.iniciarPartida().then((r) => !r.ok && onError(r.error ?? ''))}>
                Empezar · a {PUNTOS_META} puntos
              </button>
            </>
          ) : (
            <p className="hint">Esperando al anfitrión. Primera a {PUNTOS_META} puntos.</p>
          )}
        </div>
        <ChatPanel mensajes={estado.chat} tuId={estado.tuId} onError={onError} />
      </div>
      {reglas && <ModalReglas reglas={estado.reglas} onCerrar={() => setReglas(false)} />}
    </div>
  );
}
