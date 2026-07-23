import { prisma } from './prisma'
import { inicioDiaLocal, finDiaLocal } from './fecha'

// Asignación automática de odontólogo para la agenda pública (/citas).
//
// El paciente que reserva por la web no elige profesional: el sistema le asigna
// uno que esté libre en el horario y se lo informa en la confirmación.

export interface Profesional {
  id: string
  nombre: string
  apellido: string
}

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/** Dos rangos [aIni,aFin) y [bIni,bFin) se pisan. */
export function seSolapan(aIni: number, aFin: number, bIni: number, bFin: number): boolean {
  return aIni < bFin && aFin > bIni
}

/**
 * Profesionales que pueden atender. Se prefiere a los ODONTOLOGO activos; si la
 * clínica todavía no tiene ninguno cargado se admite a los administradores, para
 * que la reserva en línea no quede inoperante.
 */
export async function profesionalesAtendiendo(): Promise<Profesional[]> {
  const odontologos = await prisma.usuario.findMany({
    where: { rol: 'ODONTOLOGO', activo: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
  })
  if (odontologos.length > 0) return odontologos

  return prisma.usuario.findMany({
    where: { rol: 'ADMINISTRADOR', activo: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
  })
}

interface AgendaDelDia {
  odontologoId: string
  horaInicio: string
  horaFin: string
  id: string
}

async function agendaDelDia(fecha: string, ids: string[]): Promise<AgendaDelDia[]> {
  if (ids.length === 0) return []
  return prisma.cita.findMany({
    where: {
      odontologoId: { in: ids },
      fecha: { gte: inicioDiaLocal(fecha), lte: finDiaLocal(fecha) },
      estado: { not: 'CANCELADA' },
    },
    select: { id: true, odontologoId: true, horaInicio: true, horaFin: true },
  })
}

export interface ResultadoAsignacion {
  profesional: Profesional
  /** Cuántos profesionales estaban libres en ese horario, contando al asignado. */
  libres: number
  /** true si se respetó el profesional que ya traía la cita. */
  conservoPreferido: boolean
}

/**
 * Elige un profesional libre en el horario pedido.
 *
 * - Si se pasa `preferidoId` y está libre, se conserva (reprogramaciones: el
 *   paciente sigue con su mismo doctor).
 * - Entre los libres gana el que menos citas tiene ese día, para repartir la
 *   carga; a igualdad de citas, por orden alfabético, que es estable.
 * - Devuelve `null` si nadie está libre.
 */
export async function asignarOdontologo(opciones: {
  fecha: string
  horaInicio: string
  horaFin: string
  preferidoId?: string | null
  excluirCitaId?: string | null
}): Promise<ResultadoAsignacion | null> {
  const { fecha, horaInicio, horaFin, preferidoId, excluirCitaId } = opciones

  const profesionales = await profesionalesAtendiendo()
  if (profesionales.length === 0) return null

  const citas = (await agendaDelDia(fecha, profesionales.map((p) => p.id))).filter(
    (c) => c.id !== excluirCitaId
  )

  const ini = horaAMinutos(horaInicio)
  const fin = horaAMinutos(horaFin)

  const carga = new Map<string, number>()
  const ocupado = new Set<string>()
  for (const cita of citas) {
    carga.set(cita.odontologoId, (carga.get(cita.odontologoId) || 0) + 1)
    if (seSolapan(ini, fin, horaAMinutos(cita.horaInicio), horaAMinutos(cita.horaFin))) {
      ocupado.add(cita.odontologoId)
    }
  }

  const libres = profesionales.filter((p) => !ocupado.has(p.id))
  if (libres.length === 0) return null

  const elegido =
    (preferidoId && libres.find((p) => p.id === preferidoId)) ||
    [...libres].sort((a, b) => {
      const diferencia = (carga.get(a.id) || 0) - (carga.get(b.id) || 0)
      if (diferencia !== 0) return diferencia
      return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, 'es')
    })[0]

  return {
    profesional: elegido,
    libres: libres.length,
    conservoPreferido: Boolean(preferidoId && elegido.id === preferidoId),
  }
}

/**
 * Cuántos profesionales quedan libres en cada franja horaria del día.
 * La agenda pública muestra un horario mientras haya AL MENOS UNO libre; antes
 * bastaba una cita de cualquier profesional para tapar la franja a todos.
 */
export async function libresPorFranja(
  fecha: string,
  franjas: { inicio: string; fin: string }[],
  odontologoId?: string | null
): Promise<Map<string, number>> {
  const todos = await profesionalesAtendiendo()
  const profesionales = odontologoId ? todos.filter((p) => p.id === odontologoId) : todos

  const conteo = new Map<string, number>()
  if (profesionales.length === 0) {
    for (const franja of franjas) conteo.set(franja.inicio, 0)
    return conteo
  }

  const citas = await agendaDelDia(fecha, profesionales.map((p) => p.id))

  for (const franja of franjas) {
    const ini = horaAMinutos(franja.inicio)
    const fin = horaAMinutos(franja.fin)
    const ocupados = new Set(
      citas
        .filter((c) => seSolapan(ini, fin, horaAMinutos(c.horaInicio), horaAMinutos(c.horaFin)))
        .map((c) => c.odontologoId)
    )
    conteo.set(franja.inicio, profesionales.length - ocupados.size)
  }

  return conteo
}
