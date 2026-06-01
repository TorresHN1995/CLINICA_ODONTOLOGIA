import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CategoriaIngreso } from '@prisma/client'
import { auditar } from '@/lib/auditoria'

const itemFacturaSchema = z.object({
  descripcion: z.string().max(500),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive(),
  productoId: z.string().optional(),
  tasaIsv: z.number().min(0).max(100).default(15),
})

const facturaSchema = z.object({
  pacienteId: z.string(),
  items: z.array(itemFacturaSchema).min(1, 'Debe incluir al menos un item'),
  descuento: z.number().min(0).default(0),
  impuesto: z.number().min(0).default(0),
  observaciones: z.string().max(5000).optional(),
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50') || 50), 100)
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

    // Estadísticas agregadas sobre TODAS las facturas que cumplen el filtro
    // (no solo la página actual), para que los totales del dashboard sean correctos.
    const [pagadaAgg, pendientesFacturas] = await Promise.all([
      prisma.factura.aggregate({
        where: { ...where, estado: 'PAGADA' },
        _sum: { total: true },
      }),
      prisma.factura.findMany({
        where: { ...where, estado: { in: ['PENDIENTE', 'PAGADA_PARCIAL'] } },
        select: { total: true, pagos: { select: { monto: true } } },
      }),
    ])

    const totalIngresos = Number(pagadaAgg._sum.total || 0)
    const totalPendiente = pendientesFacturas.reduce((sum, f) => {
      const pagado = f.pagos.reduce((s, p) => s + Number(p.monto), 0)
      return sum + (Number(f.total) - pagado)
    }, 0)

    return NextResponse.json({
      facturas,
      stats: {
        totalIngresos,
        totalPendiente,
      },
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
    const extendedSchema = facturaSchema.extend({
      tipoDocumento: z.enum(['FACTURA', 'ORDEN_PEDIDO']).default('FACTURA'),
    })

    const validatedData = extendedSchema.parse(body)

    // Verificar que el paciente esté activo
    const paciente = await prisma.paciente.findUnique({
      where: { id: validatedData.pacienteId },
      select: { activo: true },
    })
    if (!paciente || !paciente.activo) {
      return NextResponse.json(
        { error: 'El paciente no existe o está inactivo' },
        { status: 400 }
      )
    }

    // Calcular totales. El impuesto se DERIVA de la tasa de ISV de cada item
    // (precioUnitario ya viene como base neta), nunca se confía en el impuesto del cliente.
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0
    )
    const impuesto = validatedData.items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario * ((item.tasaIsv ?? 15) / 100),
      0
    )

    if (validatedData.descuento > subtotal + impuesto) {
      return NextResponse.json(
        { error: 'El descuento no puede ser mayor que el total de la factura' },
        { status: 400 }
      )
    }

    const total = subtotal - validatedData.descuento + impuesto

    // Todo dentro de una transacción para evitar race conditions
    const result = await prisma.$transaction(async (tx) => {
      let correlativo = null
      let numeroFactura = ''

      if (validatedData.tipoDocumento === 'FACTURA') {
        // Leer y bloquear correlativo dentro de la transacción
        // La fecha límite SAR es válida durante TODO ese día. Comparamos contra el
        // inicio del día de hoy (no el instante actual) para no excluir un correlativo
        // cuya fecha límite es hoy (se guarda a medianoche desde un <input type="date">).
        const inicioHoy = new Date()
        inicioHoy.setHours(0, 0, 0, 0)
        correlativo = await tx.correlativo.findFirst({
          where: {
            tipo: validatedData.tipoDocumento,
            activo: true,
            fechaLimite: { gte: inicioHoy },
          },
          orderBy: { createdAt: 'desc' },
        })

        if (!correlativo) {
          throw new Error(`No hay correlativo activo o disponible para ${validatedData.tipoDocumento}. Por favor configure uno en Ajustes.`)
        }

        if (correlativo.siguiente > correlativo.rangoFinal) {
          throw new Error(`El rango de facturación para ${validatedData.tipoDocumento} se ha agotado.`)
        }

        // Generar número SAR
        const numeroActual = correlativo.siguiente
        const numeroFormateado = String(numeroActual).padStart(8, '0')
        numeroFactura = `${correlativo.sucursal}-${correlativo.puntoEmision}-${correlativo.tipoDoc}-${numeroFormateado}`

        // Incrementar correlativo inmediatamente
        await tx.correlativo.update({
          where: { id: correlativo.id },
          data: { siguiente: { increment: 1 } },
        })
      } else {
        // ORDEN_PEDIDO: generar número simple
        const ultimaOrden = await tx.factura.findFirst({
          where: { tipoDocumento: 'ORDEN_PEDIDO' },
          orderBy: { createdAt: 'desc' },
          select: { numero: true },
        })

        let siguienteNumero = 1
        if (ultimaOrden && ultimaOrden.numero) {
          const match = ultimaOrden.numero.match(/OP-(\d+)/)
          if (match) {
            siguienteNumero = parseInt(match[1]) + 1
          }
        }
        numeroFactura = `OP-${String(siguienteNumero).padStart(5, '0')}`
      }

      // Crear factura
      const factura = await tx.factura.create({
        data: {
          numero: numeroFactura,
          pacienteId: validatedData.pacienteId,
          emitenteId: session.user.id,
          subtotal,
          descuento: validatedData.descuento,
          impuesto,
          total,
          observaciones: validatedData.observaciones || null,
          tipoDocumento: validatedData.tipoDocumento,
          correlativoId: correlativo?.id || null,
          cai: correlativo?.cai || null,
          items: {
            create: validatedData.items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
              tasaIsv: item.tasaIsv ?? 15,
            })),
          },
        },
        include: {
          paciente: true,
          emitente: true,
          items: true,
        },
      })

      // Registrar ingreso dentro de la transacción
      let categoria: CategoriaIngreso = 'OTROS_SERVICIOS'
      const conceptoLower = (validatedData.items[0]?.descripcion || '').toLowerCase()
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

      await tx.ingreso.create({
        data: {
          facturaId: factura.id,
          concepto: validatedData.items[0]?.descripcion || 'Servicios',
          categoria,
          monto: total,
          metodoPago: 'OTRO',
          estado: 'REGISTRADO',
        },
      })

      // Descontar stock de inventario para productos vinculados
      for (const item of validatedData.items) {
        if (item.productoId) {
          const producto = await tx.productoServicio.findUnique({
            where: { id: item.productoId },
            select: { inventarioId: true, tipo: true, insumos: { include: { inventario: { select: { stock: true, nombre: true } } } } },
          })

          // 1. Si es PRODUCTO con inventario directo, descontar
          if (producto?.inventarioId && producto.tipo === 'PRODUCTO') {
            const inventario = await tx.inventario.findUnique({
              where: { id: producto.inventarioId },
              select: { stock: true },
            })

            if (inventario) {
              const nuevoStock = inventario.stock - item.cantidad
              if (nuevoStock < 0) {
                throw new Error(`Stock insuficiente para "${item.descripcion}". Disponible: ${inventario.stock}`)
              }
              await tx.inventario.update({ where: { id: producto.inventarioId }, data: { stock: nuevoStock } })
              await tx.movimientoInventario.create({
                data: { inventarioId: producto.inventarioId, tipo: 'SALIDA', cantidad: item.cantidad, motivo: `Factura ${factura.numero}`, responsable: session.user.id },
              })
            }
          }

          // 2. Si es SERVICIO, descontar sus insumos configurados (multiplicado por cantidad de items)
          if (producto?.tipo === 'SERVICIO' && producto.insumos && producto.insumos.length > 0) {
            for (const insumo of producto.insumos) {
              const cantidadADescontar = insumo.cantidad * item.cantidad
              const stockActual = insumo.inventario.stock

              if (stockActual < cantidadADescontar) {
                throw new Error(`Stock insuficiente de "${insumo.inventario.nombre}" para el servicio "${item.descripcion}". Disponible: ${stockActual}, requerido: ${cantidadADescontar}`)
              }

              await tx.inventario.update({
                where: { id: insumo.inventarioId },
                data: { stock: { decrement: cantidadADescontar } },
              })
              await tx.movimientoInventario.create({
                data: { inventarioId: insumo.inventarioId, tipo: 'SALIDA', cantidad: cantidadADescontar, motivo: `Insumo de servicio - Factura ${factura.numero}`, responsable: session.user.id },
              })
            }
          }
        }
      }

      return factura
    }, {
      // Aísla la lectura+incremento del correlativo para evitar números de factura
      // duplicados bajo peticiones concurrentes.
      isolationLevel: 'Serializable',
    })

    await auditar(session, request, {
      accion: 'CREAR',
      entidad: 'Factura',
      entidadId: result.id,
      descripcion: `Emitió ${result.tipoDocumento === 'ORDEN_PEDIDO' ? 'la orden' : 'la factura'} ${result.numero} por ${total.toFixed(2)}`,
      datos: { numero: result.numero, total, subtotal, impuesto, descuento: validatedData.descuento, pacienteId: validatedData.pacienteId },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    // Errores de negocio lanzados como Error dentro de la transacción
    if (error instanceof Error && (error.message.includes('correlativo') || error.message.includes('rango') || error.message.includes('Stock insuficiente'))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Error al crear factura:', error)
    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    )
  }
}
