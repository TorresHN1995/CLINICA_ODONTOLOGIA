import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

// GET - Obtener estadísticas financieras
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')

    const fechaBase = mes && anio 
      ? new Date(parseInt(anio), parseInt(mes) - 1, 1)
      : new Date()

    const inicioMes = startOfMonth(fechaBase)
    const finMes = endOfMonth(fechaBase)

    // Ingresos del mes
    const ingresosMes = await prisma.factura.aggregate({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
        estado: {
          in: ['PAGADA', 'PAGADA_PARCIAL'],
        },
      },
      _sum: {
        total: true,
      },
    })

    // Egresos del mes
    const egresosMes = await prisma.egreso.aggregate({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
        estado: {
          in: ['PAGADO', 'APROBADO'],
        },
      },
      _sum: {
        monto: true,
      },
    })

    // Ingresos por categoría
    const ingresosPorCategoria = await prisma.factura.groupBy({
      by: ['estado'],
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    })

    // Egresos por categoría
    const egresosPorCategoria = await prisma.egreso.groupBy({
      by: ['categoria'],
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
      },
      _sum: {
        monto: true,
      },
      _count: true,
    })

    // Flujo de caja últimos 6 meses
    const ultimosMeses = []
    for (let i = 5; i >= 0; i--) {
      const mesConsulta = subMonths(fechaBase, i)
      const inicioMesConsulta = startOfMonth(mesConsulta)
      const finMesConsulta = endOfMonth(mesConsulta)

      const [ingresos, egresos] = await Promise.all([
        prisma.factura.aggregate({
          where: {
            fecha: { gte: inicioMesConsulta, lte: finMesConsulta },
            estado: { in: ['PAGADA', 'PAGADA_PARCIAL'] },
          },
          _sum: { total: true },
        }),
        prisma.egreso.aggregate({
          where: {
            fecha: { gte: inicioMesConsulta, lte: finMesConsulta },
            estado: { in: ['PAGADO', 'APROBADO'] },
          },
          _sum: { monto: true },
        }),
      ])

      ultimosMeses.push({
        mes: mesConsulta.toLocaleDateString('es', { month: 'short', year: 'numeric' }),
        ingresos: Number(ingresos._sum.total || 0),
        egresos: Number(egresos._sum.monto || 0),
        ganancia: Number(ingresos._sum.total || 0) - Number(egresos._sum.monto || 0),
      })
    }

    // Saldo actual (último registro de flujo de caja)
    const ultimoFlujo = await prisma.flujoCaja.findFirst({
      orderBy: { fecha: 'desc' },
    })

    const estadisticas = {
      resumen: {
        ingresosMes: Number(ingresosMes._sum.total || 0),
        egresosMes: Number(egresosMes._sum.monto || 0),
        gananciaMes: Number(ingresosMes._sum.total || 0) - Number(egresosMes._sum.monto || 0),
        saldoActual: ultimoFlujo ? Number(ultimoFlujo.saldoActual) : 0,
      },
      ingresosPorCategoria: ingresosPorCategoria.map(item => ({
        categoria: item.estado,
        monto: Number(item._sum.total || 0),
        cantidad: item._count,
      })),
      egresosPorCategoria: egresosPorCategoria.map(item => ({
        categoria: item.categoria,
        monto: Number(item._sum.monto || 0),
        cantidad: item._count,
      })),
      ultimosMeses,
    }

    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
