import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Detalle de una compra
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const compra = await prisma.compra.findUnique({
      where: { id: params.id },
      include: {
        registrador: { select: { nombre: true, apellido: true } },
        egreso: { select: { id: true, categoria: true, estado: true } },
        detalles: {
          include: {
            inventario: { select: { id: true, codigo: true, nombre: true, unidadMedida: true } },
          },
        },
      },
    })

    if (!compra) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    }

    return NextResponse.json(compra)
  } catch (error) {
    console.error('Error al obtener compra:', error)
    return NextResponse.json({ error: 'Error al obtener compra' }, { status: 500 })
  }
}
