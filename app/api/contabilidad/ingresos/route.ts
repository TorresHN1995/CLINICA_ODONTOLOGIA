import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listado de ingresos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const categoria = searchParams.get('categoria')

    const where: any = {}
    if (categoria) where.categoria = categoria
    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      }
    }

    const ingresos = await prisma.ingreso.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        factura: {
          select: { numero: true, pacienteId: true, total: true, estado: true },
        },
      },
    })

    return NextResponse.json(ingresos)
  } catch (error) {
    console.error('Error al obtener ingresos:', error)
    return NextResponse.json(
      { error: 'Error al obtener ingresos' },
      { status: 500 }
    )
  }
}


