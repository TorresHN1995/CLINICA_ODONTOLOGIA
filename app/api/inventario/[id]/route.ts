import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  categoria: z
    .enum([
      'MATERIAL_DENTAL',
      'INSTRUMENTAL',
      'MEDICAMENTO',
      'CONSUMIBLE',
      'EQUIPAMIENTO',
      'OTRO',
    ])
    .optional(),
  unidadMedida: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  stockMinimo: z.number().int().min(0).optional(),
  precioCompra: z.number().min(0).optional(),
  precioVenta: z.number().min(0).nullable().optional(),
  proveedor: z.string().nullable().optional(),
  activo: z.boolean().optional(),
})

// PUT - Actualizar material
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const item = await prisma.inventario.update({
      where: { id: params.id },
      data: {
        ...(validated.nombre !== undefined && { nombre: validated.nombre }),
        ...(validated.descripcion !== undefined && { descripcion: validated.descripcion }),
        ...(validated.categoria !== undefined && { categoria: validated.categoria }),
        ...(validated.unidadMedida !== undefined && { unidadMedida: validated.unidadMedida }),
        ...(validated.stock !== undefined && { stock: validated.stock }),
        ...(validated.stockMinimo !== undefined && { stockMinimo: validated.stockMinimo }),
        ...(validated.precioCompra !== undefined && { precioCompra: validated.precioCompra }),
        ...(validated.precioVenta !== undefined && { precioVenta: validated.precioVenta }),
        ...(validated.proveedor !== undefined && { proveedor: validated.proveedor }),
        ...(validated.activo !== undefined && { activo: validated.activo }),
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar material:', error)
    return NextResponse.json(
      { error: 'Error al actualizar material' },
      { status: 500 }
    )
  }
}

// DELETE - Desactivar material (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const item = await prisma.inventario.update({
      where: { id: params.id },
      data: { activo: false },
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error al eliminar material:', error)
    return NextResponse.json(
      { error: 'Error al eliminar material' },
      { status: 500 }
    )
  }
}


