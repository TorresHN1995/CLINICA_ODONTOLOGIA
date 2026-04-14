/**
 * Script completo para generar datos de prueba realistas
 * Ejecutar: node seed-complete.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Datos de prueba
const ODONTOLOGOS = [
  { nombre: 'Carlos', apellido: 'López', email: 'carlos@clinica.com', username: 'carlos_lopez' },
  { nombre: 'Ana', apellido: 'Martínez', email: 'ana@clinica.com', username: 'ana_martinez' },
  { nombre: 'Roberto', apellido: 'García', email: 'roberto@clinica.com', username: 'roberto_garcia' },
];

const PACIENTES = [
  {
    identificacion: '0801-1990-12345',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@email.com',
    telefono: '50412345678',
    celular: '50487654321',
    fechaNacimiento: '1990-05-15',
    ciudad: 'Tegucigalpa',
    alergias: 'Penicilina',
    medicamentos: 'Ninguno',
    enfermedades: 'Hipertensión',
  },
  {
    identificacion: '0801-1985-54321',
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@email.com',
    telefono: '50412345679',
    celular: '50487654322',
    fechaNacimiento: '1985-08-22',
    ciudad: 'Tegucigalpa',
    alergias: 'Ninguna',
    medicamentos: 'Metformina',
    enfermedades: 'Diabetes tipo 2',
  },
  {
    identificacion: '0801-1992-11111',
    nombre: 'Pedro',
    apellido: 'Rodríguez',
    email: 'pedro.rodriguez@email.com',
    telefono: '50412345680',
    celular: '50487654323',
    fechaNacimiento: '1992-03-10',
    ciudad: 'San Pedro Sula',
    alergias: 'Ninguna',
    medicamentos: 'Ninguno',
    enfermedades: 'Ninguna',
  },
  {
    identificacion: '0801-1988-22222',
    nombre: 'Laura',
    apellido: 'Hernández',
    email: 'laura.hernandez@email.com',
    telefono: '50412345681',
    celular: '50487654324',
    fechaNacimiento: '1988-11-30',
    ciudad: 'La Ceiba',
    alergias: 'Aspirina',
    medicamentos: 'Ninguno',
    enfermedades: 'Ninguna',
  },
  {
    identificacion: '0801-1995-33333',
    nombre: 'Carlos',
    apellido: 'Morales',
    email: 'carlos.morales@email.com',
    telefono: '50412345682',
    celular: '50487654325',
    fechaNacimiento: '1995-07-18',
    ciudad: 'Tegucigalpa',
    alergias: 'Ninguna',
    medicamentos: 'Ninguno',
    enfermedades: 'Ninguna',
  },
];

const PRODUCTOS_SERVICIOS = [
  { codigo: 'SRV-001', nombre: 'Consulta General', precio: 150.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-002', nombre: 'Limpieza Dental', precio: 200.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-003', nombre: 'Obturación Simple', precio: 250.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-004', nombre: 'Obturación Compuesta', precio: 350.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-005', nombre: 'Extracción Dental', precio: 300.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-006', nombre: 'Radiografía Periapical', precio: 50.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-007', nombre: 'Radiografía Panorámica', precio: 100.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-008', nombre: 'Tratamiento de Conducto', precio: 800.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-009', nombre: 'Corona Dental', precio: 1200.00, tipo: 'SERVICIO' },
  { codigo: 'SRV-010', nombre: 'Puente Dental', precio: 2000.00, tipo: 'SERVICIO' },
];

const INVENTARIO = [
  { codigo: 'MAT-001', nombre: 'Guantes de Nitrilo Talla M', categoria: 'CONSUMIBLE', stock: 500, precioCompra: 0.50, precioVenta: 1.00 },
  { codigo: 'MAT-002', nombre: 'Mascarillas Quirúrgicas', categoria: 'CONSUMIBLE', stock: 1000, precioCompra: 0.30, precioVenta: 0.75 },
  { codigo: 'MAT-003', nombre: 'Resina Compuesta A2', categoria: 'MATERIAL_DENTAL', stock: 50, precioCompra: 25.00, precioVenta: 45.00 },
  { codigo: 'MAT-004', nombre: 'Ácido Grabador 37%', categoria: 'MATERIAL_DENTAL', stock: 30, precioCompra: 15.00, precioVenta: 28.00 },
  { codigo: 'MAT-005', nombre: 'Adhesivo Dental', categoria: 'MATERIAL_DENTAL', stock: 40, precioCompra: 20.00, precioVenta: 38.00 },
  { codigo: 'INS-001', nombre: 'Espejo Dental', categoria: 'INSTRUMENTAL', stock: 20, precioCompra: 5.00, precioVenta: 12.00 },
  { codigo: 'INS-002', nombre: 'Explorador Dental', categoria: 'INSTRUMENTAL', stock: 25, precioCompra: 3.00, precioVenta: 8.00 },
  { codigo: 'MED-001', nombre: 'Amoxicilina 500mg', categoria: 'MEDICAMENTO', stock: 100, precioCompra: 0.50, precioVenta: 1.50 },
  { codigo: 'MED-002', nombre: 'Ibuprofeno 400mg', categoria: 'MEDICAMENTO', stock: 150, precioCompra: 0.30, precioVenta: 1.00 },
];

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...\n');

  try {
    // 1. Crear Odontólogos
    console.log('📋 Creando odontólogos...');
    const odontologosCreados = [];
    
    for (const odontologo of ODONTOLOGOS) {
      const existente = await prisma.usuario.findUnique({
        where: { username: odontologo.username }
      });

      if (!existente) {
        const hashedPassword = await bcrypt.hash('Odontologo123!', 10);
        const created = await prisma.usuario.create({
          data: {
            ...odontologo,
            password: hashedPassword,
            telefono: '50412345678',
            rol: 'ODONTOLOGO',
            activo: true,
          },
        });
        odontologosCreados.push(created);
        console.log(`  ✓ ${created.nombre} ${created.apellido}`);
      } else {
        odontologosCreados.push(existente);
        console.log(`  ✓ ${existente.nombre} ${existente.apellido} (ya existe)`);
      }
    }

    // 2. Crear Pacientes
    console.log('\n👥 Creando pacientes...');
    const pacientesCreados = [];
    
    for (const paciente of PACIENTES) {
      const existente = await prisma.paciente.findUnique({
        where: { identificacion: paciente.identificacion }
      });

      if (!existente) {
        const created = await prisma.paciente.create({
          data: {
            ...paciente,
            fechaNacimiento: new Date(paciente.fechaNacimiento),
            activo: true,
          },
        });
        pacientesCreados.push(created);
        console.log(`  ✓ ${created.nombre} ${created.apellido}`);
      } else {
        pacientesCreados.push(existente);
        console.log(`  ✓ ${existente.nombre} ${existente.apellido} (ya existe)`);
      }
    }

    // 3. Crear Productos/Servicios
    console.log('\n🛍️  Creando productos y servicios...');
    const productosCreados = [];
    
    for (const producto of PRODUCTOS_SERVICIOS) {
      const existente = await prisma.productoServicio.findFirst({
        where: { nombre: producto.nombre }
      });

      if (!existente) {
        const created = await prisma.productoServicio.create({
          data: {
            codigo: producto.codigo,
            nombre: producto.nombre,
            precio: producto.precio,
            tipo: producto.tipo,
            descripcion: `Servicio de ${producto.nombre.toLowerCase()}`,
            activo: true,
          },
        });
        productosCreados.push(created);
        console.log(`  ✓ ${created.nombre} - L. ${created.precio}`);
      } else {
        productosCreados.push(existente);
        console.log(`  ✓ ${existente.nombre} (ya existe)`);
      }
    }

    // 4. Crear Inventario
    console.log('\n📦 Creando inventario...');
    const inventarioCreado = [];
    
    for (const item of INVENTARIO) {
      const existente = await prisma.inventario.findUnique({
        where: { codigo: item.codigo }
      });

      if (!existente) {
        const created = await prisma.inventario.create({
          data: {
            ...item,
            unidadMedida: 'Unidad',
            activo: true,
            stockMinimo: 10,
          },
        });
        inventarioCreado.push(created);
        console.log(`  ✓ ${created.nombre} (Stock: ${created.stock})`);
      } else {
        inventarioCreado.push(existente);
        console.log(`  ✓ ${existente.nombre} (ya existe)`);
      }
    }

    // 5. Crear Expedientes Clínicos
    console.log('\n📄 Creando expedientes clínicos...');
    const expedientesCreados = [];
    
    for (let i = 0; i < pacientesCreados.length; i++) {
      const existente = await prisma.expediente.findFirst({
        where: { pacienteId: pacientesCreados[i].id }
      });

      if (!existente) {
        const created = await prisma.expediente.create({
          data: {
            pacienteId: pacientesCreados[i].id,
            diagnostico: 'Revisión inicial completada. Presencia de caries en piezas posteriores.',
            tratamiento: 'Obturación de caries. Profilaxis dental.',
            evolucion: 'Paciente responde bien al tratamiento',
            proximaCita: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            odontograma: JSON.stringify({
              dientes: {
                '16': { estado: 'caries', tratamiento: 'obturacion' },
                '26': { estado: 'sano', tratamiento: 'ninguno' },
              },
            }),
          },
        });
        expedientesCreados.push(created);
        console.log(`  ✓ Expediente para ${pacientesCreados[i].nombre}`);
      } else {
        expedientesCreados.push(existente);
        console.log(`  ✓ Expediente para ${pacientesCreados[i].nombre} (ya existe)`);
      }
    }

    // 6. Crear Citas
    console.log('\n📅 Creando citas...');
    const citasCreadas = [];
    
    for (let i = 0; i < pacientesCreados.length; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + (i + 1));
      const fechaStr = fecha.toISOString().split('T')[0];
      
      const odontologo = odontologosCreados[i % odontologosCreados.length];
      
      const existente = await prisma.cita.findFirst({
        where: {
          pacienteId: pacientesCreados[i].id,
          fecha: new Date(fechaStr),
        }
      });

      if (!existente) {
        const created = await prisma.cita.create({
          data: {
            pacienteId: pacientesCreados[i].id,
            odontologoId: odontologo.id,
            fecha: new Date(fechaStr),
            horaInicio: '09:00',
            horaFin: '09:30',
            duracion: 30,
            tipoCita: 'CONSULTA',
            estado: 'PROGRAMADA',
            motivo: 'Revisión general',
            observaciones: 'Primera cita del paciente',
          },
        });
        citasCreadas.push(created);
        console.log(`  ✓ Cita para ${pacientesCreados[i].nombre} - ${fechaStr}`);
      } else {
        citasCreadas.push(existente);
        console.log(`  ✓ Cita para ${pacientesCreados[i].nombre} (ya existe)`);
      }
    }

    // 7. Crear Tratamientos
    console.log('\n🦷 Creando planes de tratamiento...');
    const tratamientosCreados = [];
    
    const tiposTratamiento = [
      { nombre: 'Ortodoncia', costo: 2500.00 },
      { nombre: 'Implante Dental', costo: 3500.00 },
      { nombre: 'Blanqueamiento', costo: 800.00 },
      { nombre: 'Limpieza Profunda', costo: 600.00 },
    ];

    for (let i = 0; i < pacientesCreados.length; i++) {
      const tipo = tiposTratamiento[i % tiposTratamiento.length];
      
      const existente = await prisma.tratamiento.findFirst({
        where: {
          pacienteId: pacientesCreados[i].id,
          nombre: tipo.nombre,
        }
      });

      if (!existente) {
        const created = await prisma.tratamiento.create({
          data: {
            pacienteId: pacientesCreados[i].id,
            nombre: tipo.nombre,
            descripcion: `Plan de ${tipo.nombre.toLowerCase()} para ${pacientesCreados[i].nombre}`,
            estado: 'PLANIFICADO',
            costoTotal: tipo.costo,
            observaciones: 'Tratamiento planificado',
          },
        });
        tratamientosCreados.push(created);
        console.log(`  ✓ ${tipo.nombre} para ${pacientesCreados[i].nombre}`);
      } else {
        tratamientosCreados.push(existente);
        console.log(`  ✓ ${tipo.nombre} para ${pacientesCreados[i].nombre} (ya existe)`);
      }
    }

    // 8. Crear Facturas
    console.log('\n💰 Creando facturas...');
    const admin = await prisma.usuario.findFirst({
      where: { rol: 'ADMINISTRADOR' }
    });

    const facturasCreadas = [];
    
    for (let i = 0; i < pacientesCreados.length; i++) {
      const existente = await prisma.factura.findFirst({
        where: { pacienteId: pacientesCreados[i].id }
      });

      if (!existente) {
        const subtotal = 150.00;
        const impuesto = subtotal * 0.15;
        const total = subtotal + impuesto;

        const created = await prisma.factura.create({
          data: {
            pacienteId: pacientesCreados[i].id,
            emitenteId: admin.id,
            numero: `FAC-${Date.now()}-${i}`,
            subtotal: subtotal,
            descuento: 0,
            impuesto: impuesto,
            total: total,
            metodoPago: 'EFECTIVO',
            estado: 'PENDIENTE',
            observaciones: 'Factura por servicios dentales',
            items: {
              create: [
                {
                  descripcion: 'Consulta General',
                  cantidad: 1,
                  precioUnitario: 150.00,
                  subtotal: 150.00,
                }
              ]
            }
          },
          include: { items: true }
        });
        facturasCreadas.push(created);
        console.log(`  ✓ Factura ${created.numero} - L. ${created.total}`);
      } else {
        facturasCreadas.push(existente);
        console.log(`  ✓ Factura para ${pacientesCreados[i].nombre} (ya existe)`);
      }
    }

    // 9. Crear Egresos
    console.log('\n📉 Creando egresos...');
    const egresosCreados = [];
    
    const tiposEgreso = [
      { concepto: 'Compra de materiales dentales', monto: 500.00 },
      { concepto: 'Pago de servicios', monto: 300.00 },
      { concepto: 'Mantenimiento de equipos', monto: 200.00 },
      { concepto: 'Suministros de oficina', monto: 150.00 },
    ];

    for (const egreso of tiposEgreso) {
      const existente = await prisma.egreso.findFirst({
        where: { concepto: egreso.concepto }
      });

      if (!existente) {
        const created = await prisma.egreso.create({
          data: {
            concepto: egreso.concepto,
            monto: egreso.monto,
            registradoPor: admin.id,
            categoria: 'MATERIALES_DENTALES',
            metodoPago: 'EFECTIVO',
            fecha: new Date(),
          },
        });
        egresosCreados.push(created);
        console.log(`  ✓ ${egreso.concepto} - L. ${egreso.monto}`);
      } else {
        egresosCreados.push(existente);
        console.log(`  ✓ ${egreso.concepto} (ya existe)`);
      }
    }

    console.log('\n✅ Seed completado exitosamente\n');
    console.log('📊 Resumen de datos creados:');
    console.log(`   • Odontólogos: ${odontologosCreados.length}`);
    console.log(`   • Pacientes: ${pacientesCreados.length}`);
    console.log(`   • Productos/Servicios: ${productosCreados.length}`);
    console.log(`   • Inventario: ${inventarioCreado.length}`);
    console.log(`   • Expedientes: ${expedientesCreados.length}`);
    console.log(`   • Citas: ${citasCreadas.length}`);
    console.log(`   • Tratamientos: ${tratamientosCreados.length}`);
    console.log(`   • Facturas: ${facturasCreadas.length}`);
    console.log(`   • Egresos: ${egresosCreados.length}`);
    console.log('\n🔐 Credenciales de acceso:');
    console.log('   Admin:');
    console.log('   • Usuario: admin');
    console.log('   • Contraseña: Admin123!');
    console.log('\n   Odontólogos:');
    console.log('   • Usuario: carlos_lopez, ana_martinez, roberto_garcia');
    console.log('   • Contraseña: Odontologo123!');

  } catch (error) {
    console.error('❌ Error durante seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
