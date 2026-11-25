export type BadgeTone = 'positive' | 'warning' | 'negative' | 'neutral'

const tones: Record<BadgeTone, string> = {
  positive: 'bg-[#e9f7f5] text-[#0b6f71]',
  warning: 'bg-[#fff4dd] text-[#8a5a00]',
  negative: 'bg-[#fdecea] text-[#8e281e]',
  neutral: 'bg-[#eef5f5] text-[#496779]',
}

/** Etiqueta de estado genérica para tablas admin. El texto siempre acompaña al color: el estado no depende solo del tono. */
export function StatusBadge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{children}
  </span>
}

/** Estado de una cuenta según `Usuario.habilitado` del backend. */
export function UserStatusBadge({ habilitado }: { habilitado: boolean }) {
  return <StatusBadge tone={habilitado ? 'positive' : 'negative'}>{habilitado ? 'Habilitada' : 'Bloqueada'}</StatusBadge>
}
