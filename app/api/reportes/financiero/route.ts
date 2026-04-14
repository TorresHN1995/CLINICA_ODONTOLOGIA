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

    // Obtener datos financieros
    const [facturas, pagos, ingresos, egresos] = await Promise.all([
      prisma.factura.findMany({
        where: {
          createdAt: { gte: fechaInicio, lte: fechaFin }
        },
        include: { items: true, paciente: true }
      }),
      prisma.pago.findMany({
        where: {
          fecha: { gte: fechaInicio, lte: fechaFin }
        }
      }),
      prisma.ingreso.findMany({
        where: {
          fecha: { gte: fechaInicio, lte: fechaFin }
        }
      }),
      prisma.egreso.findMany({
        where: {
          createdAt: { gte: fechaInicio, lte: fechaFin }
        }
      })
    ])

    // Calcular totales
    const totalFacturas = facturas.reduce((sum, f) => sum + parseFloat(f.total.toString()), 0)
    const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto.toString()), 0)
    const totalIngresos = ingresos.reduce((sum, i) => sum + parseFloat(i.monto.toString()), 0)
    const totalEgresos = egresos.reduce((sum, e) => sum + parseFloat(e.monto.toString()), 0)

    // Agrupar por estado
    const facturasPorEstado = {
      pagada: facturas.filter(f => f.estado === 'PAGADA').reduce((sum, f) => sum + parseFloat(f.total.toString()), 0),
      pagadaParcial: facturas.filter(f => f.estado === 'PAGADA_PARCIAL').reduce((sum, f) => sum + parseFloat(f.total.toString()), 0),
      pendiente: facturas.filter(f => f.estado === 'PENDIENTE').reduce((sum, f) => sum + parseFloat(f.total.toString()), 0),
      anulada: facturas.filter(f => f.estado === 'ANULADA').reduce((sum, f) => sum + parseFloat(f.total.toString()), 0),
    }

    // Agrupar por método de pago
    const metodosPago = {}
    pagos.forEach(p => {
      metodosPago[p.metodoPago] = (metodosPago[p.metodoPago] || 0) + parseFloat(p.monto.toString())
    })

    // Agrupar egresos por categoría
    const egresosPorCategoria = {}
    egresos.forEach(e => {
      egresosPorCategoria[e.categoria] = (egresosPorCategoria[e.categoria] || 0) + parseFloat(e.monto.toString())
    })

    // Calcular utilidad
    const utilidad = totalIngresos - totalEgresos
    const margenUtilidad = totalIngresos > 0 ? (utilidad / totalIngresos) * 100 : 0

    // Top pacientes por gasto
    const pacientesGasto = {}
    facturas.forEach(f => {
      const key = `${f.paciente.nombre} ${f.paciente.apellido}`
      pacientesGasto[key] = (pacientesGasto[key] || 0) + parseFloat(f.total.toString())
    })

    const topPacientes = Object.entries(pacientesGasto)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nombre, total]) => ({ nombre, total }))

    return NextResponse.json({
      periodo: {
        mes,
        año,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      },
      resumen: {
        totalFacturas,
        totalPagos,
        totalIngresos,
        totalEgresos,
        utilidad,
        margenUtilidad: margenUtilidad.toFixed(2),
        saldoPendiente: totalFacturas - totalPagos,
      },
      facturas: {
        cantidad: facturas.length,
        porEstado: {
          pagada: facturas.filter(f => f.estado === 'PAGADA').length,
          pagadaParcial: facturas.filter(f => f.estado === 'PAGADA_PARCIAL').length,
          pendiente: facturas.filter(f => f.estado === 'PENDIENTE').length,
          anulada: facturas.filter(f => f.estado === 'ANULADA').length,
        },
        montosPorEstado: facturasPorEstado,
      },
      pagos: {
        cantidad: pagos.length,
        metodosPago,
      },
      egresos: {
        cantidad: egresos.length,
        porCategoria: egresosPorCategoria,
      },
      topPacientes,
    })
  } catch (error) {
    console.error('Error al generar reporte financiero:', error)
    return NextResponse.json(
      { error: 'Error al generar reporte' },
      { status: 500 }
    )
  }
}
