/**
 * Seed de datos de prueba — abril y mayo 2026 (últimos 2 meses).
 *
 * - Conserva usuarios, configuración de empresa, inventario y productos/servicios.
 * - Borra los datos transaccionales/clínicos previos y genera un dataset coherente.
 * - Replica EXACTAMENTE la matemática de la app:
 *     Factura: precioUnitario = base neta; impuesto = base * tasa/100; total = subtotal - descuento + impuesto.
 *     Presupuesto: precioUnitario = inclusivo de ISV; subtotal/impuesto derivados de la tasa.
 *
 * Ejecutar:  node scripts/seed-2meses.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ---------- Helpers ----------
const r2 = (n) => Math.round(n * 100) / 100
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
// Fecha 2026 (month 1-12)
const d = (month, day, hour = 10, min = 0) => new Date(2026, month - 1, day, hour, min, 0)
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
const dayKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

const METODOS_COBRO = ['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE']

// Catálogo de servicios: precio = BASE NETA (sin ISV), tasaIsv
const SERVICIOS = [
  { desc: 'Consulta general', precio: 500, tasa: 15 },
  { desc: 'Limpieza dental (profilaxis)', precio: 800, tasa: 15 },
  { desc: 'Extracción simple', precio: 1200, tasa: 15 },
  { desc: 'Extracción quirúrgica (tercer molar)', precio: 2800, tasa: 15 },
  { desc: 'Endodoncia unirradicular', precio: 4500, tasa: 15 },
  { desc: 'Obturación con resina', precio: 1500, tasa: 15 },
  { desc: 'Corona de porcelana', precio: 8500, tasa: 15 },
  { desc: 'Ortodoncia - mensualidad', precio: 1200, tasa: 15 },
  { desc: 'Blanqueamiento dental', precio: 3500, tasa: 15 },
  { desc: 'Radiografía periapical', precio: 350, tasa: 15 },
  { desc: 'Prótesis parcial removible', precio: 9000, tasa: 15 },
  { desc: 'Control / revisión', precio: 400, tasa: 15 },
]

function categoriaIngreso(desc) {
  const c = (desc || '').toLowerCase()
  if (c.includes('consulta')) return 'CONSULTA'
  if (c.includes('limpieza')) return 'LIMPIEZA'
  if (c.includes('extracción') || c.includes('extraccion')) return 'EXTRACCION'
  if (c.includes('endodoncia')) return 'ENDODONCIA'
  if (c.includes('ortodoncia')) return 'ORTODONCIA'
  if (c.includes('prótesis') || c.includes('protesis')) return 'PROTESIS'
  if (c.includes('cirugía') || c.includes('cirugia')) return 'CIRUGIA'
  if (c.includes('control')) return 'CONTROL'
  if (c.includes('emergencia')) return 'EMERGENCIA'
  if (c.includes('material')) return 'MATERIALES'
  return 'OTROS_SERVICIOS'
}

// Pacientes de prueba (18)
const PACIENTES = [
  ['0801199001234', 'Juan', 'Pérez', '1990-05-15', 'Ingeniero'],
  ['0801198507221', 'Laura', 'Gómez', '1985-08-22', 'Profesora'],
  ['0801199503101', 'Pedro', 'Ramírez', '1995-03-10', 'Estudiante'],
  ['0801198811055', 'María', 'Fernández', '1988-11-05', 'Contadora'],
  ['0801199207189', 'Carlos', 'Mejía', '1992-07-18', 'Comerciante'],
  ['0801197709302', 'Ana', 'Castro', '1977-09-30', 'Abogada'],
  ['0801200001144', 'Sofía', 'Hernández', '2000-01-14', 'Estudiante'],
  ['0801198302276', 'Roberto', 'Díaz', '1983-02-27', 'Médico'],
  ['0801199612083', 'Gabriela', 'Lópezz', '1996-12-08', 'Diseñadora'],
  ['0801197505199', 'José', 'Martínez', '1975-05-19', 'Mecánico'],
  ['0801199409251', 'Daniela', 'Reyes', '1994-09-25', 'Enfermera'],
  ['0801198706142', 'Luis', 'Aguilar', '1987-06-14', 'Arquitecto'],
  ['0801200110073', 'Valeria', 'Cruz', '2001-10-07', 'Estudiante'],
  ['0801198004128', 'Marco', 'Velásquez', '1980-04-12', 'Empresario'],
  ['0801199308304', 'Andrea', 'Núñez', '1993-08-30', 'Periodista'],
  ['0801197911216', 'Fernando', 'Paz', '1979-11-21', 'Ingeniero'],
  ['0801199502057', 'Karla', 'Zelaya', '1995-02-05', 'Psicóloga'],
  ['0801198909163', 'Diego', 'Flores', '1989-09-16', 'Chef'],
]

async function main() {
  console.log('🌱 Seed 2 meses (abril–mayo 2026) — iniciando...\n')

  // ---------- 1. Usuarios existentes ----------
  const usuarios = await prisma.usuario.findMany()
  if (usuarios.length === 0) throw new Error('No hay usuarios. Crea al menos un admin antes de sembrar.')
  const admin = usuarios.find((u) => u.rol === 'ADMINISTRADOR') || usuarios[0]
  const odontologos = usuarios.filter((u) => u.rol === 'ODONTOLOGO')
  const odontologosOEmisor = odontologos.length ? odontologos : [admin]
  console.log(`👤 Usuarios conservados: ${usuarios.length} (admin: ${admin.email}, odontólogos: ${odontologos.length})`)

  // ---------- 2. Limpiar datos transaccionales/clínicos ----------
  console.log('🧹 Limpiando datos previos (conserva usuarios, empresa, inventario, productos)...')
  await prisma.auditoria.deleteMany()
  await prisma.cierreCaja.deleteMany()
  await prisma.itemPresupuesto.deleteMany()
  await prisma.presupuesto.deleteMany()
  await prisma.pago.deleteMany()
  await prisma.itemFactura.deleteMany()
  await prisma.ingreso.deleteMany()
  await prisma.factura.deleteMany()
  await prisma.etapaTratamiento.deleteMany()
  await prisma.tratamiento.deleteMany()
  await prisma.procedimiento.deleteMany()
  await prisma.imagenClinica.deleteMany()
  await prisma.expediente.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.cita.deleteMany()
  await prisma.movimientoInventario.deleteMany()
  await prisma.flujoCaja.deleteMany()
  await prisma.egreso.deleteMany()
  await prisma.estadisticaOdontologo.deleteMany()
  await prisma.correlativo.deleteMany()
  await prisma.paciente.deleteMany()
  console.log('   ✅ Limpieza completa\n')

  // ---------- 3. Correlativo SAR (Factura) ----------
  const correlativo = await prisma.correlativo.create({
    data: {
      tipo: 'FACTURA',
      cai: 'A1B2C3-D4E5F6-G7H8I9-J0K1L2-M3',
      sucursal: '000',
      puntoEmision: '001',
      tipoDoc: '01',
      rangoInicial: 1,
      rangoFinal: 5000,
      siguiente: 1, // se actualizará al final
      fechaLimite: d(12, 31, 23, 59),
      activo: true,
    },
  })
  console.log('🧾 Correlativo SAR creado (000-001-01, rango 1-5000)')

  // ---------- 4. Pacientes ----------
  const pacientes = []
  for (const [ident, nombre, apellido, nac, ocupacion] of PACIENTES) {
    const p = await prisma.paciente.create({
      data: {
        identificacion: ident,
        nombre,
        apellido,
        fechaNacimiento: new Date(nac),
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase().replace(/[^a-z]/g, '')}@email.com`,
        telefono: `9${randInt(1000000, 9999999)}`,
        celular: `8${randInt(1000000, 9999999)}`,
        direccion: `Col. ${pick(['Kennedy', 'Centro', 'Las Colinas', 'Miraflores', 'El Hatillo'])}, casa #${randInt(1, 200)}`,
        ciudad: 'Tegucigalpa',
        ocupacion,
        consentimiento: true,
      },
    })
    pacientes.push(p)
  }
  console.log(`🧑‍🤝‍🧑 Pacientes creados: ${pacientes.length}`)

  // Acumuladores para cierre de caja y flujo de caja
  const pagosPorDia = {} // dayKey -> { date, byMetodo:{}, totalEfectivo, totalIngresos }
  const egresosPorDia = {} // dayKey -> { date, totalEgresos, egresosEfectivo }
  const movimientos = [] // {fecha, tipo:'INGRESO'|'EGRESO', concepto, monto, referencia}
  const auditorias = []

  // ---------- 5. Facturas + ítems + ingresos + pagos ----------
  // Distribución de estados a lo largo de 46 facturas
  const N_FACTURAS = 46
  let nextNumero = 1
  const facturas = []
  let nPagada = 0, nParcial = 0, nPendiente = 0, nAnulada = 0

  for (let i = 0; i < N_FACTURAS; i++) {
    // Distribuir fechas: ~55% abril, ~45% mayo (mayo hasta el 31)
    const enAbril = Math.random() < 0.52
    const mes = enAbril ? 4 : 5
    const diaMax = enAbril ? 30 : 31
    const dia = randInt(1, diaMax)
    const fecha = d(mes, dia, randInt(8, 17), pick([0, 15, 30, 45]))

    // ítems (1-3 servicios)
    const nItems = randInt(1, 3)
    const itemsSel = []
    for (let k = 0; k < nItems; k++) {
      const s = pick(SERVICIOS)
      const cantidad = s.precio > 4000 ? 1 : randInt(1, 2)
      itemsSel.push({ descripcion: s.desc, cantidad, precioUnitario: s.precio, tasaIsv: s.tasa })
    }

    const subtotal = r2(itemsSel.reduce((sum, it) => sum + it.cantidad * it.precioUnitario, 0))
    const impuesto = r2(itemsSel.reduce((sum, it) => sum + it.cantidad * it.precioUnitario * (it.tasaIsv / 100), 0))
    const descuento = Math.random() < 0.25 ? r2(subtotal * pick([0.05, 0.1])) : 0
    const total = r2(subtotal - descuento + impuesto)

    // Estado por franja
    let estado
    const rnd = Math.random()
    if (rnd < 0.55) { estado = 'PAGADA'; nPagada++ }
    else if (rnd < 0.74) { estado = 'PAGADA_PARCIAL'; nParcial++ }
    else if (rnd < 0.93) { estado = 'PENDIENTE'; nPendiente++ }
    else { estado = 'ANULADA'; nAnulada++ }

    const numero = `${correlativo.sucursal}-${correlativo.puntoEmision}-${correlativo.tipoDoc}-${String(nextNumero).padStart(8, '0')}`
    nextNumero++

    const metodoFactura = estado === 'PAGADA' || estado === 'PAGADA_PARCIAL' ? pick(METODOS_COBRO) : null

    const factura = await prisma.factura.create({
      data: {
        numero,
        pacienteId: pick(pacientes).id,
        emitenteId: Math.random() < 0.5 ? admin.id : pick(usuarios).id,
        fecha,
        subtotal,
        descuento,
        impuesto,
        total,
        estado,
        metodoPago: metodoFactura,
        enviada: Math.random() < 0.6,
        correlativoId: correlativo.id,
        cai: correlativo.cai,
        createdAt: fecha,
        items: {
          create: itemsSel.map((it) => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            subtotal: r2(it.cantidad * it.precioUnitario),
            tasaIsv: it.tasaIsv,
            createdAt: fecha,
          })),
        },
      },
    })

    // Ingreso (igual que la app: monto = total, metodoPago OTRO)
    await prisma.ingreso.create({
      data: {
        facturaId: factura.id,
        concepto: itemsSel[0].descripcion,
        categoria: categoriaIngreso(itemsSel[0].descripcion),
        monto: total,
        fecha,
        metodoPago: 'OTRO',
        estado: 'REGISTRADO',
        createdAt: fecha,
      },
    })

    // Auditoría: emisión
    auditorias.push({
      fecha, accion: 'CREAR', entidad: 'Factura', entidadId: factura.id,
      descripcion: `Emitió la factura ${numero} por ${total.toFixed(2)}`,
      datos: { numero, total, subtotal, impuesto, descuento },
    })

    // Pagos según estado
    const registrarPago = (monto, metodo, fechaPago) => {
      const dk = dayKey(fechaPago)
      if (!pagosPorDia[dk]) pagosPorDia[dk] = { date: startOfDay(fechaPago), byMetodo: {}, totalEfectivo: 0, totalIngresos: 0 }
      const reg = pagosPorDia[dk]
      reg.byMetodo[metodo] = r2((reg.byMetodo[metodo] || 0) + monto)
      reg.totalIngresos = r2(reg.totalIngresos + monto)
      if (metodo === 'EFECTIVO') reg.totalEfectivo = r2(reg.totalEfectivo + monto)
      movimientos.push({ fecha: fechaPago, tipo: 'INGRESO', concepto: `Pago factura ${numero}`, monto, referencia: factura.id })
      auditorias.push({
        fecha: fechaPago, accion: 'OTRO', entidad: 'Pago', entidadId: factura.id,
        descripcion: `Registró un pago de ${monto.toFixed(2)} (${metodo}) en la factura ${numero}`,
        datos: { monto, metodo },
      })
      return prisma.pago.create({
        data: { facturaId: factura.id, monto, metodoPago: metodo, fecha: fechaPago, referencia: metodo === 'EFECTIVO' ? null : `REF-${randInt(10000, 99999)}`, createdAt: fechaPago },
      })
    }

    if (estado === 'PAGADA') {
      // a veces split en 2 métodos
      if (total > 4000 && Math.random() < 0.4) {
        const m1 = r2(total * 0.5)
        await registrarPago(m1, metodoFactura, fecha)
        await registrarPago(r2(total - m1), pick(METODOS_COBRO), fecha)
      } else {
        await registrarPago(total, metodoFactura, fecha)
      }
    } else if (estado === 'PAGADA_PARCIAL') {
      const abono = r2(total * pick([0.3, 0.4, 0.5, 0.6]))
      await registrarPago(abono, metodoFactura, fecha)
    } else if (estado === 'ANULADA') {
      auditorias.push({
        fecha: new Date(fecha.getTime() + 86400000), accion: 'ANULAR', entidad: 'Factura', entidadId: factura.id,
        descripcion: `Anuló la factura ${numero}`,
        datos: { numero, total },
      })
    }

    facturas.push({ ...factura, itemsSel })
  }
  // Actualizar correlativo.siguiente
  await prisma.correlativo.update({ where: { id: correlativo.id }, data: { siguiente: nextNumero } })
  console.log(`🧾 Facturas creadas: ${facturas.length} (PAGADA ${nPagada}, PARCIAL ${nParcial}, PENDIENTE ${nPendiente}, ANULADA ${nAnulada})`)

  // ---------- 6. Egresos ----------
  const EGRESOS_FIJOS = [
    { concepto: 'Alquiler del local', categoria: 'ALQUILER', monto: 12000, metodo: 'TRANSFERENCIA', prov: 'Inmobiliaria Central' },
    { concepto: 'Salarios del personal', categoria: 'SALARIOS', monto: 45000, metodo: 'TRANSFERENCIA', prov: 'Planilla' },
    { concepto: 'Energía eléctrica (ENEE)', categoria: 'SERVICIOS_PUBLICOS', monto: 3200, metodo: 'EFECTIVO', prov: 'ENEE' },
    { concepto: 'Agua potable (SANAA)', categoria: 'SERVICIOS_PUBLICOS', monto: 850, metodo: 'EFECTIVO', prov: 'SANAA' },
    { concepto: 'Internet y teléfono', categoria: 'SERVICIOS_PUBLICOS', monto: 1500, metodo: 'TARJETA_CREDITO', prov: 'Tigo' },
  ]
  const EGRESOS_VAR = [
    { concepto: 'Compra de materiales dentales', categoria: 'MATERIALES_DENTALES', metodo: 'TARJETA_CREDITO', prov: 'Dental Supply S.A.', min: 2500, max: 9000 },
    { concepto: 'Anestesia y medicamentos', categoria: 'MEDICAMENTOS', metodo: 'EFECTIVO', prov: 'Farmacia Dental', min: 800, max: 3000 },
    { concepto: 'Instrumental nuevo', categoria: 'INSTRUMENTAL', metodo: 'TRANSFERENCIA', prov: 'MedeQuip', min: 1500, max: 6000 },
    { concepto: 'Mantenimiento de equipo', categoria: 'MANTENIMIENTO', metodo: 'EFECTIVO', prov: 'TecnoDental', min: 600, max: 2500 },
    { concepto: 'Publicidad en redes', categoria: 'MARKETING', metodo: 'TARJETA_CREDITO', prov: 'Meta Ads', min: 500, max: 2000 },
  ]
  let nEgresos = 0
  for (const mes of [4, 5]) {
    // Egresos fijos una vez al mes
    for (const e of EGRESOS_FIJOS) {
      const fecha = d(mes, randInt(1, 5), randInt(9, 16))
      await prisma.egreso.create({
        data: {
          concepto: `${e.concepto} - ${mes === 4 ? 'Abril' : 'Mayo'} 2026`, categoria: e.categoria, monto: e.monto,
          fecha, metodoPago: e.metodo, proveedor: e.prov, numeroFactura: `PROV-${randInt(1000, 9999)}`,
          estado: 'PAGADO', registradoPor: admin.id, createdAt: fecha,
        },
      })
      nEgresos++
      const dk = dayKey(fecha)
      if (!egresosPorDia[dk]) egresosPorDia[dk] = { date: startOfDay(fecha), totalEgresos: 0, egresosEfectivo: 0 }
      egresosPorDia[dk].totalEgresos = r2(egresosPorDia[dk].totalEgresos + e.monto)
      if (e.metodo === 'EFECTIVO') egresosPorDia[dk].egresosEfectivo = r2(egresosPorDia[dk].egresosEfectivo + e.monto)
      movimientos.push({ fecha, tipo: 'EGRESO', concepto: e.concepto, monto: e.monto, referencia: e.categoria })
      auditorias.push({ fecha, accion: 'CREAR', entidad: 'Egreso', descripcion: `Registró egreso "${e.concepto}" por ${e.monto.toFixed(2)}`, datos: { monto: e.monto, categoria: e.categoria } })
    }
    // Egresos variables (3-5 por mes)
    const nVar = randInt(3, 5)
    for (let i = 0; i < nVar; i++) {
      const e = pick(EGRESOS_VAR)
      const monto = r2(randInt(e.min, e.max))
      const diaMax = mes === 4 ? 30 : 31
      const fecha = d(mes, randInt(1, diaMax), randInt(9, 17))
      await prisma.egreso.create({
        data: {
          concepto: e.concepto, categoria: e.categoria, monto, fecha, metodoPago: e.metodo, proveedor: e.prov,
          numeroFactura: `PROV-${randInt(1000, 9999)}`, estado: pick(['PAGADO', 'PAGADO', 'APROBADO']),
          registradoPor: admin.id, createdAt: fecha,
        },
      })
      nEgresos++
      const dk = dayKey(fecha)
      if (!egresosPorDia[dk]) egresosPorDia[dk] = { date: startOfDay(fecha), totalEgresos: 0, egresosEfectivo: 0 }
      egresosPorDia[dk].totalEgresos = r2(egresosPorDia[dk].totalEgresos + monto)
      if (e.metodo === 'EFECTIVO') egresosPorDia[dk].egresosEfectivo = r2(egresosPorDia[dk].egresosEfectivo + monto)
      movimientos.push({ fecha, tipo: 'EGRESO', concepto: e.concepto, monto, referencia: e.categoria })
    }
  }
  console.log(`💸 Egresos creados: ${nEgresos}`)

  // ---------- 7. Citas ----------
  const TIPOS_CITA = ['CONSULTA', 'LIMPIEZA', 'EXTRACCION', 'ENDODONCIA', 'ORTODONCIA', 'CONTROL', 'EMERGENCIA']
  let nCitas = 0
  for (let i = 0; i < 50; i++) {
    const enAbril = Math.random() < 0.5
    const mes = enAbril ? 4 : 5
    const diaMax = enAbril ? 30 : 31
    const dia = randInt(1, diaMax)
    const fecha = d(mes, dia)
    const hora = randInt(8, 16)
    const dur = pick([30, 45, 60, 90])
    const horaFin = hora + Math.ceil(dur / 60)
    // Estado: las citas pasadas mayormente completadas/no-asistió; futuras programadas
    const esPasada = fecha < new Date(2026, 4, 31)
    let estado
    if (esPasada) estado = pick(['COMPLETADA', 'COMPLETADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'])
    else estado = pick(['PROGRAMADA', 'CONFIRMADA'])
    await prisma.cita.create({
      data: {
        pacienteId: pick(pacientes).id,
        odontologoId: pick(odontologosOEmisor).id,
        fecha,
        horaInicio: `${String(hora).padStart(2, '0')}:00`,
        horaFin: `${String(horaFin).padStart(2, '0')}:00`,
        duracion: dur,
        tipoCita: pick(TIPOS_CITA),
        estado,
        motivo: pick(['Revisión general', 'Dolor dental', 'Control de tratamiento', 'Limpieza programada', 'Urgencia']),
        createdAt: fecha,
      },
    })
    nCitas++
  }
  console.log(`📅 Citas creadas: ${nCitas}`)

  // ---------- 8. Expedientes + procedimientos ----------
  let nExp = 0
  for (let i = 0; i < 10; i++) {
    const paciente = pick(pacientes)
    const fecha = d(pick([4, 5]), randInt(1, 28))
    const exp = await prisma.expediente.create({
      data: {
        pacienteId: paciente.id,
        fecha,
        diagnostico: pick(['Caries en molar', 'Gingivitis leve', 'Maloclusión clase II', 'Fractura coronaria', 'Periodontitis']),
        tratamiento: pick(['Obturación con resina', 'Profilaxis y raspado', 'Plan de ortodoncia', 'Reconstrucción', 'Endodoncia']),
        evolucion: 'Paciente evoluciona favorablemente.',
        createdAt: fecha,
      },
    })
    const s = pick(SERVICIOS)
    await prisma.procedimiento.create({
      data: {
        expedienteId: exp.id,
        odontologoId: pick(odontologosOEmisor).id,
        fecha,
        nombre: s.desc,
        descripcion: `Procedimiento: ${s.desc}`,
        diente: String(randInt(11, 48)),
        precio: s.precio,
        duracion: pick([30, 45, 60]),
        createdAt: fecha,
      },
    })
    nExp++
  }
  console.log(`📋 Expedientes creados: ${nExp} (con procedimiento)`)

  // ---------- 9. Tratamientos + etapas ----------
  const PLANES = [
    { nombre: 'Ortodoncia completa', costo: 35000, etapas: ['Estudio y moldes', 'Colocación de brackets', 'Controles mensuales', 'Retiro y retenedores'] },
    { nombre: 'Rehabilitación oral', costo: 28000, etapas: ['Diagnóstico', 'Endodoncias', 'Coronas', 'Ajuste final'] },
    { nombre: 'Implante unitario', costo: 22000, etapas: ['Cirugía de implante', 'Cicatrización', 'Corona sobre implante'] },
    { nombre: 'Blanqueamiento + limpieza', costo: 5000, etapas: ['Profilaxis', 'Blanqueamiento'] },
  ]
  let nTrat = 0
  for (let i = 0; i < 7; i++) {
    const plan = pick(PLANES)
    const fecha = d(4, randInt(1, 20))
    const estado = pick(['EN_PROGRESO', 'EN_PROGRESO', 'PLANIFICADO', 'COMPLETADO'])
    const costoEtapa = r2(plan.costo / plan.etapas.length)
    await prisma.tratamiento.create({
      data: {
        pacienteId: pick(pacientes).id,
        nombre: plan.nombre,
        descripcion: `Plan: ${plan.nombre}`,
        estado,
        fechaInicio: estado !== 'PLANIFICADO' ? fecha : null,
        costoTotal: plan.costo,
        createdAt: fecha,
        etapas: {
          create: plan.etapas.map((nombre, idx) => {
            const completada = estado === 'COMPLETADO' || (estado === 'EN_PROGRESO' && idx < Math.ceil(plan.etapas.length / 2))
            return {
              orden: idx + 1, nombre, descripcion: nombre, costo: costoEtapa,
              completada, fechaCompletada: completada ? d(4, randInt(20, 30)) : null,
              createdAt: fecha,
            }
          }),
        },
      },
    })
    nTrat++
  }
  console.log(`🦷 Tratamientos creados: ${nTrat} (con etapas)`)

  // ---------- 10. Presupuestos (cotizaciones) ----------
  // Precios INCLUSIVOS de ISV (convención del módulo)
  let nPre = 1
  let nPresup = 0
  const facturasFacturables = facturas.filter((f) => f.estado === 'PAGADA' || f.estado === 'PAGADA_PARCIAL')
  const estadosPresup = [
    'PROPUESTO', 'PROPUESTO', 'PROPUESTO',
    'APROBADO', 'APROBADO',
    'RECHAZADO',
    'FACTURADO', 'FACTURADO',
    'VENCIDO',
  ]
  for (let i = 0; i < 12; i++) {
    const estado = i < estadosPresup.length ? estadosPresup[i] : pick(estadosPresup)
    const mes = Math.random() < 0.5 ? 4 : 5
    const fecha = d(mes, randInt(1, 25))
    const nItems = randInt(1, 3)
    let subtotal = 0, impuesto = 0, totalBruto = 0
    const itemsData = []
    for (let k = 0; k < nItems; k++) {
      const s = pick(SERVICIOS)
      // precio inclusivo = base * (1+tasa/100)
      const precioInclusivo = r2(s.precio * (1 + s.tasa / 100))
      const cantidad = randInt(1, 2)
      const lineaInclusiva = cantidad * precioInclusivo
      const base = s.tasa > 0 ? lineaInclusiva / (1 + s.tasa / 100) : lineaInclusiva
      subtotal += base
      impuesto += lineaInclusiva - base
      totalBruto += lineaInclusiva
      itemsData.push({ descripcion: s.desc, cantidad, precioUnitario: precioInclusivo, subtotal: r2(lineaInclusiva), tasaIsv: s.tasa })
    }
    const descuento = Math.random() < 0.3 ? r2(totalBruto * 0.1) : 0
    const total = r2(totalBruto - descuento)
    const numero = `PRE-${String(nPre).padStart(5, '0')}`
    nPre++

    const facturaVinculada = estado === 'FACTURADO' && facturasFacturables.length ? pick(facturasFacturables) : null

    const pre = await prisma.presupuesto.create({
      data: {
        numero,
        pacienteId: pick(pacientes).id,
        creadoPor: admin.id,
        creadoPorNombre: `${admin.nombre} ${admin.apellido}`,
        fecha,
        validoHasta: estado === 'VENCIDO' ? d(mes, randInt(1, 10)) : new Date(fecha.getTime() + 30 * 86400000),
        subtotal: r2(subtotal),
        descuento,
        impuesto: r2(impuesto),
        total,
        estado,
        facturaId: facturaVinculada ? facturaVinculada.id : null,
        observaciones: pick(['Cotización sujeta a evaluación', 'Incluye materiales', 'Válido por 30 días', null]),
        createdAt: fecha,
        items: { create: itemsData.map((it) => ({ ...it, createdAt: fecha })) },
      },
    })
    auditorias.push({ fecha, accion: 'CREAR', entidad: 'Presupuesto', entidadId: pre.id, descripcion: `Creó el presupuesto ${numero} por ${total.toFixed(2)}`, datos: { numero, total } })
    nPresup++
  }
  console.log(`📝 Presupuestos creados: ${nPresup} (estados variados)`)

  // ---------- 11. Cierres de caja ----------
  // Para los días con actividad de pagos, generar cierre (hasta ~10 días repartidos)
  const diasActivos = Object.keys(pagosPorDia).map((k) => pagosPorDia[k]).sort((a, b) => a.date - b.date)
  // elegir hasta 10 días repartidos
  const seleccion = []
  const step = Math.max(1, Math.floor(diasActivos.length / 10))
  for (let i = 0; i < diasActivos.length && seleccion.length < 10; i += step) seleccion.push(diasActivos[i])
  let nCierres = 0
  const METODOS_ALL = ['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO']
  for (const diaP of seleccion) {
    const dk = dayKey(diaP.date)
    const eg = egresosPorDia[dk] || { totalEgresos: 0, egresosEfectivo: 0 }
    const fondoInicial = 2000
    const totalEfectivo = diaP.totalEfectivo
    const egresosEfectivo = eg.egresosEfectivo
    const efectivoEsperado = r2(fondoInicial + totalEfectivo - egresosEfectivo)
    // mayoría cuadra; algunos con diferencia pequeña
    const ruido = pick([0, 0, 0, 0, 50, -30, 25, -15])
    const efectivoContado = r2(efectivoEsperado + ruido)
    const diferencia = r2(efectivoContado - efectivoEsperado)
    const desglose = {}
    for (const m of METODOS_ALL) desglose[m] = diaP.byMetodo[m] || 0
    const cierre = await prisma.cierreCaja.create({
      data: {
        fecha: diaP.date,
        usuarioId: admin.id,
        usuarioNombre: `${admin.nombre} ${admin.apellido}`,
        fondoInicial,
        totalIngresos: diaP.totalIngresos,
        totalEfectivo,
        totalEgresos: eg.totalEgresos,
        egresosEfectivo,
        efectivoEsperado,
        efectivoContado,
        diferencia,
        desglosePorMetodo: desglose,
        observaciones: diferencia === 0 ? 'Caja cuadrada' : diferencia > 0 ? 'Sobrante en caja' : 'Faltante en caja',
        createdAt: new Date(diaP.date.getTime() + 18 * 3600000),
      },
    })
    auditorias.push({ fecha: cierre.createdAt, accion: 'CREAR', entidad: 'CierreCaja', entidadId: cierre.id, descripcion: `Cerró la caja del ${diaP.date.toLocaleDateString('es-HN')} (esperado ${efectivoEsperado.toFixed(2)}, contado ${efectivoContado.toFixed(2)}, diferencia ${diferencia.toFixed(2)})`, datos: { efectivoEsperado, efectivoContado, diferencia } })
    nCierres++
  }
  console.log(`🔐 Cierres de caja creados: ${nCierres}`)

  // ---------- 12. Flujo de caja ----------
  movimientos.sort((a, b) => a.fecha - b.fecha)
  let saldo = 15000 // saldo inicial de caja
  await prisma.flujoCaja.create({
    data: { fecha: d(4, 1, 0, 0), tipo: 'AJUSTE', concepto: 'Saldo inicial de caja', monto: saldo, saldoAnterior: 0, saldoActual: saldo, referencia: 'INICIAL', createdAt: d(4, 1, 0, 0) },
  })
  for (const mov of movimientos) {
    const saldoAnterior = saldo
    saldo = r2(mov.tipo === 'INGRESO' ? saldo + mov.monto : saldo - mov.monto)
    await prisma.flujoCaja.create({
      data: { fecha: mov.fecha, tipo: mov.tipo, concepto: mov.concepto, monto: mov.monto, saldoAnterior, saldoActual: saldo, referencia: mov.referencia, createdAt: mov.fecha },
    })
  }
  console.log(`💵 Flujo de caja: ${movimientos.length + 1} movimientos (saldo final L. ${saldo.toFixed(2)})`)

  // ---------- 13. Estadísticas por odontólogo ----------
  let nStats = 0
  for (const o of odontologos) {
    for (const [mes, anio] of [[4, 2026], [5, 2026]]) {
      await prisma.estadisticaOdontologo.create({
        data: {
          odontologoId: o.id, mes, anio,
          pacientesAtendidos: randInt(8, 20),
          citasCompletadas: randInt(10, 25),
          citasCanceladas: randInt(1, 5),
          ingresos: r2(randInt(20000, 60000)),
        },
      })
      nStats++
    }
  }
  console.log(`📊 Estadísticas de odontólogos: ${nStats}`)

  // ---------- 14. Auditoría (paciente + lo acumulado) ----------
  for (const p of pacientes.slice(0, 8)) {
    auditorias.push({ fecha: d(4, randInt(1, 5)), accion: 'CREAR', entidad: 'Paciente', entidadId: p.id, descripcion: `Registró al paciente ${p.nombre} ${p.apellido}`, datos: { identificacion: p.identificacion } })
  }
  // Insertar todas las auditorías
  for (const a of auditorias) {
    await prisma.auditoria.create({
      data: {
        fecha: a.fecha,
        accion: a.accion,
        entidad: a.entidad,
        entidadId: a.entidadId || null,
        descripcion: a.descripcion,
        datos: a.datos || undefined,
        usuarioId: admin.id,
        usuarioNombre: `${admin.nombre} ${admin.apellido}`,
        ip: `192.168.1.${randInt(2, 254)}`,
        createdAt: a.fecha,
      },
    })
  }
  console.log(`🕵️  Registros de auditoría creados: ${auditorias.length}`)

  console.log('\n🎉 Seed de 2 meses completado con éxito.')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
