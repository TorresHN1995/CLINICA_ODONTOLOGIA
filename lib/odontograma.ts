// Modelo de dominio del odontograma (numeración FDI, dentición permanente).
//
// Se comparte entre el componente visual, el formulario de expediente nuevo y el
// detalle del expediente, para que el texto del diagnóstico se redacte SIEMPRE con
// la misma terminología clínica que muestra la leyenda.

export type EstadoDiente =
  | 'sano'
  | 'caries'
  | 'obturado'
  | 'corona'
  | 'extraccion'
  | 'ausente'
  | 'endodoncia'
  | 'fractura'

export type CaraDiente = 'oclusal' | 'vestibular' | 'lingual' | 'mesial' | 'distal'

export interface DienteEstado {
  numero: number
  estado: EstadoDiente
  /** Caras/superficies afectadas. Opcional: los expedientes antiguos no la traen. */
  caras?: CaraDiente[]
  notas: string
}

export type OdontogramaData = Record<number, DienteEstado>

export interface EstadoMeta {
  label: string
  color: string
  /** Frase en tercera persona para redactar el diagnóstico. */
  frase: string
  /** `false` para el estado base: no genera hallazgo. */
  hallazgo: boolean
}

export const ESTADOS: Record<EstadoDiente, EstadoMeta> = {
  sano: { label: 'Sano', color: '#e8eef5', frase: 'sin hallazgos', hallazgo: false },
  caries: { label: 'Caries', color: '#ef4444', frase: 'caries', hallazgo: true },
  obturado: { label: 'Obturado', color: '#3b82f6', frase: 'obturación', hallazgo: true },
  corona: { label: 'Corona', color: '#f59e0b', frase: 'corona protésica', hallazgo: true },
  extraccion: { label: 'Extracción', color: '#dc2626', frase: 'indicada para extracción', hallazgo: true },
  ausente: { label: 'Ausente', color: '#94a3b8', frase: 'pieza ausente', hallazgo: true },
  endodoncia: { label: 'Endodoncia', color: '#8b5cf6', frase: 'tratamiento de conductos', hallazgo: true },
  fractura: { label: 'Fractura', color: '#ec4899', frase: 'fractura coronaria', hallazgo: true },
}

export const ORDEN_ESTADOS: EstadoDiente[] = [
  'sano',
  'caries',
  'obturado',
  'corona',
  'endodoncia',
  'fractura',
  'extraccion',
  'ausente',
]

// Arcadas en el orden en que se dibujan (de derecha a izquierda del paciente).
export const ARCADA_SUPERIOR = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
export const ARCADA_INFERIOR = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

export type TipoDiente = 'incisivo' | 'canino' | 'premolar' | 'molar'

/** Cuadrante FDI: 1 sup. derecho, 2 sup. izquierdo, 3 inf. izquierdo, 4 inf. derecho. */
export function cuadrante(numero: number): 1 | 2 | 3 | 4 {
  return Math.floor(numero / 10) as 1 | 2 | 3 | 4
}

/** Posición dentro del cuadrante (1 = incisivo central … 8 = tercer molar). */
export function posicion(numero: number): number {
  return numero % 10
}

export function esSuperior(numero: number): boolean {
  const c = cuadrante(numero)
  return c === 1 || c === 2
}

export function tipoDiente(numero: number): TipoDiente {
  const p = posicion(numero)
  if (p <= 2) return 'incisivo'
  if (p === 3) return 'canino'
  if (p <= 5) return 'premolar'
  return 'molar'
}

const NOMBRES_POSICION: Record<number, string> = {
  1: 'incisivo central',
  2: 'incisivo lateral',
  3: 'canino',
  4: 'primer premolar',
  5: 'segundo premolar',
  6: 'primer molar',
  7: 'segundo molar',
  8: 'tercer molar',
}

/** Nombre clínico completo: «primer molar superior derecho». */
export function nombreDiente(numero: number): string {
  const base = NOMBRES_POSICION[posicion(numero)] || 'pieza'
  const arcada = esSuperior(numero) ? 'superior' : 'inferior'
  const lado = cuadrante(numero) === 1 || cuadrante(numero) === 4 ? 'derecho' : 'izquierdo'
  return `${base} ${arcada} ${lado}`
}

export const CARAS: CaraDiente[] = ['oclusal', 'vestibular', 'lingual', 'mesial', 'distal']

/** Los dientes anteriores no tienen cara oclusal (es incisal) y la lingual superior es palatina. */
export function nombreCara(cara: CaraDiente, numero: number): string {
  const anterior = tipoDiente(numero) === 'incisivo' || tipoDiente(numero) === 'canino'
  if (cara === 'oclusal') return anterior ? 'incisal' : 'oclusal'
  if (cara === 'lingual') return esSuperior(numero) ? 'palatina' : 'lingual'
  return cara
}

/** Lee el JSON guardado en `expedientes.odontograma`, tolerando datos vacíos o corruptos. */
export function parseOdontograma(json: string | null | undefined): OdontogramaData {
  if (!json) return {}
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json
    if (!parsed || typeof parsed !== 'object') return {}
    const data: OdontogramaData = {}
    for (const [key, value] of Object.entries(parsed as Record<string, any>)) {
      const numero = Number(key)
      if (!Number.isFinite(numero) || !value) continue
      const estado: EstadoDiente = ESTADOS[value.estado as EstadoDiente] ? value.estado : 'sano'
      data[numero] = {
        numero,
        estado,
        caras: Array.isArray(value.caras) ? value.caras.filter((c: any) => CARAS.includes(c)) : [],
        notas: typeof value.notas === 'string' ? value.notas : '',
      }
    }
    return data
  } catch {
    return {}
  }
}

/** Solo las piezas con hallazgo real, en orden de numeración FDI de arcada. */
export function piezasAfectadas(data: OdontogramaData): DienteEstado[] {
  const orden = [...ARCADA_SUPERIOR, ...ARCADA_INFERIOR]
  return orden
    .map((n) => data[n])
    .filter((d): d is DienteEstado => Boolean(d) && ESTADOS[d.estado]?.hallazgo)
}

function listar(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

/** Frase de una sola pieza: «Pieza 16 (primer molar superior derecho): caries en oclusal y mesial.» */
export function fraseDiente(diente: DienteEstado): string {
  const meta = ESTADOS[diente.estado]
  const caras = (diente.caras || []).map((c) => nombreCara(c, diente.numero))
  const ubicacion = caras.length > 0 ? ` en ${listar(caras)}` : ''
  const nota = diente.notas?.trim() ? ` Nota: ${diente.notas.trim()}` : ''
  return `Pieza ${diente.numero} (${nombreDiente(diente.numero)}): ${meta.frase}${ubicacion}.${nota}`
}

/**
 * Redacta el diagnóstico a partir del odontograma. Se recalcula cada vez que el
 * odontólogo marca una pieza; el texto siempre queda editable en el formulario.
 */
export function generarDiagnostico(data: OdontogramaData): string {
  const afectadas = piezasAfectadas(data)
  if (afectadas.length === 0) return ''

  const resumen = new Map<EstadoDiente, number[]>()
  for (const d of afectadas) {
    resumen.set(d.estado, [...(resumen.get(d.estado) || []), d.numero])
  }

  const encabezado =
    afectadas.length === 1
      ? 'Al examen clínico se registra 1 pieza con hallazgos:'
      : `Al examen clínico se registran ${afectadas.length} piezas con hallazgos:`

  const detalle = afectadas.map((d) => `• ${fraseDiente(d)}`).join('\n')

  const conteo = ORDEN_ESTADOS.filter((e) => resumen.has(e))
    .map((e) => {
      const piezas = resumen.get(e)!
      return `${ESTADOS[e].label.toLowerCase()}: ${piezas.join(', ')}`
    })
    .join(' · ')

  return `${encabezado}\n${detalle}\n\nResumen — ${conteo}.`
}
