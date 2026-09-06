import { useEffect, useState } from 'react';
import { Inicio } from './pages/Inicio';
import { Lobby } from './pages/Lobby';
import { Mesa } from './pages/Mesa';
import { api, getSocket, infoLan } from './socket';
import type { EstadoPublico, Sesion } from './types';

const KEY = 'uno.sesion';
const KEY_DAL = 'uno.daltonico';

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
  const [ip, setIp] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [daltonico, setDaltonico] = useState(() => localStorage.getItem(KEY_DAL) === '1');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sala = params.get('sala');
    if (sala) localStorage.setItem('uno.salaHint', sala);
  }, []);

  useEffect(() => {
    void infoLan().then((d) => setIp(d.ip));
    const s = getSocket();
    const onEstado = (e: EstadoPublico) => {
      setEstado(e);
      setError('');
    };
    const onConnect = () => {
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
    s.on('estado', onEstado);
    s.on('connect', onConnect);
    if (s.connected) onConnect();
    return () => {
      s.off('estado', onEstado);
      s.off('connect', onConnect);
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
        <p>Conectando al servidor…</p>
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
        <Lobby estado={estado} ip={ip} onError={setError} onSalir={salir} />
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
