import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listado de flujo de caja
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const tipo = searchParams.get('tipo') // INGRESO/EGRESO/AJUSTE

    const where: any = {}
    if (tipo) where.tipo = tipo
    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      }
    }

    const flujo = await prisma.flujoCaja.findMany({
      where,
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(flujo)
  } catch (error) {
    console.error('Error al obtener flujo de caja:', error)
    return NextResponse.json(
      { error: 'Error al obtener flujo de caja' },
      { status: 500 }
    )
  }
}


