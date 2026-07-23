import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseFechaLocal } from '@/lib/fecha'
import { z } from 'zod'

// Notas de evolución de un expediente: el seguimiento continuo del caso.
// Cada nota es una sesión clínica y NO sobrescribe las anteriores.

const notaSchema = z.object({
  odontologoId: z.string().min(1, 'Odontólogo requerido'),
  fecha: z.string().optional(),
  motivo: z.string().max(5000).nullable().optional(),
  hallazgos: z.string().max(10000).nullable().optional(),
  procedimiento: z.string().max(10000).nullable().optional(),
  indicaciones: z.string().max(10000).nullable().optional(),
  piezas: z.string().max(191).nullable().optional(),
  proximaCita: z.string().nullable().optional(),
})

const incluirOdontologo = {
  odontologo: { select: { id: true, nombre: true, apellido: true } },
}

// GET - Listar las notas de evolución (más reciente primero)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const notas = await prisma.notaEvolucion.findMany({
      where: { expedienteId: params.id },
      include: incluirOdontologo,
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(notas)
  } catch (error) {
    console.error('Error al obtener notas de evolución:', error)
    return NextResponse.json({ error: 'Error al obtener notas de evolución' }, { status: 500 })
  }
}

// POST - Agregar una nota de evolución
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = notaSchema.parse(body)

    // Al menos un campo clínico con contenido: una nota vacía no aporta al historial.
    const tieneContenido = [
      validated.motivo,
      validated.hallazgos,
      validated.procedimiento,
      validated.indicaciones,
    ].some((campo) => Boolean(campo && campo.trim()))
    if (!tieneContenido) {
      return NextResponse.json(
        { error: 'Escribe al menos el motivo, los hallazgos, el procedimiento o las indicaciones' },
        { status: 400 }
      )
    }

    const expediente = await prisma.expediente.findUnique({
      where: { id: params.id },
      select: { id: true },
    })
    if (!expediente) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
    }

    const nota = await prisma.notaEvolucion.create({
      data: {
        expedienteId: params.id,
        odontologoId: validated.odontologoId,
        fecha: validated.fecha ? parseFechaLocal(validated.fecha) : undefined,
        motivo: validated.motivo?.trim() || null,
        hallazgos: validated.hallazgos?.trim() || null,
        procedimiento: validated.procedimiento?.trim() || null,
        indicaciones: validated.indicaciones?.trim() || null,
        piezas: validated.piezas?.trim() || null,
        proximaCita: validated.proximaCita ? parseFechaLocal(validated.proximaCita) : null,
      },
      include: incluirOdontologo,
    })

    // La próxima cita más reciente manda sobre el recordatorio del expediente.
    if (validated.proximaCita) {
      await prisma.expediente.update({
        where: { id: params.id },
        data: { proximaCita: parseFechaLocal(validated.proximaCita) },
      })
    }

    return NextResponse.json(nota, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error al crear nota de evolución:', error)
    return NextResponse.json({ error: 'Error al crear nota de evolución' }, { status: 500 })
  }
}
