import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CategoriaIngreso } from '@prisma/client'

const itemFacturaSchema = z.object({
  descripcion: z.string(),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive(),
})

const facturaSchema = z.object({
  pacienteId: z.string(),
  items: z.array(itemFacturaSchema),
  descuento: z.number().min(0).default(0),
  impuesto: z.number().min(0).default(0),
  observaciones: z.string().optional(),
})

// GET - Obtener facturas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get('pacienteId')
    const estado = searchParams.get('estado')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (pacienteId) where.pacienteId = pacienteId
    if (estado) where.estado = estado

    const [facturas, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: {
          paciente: {
            select: {
              nombre: true,
              apellido: true,
              identificacion: true,
          },
        },
        emitente: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        items: true,
        pagos: true,
      },
      orderBy: { fecha: 'desc' },
      skip,
      take: limit,
    }),
      prisma.factura.count({ where }),
    ])

    return NextResponse.json({
      facturas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al obtener facturas:', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

// POST - Crear factura
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    // Extendemos el schema para incluir tipoDocumento
    const extendedSchema = facturaSchema.extend({
      tipoDocumento: z.enum(['FACTURA', 'ORDEN_PEDIDO']).default('FACTURA'),
    })

    const validatedData = extendedSchema.parse(body)

    // 1. Buscar Correlativo Activo
    const correlativo = await prisma.correlativo.findFirst({
      where: {
        tipo: validatedData.tipoDocumento,
        activo: true,
        fechaLimite: { gte: new Date() } // Asegurar que no esté vencido
      },
      orderBy: { createdAt: 'desc' } // Priorizar el más reciente si hubiera múltiples (no debería)
    })

    if (!correlativo) {
      return NextResponse.json(
        { error: `No hay correlativo activo o disponible para ${validatedData.tipoDocumento}. Por favor configure uno en Ajustes.` },
        { status: 400 }
      )
    }

    if (correlativo.siguiente > correlativo.rangoFinal) {
      return NextResponse.json(
        { error: `El rango de facturación para ${validatedData.tipoDocumento} se ha agotado.` },
        { status: 400 }
      )
    }

    // 2. Generar Número SAR
    // Formato: SSS-PPP-TT-NNNNNNNN
    // Ejemplo: 000-001-01-00000001
    const numeroActual = correlativo.siguiente
    const numeroFormateado = String(numeroActual).padStart(8, '0')
    const numeroFactura = `${correlativo.sucursal}-${correlativo.puntoEmision}-${correlativo.tipoDoc}-${numeroFormateado}`

    // 3. Calcular totales
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0
    )
    const total = subtotal - validatedData.descuento + validatedData.impuesto

    // 4. Transacción: Crear Factura + Actualizar Correlativo
    const result = await prisma.$transaction(async (tx) => {
      // Incrementar siguiente
      await tx.correlativo.update({
        where: { id: correlativo.id },
        data: {
          siguiente: { increment: 1 },
          // Desactivar si llegamos al final? Lo mantenemos activo hasta que se cree uno nuevo o se agote explícitamente.
        }
      })

      // Crear factura
      const factura = await tx.factura.create({
        data: {
          numero: numeroFactura,
          pacienteId: validatedData.pacienteId,
          emitenteId: session.user.id,
          subtotal,
          descuento: validatedData.descuento,
          impuesto: validatedData.impuesto,
          total,
          observaciones: validatedData.observaciones || null,

          // Datos SAR
          tipoDocumento: validatedData.tipoDocumento,
          correlativoId: correlativo.id,
          cai: correlativo.cai, // null si es Orden de Pedido

          items: {
            create: validatedData.items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
            })),
          },
        },
        include: {
          paciente: true,
          emitente: true,
          items: true,
        },
      })

      return factura
    })

    // Registrar ingreso automático (fuera de la transacción principal para no bloquear si falla el log de ingreso)
    // Nota: Idealmente debería estar dentro, pero mantenemos lógica original de "try/catch" independiente
    try {
      await registrarIngreso(
        result.id,
        validatedData.items[0]?.descripcion || 'Servicios',
        total
      )
    } catch (error) {
      console.error('Error al registrar ingreso:', error)
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear factura:', error)
    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    )
  }
}

// Función auxiliar para registrar ingreso automático
async function registrarIngreso(facturaId: string, concepto: string, monto: number) {
  try {
    // Determinar categoría basada en el concepto
    // Importamos el enum implícitamente al usar las strings, pero para TS strict necesitamos type cast
    let categoria: CategoriaIngreso = 'OTROS_SERVICIOS'
    const conceptoLower = concepto.toLowerCase()

    if (conceptoLower.includes('consulta')) categoria = 'CONSULTA'
    else if (conceptoLower.includes('limpieza')) categoria = 'LIMPIEZA'
    else if (conceptoLower.includes('extracción') || conceptoLower.includes('extraccion')) categoria = 'EXTRACCION'
    else if (conceptoLower.includes('endodoncia')) categoria = 'ENDODONCIA'
    else if (conceptoLower.includes('ortodoncia')) categoria = 'ORTODONCIA'
    else if (conceptoLower.includes('prótesis') || conceptoLower.includes('protesis')) categoria = 'PROTESIS'
    else if (conceptoLower.includes('cirugía') || conceptoLower.includes('cirugia')) categoria = 'CIRUGIA'
    else if (conceptoLower.includes('control')) categoria = 'CONTROL'
    else if (conceptoLower.includes('emergencia')) categoria = 'EMERGENCIA'
    else if (conceptoLower.includes('material')) categoria = 'MATERIALES'

    await prisma.ingreso.create({
      data: {
        facturaId,
        concepto,
        categoria: categoria,
        monto,
        // Se define método de pago genérico hasta que se registre el pago real
        metodoPago: 'OTRO',
        estado: 'REGISTRADO',
      },
    })
  } catch (error) {
    console.error('Error al registrar ingreso:', error)
    throw error // Re-throw para que el caller sepa (aunque lo ignoramos arriba, es buena práctica)
  }
}
