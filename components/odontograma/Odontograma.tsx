'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eraser, Info } from 'lucide-react'
import Diente, { OdontogramaDefs } from './Diente'
import MapaCaras from './MapaCaras'
import {
  ARCADA_INFERIOR,
  ARCADA_SUPERIOR,
  CaraDiente,
  DienteEstado,
  ESTADOS,
  EstadoDiente,
  ORDEN_ESTADOS,
  OdontogramaData,
  nombreDiente,
  piezasAfectadas,
} from '@/lib/odontograma'

interface OdontogramaProps {
  data?: OdontogramaData
  editable?: boolean
  onChange?: (data: OdontogramaData) => void
}

/** Separación visual entre hemiarcadas (línea media). */
const MITAD = 8

/** Curvatura de la arcada: las piezas posteriores se separan del plano oclusal. */
function desplazamientoArco(indice: number) {
  const t = (indice - (ARCADA_SUPERIOR.length - 1) / 2) / ((ARCADA_SUPERIOR.length - 1) / 2)
  return Math.round(16 * t * t)
}

export default function Odontograma({ data = {}, editable = true, onChange }: OdontogramaProps) {
  const [seleccionado, setSeleccionado] = useState<number | null>(null)
  const [registro, setRegistro] = useState<OdontogramaData>(data)

  // El expediente carga de forma asíncrona: hay que re-sincronizar cuando llega.
  // Se compara por contenido y no por identidad para no entrar en bucle cuando el
  // padre reconstruye el objeto en cada render.
  const dataKey = JSON.stringify(data || {})
  useEffect(() => {
    setRegistro(JSON.parse(dataKey))
  }, [dataKey])

  const actualizar = (siguiente: OdontogramaData) => {
    setRegistro(siguiente)
    onChange?.(siguiente)
  }

  const actual: DienteEstado | undefined = seleccionado !== null ? registro[seleccionado] : undefined

  const setDiente = (cambios: Partial<DienteEstado>) => {
    if (!editable || seleccionado === null) return
    const previo = registro[seleccionado]
    actualizar({
      ...registro,
      [seleccionado]: {
        numero: seleccionado,
        estado: previo?.estado || 'sano',
        caras: previo?.caras || [],
        notas: previo?.notas || '',
        ...cambios,
      },
    })
  }

  const limpiarDiente = () => {
    if (!editable || seleccionado === null) return
    const siguiente = { ...registro }
    delete siguiente[seleccionado]
    actualizar(siguiente)
  }

  const toggleCara = (cara: CaraDiente) => {
    const caras = actual?.caras || []
    setDiente({ caras: caras.includes(cara) ? caras.filter((c) => c !== cara) : [...caras, cara] })
  }

  const afectadas = useMemo(() => piezasAfectadas(registro), [registro])

  const renderArcada = (piezas: number[], superior: boolean) => (
    // items-start: todas las piezas miden lo mismo, así el número queda alineado
    // aunque alguna muestre la línea extra de caras marcadas.
    <div className="flex items-start justify-center">
      {piezas.map((numero, i) => (
        <div
          key={numero}
          style={{
            transform: `translateY(${superior ? -desplazamientoArco(i) : desplazamientoArco(i)}px)`,
            marginLeft: i === piezas.length / 2 ? MITAD : undefined,
          }}
        >
          <Diente
            numero={numero}
            registro={registro[numero]}
            seleccionado={seleccionado === numero}
            editable={editable}
            onSelect={(n) => setSeleccionado(seleccionado === n ? null : n)}
          />
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-5">
      <OdontogramaDefs />

      {/* Arcadas */}
      {/* py generoso: la curvatura de la arcada desplaza las piezas posteriores
          hasta 16px y `overflow-x-auto` recortaría lo que se salga en vertical. */}
      <div className="overflow-x-auto rounded-xl border border-border bg-muted/60 px-4 py-8 sm:px-6">
        <div className="mx-auto min-w-[720px] max-w-4xl">
          {/* Etiquetas de cuadrante */}
          <div className="mb-1 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Cuadrante 1 · superior derecho</span>
            <span>Cuadrante 2 · superior izquierdo</span>
          </div>

          {renderArcada(ARCADA_SUPERIOR, true)}

          {/* Línea media / plano oclusal */}
          <div className="relative my-3 h-px bg-gradient-to-r from-transparent via-border to-transparent">
            <span className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
          </div>

          {renderArcada(ARCADA_INFERIOR, false)}

          <div className="mt-1 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Cuadrante 4 · inferior derecho</span>
            <span>Cuadrante 3 · inferior izquierdo</span>
          </div>
        </div>
      </div>

      {/* Ayuda / resumen */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {editable && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Info className="h-4 w-4" />
            Haz clic en una pieza para registrar su estado.
          </span>
        )}
        <span className="font-semibold text-foreground">
          {afectadas.length === 0
            ? 'Sin hallazgos registrados'
            : `${afectadas.length} ${afectadas.length === 1 ? 'pieza con hallazgo' : 'piezas con hallazgos'}: ${afectadas
                .map((d) => d.numero)
                .join(', ')}`}
        </span>
      </div>

      {/* Panel de la pieza seleccionada */}
      {seleccionado !== null && (
        <div className="card animate-slide-in space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">Pieza {seleccionado}</h3>
              <p className="text-sm capitalize text-muted-foreground">{nombreDiente(seleccionado)}</p>
            </div>
            {editable && registro[seleccionado] && (
              <button
                type="button"
                onClick={limpiarDiente}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Eraser className="h-4 w-4" />
                Quitar registro
              </button>
            )}
          </div>

          <div>
            <label className="label">Estado</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ORDEN_ESTADOS.map((key) => {
                const meta = ESTADOS[key]
                const activo = (actual?.estado || 'sano') === key
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!editable}
                    onClick={() => setDiente({ estado: key as EstadoDiente })}
                    className={[
                      'flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all',
                      activo ? 'border-sky-500 bg-sky-500/10' : 'border-border hover:border-slate-500',
                    ].join(' ')}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-black/20"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-sm font-medium text-foreground">{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {(actual?.estado || 'sano') !== 'sano' && (
            <MapaCaras
              numero={seleccionado}
              caras={actual?.caras || []}
              color={ESTADOS[actual?.estado || 'sano'].color}
              editable={editable}
              onToggle={toggleCara}
            />
          )}

          <div>
            <label className="label">Notas de la pieza</label>
            <textarea
              rows={2}
              readOnly={!editable}
              className="input-field"
              placeholder="Observaciones clínicas sobre esta pieza..."
              value={actual?.notas || ''}
              onChange={(e) => setDiente({ notas: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="card">
        <h3 className="mb-3 text-sm font-bold text-foreground">Leyenda</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ORDEN_ESTADOS.map((key) => (
            <div key={key} className="flex items-center space-x-2">
              <div
                className="h-4 w-4 rounded border border-border"
                style={{ backgroundColor: ESTADOS[key].color }}
              />
              <span className="text-sm text-muted-foreground">{ESTADOS[key].label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
