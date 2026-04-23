import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { activo: true },
      select: {
        username: true,
        nombre: true,
        apellido: true,
        rol: true,
      },
      orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Error listando usuarios públicos:', error)
    return NextResponse.json([], { status: 200 })
  }
}
