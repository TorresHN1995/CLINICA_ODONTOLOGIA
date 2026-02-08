import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

// GET - Obtener estadísticas para reportes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const inicio = fechaInicio
      ? startOfDay(new Date(fechaInicio))
      : startOfMonth(new Date())
    const fin = fechaFin
      ? endOfDay(new Date(fechaFin))
      : endOfMonth(new Date())

    const [
      pacientesNuevos,
      citasCompletadas,
      citasCanceladas,
      ingresosMes,
      serviciosRaw,
    ] = await Promise.all([
      // Pacientes nuevos en el rango
      prisma.paciente.count({
        where: { createdAt: { gte: inicio, lte: fin } },
      }),
      // Citas completadas
      prisma.cita.count({
        where: {
          fecha: { gte: inicio, lte: fin },
          estado: 'COMPLETADA',
        },
      }),
      // Citas canceladas
      prisma.cita.count({
        where: {
          fecha: { gte: inicio, lte: fin },
          estado: 'CANCELADA',
        },
      }),
      // Ingresos del periodo
      prisma.factura.aggregate({
        where: {
          fecha: { gte: inicio, lte: fin },
          estado: { in: ['PAGADA', 'PAGADA_PARCIAL'] },
        },
        _sum: { total: true },
      }),
      // Servicios más demandados (basado en items de factura)
      prisma.itemFactura.groupBy({
        by: ['descripcion'],
        where: {
          factura: {
            fecha: { gte: inicio, lte: fin },
          },
        },
        _sum: { cantidad: true },
        orderBy: { _sum: { cantidad: 'desc' } },
        take: 5,
      }),
    ])

    // Ingresos últimos 6 meses
    const ingresosUltimosMeses = []
    for (let i = 5; i >= 0; i--) {
      const mesDate = new Date()
      mesDate.setMonth(mesDate.getMonth() - i)
      const inicioMes = startOfMonth(mesDate)
      const finMes = endOfMonth(mesDate)

      const ingresos = await prisma.factura.aggregate({
        where: {
          fecha: { gte: inicioMes, lte: finMes },
          estado: { in: ['PAGADA', 'PAGADA_PARCIAL'] },
        },
        _sum: { total: true },
      })

      ingresosUltimosMeses.push({
        mes: mesDate.toLocaleDateString('es', { month: 'long' }),
        ingresos: Number(ingresos._sum.total || 0),
      })
    }

    const stats = {
      pacientesNuevos,
      citasCompletadas,
      citasCanceladas,
      ingresosMes: Number(ingresosMes._sum.total || 0),
      serviciosMasDemandados: serviciosRaw.map((s) => ({
        servicio: s.descripcion,
        cantidad: Number(s._sum.cantidad || 0),
      })),
      ingresosUltimosMeses,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error al obtener reportes:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    )
  }
}
