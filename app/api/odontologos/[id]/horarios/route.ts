import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener horarios de un odontólogo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Por ahora retornamos horarios por defecto
    // En el futuro se puede crear un modelo HorarioOdontologo
    const horarios = {
      lunes: { activo: true, inicio: '08:00', fin: '17:00' },
      martes: { activo: true, inicio: '08:00', fin: '17:00' },
      miercoles: { activo: true, inicio: '08:00', fin: '17:00' },
      jueves: { activo: true, inicio: '08:00', fin: '17:00' },
      viernes: { activo: true, inicio: '08:00', fin: '17:00' },
      sabado: { activo: false, inicio: '08:00', fin: '12:00' },
      domingo: { activo: false, inicio: '00:00', fin: '00:00' },
    }

    return NextResponse.json({ horarios })
  } catch (error) {
    console.error('Error al obtener horarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener horarios' },
      { status: 500 }
    )
  }
}
