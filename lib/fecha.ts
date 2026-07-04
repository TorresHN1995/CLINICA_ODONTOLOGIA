import { startOfDay, endOfDay } from 'date-fns'

// Utilidades de fecha para una app de zona horaria única (Honduras / America/Tegucigalpa).
//
// Un <input type="date"> envía 'yyyy-MM-dd'. `new Date('yyyy-MM-dd')` lo parsea como
// MEDIANOCHE UTC, lo que en una zona UTC-negativa cae en el día anterior y desfasa
// todos los filtros/guardados por día. Estas funciones lo interpretan en hora LOCAL.

/** Parsea 'yyyy-MM-dd' (o el prefijo de fecha de un ISO) como medianoche LOCAL. */
export function parseFechaLocal(str: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(str)
}

/** Inicio del día LOCAL (00:00:00.000) para una fecha 'yyyy-MM-dd'. */
export function inicioDiaLocal(str: string): Date {
  return startOfDay(parseFechaLocal(str))
}

/** Fin del día LOCAL (23:59:59.999, inclusivo) para una fecha 'yyyy-MM-dd'. */
export function finDiaLocal(str: string): Date {
  return endOfDay(parseFechaLocal(str))
}

/** Fecha de HOY en 'yyyy-MM-dd' en hora LOCAL (para valores por defecto de formularios). */
export function hoyLocalISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
