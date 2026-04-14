/**
 * Seed final — Datos de prueba limpios y coherentes
 * Ejecutar: node seed-final.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────
function fecha(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(8, 0, 0, 0);
  return d;
}

async function main() {
  console.log('\n🦷 Seed Final — Clínica Odontológica\n');

  // ════════════════════════════════════════════════════════
  // 1. USUARIOS
  // ════════════════════════════════════════════════════════
  console.log('👤 Usuarios...');
  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMINISTRADOR' } });
  if (!admin) { console.error('❌ No hay admin'); return; }
  console.log(`  ✓ Admin existente: ${admin.username}`);

  const hashOd = await bcrypt.hash('Odontologo123!', 10);
  const hashRec = await bcrypt.hash('Recepcion123!', 10);
  const hashAsi = await bcrypt.hash('Asistente123!', 10);

  const od1 = await prisma.usuario.create({ data: { email: 'dra.garcia@clinica.com', username: 'dra.garcia', password: hashOd, nombre: 'María', apellido: 'García López', telefono: '50433001001', rol: 'ODONTOLOGO' } });
  const od2 = await prisma.usuario.create({ data: { email: 'dr.martinez@clinica.com', username: 'dr.martinez', password: hashOd, nombre: 'Carlos', apellido: 'Martínez Reyes', telefono: '50433002002', rol: 'ODONTOLOGO' } });
  const od3 = await prisma.usuario.create({ data: { email: 'dra.flores@clinica.com', username: 'dra.flores', password: hashOd, nombre: 'Ana', apellido: 'Flores Mejía', telefono: '50433003003', rol: 'ODONTOLOGO' } });
  await prisma.usuario.create({ data: { email: 'recepcion@clinica.com', username: 'recepcion', password: hashRec, nombre: 'Sofía', apellido: 'López Hernández', telefono: '50433004004', rol: 'RECEPCION' } });
  await prisma.usuario.create({ data: { email: 'asistente@clinica.com', username: 'asistente', password: hashAsi, nombre: 'Daniela', apellido: 'Ramos Cruz', telefono: '50433005005', rol: 'ASISTENTE' } });
  const odontologos = [od1, od2, od3];
  console.log('  ✓ 5 usuarios creados');


  // ════════════════════════════════════════════════════════
  // 2. CONFIGURACIÓN EMPRESA
  // ════════════════════════════════════════════════════════
  console.log('\n🏢 Configuración empresa...');
  await prisma.configuracionEmpresa.create({
    data: {
      nombre: 'Clínica Odontológica San Rafael',
      rtn: '08019999123456',
      telefono: '+504 2234-5678',
      email: 'info@clinicasanrafael.hn',
      direccion: 'Col. Palmira, Ave. República de Chile, Edificio Médico San Rafael, 2do Piso',
      ciudad: 'Tegucigalpa', pais: 'Honduras', moneda: 'HNL', simboloMoneda: 'L.', formatoFecha: 'DD/MM/YYYY',
    },
  });
  console.log('  ✓ Empresa configurada');

  // ════════════════════════════════════════════════════════
  // 3. PACIENTES
  // ════════════════════════════════════════════════════════
  console.log('\n👥 Pacientes...');
  const pacientesData = [
    { identificacion: '0801199012345', nombre: 'Juan', apellido: 'Pérez Castillo', fechaNacimiento: new Date('1990-05-15'), email: 'juan.perez@email.com', telefono: '50498001001', celular: '50498001002', direccion: 'Col. Kennedy, Bloque H, Casa 12', ciudad: 'Tegucigalpa', ocupacion: 'Ingeniero Civil', contactoEmergencia: 'Rosa Castillo', telefonoEmergencia: '50498001003', alergias: 'Penicilina', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
    { identificacion: '0801198554321', nombre: 'María', apellido: 'González Rivera', fechaNacimiento: new Date('1985-08-22'), email: 'maria.gonzalez@email.com', telefono: '50498002001', direccion: 'Res. Los Pinos, Casa 45', ciudad: 'Tegucigalpa', ocupacion: 'Contadora', alergias: 'Ninguna', medicamentos: 'Metformina 500mg', enfermedades: 'Diabetes tipo 2' },
    { identificacion: '0801199211111', nombre: 'Pedro', apellido: 'Rodríguez Mejía', fechaNacimiento: new Date('1992-03-10'), email: 'pedro.rodriguez@email.com', telefono: '50498003001', direccion: 'Barrio Abajo, 3ra Calle', ciudad: 'San Pedro Sula', ocupacion: 'Profesor', alergias: 'Ninguna', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
    { identificacion: '0801198822222', nombre: 'Laura', apellido: 'Hernández Pineda', fechaNacimiento: new Date('1988-11-30'), email: 'laura.hernandez@email.com', telefono: '50498004001', celular: '50498004002', direccion: 'Col. Miraflores, Ave. Principal', ciudad: 'Tegucigalpa', ocupacion: 'Abogada', alergias: 'Aspirina', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
    { identificacion: '0801199533333', nombre: 'Carlos', apellido: 'Morales Ávila', fechaNacimiento: new Date('1995-07-18'), email: 'carlos.morales@email.com', telefono: '50498005001', direccion: 'Col. Lomas del Guijarro', ciudad: 'Tegucigalpa', ocupacion: 'Diseñador Gráfico', alergias: 'Ninguna', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
    { identificacion: '0801200044444', nombre: 'Sofía', apellido: 'Reyes Turcios', fechaNacimiento: new Date('2000-01-25'), email: 'sofia.reyes@email.com', telefono: '50498006001', direccion: 'Res. Villa Real, Bloque 3', ciudad: 'Comayagüela', ocupacion: 'Estudiante', alergias: 'Ninguna', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
    { identificacion: '0801197855555', nombre: 'Roberto', apellido: 'Zelaya Fúnez', fechaNacimiento: new Date('1978-09-05'), email: 'roberto.zelaya@email.com', telefono: '50498007001', direccion: 'Barrio La Granja, 5ta Ave.', ciudad: 'Tegucigalpa', ocupacion: 'Empresario', alergias: 'Ninguna', medicamentos: 'Losartán 50mg', enfermedades: 'Hipertensión arterial' },
    { identificacion: '0801198366666', nombre: 'Andrea', apellido: 'Bustillo Cárcamo', fechaNacimiento: new Date('1983-04-12'), email: 'andrea.bustillo@email.com', telefono: '50498008001', direccion: 'Col. Palmira', ciudad: 'Tegucigalpa', ocupacion: 'Médico General', alergias: 'Sulfas', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
    { identificacion: '0801200177777', nombre: 'Diego', apellido: 'Aguilar Sosa', fechaNacimiento: new Date('2001-12-08'), email: 'diego.aguilar@email.com', telefono: '50498009001', direccion: 'Col. Las Colinas, Bloque B', ciudad: 'Tegucigalpa', ocupacion: 'Estudiante Universitario', alergias: 'Ninguna', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
    { identificacion: '0801197088888', nombre: 'Carmen', apellido: 'Valladares Ortiz', fechaNacimiento: new Date('1970-06-20'), email: 'carmen.valladares@email.com', telefono: '50498010001', direccion: 'Barrio El Centro, 2da Calle', ciudad: 'Tegucigalpa', ocupacion: 'Jubilada', alergias: 'Anestesia con epinefrina', medicamentos: 'Omeprazol, Calcio', enfermedades: 'Osteoporosis, Gastritis' },
  ];
  const pacientes = [];
  for (const p of pacientesData) {
    pacientes.push(await prisma.paciente.create({ data: p }));
  }
  console.log(`  ✓ ${pacientes.length} pacientes creados`);

  // ════════════════════════════════════════════════════════
  // 4. PRODUCTOS Y SERVICIOS
  // ════════════════════════════════════════════════════════
  console.log('\n🛍️  Productos y servicios...');
  const servicios = [
    { codigo: 'SRV-001', nombre: 'Consulta General', precio: 300, tipo: 'SERVICIO', descripcion: 'Evaluación dental completa' },
    { codigo: 'SRV-002', nombre: 'Profilaxis Dental', precio: 450, tipo: 'SERVICIO', descripcion: 'Limpieza profesional con ultrasonido' },
    { codigo: 'SRV-003', nombre: 'Obturación con Resina', precio: 600, tipo: 'SERVICIO', descripcion: 'Restauración con resina compuesta' },
    { codigo: 'SRV-004', nombre: 'Extracción Simple', precio: 500, tipo: 'SERVICIO', descripcion: 'Extracción dental sin complicaciones' },
    { codigo: 'SRV-005', nombre: 'Extracción de Cordal', precio: 1500, tipo: 'SERVICIO', descripcion: 'Extracción quirúrgica de tercer molar' },
    { codigo: 'SRV-006', nombre: 'Endodoncia', precio: 2500, tipo: 'SERVICIO', descripcion: 'Tratamiento de conducto radicular' },
    { codigo: 'SRV-007', nombre: 'Corona de Porcelana', precio: 4500, tipo: 'SERVICIO', descripcion: 'Corona dental porcelana sobre metal' },
    { codigo: 'SRV-008', nombre: 'Puente Dental (3 piezas)', precio: 12000, tipo: 'SERVICIO', descripcion: 'Puente fijo de 3 unidades' },
    { codigo: 'SRV-009', nombre: 'Blanqueamiento Dental', precio: 2000, tipo: 'SERVICIO', descripcion: 'Blanqueamiento profesional' },
    { codigo: 'SRV-010', nombre: 'Radiografía Periapical', precio: 150, tipo: 'SERVICIO', descripcion: 'Radiografía dental individual' },
    { codigo: 'SRV-011', nombre: 'Radiografía Panorámica', precio: 400, tipo: 'SERVICIO', descripcion: 'Radiografía panorámica completa' },
    { codigo: 'SRV-012', nombre: 'Aplicación de Flúor', precio: 200, tipo: 'SERVICIO', descripcion: 'Aplicación tópica de flúor' },
    { codigo: 'SRV-013', nombre: 'Sellante Dental', precio: 250, tipo: 'SERVICIO', descripcion: 'Sellante de fosas y fisuras' },
    { codigo: 'PRD-001', nombre: 'Cepillo Dental Profesional', precio: 85, tipo: 'PRODUCTO', descripcion: 'Cepillo de cerdas suaves' },
    { codigo: 'PRD-002', nombre: 'Pasta Dental con Flúor', precio: 120, tipo: 'PRODUCTO', descripcion: 'Pasta dental profesional 100ml' },
    { codigo: 'PRD-003', nombre: 'Enjuague Bucal', precio: 180, tipo: 'PRODUCTO', descripcion: 'Enjuague antiséptico 500ml' },
  ];
  for (const s of servicios) { await prisma.productoServicio.create({ data: s }); }
  console.log(`  ✓ ${servicios.length} productos/servicios`);


  // ════════════════════════════════════════════════════════
  // 5. INVENTARIO + MOVIMIENTOS
  // ════════════════════════════════════════════════════════
  console.log('\n📦 Inventario...');
  const invItems = [
    { codigo: 'MAT-001', nombre: 'Guantes de Nitrilo Talla M', categoria: 'CONSUMIBLE', unidadMedida: 'Caja x100', stock: 45, stockMinimo: 20, precioCompra: 180, precioVenta: 250, proveedor: 'Dental Supply Honduras' },
    { codigo: 'MAT-002', nombre: 'Mascarillas Quirúrgicas', categoria: 'CONSUMIBLE', unidadMedida: 'Caja x50', stock: 60, stockMinimo: 25, precioCompra: 95, precioVenta: 150, proveedor: 'MediHonduras S.A.' },
    { codigo: 'MAT-003', nombre: 'Resina Compuesta A2 (3M)', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Jeringa 4g', stock: 25, stockMinimo: 10, precioCompra: 450, precioVenta: 650, proveedor: '3M Dental' },
    { codigo: 'MAT-004', nombre: 'Ácido Grabador 37%', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Jeringa 5ml', stock: 35, stockMinimo: 15, precioCompra: 120, precioVenta: 200, proveedor: 'Ivoclar Vivadent' },
    { codigo: 'MAT-005', nombre: 'Adhesivo Single Bond', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Frasco 6ml', stock: 15, stockMinimo: 8, precioCompra: 380, precioVenta: 550, proveedor: '3M Dental' },
    { codigo: 'MAT-006', nombre: 'Algodón en Rollos', categoria: 'CONSUMIBLE', unidadMedida: 'Bolsa x500', stock: 40, stockMinimo: 15, precioCompra: 65, precioVenta: 100, proveedor: 'MediHonduras S.A.' },
    { codigo: 'MAT-007', nombre: 'Eyectores de Saliva', categoria: 'CONSUMIBLE', unidadMedida: 'Bolsa x100', stock: 50, stockMinimo: 20, precioCompra: 45, precioVenta: 80, proveedor: 'MediHonduras S.A.' },
    { codigo: 'MED-001', nombre: 'Lidocaína 2% c/Epinefrina', categoria: 'MEDICAMENTO', unidadMedida: 'Cartucho', stock: 200, stockMinimo: 80, precioCompra: 18, precioVenta: 35, proveedor: 'Septodont' },
    { codigo: 'MED-002', nombre: 'Mepivacaína 3% s/Vasoconstrictor', categoria: 'MEDICAMENTO', unidadMedida: 'Cartucho', stock: 80, stockMinimo: 30, precioCompra: 22, precioVenta: 40, proveedor: 'Septodont' },
    { codigo: 'MED-003', nombre: 'Amoxicilina 500mg', categoria: 'MEDICAMENTO', unidadMedida: 'Cápsula', stock: 300, stockMinimo: 100, precioCompra: 2.5, precioVenta: 5, proveedor: 'Laboratorios Finlay' },
    { codigo: 'INS-001', nombre: 'Espejo Dental #5', categoria: 'INSTRUMENTAL', unidadMedida: 'Unidad', stock: 12, stockMinimo: 6, precioCompra: 85, precioVenta: 150, proveedor: 'Hu-Friedy' },
    { codigo: 'INS-002', nombre: 'Explorador Dental', categoria: 'INSTRUMENTAL', unidadMedida: 'Unidad', stock: 10, stockMinimo: 5, precioCompra: 95, precioVenta: 160, proveedor: 'Hu-Friedy' },
    { codigo: 'INS-003', nombre: 'Fórceps #150', categoria: 'INSTRUMENTAL', unidadMedida: 'Unidad', stock: 4, stockMinimo: 2, precioCompra: 650, precioVenta: 950, proveedor: 'Hu-Friedy' },
  ];
  for (const item of invItems) {
    const inv = await prisma.inventario.create({ data: item });
    await prisma.movimientoInventario.create({
      data: { inventarioId: inv.id, tipo: 'ENTRADA', cantidad: inv.stock, motivo: 'Stock inicial', responsable: admin.nombre, fecha: fecha(30) },
    });
  }
  console.log(`  ✓ ${invItems.length} items con movimientos iniciales`);

  // ════════════════════════════════════════════════════════
  // 6. CITAS
  // ════════════════════════════════════════════════════════
  console.log('\n📅 Citas...');
  const citas = [
    // Completadas (pasado)
    { p: 0, o: 0, d: 20, h: '09:00', hf: '09:30', dur: 30, tipo: 'CONSULTA', est: 'COMPLETADA', motivo: 'Revisión general' },
    { p: 1, o: 1, d: 18, h: '10:00', hf: '11:00', dur: 60, tipo: 'LIMPIEZA', est: 'COMPLETADA', motivo: 'Profilaxis semestral' },
    { p: 2, o: 0, d: 16, h: '14:00', hf: '15:00', dur: 60, tipo: 'EXTRACCION', est: 'COMPLETADA', motivo: 'Extracción cordal 48' },
    { p: 3, o: 2, d: 14, h: '08:30', hf: '09:00', dur: 30, tipo: 'CONSULTA', est: 'COMPLETADA', motivo: 'Dolor molar superior' },
    { p: 4, o: 1, d: 12, h: '11:00', hf: '12:30', dur: 90, tipo: 'ENDODONCIA', est: 'COMPLETADA', motivo: 'Conducto pieza 36' },
    { p: 5, o: 0, d: 10, h: '15:00', hf: '15:30', dur: 30, tipo: 'CONSULTA', est: 'COMPLETADA', motivo: 'Primera consulta' },
    { p: 6, o: 2, d: 8, h: '09:00', hf: '10:00', dur: 60, tipo: 'CONSULTA', est: 'COMPLETADA', motivo: 'Evaluación para prótesis' },
    { p: 7, o: 1, d: 6, h: '10:00', hf: '11:00', dur: 60, tipo: 'LIMPIEZA', est: 'COMPLETADA', motivo: 'Limpieza y obturaciones' },
    { p: 8, o: 0, d: 4, h: '09:00', hf: '10:00', dur: 60, tipo: 'OTRO', est: 'COMPLETADA', motivo: 'Blanqueamiento dental' },
    { p: 9, o: 2, d: 3, h: '14:00', hf: '15:00', dur: 60, tipo: 'CONSULTA', est: 'COMPLETADA', motivo: 'Evaluación bruxismo' },
    { p: 0, o: 0, d: 2, h: '09:00', hf: '10:00', dur: 60, tipo: 'ENDODONCIA', est: 'COMPLETADA', motivo: 'Endodoncia pieza 16 sesión 1' },
    // No asistió
    { p: 6, o: 2, d: 1, h: '09:00', hf: '10:00', dur: 60, tipo: 'PROTESIS', est: 'NO_ASISTIO', motivo: 'Impresión para prótesis' },
    // Hoy
    { p: 1, o: 0, d: 0, h: '09:00', hf: '10:30', dur: 90, tipo: 'ENDODONCIA', est: 'CONFIRMADA', motivo: 'Endodoncia pieza 26' },
    { p: 3, o: 2, d: 0, h: '10:00', hf: '11:00', dur: 60, tipo: 'PROTESIS', est: 'PROGRAMADA', motivo: 'Toma de impresión corona' },
    // Futuras
    { p: 0, o: 0, d: -2, h: '09:00', hf: '10:00', dur: 60, tipo: 'ENDODONCIA', est: 'PROGRAMADA', motivo: 'Endodoncia pieza 16 sesión 2' },
    { p: 4, o: 1, d: -3, h: '10:00', hf: '10:30', dur: 30, tipo: 'CONTROL', est: 'PROGRAMADA', motivo: 'Control post-endodoncia' },
    { p: 9, o: 2, d: -5, h: '14:00', hf: '15:00', dur: 60, tipo: 'OTRO', est: 'PROGRAMADA', motivo: 'Entrega placa oclusal' },
    { p: 6, o: 2, d: -7, h: '09:00', hf: '10:00', dur: 60, tipo: 'PROTESIS', est: 'PROGRAMADA', motivo: 'Reprogramación impresión' },
  ];
  for (const c of citas) {
    await prisma.cita.create({
      data: {
        pacienteId: pacientes[c.p].id, odontologoId: odontologos[c.o].id,
        fecha: fecha(c.d), horaInicio: c.h, horaFin: c.hf, duracion: c.dur,
        tipoCita: c.tipo, estado: c.est, motivo: c.motivo,
      },
    });
  }
  console.log(`  ✓ ${citas.length} citas`);


  // ════════════════════════════════════════════════════════
  // 7. EXPEDIENTES + PROCEDIMIENTOS
  // ════════════════════════════════════════════════════════
  console.log('\n📋 Expedientes y procedimientos...');
  const expData = [
    { p: 0, diag: 'Caries profunda pieza 16. Gingivitis leve.', trat: 'Endodoncia pieza 16 + corona.', evol: 'En tratamiento, buena evolución.',
      procs: [
        { o: 0, nombre: 'Radiografía periapical', desc: 'Rx pieza 16', diente: '16', precio: 150, dur: 10, d: 20 },
        { o: 0, nombre: 'Apertura cameral', desc: 'Inicio endodoncia pieza 16', diente: '16', precio: 1200, dur: 45, d: 2 },
      ] },
    { p: 1, diag: 'Cálculo dental moderado. Caries incipiente pieza 26.', trat: 'Profilaxis + obturación pieza 26.', evol: 'Tratamiento completado.',
      procs: [
        { o: 1, nombre: 'Profilaxis dental', desc: 'Limpieza con ultrasonido', diente: null, precio: 450, dur: 40, d: 18 },
        { o: 1, nombre: 'Obturación con resina', desc: 'Obturación pieza 26 resina A2', diente: '26', precio: 600, dur: 30, d: 18 },
      ] },
    { p: 2, diag: 'Tercer molar 48 semi-impactado con pericoronaritis.', trat: 'Extracción quirúrgica pieza 48.', evol: 'Cicatrización normal.',
      procs: [
        { o: 0, nombre: 'Extracción quirúrgica', desc: 'Extracción cordal 48', diente: '48', precio: 1500, dur: 60, d: 16 },
      ] },
    { p: 3, diag: 'Fractura coronaria pieza 26. Pulpa vital.', trat: 'Recubrimiento pulpar + corona porcelana.', evol: 'Provisional colocado.',
      procs: [
        { o: 2, nombre: 'Recubrimiento pulpar', desc: 'Recubrimiento directo con MTA', diente: '26', precio: 700, dur: 35, d: 14 },
      ] },
    { p: 4, diag: 'Necrosis pulpar pieza 36 por caries profunda.', trat: 'Endodoncia + corona pieza 36.', evol: 'Endodoncia completada.',
      procs: [
        { o: 1, nombre: 'Endodoncia completa', desc: 'Conducto pieza 36, 3 conductos', diente: '36', precio: 2500, dur: 90, d: 12 },
      ] },
    { p: 5, diag: 'Caries incipientes piezas 55 y 65.', trat: 'Obturaciones + flúor.', evol: 'Completado. Control en 6 meses.',
      procs: [
        { o: 0, nombre: 'Obturación con ionómero', desc: 'Obturaciones piezas 55 y 65', diente: '55', precio: 400, dur: 25, d: 10 },
        { o: 0, nombre: 'Aplicación de flúor', desc: 'Flúor tópico en barniz', diente: null, precio: 200, dur: 15, d: 10 },
      ] },
    { p: 7, diag: 'Caries múltiples por mala higiene oral.', trat: 'Profilaxis + obturaciones múltiples.', evol: 'Tratamiento completado.',
      procs: [
        { o: 1, nombre: 'Profilaxis dental', desc: 'Limpieza completa', diente: null, precio: 450, dur: 40, d: 6 },
        { o: 1, nombre: 'Obturaciones múltiples', desc: 'Obturaciones piezas 16, 26, 36', diente: '16', precio: 1800, dur: 60, d: 6 },
      ] },
    { p: 9, diag: 'Desgaste dental por bruxismo. ATM con clic bilateral.', trat: 'Placa oclusal nocturna.', evol: 'Mejoría con placa oclusal.',
      procs: [
        { o: 2, nombre: 'Impresión para placa', desc: 'Impresión superior para placa oclusal', diente: null, precio: 300, dur: 20, d: 3 },
      ] },
  ];
  for (const e of expData) {
    const exp = await prisma.expediente.create({
      data: {
        pacienteId: pacientes[e.p].id, diagnostico: e.diag, tratamiento: e.trat,
        evolucion: e.evol, proximaCita: fecha(-15), odontograma: JSON.stringify({ dientes: {} }),
      },
    });
    for (const pr of e.procs) {
      await prisma.procedimiento.create({
        data: {
          expedienteId: exp.id, odontologoId: odontologos[pr.o].id,
          nombre: pr.nombre, descripcion: pr.desc, diente: pr.diente,
          precio: pr.precio, duracion: pr.dur, fecha: fecha(pr.d),
        },
      });
    }
  }
  console.log(`  ✓ ${expData.length} expedientes con procedimientos`);

  // ════════════════════════════════════════════════════════
  // 8. TRATAMIENTOS CON ETAPAS
  // ════════════════════════════════════════════════════════
  console.log('\n🦷 Tratamientos...');
  const tratData = [
    { p: 0, nombre: 'Endodoncia + Corona Pieza 16', desc: 'Conducto y corona porcelana', estado: 'EN_PROGRESO', costo: 7000, fi: 20,
      etapas: [
        { orden: 1, nombre: 'Diagnóstico y Rx', costo: 450, completada: true, fc: fecha(20) },
        { orden: 2, nombre: 'Endodoncia sesión 1', costo: 1200, completada: true, fc: fecha(2) },
        { orden: 3, nombre: 'Endodoncia sesión 2', costo: 1300, completada: false },
        { orden: 4, nombre: 'Preparación corona', costo: 800, completada: false },
        { orden: 5, nombre: 'Colocación corona', costo: 3250, completada: false },
      ] },
    { p: 1, nombre: 'Rehabilitación Oral', desc: 'Profilaxis y obturaciones', estado: 'COMPLETADO', costo: 1050, fi: 18, ff: 18,
      etapas: [
        { orden: 1, nombre: 'Profilaxis', costo: 450, completada: true, fc: fecha(18) },
        { orden: 2, nombre: 'Obturación pieza 26', costo: 600, completada: true, fc: fecha(18) },
      ] },
    { p: 3, nombre: 'Corona Porcelana Pieza 26', desc: 'Rehabilitación con corona', estado: 'EN_PROGRESO', costo: 5200, fi: 14,
      etapas: [
        { orden: 1, nombre: 'Recubrimiento pulpar', costo: 700, completada: true, fc: fecha(14) },
        { orden: 2, nombre: 'Toma de impresión', costo: 500, completada: false },
        { orden: 3, nombre: 'Cementación corona', costo: 4000, completada: false },
      ] },
    { p: 4, nombre: 'Endodoncia + Corona Pieza 36', desc: 'Conducto y corona por necrosis', estado: 'EN_PROGRESO', costo: 7000, fi: 12,
      etapas: [
        { orden: 1, nombre: 'Endodoncia completa', costo: 2500, completada: true, fc: fecha(12) },
        { orden: 2, nombre: 'Poste fibra de vidrio', costo: 800, completada: false },
        { orden: 3, nombre: 'Corona porcelana', costo: 3700, completada: false },
      ] },
    { p: 6, nombre: 'Prótesis Parcial Superior', desc: 'Prótesis para piezas 14,15,24,25', estado: 'PLANIFICADO', costo: 8500,
      etapas: [
        { orden: 1, nombre: 'Tratamiento periodontal', costo: 1500, completada: false },
        { orden: 2, nombre: 'Impresiones', costo: 1000, completada: false },
        { orden: 3, nombre: 'Entrega prótesis', costo: 6000, completada: false },
      ] },
  ];
  for (const t of tratData) {
    await prisma.tratamiento.create({
      data: {
        pacienteId: pacientes[t.p].id, nombre: t.nombre, descripcion: t.desc,
        estado: t.estado, costoTotal: t.costo,
        fechaInicio: t.fi ? fecha(t.fi) : null, fechaFin: t.ff ? fecha(t.ff) : null,
        etapas: { create: t.etapas.map(e => ({ orden: e.orden, nombre: e.nombre, costo: e.costo, completada: e.completada, fechaCompletada: e.fc || null })) },
      },
    });
  }
  console.log(`  ✓ ${tratData.length} tratamientos con etapas`);


  // ════════════════════════════════════════════════════════
  // 9. FACTURAS + PAGOS + INGRESOS (balanceados)
  // ════════════════════════════════════════════════════════
  console.log('\n💰 Facturas, pagos e ingresos...');
  const facturas = [
    { p: 0, d: 20, items: [{ desc: 'Consulta General', pr: 300 }, { desc: 'Radiografía Periapical x2', pr: 300 }], est: 'PAGADA', met: 'EFECTIVO' },
    { p: 1, d: 18, items: [{ desc: 'Profilaxis Dental', pr: 450 }, { desc: 'Obturación con Resina', pr: 600 }], est: 'PAGADA', met: 'TARJETA_CREDITO' },
    { p: 2, d: 16, items: [{ desc: 'Extracción de Cordal', pr: 1500 }, { desc: 'Radiografía Panorámica', pr: 400 }], est: 'PAGADA', met: 'TRANSFERENCIA' },
    { p: 3, d: 14, items: [{ desc: 'Recubrimiento Pulpar', pr: 700 }, { desc: 'Corona Provisional', pr: 500 }], est: 'PAGADA', met: 'EFECTIVO' },
    { p: 4, d: 12, items: [{ desc: 'Endodoncia Completa', pr: 2500 }], est: 'PAGADA', met: 'TRANSFERENCIA' },
    { p: 5, d: 10, items: [{ desc: 'Obturación Ionómero x2', pr: 800 }, { desc: 'Aplicación de Flúor', pr: 200 }], est: 'PAGADA', met: 'EFECTIVO' },
    { p: 7, d: 6, items: [{ desc: 'Profilaxis Dental', pr: 450 }, { desc: 'Obturaciones x3', pr: 1800 }], est: 'PAGADA', met: 'TARJETA_DEBITO' },
    { p: 8, d: 4, items: [{ desc: 'Blanqueamiento Dental', pr: 2000 }], est: 'PAGADA', met: 'TARJETA_CREDITO' },
    { p: 9, d: 3, items: [{ desc: 'Consulta ATM', pr: 300 }, { desc: 'Placa Oclusal', pr: 1800 }], est: 'PAGADA', met: 'EFECTIVO' },
    { p: 0, d: 2, items: [{ desc: 'Endodoncia sesión 1', pr: 1200 }], est: 'PAGADA', met: 'EFECTIVO' },
    { p: 6, d: 8, items: [{ desc: 'Consulta General', pr: 300 }, { desc: 'Radiografía Panorámica', pr: 400 }], est: 'PAGADA', met: 'TRANSFERENCIA' },
    // Parcial y pendiente
    { p: 3, d: 1, items: [{ desc: 'Corona Porcelana (abono)', pr: 4500 }], est: 'PAGADA_PARCIAL', met: 'EFECTIVO' },
    { p: 4, d: 1, items: [{ desc: 'Poste + Corona (pendiente)', pr: 4500 }], est: 'PENDIENTE', met: null },
  ];

  let totalIngresos = 0;
  for (let i = 0; i < facturas.length; i++) {
    const f = facturas[i];
    const items = f.items.map(it => ({ descripcion: it.desc, cantidad: 1, precioUnitario: it.pr, subtotal: it.pr }));
    const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
    const impuesto = Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + impuesto) * 100) / 100;
    const numero = `FAC-${String(i + 1).padStart(6, '0')}`;
    const fechaFact = fecha(f.d);

    const pagos = [];
    let montoIngreso = 0;
    if (f.est === 'PAGADA') {
      pagos.push({ monto: total, metodoPago: f.met, referencia: `Pago completo ${numero}`, fecha: fechaFact });
      montoIngreso = total;
    } else if (f.est === 'PAGADA_PARCIAL') {
      const abono = Math.round(total * 0.5 * 100) / 100;
      pagos.push({ monto: abono, metodoPago: f.met || 'EFECTIVO', referencia: `Abono ${numero}`, fecha: fechaFact });
      montoIngreso = abono;
    }

    const fac = await prisma.factura.create({
      data: {
        numero, pacienteId: pacientes[f.p].id, emitenteId: admin.id,
        subtotal, descuento: 0, impuesto, total, estado: f.est, metodoPago: f.met, fecha: fechaFact,
        items: { create: items },
        pagos: pagos.length > 0 ? { create: pagos } : undefined,
      },
    });

    if (montoIngreso > 0) {
      await prisma.ingreso.create({
        data: {
          facturaId: fac.id, concepto: `Pago ${numero}`, categoria: 'CONSULTA',
          monto: montoIngreso, fecha: fechaFact, metodoPago: f.met || 'EFECTIVO', estado: 'REGISTRADO',
        },
      });
      totalIngresos += montoIngreso;
    }
  }
  console.log(`  ✓ ${facturas.length} facturas (ingresos: L.${totalIngresos.toFixed(2)})`);

  // ════════════════════════════════════════════════════════
  // 10. EGRESOS (menores que ingresos → utilidad positiva)
  // ════════════════════════════════════════════════════════
  console.log('\n📉 Egresos...');
  const egresos = [
    { concepto: 'Alquiler del local', cat: 'ALQUILER', monto: 8000, met: 'TRANSFERENCIA', prov: 'Inmobiliaria Palmira', nf: 'ALQ-04', d: 1 },
    { concepto: 'Salario asistente dental', cat: 'SALARIOS', monto: 6000, met: 'TRANSFERENCIA', prov: null, nf: null, d: 1 },
    { concepto: 'Salario recepcionista', cat: 'SALARIOS', monto: 5000, met: 'TRANSFERENCIA', prov: null, nf: null, d: 1 },
    { concepto: 'Materiales dentales', cat: 'MATERIALES_DENTALES', monto: 3500, met: 'TRANSFERENCIA', prov: '3M Dental', nf: 'DS-891', d: 20 },
    { concepto: 'Anestésicos', cat: 'MEDICAMENTOS', monto: 1200, met: 'TRANSFERENCIA', prov: 'Septodont', nf: 'SEP-445', d: 18 },
    { concepto: 'Energía eléctrica', cat: 'SERVICIOS_PUBLICOS', monto: 1500, met: 'EFECTIVO', prov: 'ENEE', nf: 'ENEE-04', d: 5 },
    { concepto: 'Agua potable', cat: 'SERVICIOS_PUBLICOS', monto: 400, met: 'EFECTIVO', prov: 'SANAA', nf: 'SANAA-04', d: 5 },
    { concepto: 'Internet y telefonía', cat: 'SERVICIOS_PUBLICOS', monto: 800, met: 'TARJETA_CREDITO', prov: 'Tigo', nf: 'TIGO-04', d: 3 },
    { concepto: 'Consumibles (guantes, etc.)', cat: 'MATERIALES_DENTALES', monto: 1200, met: 'TARJETA_CREDITO', prov: 'MediHonduras', nf: 'MH-789', d: 15 },
  ];
  let totalEgresos = 0;
  for (const e of egresos) {
    await prisma.egreso.create({
      data: {
        concepto: e.concepto, categoria: e.cat, monto: e.monto, metodoPago: e.met,
        proveedor: e.prov, numeroFactura: e.nf, estado: 'PAGADO',
        registradoPor: admin.id, fecha: fecha(e.d),
      },
    });
    totalEgresos += e.monto;
  }
  console.log(`  ✓ ${egresos.length} egresos (total: L.${totalEgresos.toFixed(2)})`);

  // ════════════════════════════════════════════════════════
  // 11. FLUJO DE CAJA
  // ════════════════════════════════════════════════════════
  console.log('\n💵 Flujo de caja...');
  let saldo = 0;
  const flujo = [
    { tipo: 'AJUSTE', concepto: 'Saldo inicial', monto: 25000, d: 28 },
    { tipo: 'INGRESO', concepto: 'Ingresos semana 1', monto: 10000, d: 21 },
    { tipo: 'EGRESO', concepto: 'Alquiler y servicios', monto: 10700, d: 20 },
    { tipo: 'INGRESO', concepto: 'Ingresos semana 2', monto: 12000, d: 14 },
    { tipo: 'EGRESO', concepto: 'Materiales y medicamentos', monto: 4700, d: 13 },
    { tipo: 'INGRESO', concepto: 'Ingresos semana 3', monto: 9000, d: 7 },
    { tipo: 'EGRESO', concepto: 'Salarios', monto: 11000, d: 5 },
    { tipo: 'INGRESO', concepto: 'Ingresos semana 4', monto: 7500, d: 1 },
    { tipo: 'EGRESO', concepto: 'Consumibles y otros', monto: 1200, d: 1 },
  ];
  for (const m of flujo) {
    const ant = saldo;
    saldo += m.tipo === 'EGRESO' ? -m.monto : m.monto;
    await prisma.flujoCaja.create({
      data: { tipo: m.tipo, concepto: m.concepto, monto: m.monto, saldoAnterior: ant, saldoActual: saldo, fecha: fecha(m.d) },
    });
  }
  console.log(`  ✓ ${flujo.length} movimientos (saldo: L.${saldo.toFixed(2)})`);

  // ════════════════════════════════════════════════════════
  // 12. ESTADÍSTICAS + CORRELATIVO
  // ════════════════════════════════════════════════════════
  console.log('\n📊 Estadísticas y correlativo...');
  const mesActual = new Date().getMonth() + 1;
  const anio = new Date().getFullYear();
  for (const od of odontologos) {
    for (let m = mesActual - 2; m <= mesActual; m++) {
      const mesReal = m <= 0 ? m + 12 : m;
      const anioReal = m <= 0 ? anio - 1 : anio;
      await prisma.estadisticaOdontologo.create({
        data: {
          odontologoId: od.id, mes: mesReal, anio: anioReal,
          pacientesAtendidos: 12 + Math.floor(Math.random() * 10),
          citasCompletadas: 18 + Math.floor(Math.random() * 8),
          citasCanceladas: Math.floor(Math.random() * 3),
          ingresos: 18000 + Math.floor(Math.random() * 15000),
        },
      });
    }
  }
  await prisma.correlativo.create({
    data: {
      tipo: 'FACTURA', cai: 'A1B2C3-D4E5F6-G7H8I9-J0K1L2-M3N4O5-P6',
      sucursal: '000', puntoEmision: '001', tipoDoc: '01',
      rangoInicial: 1, rangoFinal: 5000, siguiente: facturas.length + 1,
      fechaLimite: fecha(-365), activo: true,
    },
  });
  console.log('  ✓ Estadísticas y correlativo SAR');

  // ════════════════════════════════════════════════════════
  // RESUMEN
  // ════════════════════════════════════════════════════════
  const utilidad = totalIngresos - totalEgresos;
  console.log('\n══════════════════════════════════════════');
  console.log('  ✅ SEED COMPLETADO');
  console.log('══════════════════════════════════════════');
  console.log(`  Ingresos:  L.${totalIngresos.toFixed(2)}`);
  console.log(`  Egresos:   L.${totalEgresos.toFixed(2)}`);
  console.log(`  Utilidad:  L.${utilidad.toFixed(2)} (${((utilidad/totalIngresos)*100).toFixed(1)}%)`);
  console.log('──────────────────────────────────────────');
  console.log('  admin        / Admin123!       (ya existía)');
  console.log('  dra.garcia   / Odontologo123!');
  console.log('  dr.martinez  / Odontologo123!');
  console.log('  dra.flores   / Odontologo123!');
  console.log('  recepcion    / Recepcion123!');
  console.log('  asistente    / Asistente123!');
  console.log('══════════════════════════════════════════\n');
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
