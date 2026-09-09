import { useState } from 'react';
import { api } from '../socket';
import type { MensajeChat } from '../types';

export function ChatPanel({
  mensajes,
  tuId,
  onError,
}: {
  mensajes: MensajeChat[];
  tuId: string;
  onError: (m: string) => void;
}) {
  const [texto, setTexto] = useState('');
  const visibles = mensajes.slice(-6);

  async function enviar() {
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    const r = await api.chat(t);
    if (!r.ok) onError(r.error ?? 'No se pudo enviar.');
  }

  return (
    <div className="chat">
      <h3>Chat</h3>
      <div className="chat-lista">
        {visibles.length === 0 && <p className="muted">Todavía no hay mensajes.</p>}
        {visibles.map((m) => (
          <p key={m.id} className={m.jugadorId === tuId ? 'mio' : ''}>
            <strong>{m.nombre}:</strong> {m.texto}
          </p>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <input
          value={texto}
          maxLength={80}
          placeholder="Escribe…"
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="btn mini">
          Enviar
        </button>
      </form>
    </div>
  );
}
