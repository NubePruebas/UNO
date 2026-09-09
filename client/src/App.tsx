import { useEffect, useState } from 'react';
import { Inicio } from './pages/Inicio';
import { Lobby } from './pages/Lobby';
import { Mesa } from './pages/Mesa';
import { api, getSocket } from './socket';
import type { EstadoPublico, Sesion } from './types';

const KEY = 'kroma.sesion';
const KEY_DAL = 'kroma.daltonico';

function leerSesion(): Sesion | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

function guardarSesion(s: Sesion | null) {
  if (!s) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(s));
}

export function App() {
  const [estado, setEstado] = useState<EstadoPublico | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [sinServidor, setSinServidor] = useState(false);
  const [daltonico, setDaltonico] = useState(() => localStorage.getItem(KEY_DAL) === '1');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sala = params.get('sala');
    if (sala) localStorage.setItem('kroma.salaHint', sala);
  }, []);

  useEffect(() => {
    const s = getSocket();
    const espera = window.setTimeout(() => {
      if (!s.connected) setSinServidor(true);
    }, 7000);
    const onEstado = (e: EstadoPublico) => {
      setEstado(e);
      setError('');
    };
    const onConnect = () => {
      setSinServidor(false);
      const guardada = leerSesion();
      if (guardada) {
        void api.reconectar(guardada.partidaId, guardada.jugadorId).then((r) => {
          if (!r.ok) {
            guardarSesion(null);
            setSesion(null);
            setEstado(null);
          }
          setListo(true);
        });
      } else {
        setListo(true);
      }
    };
    const onError = () => setSinServidor(true);
    s.on('estado', onEstado);
    s.on('connect', onConnect);
    s.on('connect_error', onError);
    if (s.connected) onConnect();
    return () => {
      window.clearTimeout(espera);
      s.off('estado', onEstado);
      s.off('connect', onConnect);
      s.off('connect_error', onError);
    };
  }, []);

  function entrar(s: Sesion) {
    guardarSesion(s);
    setSesion(s);
    setError('');
  }

  function salir() {
    guardarSesion(null);
    setSesion(null);
    setEstado(null);
  }

  function toggleDaltonico() {
    const v = !daltonico;
    setDaltonico(v);
    localStorage.setItem(KEY_DAL, v ? '1' : '0');
  }

  if (!listo) {
    return (
      <div className="pantalla inicio">
        <p>{sinServidor ? 'No se pudo conectar al servidor. Recarga la página.' : 'Conectando al servidor…'}</p>
        {sinServidor && (
          <button type="button" className="btn primario" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {error && <p className="aviso-flotante">{error}</p>}
      {!sesion ? (
        <Inicio onEntrar={entrar} error="" daltonico={daltonico} onDaltonico={toggleDaltonico} />
      ) : !estado ? (
        <div className="pantalla inicio">
          <p>Entrando a la sala…</p>
        </div>
      ) : estado.fase === 'lobby' ? (
        <Lobby estado={estado} onError={setError} onSalir={salir} />
      ) : (
        <Mesa
          estado={estado}
          onError={setError}
          onSalir={salir}
          daltonico={daltonico}
          onDaltonico={toggleDaltonico}
        />
      )}
    </>
  );
}
