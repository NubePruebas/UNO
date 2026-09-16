import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CartaVista, ChipColor } from '../components/CartaVista';
import { ChatPanel } from '../components/ChatPanel';
import { ModalReglas } from '../components/ModalReglas';
import { TutorialMesa, tutorialPendiente } from '../components/TutorialMesa';
import { guardarHistorial } from '../juego/historial';
import { cartaIdentica, cartaLegal } from '../juego/legal';
import { abanico, asientosRivales, ordenarMano, layoutMano } from '../juego/ordenar';
import { sonido } from '../juego/sonidos';
import { api } from '../socket';
import { COLORES, PUNTOS_META, type Carta, type ColorCarta, type EstadoPublico } from '../types';

function Reloj({ segs, total = 60, compacto }: { segs: number; total?: number; compacto?: boolean }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, segs / total));
  return (
    <svg className={`reloj ${segs <= 10 ? 'urgente' : ''} ${compacto ? 'compacto' : ''}`} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r={r} className="reloj-fondo" />
      <circle
        cx="20"
        cy="20"
        r={r}
        className="reloj-arco"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
      <text x="20" y="24">
        {segs}
      </text>
    </svg>
  );
}

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
  const [tutorial, setTutorial] = useState(tutorialPendiente);
  const [ahora, setAhora] = useState(Date.now());
  const [vuelo, setVuelo] = useState<{ carta: Carta; dx: number; dy: number } | null>(null);
  const [estrecho, setEstrecho] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches,
  );
  const [robando, setRobando] = useState(false);
  const robandoRef = useRef(false);
  const [recienId, setRecienId] = useState<string | null>(null);
  const prevManoIds = useRef<string[]>([]);
  const logLen = useRef(estado.log.length);
  const cimaId = useRef(estado.cima?.id);
  const histHecho = useRef(false);

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

  useLayoutEffect(() => {
    const el = mesaRef.current;
    if (!el) return;
    const sync = () => setEstrecho(el.clientWidth < 720);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (estado.log.length > logLen.current) {
      const ultimo = estado.log[estado.log.length - 1]?.texto ?? '';
      if (ultimo.includes('¡Kroma')) sonido('kroma');
      else if (ultimo.includes('gana') || ultimo.includes('cierra')) sonido('win');
      else if (ultimo.includes('toma')) sonido('robar');
      else if (ultimo.includes('Ronda empezada') || ultimo.includes('reparte')) sonido('barajar');
      else if (ultimo.includes('juega') || ultimo.includes('entra con')) sonido('carta');
    }
    logLen.current = estado.log.length;
  }, [estado.log]);

  useEffect(() => {
    if (estado.cima?.id && estado.cima.id !== cimaId.current) {
      const turno = estado.jugadores.find((j) => j.id === estado.turnoJugadorId);
      const idx = estado.jugadores.filter((j) => j.id !== estado.tuId).findIndex((j) => j.id === turno?.id);
      const n = estado.jugadores.length - 1;
      let dx = 0;
      let dy = 80;
      if (idx >= 0 && n > 0) {
        const t = (idx + 1) / (n + 1);
        const a = Math.PI + t * Math.PI;
        dx = 180 * Math.cos(a);
        dy = 140 * Math.sin(a);
      }
      setVuelo({ carta: estado.cima, dx, dy });
      const t = window.setTimeout(() => setVuelo(null), 320);
      cimaId.current = estado.cima.id;
      return () => window.clearTimeout(t);
    }
    cimaId.current = estado.cima?.id;
  }, [estado.cima, estado.turnoJugadorId, estado.jugadores, estado.tuId]);

  useEffect(() => {
    if (!estado.campeonId || histHecho.current) return;
    histHecho.current = true;
    const yo = estado.jugadores.find((j) => j.id === estado.tuId);
    guardarHistorial({
      cuando: Date.now(),
      campeon: estado.campeonNombre ?? 'Alguien',
      puntos: estado.jugadores.find((j) => j.id === estado.campeonId)?.puntos ?? 0,
      rivales: estado.jugadores.filter((j) => j.id !== yo?.id).map((j) => j.nombre),
    });
  }, [estado.campeonId, estado.campeonNombre, estado.jugadores, estado.tuId]);

  const segsTurno = Math.max(0, Math.ceil((estado.turnoHasta - ahora) / 1000));
  const segsUno = estado.unoHasta ? Math.max(0, Math.ceil((estado.unoHasta - ahora) / 1000)) : 0;
  const pctTurno = estado.turnoHasta ? Math.max(0, Math.min(100, ((estado.turnoHasta - ahora) / 60000) * 100)) : 0;
  const segsRonda = estado.rondaAutoEn ? Math.max(0, Math.ceil((estado.rondaAutoEn - ahora) / 1000)) : 0;

  useEffect(() => {
    if (miTurno && segsTurno > 0 && segsTurno <= 10) sonido('tick');
  }, [segsTurno, miTurno]);

  const mano = useMemo(() => {
    const o = ordenarMano(estado.tuMano);
    if (!recienId) return o;
    const i = o.findIndex((c) => c.id === recienId);
    if (i < 0) return o;
    return [...o.slice(0, i), ...o.slice(i + 1), o[i]];
  }, [estado.tuMano, recienId]);

  useEffect(() => {
    const ids = estado.tuMano.map((c) => c.id);
    const nuevos = ids.filter((id) => !prevManoIds.current.includes(id));
    if (nuevos.length > 0 && ids.length >= prevManoIds.current.length) {
      setRecienId(nuevos[nuevos.length - 1] ?? null);
    } else if (recienId && !ids.includes(recienId)) {
      setRecienId(null);
    }
    prevManoIds.current = ids;
  }, [estado.tuMano, recienId]);
  const manoRef = useRef<HTMLElement>(null);
  const mesaRef = useRef<HTMLDivElement>(null);
  const [solape, setSolape] = useState(18);
  const [escalaMano, setEscalaMano] = useState(1);

  useLayoutEffect(() => {
    const el = manoRef.current;
    if (!el) return;
    const medir = () => {
      const n = mano.length;
      if (n < 2) {
        setSolape(0);
        setEscalaMano(1);
        return;
      }
      const carta = el.querySelector('.carta') as HTMLElement | null;
      const w = carta?.offsetWidth || 86;
      const { solape: s, escala } = layoutMano(n, el.clientWidth, w, el.clientWidth < 720);
      setSolape(s);
      setEscalaMano(escala);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mano.length]);

  const jugables = useMemo(() => {
    const ids = new Set<string>();
    if (estado.fase !== 'jugando' || deboResolverMas4 || deboIntercambiar || !estado.cima) return ids;
    for (const c of estado.tuMano) {
      if (miTurno) {
        if (cartaLegal(c, estado)) ids.add(c.id);
      } else if (estado.reglas.jumpIn && cartaIdentica(c, estado.cima)) {
        ids.add(c.id);
      }
    }
    return ids;
  }, [estado, miTurno, deboResolverMas4, deboIntercambiar]);

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

  async function tomar() {
    if (robandoRef.current) return;
    robandoRef.current = true;
    setRobando(true);
    try {
      const r = await api.robar();
      if (!r.ok) {
        sonido('error');
        onError(r.error ?? 'No se pudo tomar.');
      }
    } finally {
      robandoRef.current = false;
      setRobando(false);
    }
  }

  const rivales = estado.jugadores.filter((j) => j.id !== estado.tuId);
  const puestos = asientosRivales(rivales.length, estrecho);
  const turnoNombre = estado.jugadores[estado.turnoIndex]?.nombre ?? '';
  const debajo = (estado.descarteVisible ?? []).slice(0, -1);

  return (
    <div
      ref={mesaRef}
      className={`mesa mesa-oval color-${estado.colorActual ?? 'rojo'}${estrecho ? ' estrecho' : ''}`}
    >
      <div className="timer-bar" style={{ width: `${pctTurno}%` }} />
      <header className="barra mesa-barra">
        <div className="mesa-fila">
          <button
            type="button"
            className="btn mini"
            onClick={() => {
              void api.salirSala().then(onSalir);
            }}
          >
            Salir
          </button>
          <span className={`turno-pill ${miTurno ? 'mio' : ''}`}>
            {estado.fase === 'finalizada' ? 'Fin' : miTurno ? 'Tu turno' : turnoNombre}
          </span>
          <div className="mesa-iconos">
            <button type="button" className="btn ghost mini" onClick={() => setReglas(true)}>
              Reglas
            </button>
            <button
              type="button"
              className={`btn ghost mini ${daltonico ? 'activo' : ''}`}
              onClick={onDaltonico}
              title="Daltonismo"
            >
              <span className="lbl-full">Daltonismo</span>
              <span className="lbl-corto">Aa</span>
            </button>
            <button type="button" className={`btn ghost mini ${chatOn ? 'activo' : ''}`} onClick={() => setChatOn((v) => !v)}>
              Chat
            </button>
          </div>
        </div>
        <p className="mesa-meta">
          Sala {estado.codigo} · {estado.sentido === 1 ? '↻' : '↺'} · mazo {estado.cartasMazo}
          {estado.acumuladoMas > 0 ? ` · pila +${estado.acumuladoMas}` : ''}
        </p>
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

      <div className="cancha">
        <div className="feltro" />
        {estado.colorActual && <div className={`anillo ${estado.colorActual}`} />}

        {rivales.map((j, i) => {
          const pos = puestos[i];
          const activo = j.id === estado.turnoJugadorId;
          const pensando = j.id === estado.pensandoId;
          return (
            <article
              key={j.id}
              className={`asiento ${activo ? 'activo' : ''} ${j.conectado ? '' : 'off'} ${pensando ? 'pensando' : ''}`}
              style={{ left: pos.left, top: pos.top }}
            >
              {activo && estado.fase === 'jugando' && <Reloj segs={segsTurno} compacto />}
              <header>
                <strong>{j.nombre}</strong>
                {j.esBot && !estrecho && <em>{j.nivelBot}</em>}
                {j.dijoUno && <span className="kroma-tag">KROMA</span>}
                {!j.conectado && !j.esBot && <span className="off-tag">off</span>}
              </header>
              {pensando && <p className="pensa">pensando…</p>}
              <div className="mini-cartas" aria-label={`${j.cantidadCartas} cartas`}>
                {Array.from({ length: Math.min(Math.max(j.cantidadCartas, 0), estrecho ? 8 : 12) }).map((_, k) => (
                  <span
                    key={k}
                    className="mini-dorso"
                    style={{ zIndex: k, '--i': k } as CSSProperties}
                  />
                ))}
                <span className="n-cartas">{j.cantidadCartas}</span>
              </div>
              {j.cantidadCartas === 1 && !j.dijoUno && (
                <button type="button" className="btn mini peligro" onClick={() => void api.acusarUno(j.id)}>
                  ¡Le falta Kroma!
                </button>
              )}
            </article>
          );
        })}

        <div className="centro-mesa">
          <div className="pila-mazo">
            <CartaVista
              dorso
              grande
              etiquetaDorso="KROMA"
              onClick={
                miTurno && !acaboDeRobar && !deboResolverMas4 && !deboIntercambiar && !robando
                  ? () => void tomar()
                  : undefined
              }
            />
            <span>
              {estado.acumuladoMas > 0
                ? `Pila +${estado.acumuladoMas}`
                : estado.reglas.robarHastaJugar
                  ? acaboDeRobar
                    ? 'Tomar'
                    : 'Tomar una'
                  : 'Tomar'}
            </span>
          </div>
          <div className="pila-descarte">
            {debajo.map((c) => (
              <CartaVista key={c.id} carta={c} daltonico={daltonico} apilada />
            ))}
            <div
              className={`descarte-wrap ${vuelo ? 'cae' : ''}`}
              style={
                vuelo
                  ? ({ '--dx': `${vuelo.dx}px`, '--dy': `${vuelo.dy}px` } as CSSProperties)
                  : undefined
              }
            >
              <CartaVista carta={estado.cima ?? undefined} grande daltonico={daltonico} />
            </div>
          </div>
        </div>
      </div>

      {deboUno && (
        <button type="button" className="kroma-fab" onClick={() => void api.decirUno()}>
          ¡KROMA!{segsUno > 0 ? ` ${segsUno}` : ''}
        </button>
      )}

      {deboResolverMas4 && (
        <div className="banner">
          <p>
            Te tiraron un +4{estado.acumuladoMas ? ` (pila ${estado.acumuladoMas})` : ''}. Puedes apilar un +2 o +4,
            desafiar, o tomar. Si desafías y era trampa, toma el otro; si era legal, tú tomas{' '}
            {Math.max(estado.acumuladoMas, 4) + 2}.
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
          <p>Puedes tirar cualquiera que coincida, o pasar.</p>
          <button type="button" className="btn" onClick={() => void api.pasar()}>
            Pasar
          </button>
        </div>
      )}

      {miTurno &&
        estado.reglas.robarHastaJugar &&
        !acaboDeRobar &&
        !deboResolverMas4 &&
        !deboIntercambiar &&
        estado.acumuladoMas === 0 &&
        estado.fase === 'jugando' &&
        jugables.size === 0 && (
          <div className="banner">
            <p>
              {recienId
                ? 'Esa no pega. Toma otra, una por una, hasta que sí.'
                : 'No tienes jugada. Toma una carta.'}
            </p>
          </div>
        )}

      {deboIntercambiar && (
        <div className="banner">
          <p>Jugaste un 7. ¿Con quién intercambias la mano?</p>
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
            <p>
              Campeón: {estado.campeonNombre} · {estado.jugadores.find((j) => j.id === estado.campeonId)?.puntos} pts
            </p>
          ) : (
            <p>
              Ronda para {estado.ganadorNombre}
              {estado.puntosRonda && ` · +${estado.puntosRonda.find((p) => p.id === estado.ganadorId)?.puntos ?? 0} pts`}
              {segsRonda > 0 ? ` · siguiente en ${segsRonda}s` : ''}
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

      <section
        ref={manoRef}
        className="mano-abanico"
        aria-label="Tu mano"
        style={{ '--solape': `${solape}px`, '--mano-escala': String(escalaMano) } as CSSProperties}
      >
        <div className="mano-abanico-inner">
        {mano.map((c, i) => {
          const { rot, y } = abanico(i, mano.length, estrecho);
          return (
            <div
              key={c.id}
              className="carta-slot"
              style={
                {
                  '--r': `${rot}deg`,
                  '--y': `${y}px`,
                  zIndex: jugables.has(c.id) ? 20 : i + 1,
                } as CSSProperties
              }
            >
              <CartaVista
                carta={c}
                jugable={jugables.has(c.id)}
                daltonico={daltonico}
                recien={c.id === recienId}
                onClick={jugables.has(c.id) ? () => void jugar(c) : undefined}
              />
            </div>
          );
        })}
        </div>
      </section>

      <footer className="acciones">
        {miTurno && !acaboDeRobar && !deboResolverMas4 && estado.fase === 'jugando' && (
          <button type="button" className="btn" disabled={robando} onClick={() => void tomar()}>
            {estado.acumuladoMas > 0
              ? `Tomar pila (+${estado.acumuladoMas})`
              : estado.reglas.robarHastaJugar
                ? recienId && !acaboDeRobar
                  ? 'Tomar otra'
                  : 'Tomar una'
                : 'Tomar carta'}
          </button>
        )}
        {miTurno && estado.fase === 'jugando' && <Reloj segs={segsTurno} />}
      </footer>

      <aside className="log">
        {estado.log
          .slice()
          .reverse()
          .slice(0, 2)
          .map((l) => (
            <p key={l.id}>{l.texto}</p>
          ))}
      </aside>

      {chatOn && (
        <div className="chat-cajon">
          <ChatPanel mensajes={estado.chat} tuId={estado.tuId} onError={onError} />
        </div>
      )}

      {colorPendiente && colorPendiente.tipo !== 'numero' && (
        <div className="modal" role="dialog">
          <div className="tarjeta">
            <p>Elige el color</p>
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
            <p>¿Con quién intercambias?</p>
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
      {tutorial && <TutorialMesa onCerrar={() => setTutorial(false)} />}
    </div>
  );
}
