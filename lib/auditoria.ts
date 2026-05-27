import { prisma } from '@/lib/prisma'
import type { AccionAuditoria } from '@prisma/client'

/**
 * Bitácora de auditoría.
 *
 * Registra acciones sensibles del sistema (crear/editar/anular/eliminar/exportar).
 * El registro es "best-effort": si falla, se loguea pero NUNCA interrumpe la
 * operación principal (igual que el flujo de caja).
 */

interface ActorSession {
  user?: {
    id?: string | null
    name?: string | null
  } | null
}

interface AuditoriaDetalle {
  accion: AccionAuditoria
  entidad: string
  entidadId?: string | null
  descripcion: string
  datos?: Record<string, unknown> | null
}

// Extrae la IP de origen de la petición (mejor esfuerzo).
function obtenerIp(request: Request | null): string | null {
  if (!request) return null
  const fwd = request.headers.get('x-forwarded-for')
  const ip = fwd?.split(',')[0]?.trim()
  return ip || request.headers.get('x-real-ip') || null
}

/**
 * Registra una entrada de auditoría a partir de la sesión y la petición.
 * Uso típico dentro de un route handler:
 *
 *   await auditar(session, request, {
 *     accion: 'ANULAR',
 *     entidad: 'Factura',
 *     entidadId: factura.id,
 *     descripcion: `Anuló la factura ${factura.numero}`,
 *     datos: { total: factura.total },
 *   })
 */
export async function auditar(
  session: ActorSession | null,
  request: Request | null,
  detalle: AuditoriaDetalle
): Promise<void> {
  try {
    const data: Record<string, unknown> = {
      accion: detalle.accion,
      entidad: detalle.entidad,
      entidadId: detalle.entidadId ?? null,
      descripcion: detalle.descripcion,
      usuarioId: session?.user?.id ?? null,
      usuarioNombre: session?.user?.name ?? null,
      ip: obtenerIp(request),
    }
    // Solo incluir `datos` si viene algo, para no chocar con el manejo de JSON null
    if (detalle.datos != null) {
      data.datos = detalle.datos as any
    }

    await prisma.auditoria.create({ data: data as any })
  } catch (error) {
    console.error('Error al registrar auditoría:', error)
  }
}
