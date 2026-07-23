'use client'

import { CaraDiente, nombreCara } from '@/lib/odontograma'

/**
 * Mapa de superficies de una pieza: el esquema clásico de cinco zonas que se usa
 * en la ficha impresa. Marcar aquí es lo que hace que el diagnóstico se redacte
 * como «caries en oclusal y mesial» en vez de solo «caries».
 */

const ZONAS: { cara: CaraDiente; d: string; tx: number; ty: number }[] = [
  { cara: 'vestibular', d: 'M0 0 H100 L70 30 H30 Z', tx: 50, ty: 17 },
  { cara: 'distal', d: 'M100 0 V100 L70 70 V30 Z', tx: 85, ty: 53 },
  { cara: 'lingual', d: 'M0 100 H100 L70 70 H30 Z', tx: 50, ty: 88 },
  { cara: 'mesial', d: 'M0 0 V100 L30 70 V30 Z', tx: 15, ty: 53 },
  { cara: 'oclusal', d: 'M30 30 H70 V70 H30 Z', tx: 50, ty: 53 },
]

interface MapaCarasProps {
  numero: number
  caras: CaraDiente[]
  color: string
  editable?: boolean
  onToggle?: (cara: CaraDiente) => void
}

export default function MapaCaras({ numero, caras, color, editable = true, onToggle }: MapaCarasProps) {
  return (
    <div className="flex items-start gap-4">
      <svg viewBox="-2 -2 104 104" className="h-28 w-28 shrink-0">
        {ZONAS.map(({ cara, d, tx, ty }) => {
          const activa = caras.includes(cara)
          return (
            <g
              key={cara}
              onClick={editable && onToggle ? () => onToggle(cara) : undefined}
              className={editable ? 'cursor-pointer' : ''}
              role={editable ? 'button' : undefined}
              aria-pressed={activa}
            >
              <path
                d={d}
                fill={activa ? color : 'rgb(var(--card))'}
                fillOpacity={activa ? 0.9 : 1}
                stroke="rgb(var(--border))"
                strokeWidth={1.5}
                className={editable ? 'transition-colors hover:fill-slate-400/30' : ''}
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={700}
                fill={activa ? '#ffffff' : 'currentColor'}
                className={activa ? '' : 'text-muted-foreground'}
                pointerEvents="none"
              >
                {nombreCara(cara, numero).charAt(0).toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex-1 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Caras afectadas</p>
        <ul className="space-y-0.5">
          {ZONAS.map(({ cara }) => (
            <li key={cara} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm border border-border"
                style={{ backgroundColor: caras.includes(cara) ? color : 'transparent' }}
              />
              <span className={caras.includes(cara) ? 'text-foreground' : 'text-muted-foreground'}>
                {nombreCara(cara, numero).charAt(0).toUpperCase()} — {nombreCara(cara, numero)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
