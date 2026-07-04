import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Prefijo de código según el tipo de ítem
const PREFIJOS: Record<'SERVICIO' | 'PRODUCTO', string> = {
  SERVICIO: 'SRV-',
  PRODUCTO: 'PRD-',
}

// GET - Genera el siguiente código correlativo disponible para el tipo dado
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') === 'PRODUCTO' ? 'PRODUCTO' : 'SERVICIO'
    const prefijo = PREFIJOS[tipo]

    // Todos los códigos existentes con ese prefijo (incluye inactivos para no reusar números)
    const items = await prisma.productoServicio.findMany({
      where: { codigo: { startsWith: prefijo } },
      select: { codigo: true },
    })

    let max = 0
    for (const { codigo } of items) {
      const n = parseInt(codigo.slice(prefijo.length), 10)
      if (!Number.isNaN(n) && n > max) max = n
    }

    const codigo = `${prefijo}${String(max + 1).padStart(3, '0')}`
    return NextResponse.json({ codigo })
  } catch (error) {
    console.error('Error al generar código:', error)
    return NextResponse.json({ error: 'Error al generar código' }, { status: 500 })
  }
}
