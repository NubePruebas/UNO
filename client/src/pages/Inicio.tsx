import { useEffect, useState } from 'react';
import { ModalReglas } from '../components/ModalReglas';
import { leerHistorial } from '../juego/historial';
import { setSonidoActivo, sonidoActivo } from '../juego/sonidos';
import { api, salasLan, type SalaLan } from '../socket';
import type { NivelBot, Sesion } from '../types';

type Vista = 'titulo' | 'jugar' | 'crear' | 'unirse' | 'reanudar' | 'rapida' | 'opciones';

function CampoNombre({
  nombre,
  onChange,
}: {
  nombre: string;
  onChange: (v: string) => void;
}) {
  return (
    <label>
      Tu nombre
      <input
        value={nombre}
        onChange={(e) => onChange(e.target.value)}
        maxLength={16}
        placeholder="Ej. Juan"
        autoComplete="nickname"
      />
    </label>
  );
}

export function Inicio({
  onEntrar,
  error,
  daltonico,
  onDaltonico,
}: {
  onEntrar: (sesion: Sesion) => void;
  error: string;
  daltonico: boolean;
  onDaltonico: () => void;
}) {
  const salaLink = new URLSearchParams(window.location.search).get('sala');
  const [vista, setVista] = useState<Vista>(salaLink ? 'unirse' : 'titulo');
  const [nombre, setNombre] = useState(localStorage.getItem('kroma.nombre') ?? '');
  const [codigo, setCodigo] = useState(
    () => salaLink ?? localStorage.getItem('kroma.salaHint') ?? '',
  );
  const [pin, setPin] = useState('');
  const [nivel, setNivel] = useState<NivelBot>('medio');
  const [bots, setBots] = useState(1);
  const [localError, setLocalError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [reglas, setReglas] = useState(false);
  const [sonidoOn, setSonidoOn] = useState(() => sonidoActivo());
  const [salas, setSalas] = useState<SalaLan[]>([]);
  const historial = leerHistorial();

  useEffect(() => {
    if (vista !== 'unirse' && vista !== 'titulo') return;
    void salasLan().then(setSalas);
  }, [vista]);

  function guardarNombre() {
    localStorage.setItem('kroma.nombre', nombre.trim());
  }

  function entrarCon(r: {
    ok: boolean;
    error?: string;
    partidaId?: string;
    jugadorId?: string;
    codigo?: string;
    pin?: string;
  }) {
    if (!r.ok || !r.partidaId || !r.jugadorId || !r.codigo) {
      setLocalError(r.error ?? 'No se pudo entrar.');
      return;
    }
    guardarNombre();
    onEntrar({
      partidaId: r.partidaId,
      jugadorId: r.jugadorId,
      codigo: r.codigo,
      nombre: nombre.trim(),
      pin: r.pin,
    });
  }

  async function crear() {
    setLocalError('');
    setCargando(true);
    const r = await api.crearSala(nombre.trim());
    setCargando(false);
    entrarCon(r);
  }

  async function unirse() {
    setLocalError('');
    setCargando(true);
    const r = await api.unirseSala(codigo.trim().toUpperCase(), nombre.trim());
    setCargando(false);
    entrarCon(r);
  }

  async function reanudar() {
    setLocalError('');
    setCargando(true);
    const r = await api.reanudarPin(codigo.trim().toUpperCase(), pin.trim(), nombre.trim());
    setCargando(false);
    entrarCon(r);
  }

  async function rapida() {
    setLocalError('');
    setCargando(true);
    const r = await api.partidaRapida(nombre.trim(), nivel, bots);
    setCargando(false);
    entrarCon(r);
  }

  const nombreOk = nombre.trim().length >= 2;

  return (
    <div className="pantalla inicio menu-juego">
      <div className="cartas-fondo" aria-hidden>
        <span className="carta-deco rojo">7</span>
        <span className="carta-deco amarillo">+2</span>
        <span className="carta-deco azul">0</span>
        <span className="carta-deco verde">⇄</span>
      </div>

      <div className="marca">
        <p className="marca-sello">EN LÍNEA</p>
        <h1>KROMA</h1>
        <p>Cuatro colores. Juega con tus amigos.</p>
      </div>

      {vista === 'titulo' && (
        <nav className="menu-principal">
          <button type="button" className="btn-menu primario" onClick={() => setVista('jugar')}>
            Jugar
          </button>
          <button type="button" className="btn-menu" onClick={() => setReglas(true)}>
            Cómo se juega
          </button>
          <button type="button" className="btn-menu" onClick={() => setVista('opciones')}>
            Opciones
          </button>
        </nav>
      )}

      {vista === 'titulo' && historial.length > 0 && (
        <aside className="historial">
          <h3>Últimas partidas</h3>
          {historial.slice(0, 3).map((h) => (
            <p key={h.cuando}>
              {h.campeon} · {h.puntos} pts
            </p>
          ))}
        </aside>
      )}

      {vista === 'jugar' && (
        <nav className="menu-principal">
          <p className="menu-titulo">Elige cómo entrar</p>
          <button type="button" className="btn-menu primario" onClick={() => setVista('rapida')}>
            Partida rápida
            <small>tú contra 1 a 3 bots</small>
          </button>
          <button type="button" className="btn-menu" onClick={() => setVista('crear')}>
            Crear sala
            <small>invita a tus amigos</small>
          </button>
          <button type="button" className="btn-menu" onClick={() => setVista('unirse')}>
            Unirse a una sala
            <small>con el código de 4 letras</small>
          </button>
          <button type="button" className="btn-menu" onClick={() => setVista('reanudar')}>
            Reanudar
            <small>código + PIN en otro dispositivo</small>
          </button>
          <button type="button" className="btn-menu ghost" onClick={() => setVista('titulo')}>
            Volver
          </button>
        </nav>
      )}

      {vista === 'crear' && (
        <form
          className="tarjeta"
          onSubmit={(e) => {
            e.preventDefault();
            void crear();
          }}
        >
          <h2>Crear sala</h2>
          <CampoNombre nombre={nombre} onChange={setNombre} />
          <button type="submit" className="btn primario" disabled={cargando || !nombreOk}>
            Crear e ir al lobby
          </button>
          {(localError || error) && <p className="aviso">{localError || error}</p>}
          <button type="button" className="btn ghost" onClick={() => setVista('jugar')}>
            Volver
          </button>
        </form>
      )}

      {vista === 'unirse' && (
        <form
          className="tarjeta"
          onSubmit={(e) => {
            e.preventDefault();
            void unirse();
          }}
        >
          <h2>Unirse</h2>
          <CampoNombre nombre={nombre} onChange={setNombre} />
          <label>
            Código de sala
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="AB3K"
            />
          </label>
          {salas.length > 0 && (
            <div className="salas-lan">
              <p className="hint">Salas abiertas</p>
              {salas.map((s) => (
                <button
                  key={s.codigo}
                  type="button"
                  className="chip sala-chip"
                  onClick={() => setCodigo(s.codigo)}
                >
                  {s.codigo} · {s.nombres.join(', ')} ({s.jugadores})
                </button>
              ))}
            </div>
          )}
          <button type="submit" className="btn primario" disabled={cargando || !nombreOk || codigo.trim().length < 4}>
            Entrar
          </button>
          {(localError || error) && <p className="aviso">{localError || error}</p>}
          <button type="button" className="btn ghost" onClick={() => setVista('jugar')}>
            Volver
          </button>
        </form>
      )}

      {vista === 'reanudar' && (
        <form
          className="tarjeta"
          onSubmit={(e) => {
            e.preventDefault();
            void reanudar();
          }}
        >
          <h2>Reanudar</h2>
          <p className="hint">Si te cambiaste de celular, usa el código de la sala y tu PIN.</p>
          <CampoNombre nombre={nombre} onChange={setNombre} />
          <label>
            Código
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="AB3K"
            />
          </label>
          <label>
            PIN
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              placeholder="1234"
              inputMode="numeric"
            />
          </label>
          <button type="submit" className="btn primario" disabled={cargando || codigo.trim().length < 4 || pin.trim().length < 4}>
            Seguir partida
          </button>
          {(localError || error) && <p className="aviso">{localError || error}</p>}
          <button type="button" className="btn ghost" onClick={() => setVista('jugar')}>
            Volver
          </button>
        </form>
      )}

      {vista === 'rapida' && (
        <form
          className="tarjeta"
          onSubmit={(e) => {
            e.preventDefault();
            void rapida();
          }}
        >
          <h2>Partida rápida</h2>
          <CampoNombre nombre={nombre} onChange={setNombre} />
          <p className="hint">¿Cuántos bots?</p>
          <div className="fila-bots wrap">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${bots === n ? 'activo' : ''}`}
                onClick={() => setBots(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="hint">Nivel</p>
          <div className="fila-bots wrap">
            {(['facil', 'medio', 'dificil'] as const).map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${nivel === n ? 'activo' : ''}`}
                onClick={() => setNivel(n)}
              >
                {n === 'facil' ? 'Fácil' : n === 'medio' ? 'Medio' : 'Difícil'}
              </button>
            ))}
          </div>
          <button type="submit" className="btn primario" disabled={cargando || !nombreOk}>
            ¡A jugar!
          </button>
          {(localError || error) && <p className="aviso">{localError || error}</p>}
          <button type="button" className="btn ghost" onClick={() => setVista('jugar')}>
            Volver
          </button>
        </form>
      )}

      {vista === 'opciones' && (
        <div className="tarjeta">
          <h2>Opciones</h2>
          <label className={`toggle ${sonidoOn ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={sonidoOn}
              onChange={() => {
                const v = !sonidoOn;
                setSonidoOn(v);
                setSonidoActivo(v);
              }}
            />
            Sonido
          </label>
          <label className={`toggle ${daltonico ? 'on' : ''}`}>
            <input type="checkbox" checked={daltonico} onChange={onDaltonico} />
            Daltonismo (letras en las cartas)
          </label>
          <button type="button" className="btn ghost" onClick={() => setVista('titulo')}>
            Volver
          </button>
        </div>
      )}

      <p className="pie-menu">Primera a 500 puntos · 2 a 8 jugadores</p>
      {reglas && <ModalReglas onCerrar={() => setReglas(false)} />}
    </div>
  );
}
