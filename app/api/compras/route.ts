import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { inicioDiaLocal, finDiaLocal } from '@/lib/fecha'
import { registrarFlujoCaja } from '@/lib/flujo-caja'
import { auditar } from '@/lib/auditoria'
import { z } from 'zod'

const CATEGORIAS_INVENTARIO = [
  'MATERIAL_DENTAL',
  'INSTRUMENTAL',
  'MEDICAMENTO',
  'CONSUMIBLE',
  'EQUIPAMIENTO',
  'OTRO',
] as const

const METODOS_PAGO = [
  'EFECTIVO',
  'TARJETA_CREDITO',
  'TARJETA_DEBITO',
  'TRANSFERENCIA',
  'CHEQUE',
  'OTRO',
] as const

const CATEGORIAS_EGRESO = [
  'MATERIALES_DENTALES',
  'INSTRUMENTAL',
  'MEDICAMENTOS',
  'EQUIPAMIENTO',
  'SERVICIOS_PUBLICOS',
  'ALQUILER',
  'SALARIOS',
  'SEGUROS',
  'MANTENIMIENTO',
  'MARKETING',
  'CAPACITACION',
  'OTROS_GASTOS',
] as const

// Cada ítem: o refiere un producto de inventario existente (inventarioId),
// o trae los datos para crear uno nuevo (codigo, nombre, categoria, unidadMedida).
const itemSchema = z
  .object({
    inventarioId: z.string().optional(),
    codigo: z.string().max(50).optional(),
    nombre: z.string().max(200).optional(),
    categoria: z.enum(CATEGORIAS_INVENTARIO).optional(),
    unidadMedida: z.string().max(50).optional(),
    cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
    costoUnitario: z.number().min(0, 'El costo no puede ser negativo'),
    // Solo para productos nuevos: si se define precioVenta, el producto se
    // registra también en el catálogo general (Productos/Servicios) y queda facturable.
    precioVenta: z.number().min(0).optional(),
    isv: z.number().min(0).max(100).optional(),
  })
  .refine(
    (d) => !!d.inventarioId || (!!d.codigo && !!d.nombre && !!d.categoria && !!d.unidadMedida),
    { message: 'Cada ítem debe referir un producto existente o traer los datos completos del producto nuevo' }
  )

const compraSchema = z.object({
  proveedor: z.string().min(1, 'Proveedor requerido').max(300),
  numeroFactura: z.string().max(100).optional(),
  fecha: z.string(),
  metodoPago: z.enum(METODOS_PAGO),
  categoriaEgreso: z.enum(CATEGORIAS_EGRESO).optional(),
  observaciones: z.string().max(5000).optional(),
  items: z.array(itemSchema).min(1, 'Debe incluir al menos un producto'),
})

// GET - Listar compras
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const where: any = {}
    if (estado) where.estado = estado
    if (search) {
      where.OR = [
        { proveedor: { contains: search } },
        { numeroFactura: { contains: search } },
      ]
    }
    if (fechaInicio && fechaFin) {
      where.fecha = { gte: inicioDiaLocal(fechaInicio), lte: finDiaLocal(fechaFin) }
    }

    const compras = await prisma.compra.findMany({
      where,
      include: {
        registrador: { select: { nombre: true, apellido: true } },
        _count: { select: { detalles: true } },
      },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(compras)
  } catch (error) {
    console.error('Error al obtener compras:', error)
    return NextResponse.json({ error: 'Error al obtener compras' }, { status: 500 })
  }
}

// POST - Registrar compra (ingresa al inventario y genera un egreso)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = compraSchema.parse(body)

    const fecha = inicioDiaLocal(data.fecha)
    const responsable = session.user?.name || undefined
    const motivoBase = `Compra${data.numeroFactura ? ` (Fact. ${data.numeroFactura})` : ''} a ${data.proveedor}`

    const { compra, total, egresoId } = await prisma.$transaction(async (tx) => {
      let total = 0
      const detallesData: { inventarioId: string; cantidad: number; costoUnitario: number; subtotal: number }[] = []

      for (const item of data.items) {
        let inventarioId = item.inventarioId

        if (!inventarioId) {
          // Crear el producto nuevo en inventario (código único)
          const existente = await tx.inventario.findUnique({ where: { codigo: item.codigo! } })
          if (existente) {
            throw new Error(`Ya existe un producto con el código "${item.codigo}"`)
          }
          const nuevo = await tx.inventario.create({
            data: {
              codigo: item.codigo!,
              nombre: item.nombre!,
              categoria: item.categoria!,
              unidadMedida: item.unidadMedida!,
              stock: 0,
              precioCompra: item.costoUnitario,
              precioVenta: item.precioVenta ?? null,
              proveedor: data.proveedor,
            },
          })
          inventarioId = nuevo.id

          // Si se indicó precio de venta, registrar también en el catálogo
          // general (Productos/Servicios) para que sea facturable en todo el sistema.
          if (item.precioVenta != null) {
            const existenteProd = await tx.productoServicio.findUnique({ where: { codigo: item.codigo! } })
            if (existenteProd) {
              throw new Error(`Ya existe un producto/servicio con el código "${item.codigo}"`)
            }
            await tx.productoServicio.create({
              data: {
                codigo: item.codigo!,
                nombre: item.nombre!,
                tipo: 'PRODUCTO',
                precio: item.precioVenta,
                isv: item.isv ?? 15,
                inventarioId: nuevo.id,
              },
            })
          }
        }

        // Sumar al stock y actualizar el último precio de compra
        await tx.inventario.update({
          where: { id: inventarioId },
          data: {
            stock: { increment: item.cantidad },
            precioCompra: item.costoUnitario,
          },
        })

        // Registrar el movimiento de ENTRADA
        await tx.movimientoInventario.create({
          data: {
            inventarioId,
            tipo: 'ENTRADA',
            cantidad: item.cantidad,
            motivo: motivoBase,
            responsable,
          },
        })

        const subtotal = Math.round(item.cantidad * item.costoUnitario * 100) / 100
        total += subtotal
        detallesData.push({ inventarioId, cantidad: item.cantidad, costoUnitario: item.costoUnitario, subtotal })
      }

      total = Math.round(total * 100) / 100

      // Egreso automático por el total de la compra
      const egreso = await tx.egreso.create({
        data: {
          concepto: motivoBase,
          categoria: data.categoriaEgreso || 'MATERIALES_DENTALES',
          monto: total,
          fecha,
          metodoPago: data.metodoPago,
          proveedor: data.proveedor,
          numeroFactura: data.numeroFactura || null,
          estado: 'PAGADO',
          observaciones: data.observaciones || null,
          registradoPor: session.user.id,
        },
      })

      // Cabecera de la compra + detalles
      const compra = await tx.compra.create({
        data: {
          proveedor: data.proveedor,
          numeroFactura: data.numeroFactura || null,
          fecha,
          metodoPago: data.metodoPago,
          total,
          estado: 'RECIBIDA',
          observaciones: data.observaciones || null,
          registradoPor: session.user.id,
          egresoId: egreso.id,
          detalles: { create: detallesData },
        },
        include: {
          detalles: { include: { inventario: { select: { codigo: true, nombre: true, unidadMedida: true } } } },
        },
      })

      return { compra, total, egresoId: egreso.id }
    })

    // Reflejar el egreso en el flujo de caja (fuera de la transacción principal)
    await registrarFlujoCaja('EGRESO', motivoBase, total, egresoId)

    await auditar(session, request, {
      accion: 'CREAR',
      entidad: 'Compra',
      entidadId: compra.id,
      descripcion: `Registró una compra a "${data.proveedor}" por ${total.toFixed(2)} (${data.items.length} producto(s))`,
      datos: { proveedor: data.proveedor, total, items: data.items.length, numeroFactura: data.numeroFactura },
    })

    return NextResponse.json(compra, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message.startsWith('Ya existe un producto')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Error al registrar compra:', error)
    return NextResponse.json({ error: 'Error al registrar compra' }, { status: 500 })
  }
}
