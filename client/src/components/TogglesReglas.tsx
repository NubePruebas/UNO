import { REGLAS_LABEL, type ReglasCasa } from '../types';

export function TogglesReglas({
  valor,
  onToggle,
}: {
  valor: ReglasCasa;
  onToggle: (key: keyof ReglasCasa) => void;
}) {
  return (
    <div className="toggles compactos">
      {REGLAS_LABEL.map((r) => (
        <label key={r.key} className={`toggle ${valor[r.key] ? 'on' : ''}`} title={r.texto}>
          <input type="checkbox" checked={valor[r.key]} onChange={() => onToggle(r.key)} />
          {r.titulo}
        </label>
      ))}
    </div>
  );
}
