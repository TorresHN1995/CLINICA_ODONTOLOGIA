import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar base de datos (orden correcto para evitar problemas de FK)
  await prisma.pago.deleteMany()
  await prisma.itemFactura.deleteMany()
  await prisma.factura.deleteMany()
  await prisma.etapaTratamiento.deleteMany()
  await prisma.tratamiento.deleteMany()
  await prisma.procedimiento.deleteMany()
  await prisma.imagenClinica.deleteMany()
  await prisma.expediente.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.cita.deleteMany()
  await prisma.paciente.deleteMany()
  await prisma.estadisticaOdontologo.deleteMany()
  await prisma.movimientoInventario.deleteMany()
  await prisma.inventario.deleteMany()
  await prisma.flujoCaja.deleteMany()
  await prisma.egreso.deleteMany()
  await prisma.ingreso.deleteMany()
  await prisma.configuracionEmpresa.deleteMany()
  await prisma.usuario.deleteMany()

  console.log('✅ Base de datos limpiada')

  // Crear usuarios
  const adminPassword = await bcrypt.hash('admin123', 10)
  const odontologoPassword = await bcrypt.hash('odontologo123', 10)

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@clinica.com',
      username: 'admin',
      password: adminPassword,
      nombre: 'Admin',
      apellido: 'Sistema',
      telefono: '555-0100',
      rol: 'ADMINISTRADOR',
    },
  })

  const odontologo1 = await prisma.usuario.create({
    data: {
      email: 'dra.garcia@clinica.com',
      username: 'dra.garcia',
      password: odontologoPassword,
      nombre: 'María',
      apellido: 'García',
      telefono: '555-0101',
      rol: 'ODONTOLOGO',
    },
  })

  const odontologo2 = await prisma.usuario.create({
    data: {
      email: 'dr.martinez@clinica.com',
      username: 'dr.martinez',
      password: odontologoPassword,
      nombre: 'Carlos',
      apellido: 'Martínez',
      telefono: '555-0102',
      rol: 'ODONTOLOGO',
    },
  })

  const recepcion = await prisma.usuario.create({
    data: {
      email: 'recepcion@clinica.com',
      username: 'recepcion',
      password: odontologoPassword,
      nombre: 'Ana',
      apellido: 'López',
      telefono: '555-0103',
      rol: 'RECEPCION',
    },
  })

  console.log('✅ Usuarios creados')

  // Crear configuración de empresa
  const configuracionEmpresa = await prisma.configuracionEmpresa.create({
    data: {
      nombre: 'Clínica Odontológica San Rafael',
      rtn: '08019999123456',
      telefono: '+504 2234-5678',
      email: 'info@clinicasanrafael.hn',
      direccion: 'Col. Centro, Ave. República de Chile, Edificio San Rafael, 2do Piso',
      ciudad: 'Tegucigalpa',
      pais: 'Honduras',
      moneda: 'HNL',
      simboloMoneda: 'L.',
      formatoFecha: 'DD/MM/YYYY',
      logo: 'https://via.placeholder.com/200x100/3B82F6/FFFFFF?text=Clinica+San+Rafael'
    },
  })

  console.log('✅ Configuración de empresa creada')

  // Crear pacientes
  const pacientes = await Promise.all([
    prisma.paciente.create({
      data: {
        identificacion: '12345678',
        nombre: 'Juan',
        apellido: 'Pérez',
        fechaNacimiento: new Date('1990-05-15'),
        email: 'juan.perez@email.com',
        telefono: '555-1001',
        celular: '555-1002',
        direccion: 'Calle Principal 123',
        ciudad: 'Ciudad Capital',
        ocupacion: 'Ingeniero',
        contactoEmergencia: 'María Pérez',
        telefonoEmergencia: '555-1003',
        alergias: 'Penicilina',
        medicamentos: 'Ninguno',
        enfermedades: 'Ninguna',
      },
    }),
    prisma.paciente.create({
      data: {
        identificacion: '87654321',
        nombre: 'Laura',
        apellido: 'Gómez',
        fechaNacimiento: new Date('1985-08-22'),
        email: 'laura.gomez@email.com',
        telefono: '555-2001',
        direccion: 'Avenida Central 456',
        ciudad: 'Ciudad Capital',
        ocupacion: 'Profesora',
        alergias: 'Ninguna',
      },
    }),
    prisma.paciente.create({
      data: {
        identificacion: '11223344',
        nombre: 'Pedro',
        apellido: 'Ramírez',
        fechaNacimiento: new Date('1995-03-10'),
        telefono: '555-3001',
        ciudad: 'Ciudad Capital',
      },
    }),
  ])

  console.log('✅ Pacientes creados')

  // Crear citas
  const hoy = new Date()
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  await Promise.all([
    prisma.cita.create({
      data: {
        pacienteId: pacientes[0].id,
        odontologoId: odontologo1.id,
        fecha: hoy,
        horaInicio: '09:00',
        horaFin: '09:30',
        duracion: 30,
        tipoCita: 'CONSULTA',
        estado: 'PROGRAMADA',
        motivo: 'Revisión general',
      },
    }),
    prisma.cita.create({
      data: {
        pacienteId: pacientes[1].id,
        odontologoId: odontologo2.id,
        fecha: hoy,
        horaInicio: '10:00',
        horaFin: '11:00',
        duracion: 60,
        tipoCita: 'LIMPIEZA',
        estado: 'COMPLETADA',
        motivo: 'Limpieza dental',
      },
    }),
    prisma.cita.create({
      data: {
        pacienteId: pacientes[2].id,
        odontologoId: odontologo1.id,
        fecha: manana,
        horaInicio: '14:00',
        horaFin: '15:30',
        duracion: 90,
        tipoCita: 'ENDODONCIA',
        estado: 'PROGRAMADA',
        motivo: 'Tratamiento de conducto',
      },
    }),
  ])

  console.log('✅ Citas creadas')

  // Crear expedientes
  const expediente1 = await prisma.expediente.create({
    data: {
      pacienteId: pacientes[0].id,
      diagnostico: 'Caries en molar superior derecho',
      tratamiento: 'Obturación con resina',
      evolucion: 'Paciente sin molestias',
      proximaCita: manana,
      odontograma: JSON.stringify({
        16: { numero: 16, estado: 'caries', notas: 'Caries profunda' },
        17: { numero: 17, estado: 'obturado', notas: 'Obturación anterior' },
      }),
    },
  })

  console.log('✅ Expedientes creados')

  // Crear tratamientos
  await prisma.tratamiento.create({
    data: {
      pacienteId: pacientes[1].id,
      nombre: 'Ortodoncia',
      descripcion: 'Tratamiento de ortodoncia completo',
      estado: 'EN_PROGRESO',
      fechaInicio: new Date(),
      costoTotal: 15000,
      observaciones: 'Uso de brackets metálicos',
      etapas: {
        create: [
          { orden: 1, nombre: 'Evaluación inicial', descripcion: 'Radiografías y moldes', costo: 1500, completada: true },
          { orden: 2, nombre: 'Colocación de brackets', descripcion: 'Instalación del aparato', costo: 5000, completada: true },
          { orden: 3, nombre: 'Control mensual', descripcion: 'Ajustes y seguimiento', costo: 500 },
          { orden: 4, nombre: 'Retiro de brackets', descripcion: 'Finalización del tratamiento', costo: 2000 },
        ],
      },
    },
  })

  console.log('✅ Tratamientos creados')

  // Crear factura
  await prisma.factura.create({
    data: {
      numero: 'F-000001',
      pacienteId: pacientes[0].id,
      emitenteId: admin.id,
      subtotal: 1000,
      descuento: 100,
      impuesto: 135,
      total: 1035,
      estado: 'PAGADA',
      items: {
        create: [
          { descripcion: 'Consulta general', cantidad: 1, precioUnitario: 500, subtotal: 500 },
          { descripcion: 'Limpieza dental', cantidad: 1, precioUnitario: 500, subtotal: 500 },
        ],
      },
      pagos: {
        create: [
          { monto: 1035, metodoPago: 'EFECTIVO', referencia: 'Pago en efectivo' },
        ],
      },
    },
  })

  console.log('✅ Facturas creadas')

  // Crear inventario
  await Promise.all([
    prisma.inventario.create({
      data: {
        codigo: 'MAT-001',
        nombre: 'Guantes de látex',
        descripcion: 'Guantes desechables para procedimientos',
        categoria: 'CONSUMIBLE',
        unidadMedida: 'Caja',
        stock: 150,
        stockMinimo: 50,
        precioCompra: 15.50,
        precioVenta: 25.00,
        proveedor: 'Proveedores Médicos S.A.',
      },
    }),
    prisma.inventario.create({
      data: {
        codigo: 'MED-001',
        nombre: 'Anestesia local',
        descripcion: 'Lidocaína al 2%',
        categoria: 'MEDICAMENTO',
        unidadMedida: 'Ampolla',
        stock: 25,
        stockMinimo: 30,
        precioCompra: 3.50,
        precioVenta: 8.00,
        proveedor: 'Farmacias Dentales',
      },
    }),
    prisma.inventario.create({
      data: {
        codigo: 'INS-001',
        nombre: 'Espejo dental',
        descripcion: 'Espejo bucal con mango de acero',
        categoria: 'INSTRUMENTAL',
        unidadMedida: 'Unidad',
        stock: 45,
        stockMinimo: 20,
        precioCompra: 8.00,
        precioVenta: 15.00,
      },
    }),
  ])

  console.log('✅ Inventario creado')

  // Crear algunos egresos de ejemplo
  await Promise.all([
    prisma.egreso.create({
      data: {
        concepto: 'Compra de materiales dentales',
        categoria: 'MATERIALES_DENTALES',
        monto: 250.00,
        fecha: new Date(),
        metodoPago: 'TARJETA_CREDITO',
        proveedor: 'Dental Supply Co.',
        numeroFactura: 'DS-001234',
        estado: 'PAGADO',
        registradoPor: admin.id,
        observaciones: 'Materiales para el mes de octubre',
      },
    }),
    prisma.egreso.create({
      data: {
        concepto: 'Pago de alquiler',
        categoria: 'ALQUILER',
        monto: 1200.00,
        fecha: new Date(),
        metodoPago: 'TRANSFERENCIA',
        proveedor: 'Inmobiliaria Central',
        numeroFactura: 'ALQ-2024-10',
        estado: 'PAGADO',
        registradoPor: admin.id,
        observaciones: 'Alquiler del local - Octubre 2024',
      },
    }),
    prisma.egreso.create({
      data: {
        concepto: 'Servicios públicos',
        categoria: 'SERVICIOS_PUBLICOS',
        monto: 180.50,
        fecha: new Date(),
        metodoPago: 'EFECTIVO',
        proveedor: 'Empresa Eléctrica',
        numeroFactura: 'EE-987654',
        estado: 'PAGADO',
        registradoPor: admin.id,
        observaciones: 'Luz y agua del mes',
      },
    }),
  ])

  console.log('✅ Egresos creados')

  // Crear flujo de caja inicial
  await prisma.flujoCaja.create({
    data: {
      tipo: 'AJUSTE',
      concepto: 'Saldo inicial',
      monto: 10000.00,
      saldoAnterior: 0,
      saldoActual: 10000.00,
      referencia: 'INICIAL',
    },
  })

  console.log('✅ Flujo de caja inicializado')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📧 Credenciales de acceso:')
  console.log('Admin: admin@clinica.com / admin123')
  console.log('Odontólogo: dra.garcia@clinica.com / odontologo123')
  console.log('Recepción: recepcion@clinica.com / odontologo123')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

