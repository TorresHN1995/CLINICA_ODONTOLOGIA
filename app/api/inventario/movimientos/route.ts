import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const movimientoSchema = z.object({
  inventarioId: z.string(),
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION']),
  cantidad: z.number().int().positive(),
  motivo: z.string().optional(),
})

// POST - Registrar movimiento de inventario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = movimientoSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventario.findUnique({
        where: { id: validated.inventarioId },
      })
      if (!item) throw new Error('Material no encontrado')

      let nuevoStock = item.stock
      if (validated.tipo === 'ENTRADA' || validated.tipo === 'DEVOLUCION') {
        nuevoStock += validated.cantidad
      } else if (validated.tipo === 'SALIDA') {
        if (item.stock < validated.cantidad) {
          throw new Error('Stock insuficiente')
        }
        nuevoStock -= validated.cantidad
      } else {
        // AJUSTE: set directo
        nuevoStock = validated.cantidad
      }

      await tx.inventario.update({
        where: { id: validated.inventarioId },
        data: { stock: nuevoStock },
      })

      const movimiento = await tx.movimientoInventario.create({
        data: {
          inventarioId: validated.inventarioId,
          tipo: validated.tipo,
          cantidad: validated.cantidad,
          motivo: validated.motivo || null,
          responsable: session.user.id,
        },
      })

      return movimiento
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    const msg = error instanceof Error ? error.message : 'Error al registrar movimiento'
    console.error('Error movimiento inventario:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
