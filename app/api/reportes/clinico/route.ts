import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1))
    const año = parseInt(searchParams.get('año') || String(new Date().getFullYear()))

    // Calcular rango de fechas
    const fechaInicio = new Date(año, mes - 1, 1)
    const fechaFin = new Date(año, mes, 0, 23, 59, 59)

    // Obtener datos clínicos
    const [citas, expedientes, tratamientos, procedimientos] = await Promise.all([
      prisma.cita.findMany({
        where: {
          fecha: { gte: fechaInicio, lte: fechaFin }
        },
        include: { paciente: true }
      }),
      prisma.expediente.findMany({
        where: {
          createdAt: { gte: fechaInicio, lte: fechaFin }
        }
      }),
      prisma.tratamiento.findMany({
        where: {
          createdAt: { gte: fechaInicio, lte: fechaFin }
        }
      }),
      prisma.procedimiento.findMany({
        where: {
          createdAt: { gte: fechaInicio, lte: fechaFin }
        }
      })
    ])

    // Agrupar citas por estado
    const citasPorEstado = {
      programada: citas.filter(c => c.estado === 'PROGRAMADA').length,
      confirmada: citas.filter(c => c.estado === 'CONFIRMADA').length,
      enCurso: citas.filter(c => c.estado === 'EN_CURSO').length,
      completada: citas.filter(c => c.estado === 'COMPLETADA').length,
      cancelada: citas.filter(c => c.estado === 'CANCELADA').length,
      noAsistio: citas.filter(c => c.estado === 'NO_ASISTIO').length,
    }

    // Agrupar citas por tipo
    const citasPorTipo: Record<string, number> = {}
    citas.forEach(c => {
      citasPorTipo[c.tipoCita] = (citasPorTipo[c.tipoCita] || 0) + 1
    })

    // Agrupar tratamientos por estado
    const tratamientosPorEstado = {
      planificado: tratamientos.filter(t => t.estado === 'PLANIFICADO').length,
      enProgreso: tratamientos.filter(t => t.estado === 'EN_PROGRESO').length,
      pausado: tratamientos.filter(t => t.estado === 'PAUSADO').length,
      completado: tratamientos.filter(t => t.estado === 'COMPLETADO').length,
      cancelado: tratamientos.filter(t => t.estado === 'CANCELADO').length,
    }

    // Calcular tasa de asistencia
    const citasCompletadas = citas.filter(c => c.estado === 'COMPLETADA').length
    const citasNoAsistio = citas.filter(c => c.estado === 'NO_ASISTIO').length
    const tasaAsistencia = citas.length > 0 ? ((citasCompletadas / citas.length) * 100) : 0

    // Pacientes atendidos
    const pacientesUnicos = new Set(citas.map(c => c.pacienteId)).size

    // Costo promedio de procedimientos
    const costoProcedimientos = procedimientos.reduce((sum, p) => sum + parseFloat(p.precio?.toString() || '0'), 0)
    const costoProcedimientoPromedio = procedimientos.length > 0 ? (costoProcedimientos / procedimientos.length).toFixed(2) : 0

    // Procedimientos por tipo
    const procedimientosPorTipo: Record<string, number> = {}
    procedimientos.forEach(p => {
      procedimientosPorTipo[p.nombre] = (procedimientosPorTipo[p.nombre] || 0) + 1
    })

    // Top procedimientos
    const topProcedimientos = Object.entries(procedimientosPorTipo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))

    return NextResponse.json({
      periodo: {
        mes,
        año,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      },
      resumen: {
        citasTotal: citas.length,
        expedientesCreados: expedientes.length,
        tratamientosCreados: tratamientos.length,
        procedimientosRealizados: procedimientos.length,
        pacientesAtendidos: pacientesUnicos,
        tasaAsistencia: parseFloat(tasaAsistencia.toFixed(2)),
      },
      citas: {
        porEstado: citasPorEstado,
        porTipo: citasPorTipo,
        completadas: citasCompletadas,
        noAsistio: citasNoAsistio,
      },
      tratamientos: {
        porEstado: tratamientosPorEstado,
        costoTotal: tratamientos.reduce((sum, t) => sum + parseFloat(t.costoTotal?.toString() || '0'), 0),
        costoPromedio: tratamientos.length > 0 ? (tratamientos.reduce((sum, t) => sum + parseFloat(t.costoTotal?.toString() || '0'), 0) / tratamientos.length).toFixed(2) : 0,
      },
      procedimientos: {
        cantidad: procedimientos.length,
        costoTotal: costoProcedimientos,
        costoPromedio: costoProcedimientoPromedio,
        porTipo: procedimientosPorTipo,
        topProcedimientos,
      },
    })
  } catch (error) {
    console.error('Error al generar reporte clínico:', error)
    return NextResponse.json(
      { error: 'Error al generar reporte' },
      { status: 500 }
    )
  }
}
