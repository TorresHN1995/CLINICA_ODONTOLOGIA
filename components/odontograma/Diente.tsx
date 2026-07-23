'use client'

import { memo } from 'react'
import {
  DienteEstado,
  ESTADOS,
  EstadoDiente,
  TipoDiente,
  esSuperior,
  tipoDiente,
} from '@/lib/odontograma'

/**
 * Anatomía de cada pieza en un lienzo 64 × 112, dibujada SIEMPRE en orientación
 * de arcada superior (raíz arriba, corona abajo). Las piezas inferiores se
 * reflejan verticalmente al renderizar, igual que en un odontograma impreso.
 */
interface Anatomia {
  /** Una entrada por raíz: se pintan por separado para que se lean en volumen. */
  raices: string[]
  corona: string
  /** Surcos/aristas de la cara oclusal que dan la sensación de relieve. */
  surcos: string[]
  /** Centro aproximado de la cara oclusal, donde se marcan caries y obturaciones. */
  oclusal: { cx: number; cy: number; rx: number; ry: number }
}

const ANATOMIA: Record<TipoDiente, Anatomia> = {
  incisivo: {
    raices: ['M32 8 C 27 22, 25 38, 27 58 L 37 58 C 39 38, 37 22, 32 8 Z'],
    corona:
      'M22 54 C 18 64, 16 76, 16.5 93 C 16.7 100, 20 104, 25 104 L 39 104 C 44 104, 47.3 100, 47.5 93 C 48 76, 46 64, 42 54 Z',
    surcos: ['M24 96 L 40 96'],
    oclusal: { cx: 32, cy: 92, rx: 12, ry: 8 },
  },
  canino: {
    raices: ['M32 4 C 26 20, 23 38, 26 58 L 38 58 C 41 38, 38 20, 32 4 Z'],
    corona:
      'M23 54 C 18 66, 16 79, 17.5 90 C 19 97, 26 101, 32 108 C 38 101, 45 97, 46.5 90 C 48 79, 46 66, 41 54 Z',
    surcos: ['M32 108 L 32 92'],
    oclusal: { cx: 32, cy: 92, rx: 11, ry: 9 },
  },
  premolar: {
    raices: ['M27 10 C 22 24, 21 42, 24 58 L 40 58 C 43 42, 42 24, 37 10 C 35 6, 29 6, 27 10 Z'],
    corona:
      'M22 54 C 16 62, 13 74, 13.5 88 C 14 98, 20 104, 26 102 C 29 101, 30 98, 32 98 C 34 98, 35 101, 38 102 C 44 104, 50 98, 50.5 88 C 51 74, 48 62, 42 54 Z',
    surcos: ['M32 98 L 32 84'],
    oclusal: { cx: 32, cy: 86, rx: 15, ry: 10 },
  },
  molar: {
    raices: [
      'M16 16 C 12 30, 12 47, 17 59 L 29 59 C 28 43, 25 26, 22 16 C 21 11, 17 11, 16 16 Z',
      'M32 12 C 29 28, 29 45, 30 59 L 37 59 C 38 45, 36 28, 33.5 12 C 33 8, 32.5 8, 32 12 Z',
      'M48 16 C 52 30, 52 47, 47 59 L 35 59 C 36 43, 39 26, 42 16 C 43 11, 47 11, 48 16 Z',
    ],
    corona:
      'M18 54 C 11 62, 7 74, 7.5 88 C 8 99, 15 105, 22 103 C 25 102, 26 98, 29 98 C 30.5 98, 31 100, 32 100 C 33 100, 33.5 98, 35 98 C 38 98, 39 102, 42 103 C 49 105, 56 99, 56.5 88 C 57 74, 53 62, 46 54 Z',
    surcos: ['M12 86 L 52 86', 'M32 100 L 32 74'],
    oclusal: { cx: 32, cy: 84, rx: 20, ry: 11 },
  },
}

/** Opacidad del tinte de estado sobre el esmalte: deja ver el degradado 3D. */
const TINTE = 0.62

interface DienteProps {
  numero: number
  registro?: DienteEstado
  seleccionado: boolean
  editable: boolean
  onSelect: (numero: number) => void
}

function DienteSVG({ numero, registro, seleccionado, editable, onSelect }: DienteProps) {
  const estado: EstadoDiente = registro?.estado || 'sano'
  const meta = ESTADOS[estado]
  const tipo = tipoDiente(numero)
  const anatomia = ANATOMIA[tipo]
  const superior = esSuperior(numero)
  const ausente = estado === 'ausente'
  const corona = estado === 'corona'
  const caras = registro?.caras || []
  const anotado = estado !== 'sano' || caras.length > 0 || Boolean(registro?.notas?.trim())

  const { cx, cy, rx, ry } = anatomia.oclusal

  return (
    <button
      type="button"
      onClick={() => onSelect(numero)}
      aria-pressed={seleccionado}
      aria-label={`Pieza ${numero}: ${meta.label}`}
      title={`Pieza ${numero} — ${meta.label}`}
      className={[
        'group relative flex flex-col items-center rounded-lg px-0.5 pb-1 pt-1 outline-none transition-transform duration-200',
        'cursor-pointer hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-sky-400',
        seleccionado ? '-translate-y-1' : '',
      ].join(' ')}
    >
      <span
        className={[
          'relative block transition-[filter] duration-200',
          seleccionado ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.55)]' : '',
        ].join(' ')}
      >
        <svg
          viewBox="0 0 64 112"
          className="h-[64px] w-[38px] sm:h-[76px] sm:w-[44px]"
          style={{ transform: superior ? undefined : 'scaleY(-1)' }}
        >
          <g opacity={ausente ? 0.4 : 1} filter={ausente ? undefined : 'url(#od-sombra)'}>
            {/* Raíces */}
            {anatomia.raices.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={ausente ? 'none' : 'url(#od-raiz)'}
                stroke={ausente ? '#94a3b8' : '#8d7f6b'}
                strokeWidth={ausente ? 1.6 : 0.8}
                strokeDasharray={ausente ? '5 4' : undefined}
                strokeLinejoin="round"
              />
            ))}
            {/* Endodoncia: conductos obturados dentro de la raíz */}
            {estado === 'endodoncia' &&
              anatomia.raices.map((d, i) => (
                <path key={`c${i}`} d={d} fill="none" stroke="#8b5cf6" strokeWidth={4} strokeDasharray="3 4" opacity={0.85} />
              ))}

            {/* Corona: esmalte */}
            <path d={anatomia.corona} fill={ausente ? 'none' : 'url(#od-esmalte)'} />
            {/* Tinte del estado */}
            {estado !== 'sano' && estado !== 'ausente' && !corona && (
              <path d={anatomia.corona} fill={meta.color} opacity={TINTE} />
            )}
            {/* Corona protésica: acabado metálico completo */}
            {corona && <path d={anatomia.corona} fill="url(#od-metal)" />}

            {/* Relieve oclusal */}
            <g stroke="#7b6a55" strokeOpacity={0.45} strokeWidth={1.2} strokeLinecap="round" fill="none">
              {anatomia.surcos.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>

            {/* Brillo especular: es lo que da la lectura de volumen */}
            {!ausente && (
              <>
                <ellipse cx={24} cy={72} rx={6} ry={13} fill="url(#od-brillo)" opacity={0.75} />
                <path d={anatomia.corona} fill="url(#od-volumen)" style={{ mixBlendMode: 'multiply' }} />
              </>
            )}

            {/* Caries: lesión en la cara oclusal */}
            {estado === 'caries' && (
              <>
                <ellipse cx={cx} cy={cy} rx={rx * 0.5} ry={ry * 0.5} fill="#7f1d1d" />
                <ellipse cx={cx - rx * 0.22} cy={cy - ry * 0.18} rx={rx * 0.22} ry={ry * 0.22} fill="#450a0a" />
              </>
            )}
            {/* Obturación: incrustación en la cara oclusal */}
            {estado === 'obturado' && (
              <rect
                x={cx - rx * 0.55}
                y={cy - ry * 0.5}
                width={rx * 1.1}
                height={ry}
                rx={3}
                fill="url(#od-amalgama)"
                stroke="#1e3a8a"
                strokeWidth={0.8}
              />
            )}
            {/* Fractura: línea de fractura coronaria */}
            {estado === 'fractura' && (
              <path
                d={`M${cx - rx * 0.9} ${cy + ry} L ${cx - 3} ${cy - 6} L ${cx + 6} ${cy + 3} L ${cx + rx * 0.85} ${cy - ry * 1.6}`}
                fill="none"
                stroke="#fdf2f8"
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {/* Extracción indicada */}
            {estado === 'extraccion' && (
              <g stroke="#fee2e2" strokeWidth={4} strokeLinecap="round">
                <line x1={14} y1={22} x2={50} y2={100} />
                <line x1={50} y1={22} x2={14} y2={100} />
              </g>
            )}

            {/* Contorno */}
            <path
              d={anatomia.corona}
              fill="none"
              stroke={seleccionado ? '#38bdf8' : ausente ? '#94a3b8' : '#6b7280'}
              strokeWidth={seleccionado ? 3 : ausente ? 1.6 : 1.2}
              strokeLinejoin="round"
              strokeDasharray={ausente ? '5 4' : undefined}
            />
          </g>
        </svg>
        {/* Punto indicador cuando la pieza tiene registro pero el estado es sutil */}
        {anotado && !seleccionado && (
          <span
            className="absolute right-0 top-0 block h-2 w-2 rounded-full ring-2 ring-slate-900/40"
            style={{ backgroundColor: meta.color }}
          />
        )}
      </span>

      <span
        className={[
          'mt-0.5 rounded px-1 text-[11px] font-bold tabular-nums transition-colors',
          seleccionado ? 'bg-sky-500 text-white' : 'text-muted-foreground group-hover:text-foreground',
        ].join(' ')}
      >
        {numero}
      </span>
      {caras.length > 0 && (
        <span className="text-[9px] font-medium uppercase tracking-wide text-sky-400">
          {caras.length} {caras.length === 1 ? 'cara' : 'caras'}
        </span>
      )}
    </button>
  )
}

export default memo(DienteSVG)

/** Degradados y filtros compartidos por las 32 piezas (se declaran una sola vez). */
export function OdontogramaDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id="od-esmalte" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#f3f6f9" />
          <stop offset="100%" stopColor="#cdd6e0" />
        </linearGradient>
        <linearGradient id="od-raiz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9b79b" />
          <stop offset="35%" stopColor="#efe3d0" />
          <stop offset="100%" stopColor="#a8987e" />
        </linearGradient>
        <radialGradient id="od-brillo" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="od-volumen" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="62%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#5b6675" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="od-metal" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="#7c5c14" />
          <stop offset="28%" stopColor="#fcd34d" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78500c" />
        </linearGradient>
        <linearGradient id="od-amalgama" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="60%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id="od-sombra" x="-40%" y="-25%" width="180%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.45" />
        </filter>
      </defs>
    </svg>
  )
}
