import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const insumoSchema = z.object({
  inventarioId: z.string(),
  cantidad: z.number().int().positive(),
})

// GET - Obtener insumos de un servicio
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const insumos = await prisma.servicioInsumo.findMany({
    where: { servicioId: params.id },
    include: {
      inventario: {
        select: { id: true, nombre: true, codigo: true, unidadMedida: true, stock: true, stockMinimo: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json(insumos)
}

// POST - Agregar insumo a un servicio
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { inventarioId, cantidad } = insumoSchema.parse(body)

    // Verificar que el inventario existe
    const inv = await prisma.inventario.findUnique({ where: { id: inventarioId } })
    if (!inv) return NextResponse.json({ error: 'Insumo de inventario no encontrado' }, { status: 404 })

    const insumo = await prisma.servicioInsumo.upsert({
      where: { servicioId_inventarioId: { servicioId: params.id, inventarioId } },
      update: { cantidad },
      create: { servicioId: params.id, inventarioId, cantidad },
      include: {
        inventario: {
          select: { id: true, nombre: true, codigo: true, unidadMedida: true, stock: true, stockMinimo: true }
        }
      }
    })

    return NextResponse.json(insumo, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Error al agregar insumo' }, { status: 500 })
  }
}

// DELETE - Eliminar insumo de un servicio
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const insumoId = searchParams.get('insumoId')
  if (!insumoId) return NextResponse.json({ error: 'insumoId requerido' }, { status: 400 })

  await prisma.servicioInsumo.delete({ where: { id: insumoId } })
  return NextResponse.json({ success: true })
}
