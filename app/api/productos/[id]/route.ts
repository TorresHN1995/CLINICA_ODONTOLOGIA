import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  codigo: z.string().min(1).optional(),
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  tipo: z.enum(['PRODUCTO', 'SERVICIO']).optional(),
  precio: z.number().positive().optional(),
  isv: z.number().min(0).max(100).optional(),
  activo: z.boolean().optional(),
  inventarioId: z.string().nullable().optional(),
})

// PUT - Actualizar producto/servicio
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const producto = await prisma.productoServicio.update({
      where: { id: params.id },
      data: validated,
    })

    return NextResponse.json(producto)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    console.error('Error al actualizar producto:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

// DELETE - Desactivar producto/servicio
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.productoServicio.update({
      where: { id: params.id },
      data: { activo: false },
    })

    return NextResponse.json({ message: 'Producto desactivado' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    console.error('Error al eliminar producto:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
