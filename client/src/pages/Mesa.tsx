import { useEffect, useMemo, useRef, useState } from 'react';
import { CartaVista, ChipColor } from '../components/CartaVista';
import { ChatPanel } from '../components/ChatPanel';
import { ModalReglas } from '../components/ModalReglas';
import { cartaIdentica, cartaLegal } from '../juego/legal';
import { sonido } from '../juego/sonidos';
import { api } from '../socket';
import { COLORES, PUNTOS_META, type Carta, type ColorCarta, type EstadoPublico } from '../types';

export function Mesa({
  estado,
  onError,
  onSalir,
  daltonico,
  onDaltonico,
}: {
  estado: EstadoPublico;
  onError: (m: string) => void;
  onSalir: () => void;
  daltonico: boolean;
  onDaltonico: () => void;
}) {
  const [colorPendiente, setColorPendiente] = useState<Carta | null>(null);
  const [reglas, setReglas] = useState(false);
  const [chatOn, setChatOn] = useState(false);
  const [ahora, setAhora] = useState(Date.now());
  const logLen = useRef(estado.log.length);
  const cimaId = useRef(estado.cima?.id);

  const miTurno = estado.turnoJugadorId === estado.tuId && estado.fase === 'jugando';
  const deboResolverMas4 = estado.desafiarMas4?.jugadorId === estado.tuId;
  const acaboDeRobar = estado.acabaDeRobarId === estado.tuId;
  const deboIntercambiar = estado.pendienteIntercambioDe === estado.tuId;
  const soyHost = estado.hostId === estado.tuId;
  const deboUno = estado.tuMano.length === 1 && !estado.jugadores.find((j) => j.id === estado.tuId)?.dijoUno;

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (estado.log.length > logLen.current) {
      const ultimo = estado.log[estado.log.length - 1]?.texto ?? '';
      if (ultimo.includes('¡Uno')) sonido('uno');
      else if (ultimo.includes('gana') || ultimo.includes('cierra')) sonido('win');
      else if (ultimo.includes('toma')) sonido('robar');
      else if (ultimo.includes('juega') || ultimo.includes('jump-in')) sonido('carta');
    }
    logLen.current = estado.log.length;
    if (estado.cima?.id !== cimaId.current) cimaId.current = estado.cima?.id;
  }, [estado.log, estado.cima?.id]);

  const segsTurno = Math.max(0, Math.ceil((estado.turnoHasta - ahora) / 1000));
  const segsUno = estado.unoHasta ? Math.max(0, Math.ceil((estado.unoHasta - ahora) / 1000)) : 0;
  const pctTurno = estado.turnoHasta ? Math.max(0, Math.min(100, ((estado.turnoHasta - ahora) / 60000) * 100)) : 0;

  useEffect(() => {
    if (miTurno && segsTurno > 0 && segsTurno <= 10) sonido('tick');
  }, [segsTurno, miTurno]);

  const jugables = useMemo(() => {
    const ids = new Set<string>();
    if (estado.fase !== 'jugando' || deboResolverMas4 || deboIntercambiar || !estado.cima) return ids;
    const mano = estado.tuMano;
    for (const c of mano) {
      if (miTurno) {
        if (acaboDeRobar && c.id !== mano[mano.length - 1]?.id) continue;
        if (cartaLegal(c, estado)) ids.add(c.id);
      } else if (estado.reglas.jumpIn && cartaIdentica(c, estado.cima)) {
        ids.add(c.id);
      }
    }
    return ids;
  }, [estado, miTurno, deboResolverMas4, acaboDeRobar, deboIntercambiar]);

  async function jugar(carta: Carta) {
    if (carta.tipo === 'comodin' || carta.tipo === 'comodin_mas4') {
      setColorPendiente(carta);
      return;
    }
    if (estado.reglas.sieteCero && carta.tipo === 'numero' && carta.valor === 7) {
      setColorPendiente(carta);
      return;
    }
    const r = await api.jugarCarta(carta.id);
    if (!r.ok) {
      sonido('error');
      onError(r.error ?? 'No se pudo jugar.');
    }
  }

  async function confirmarColor(color: ColorCarta) {
    if (!colorPendiente) return;
    if (colorPendiente.tipo === 'numero') return;
    const r = await api.jugarCarta(colorPendiente.id, color);
    setColorPendiente(null);
    if (!r.ok) onError(r.error ?? 'No se pudo jugar.');
  }

  const turnoNombre = estado.jugadores[estado.turnoIndex]?.nombre ?? '';

  return (
    <div className={`mesa color-${estado.colorActual ?? 'rojo'}`}>
      <div className="timer-bar" style={{ width: `${pctTurno}%` }} />
      <header className="barra mesa-barra">
        <button
          type="button"
          className="btn mini"
          onClick={() => {
            void api.salirSala().then(onSalir);
          }}
        >
          Salir
        </button>
        <div>
          <strong>Sala {estado.codigo}</strong>
          <span className="muted">
            {' '}
            · {estado.sentido === 1 ? '→' : '←'} · mazo {estado.cartasMazo}
            {estado.acumuladoMas > 0 ? ` · pila +${estado.acumuladoMas}` : ''}
          </span>
        </div>
        <span className={`turno-pill ${miTurno ? 'mio' : ''}`}>
          {estado.fase === 'finalizada' ? 'Fin de ronda' : `${turnoNombre} · ${segsTurno}s`}
        </span>
        <button type="button" className="btn ghost" onClick={() => setReglas(true)}>
          Reglas
        </button>
        <button type="button" className={`btn ghost ${daltonico ? 'activo' : ''}`} onClick={onDaltonico}>
          Daltonismo
        </button>
        <button type="button" className="btn ghost" onClick={() => setChatOn((v) => !v)}>
          Chat
        </button>
      </header>

      <section className="marcador">
        {estado.jugadores.map((j) => (
          <span key={j.id} className={j.id === estado.tuId ? 'yo' : ''}>
            {j.nombre} {j.puntos}
            {j.id === estado.campeonId ? ' 🏆' : ''}
          </span>
        ))}
        <em>a {PUNTOS_META}</em>
      </section>

      <section className="rivales">
        {estado.jugadores
          .filter((j) => j.id !== estado.tuId)
          .map((j) => (
            <article
              key={j.id}
              className={`rival ${j.id === estado.turnoJugadorId ? 'activo' : ''} ${j.conectado ? '' : 'off'}`}
            >
              <header>
                <strong>{j.nombre}</strong>
                {j.esBot && <em>{j.nivelBot}</em>}
                {j.dijoUno && <span className="uno-tag">UNO</span>}
                {!j.conectado && !j.esBot && <span className="off-tag">off</span>}
              </header>
              <div className="mini-cartas">
                {Array.from({ length: Math.min(j.cantidadCartas, 12) }).map((_, i) => (
                  <span key={i} className="mini-dorso" />
                ))}
                <span className="n-cartas">{j.cantidadCartas}</span>
              </div>
              {j.cantidadCartas === 1 && !j.dijoUno && (
                <button type="button" className="btn mini peligro" onClick={() => void api.acusarUno(j.id)}>
                  ¡Le falta Uno!
                </button>
              )}
            </article>
          ))}
      </section>

      <section className="centro">
        <div className="pila-mazo">
          <CartaVista
            dorso
            grande
            etiquetaDorso="MAZO"
            onClick={miTurno && !acaboDeRobar && !deboResolverMas4 && !deboIntercambiar ? () => void api.robar() : undefined}
          />
          <span>Tomar</span>
        </div>
        <div className={`descarte-wrap ${estado.cima ? 'cae' : ''}`}>
          <CartaVista carta={estado.cima ?? undefined} grande daltonico={daltonico} />
          {estado.colorActual && <div className={`anillo ${estado.colorActual}`} />}
        </div>
      </section>

      {deboUno && (
        <div className="banner uno-banner">
          <p>¡Decí UNO! {segsUno > 0 ? `${segsUno}s` : '¡Ya te pueden pillar!'}</p>
          <button type="button" className="btn uno" onClick={() => void api.decirUno()}>
            ¡UNO!
          </button>
        </div>
      )}

      {deboResolverMas4 && (
        <div className="banner">
          <p>
            Te tiraron un +4{estado.acumuladoMas ? ` (pila ${estado.acumuladoMas})` : ''}. Si desafiás y era trampa, toma
            el otro; si era legal, vos tomás {Math.max(estado.acumuladoMas, 4) + 2}.
          </p>
          <button type="button" className="btn peligro" onClick={() => void api.resolverMas4(true)}>
            Desafiar
          </button>
          <button type="button" className="btn" onClick={() => void api.resolverMas4(false)}>
            Tomar {estado.acumuladoMas || 4}
          </button>
        </div>
      )}

      {acaboDeRobar && miTurno && (
        <div className="banner">
          <p>Tomaste carta. Jugala o pasá.</p>
          <button type="button" className="btn" onClick={() => void api.pasar()}>
            Pasar
          </button>
        </div>
      )}

      {deboIntercambiar && (
        <div className="banner">
          <p>Jugaste un 7. ¿Con quién intercambiás la mano?</p>
          {estado.jugadores
            .filter((j) => j.id !== estado.tuId)
            .map((j) => (
              <button key={j.id} type="button" className="btn" onClick={() => void api.intercambiar(j.id)}>
                {j.nombre} ({j.cantidadCartas})
              </button>
            ))}
        </div>
      )}

      {estado.fase === 'finalizada' && (
        <div className="banner ganador">
          {estado.campeonId ? (
            <p>Campeón: {estado.campeonNombre} · {estado.jugadores.find((j) => j.id === estado.campeonId)?.puntos} pts</p>
          ) : (
            <p>
              Ronda para {estado.ganadorNombre}
              {estado.puntosRonda &&
                ` · +${estado.puntosRonda.find((p) => p.id === estado.ganadorId)?.puntos ?? 0} pts`}
            </p>
          )}
          {soyHost && !estado.campeonId && (
            <button type="button" className="btn primario" onClick={() => void api.nuevaRonda()}>
              Siguiente ronda
            </button>
          )}
          {soyHost && estado.campeonId && (
            <button type="button" className="btn primario" onClick={() => void api.nuevaPartida()}>
              Nueva partida
            </button>
          )}
        </div>
      )}

      <section className="mano">
        {estado.tuMano.map((c) => (
          <CartaVista
            key={c.id}
            carta={c}
            jugable={jugables.has(c.id)}
            daltonico={daltonico}
            onClick={jugables.has(c.id) ? () => void jugar(c) : undefined}
          />
        ))}
      </section>

      <footer className="acciones">
        {miTurno && !acaboDeRobar && !deboResolverMas4 && estado.fase === 'jugando' && (
          <button type="button" className="btn" onClick={() => void api.robar()}>
            {estado.acumuladoMas > 0 ? `Tomar pila (+${estado.acumuladoMas})` : 'Tomar carta'}
          </button>
        )}
      </footer>

      <aside className="log">
        {estado.log
          .slice()
          .reverse()
          .slice(0, 6)
          .map((l) => (
            <p key={l.id}>{l.texto}</p>
          ))}
      </aside>

      {chatOn && (
        <div className="chat-flotante">
          <ChatPanel mensajes={estado.chat} tuId={estado.tuId} onError={onError} />
        </div>
      )}

      {colorPendiente && colorPendiente.tipo !== 'numero' && (
        <div className="modal" role="dialog">
          <div className="tarjeta">
            <p>Elegí el color</p>
            <div className="fila-colores">
              {COLORES.map((c) => (
                <ChipColor key={c} color={c} onClick={() => void confirmarColor(c)} />
              ))}
            </div>
            <button type="button" className="btn mini" onClick={() => setColorPendiente(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {colorPendiente && colorPendiente.tipo === 'numero' && (
        <div className="modal" role="dialog">
          <div className="tarjeta">
            <p>¿Con quién intercambiás?</p>
            {estado.jugadores
              .filter((j) => j.id !== estado.tuId)
              .map((j) => (
                <button
                  key={j.id}
                  type="button"
                  className="btn"
                  onClick={() => {
                    void api.jugarCarta(colorPendiente.id, undefined, j.id).then((r) => {
                      setColorPendiente(null);
                      if (!r.ok) onError(r.error ?? '');
                    });
                  }}
                >
                  {j.nombre} ({j.cantidadCartas} cartas)
                </button>
              ))}
            <button type="button" className="btn mini" onClick={() => setColorPendiente(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {reglas && <ModalReglas reglas={estado.reglas} onCerrar={() => setReglas(false)} />}
    </div>
  );
}
