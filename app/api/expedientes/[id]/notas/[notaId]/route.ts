import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Eliminar una nota de evolución.
// Solo el odontólogo que la escribió o un administrador pueden borrarla: el
// historial clínico de un tercero no se toca.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; notaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const nota = await prisma.notaEvolucion.findUnique({
      where: { id: params.notaId },
      select: { id: true, expedienteId: true, odontologoId: true },
    })

    if (!nota || nota.expedienteId !== params.id) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    const esAdmin = session.user.role === 'ADMINISTRADOR'
    if (!esAdmin && nota.odontologoId !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo el odontólogo que registró la nota puede eliminarla' },
        { status: 403 }
      )
    }

    await prisma.notaEvolucion.delete({ where: { id: params.notaId } })
    return NextResponse.json({ message: 'Nota eliminada' })
  } catch (error) {
    console.error('Error al eliminar nota de evolución:', error)
    return NextResponse.json({ error: 'Error al eliminar nota de evolución' }, { status: 500 })
  }
}
