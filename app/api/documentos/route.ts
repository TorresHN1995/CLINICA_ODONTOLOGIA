import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const documentoSchema = z.object({
  pacienteId: z.string(),
  nombre: z.string().min(1),
  tipo: z.enum(['RADIOGRAFIA', 'FOTOGRAFIA', 'CONSENTIMIENTO', 'RECETA', 'ORDEN_LABORATORIO', 'OTRO']),
  url: z.string().min(1),
  tamanio: z.number().int().positive(),
})

// GET - Obtener documentos de un paciente
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get('pacienteId')
    if (!pacienteId) {
      return NextResponse.json({ error: 'pacienteId requerido' }, { status: 400 })
    }

    const documentos = await prisma.documento.findMany({
      where: { pacienteId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documentos)
  } catch (error) {
    console.error('Error al obtener documentos:', error)
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 })
  }
}

// POST - Crear documento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = documentoSchema.parse(body)

    const documento = await prisma.documento.create({
      data: validated,
    })

    return NextResponse.json(documento, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error al crear documento:', error)
    return NextResponse.json({ error: 'Error al crear documento' }, { status: 500 })
  }
}

// DELETE - Eliminar documento
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.documento.delete({ where: { id } })
    return NextResponse.json({ message: 'Documento eliminado' })
  } catch (error) {
    console.error('Error al eliminar documento:', error)
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 })
  }
}
