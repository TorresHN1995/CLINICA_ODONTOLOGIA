/**
 * Script unificado de datos de prueba - Clínica Odontológica
 * Modo aditivo: no borra datos existentes, solo agrega lo que falta.
 * Ejecutar: node seed-datos-prueba.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────
function diasDesdeHoy(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function diasAtras(n) { return diasDesdeHoy(-n); }

async function upsertUsuario(data) {
  const existe = await prisma.usuario.findUnique({ where: { username: data.username } });
  if (existe) { console.log(`  ⏭  Usuario ${data.username} ya existe`); return existe; }
  const hash = await bcrypt.hash(data.password, 10);
  const u = await prisma.usuario.create({ data: { ...data, password: hash } });
  console.log(`  ✓ Usuario ${u.username} (${u.rol})`);
  return u;
}

async function upsertPaciente(data) {
  const existe = await prisma.paciente.findUnique({ where: { identificacion: data.identificacion } });
  if (existe) { console.log(`  ⏭  Paciente ${data.identificacion} ya existe`); return existe; }
  const p = await prisma.paciente.create({ data });
  console.log(`  ✓ Paciente ${p.nombre} ${p.apellido}`);
  return p;
}

// ─── DATOS ─────────────────────────────────────────────────

const USUARIOS = [
  { email: 'admin@clinica.com', username: 'admin', password: 'Admin123!', nombre: 'Administrador', apellido: 'Sistema', telefono: '50422345678', rol: 'ADMINISTRADOR' },
  { email: 'dra.garcia@clinica.com', username: 'dra.garcia', password: 'Odontologo123!', nombre: 'María', apellido: 'García López', telefono: '50433001001', rol: 'ODONTOLOGO' },
  { email: 'dr.martinez@clinica.com', username: 'dr.martinez', password: 'Odontologo123!', nombre: 'Carlos', apellido: 'Martínez Reyes', telefono: '50433002002', rol: 'ODONTOLOGO' },
  { email: 'dra.flores@clinica.com', username: 'dra.flores', password: 'Odontologo123!', nombre: 'Ana', apellido: 'Flores Mejía', telefono: '50433003003', rol: 'ODONTOLOGO' },
  { email: 'recepcion@clinica.com', username: 'recepcion', password: 'Recepcion123!', nombre: 'Sofía', apellido: 'López Hernández', telefono: '50433004004', rol: 'RECEPCION' },
  { email: 'asistente@clinica.com', username: 'asistente', password: 'Asistente123!', nombre: 'Daniela', apellido: 'Ramos Cruz', telefono: '50433005005', rol: 'ASISTENTE' },
];

const PACIENTES = [
  { identificacion: '0801199012345', nombre: 'Juan', apellido: 'Pérez Castillo', fechaNacimiento: new Date('1990-05-15'), email: 'juan.perez@email.com', telefono: '50498001001', celular: '50498001002', direccion: 'Col. Kennedy, Bloque H, Casa 12', ciudad: 'Tegucigalpa', ocupacion: 'Ingeniero Civil', contactoEmergencia: 'Rosa Castillo', telefonoEmergencia: '50498001003', alergias: 'Penicilina, Látex', medicamentos: 'Ninguno', enfermedades: 'Ninguna', observaciones: 'Paciente puntual, buena higiene oral' },
  { identificacion: '0801198554321', nombre: 'María', apellido: 'González Rivera', fechaNacimiento: new Date('1985-08-22'), email: 'maria.gonzalez@email.com', telefono: '50498002001', celular: '50498002002', direccion: 'Res. Los Pinos, Casa 45', ciudad: 'Tegucigalpa', ocupacion: 'Contadora', alergias: 'Ninguna', medicamentos: 'Metformina 500mg', enfermedades: 'Diabetes tipo 2', observaciones: 'Requiere control de glucosa antes de procedimientos' },
  { identificacion: '0801199211111', nombre: 'Pedro', apellido: 'Rodríguez Mejía', fechaNacimiento: new Date('1992-03-10'), email: 'pedro.rodriguez@email.com', telefono: '50498003001', direccion: 'Barrio Abajo, 3ra Calle', ciudad: 'San Pedro Sula', ocupacion: 'Profesor', alergias: 'Ninguna', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
  { identificacion: '0801198822222', nombre: 'Laura', apellido: 'Hernández Pineda', fechaNacimiento: new Date('1988-11-30'), email: 'laura.hernandez@email.com', telefono: '50498004001', celular: '50498004002', direccion: 'Col. Miraflores, Ave. Principal', ciudad: 'Tegucigalpa', ocupacion: 'Abogada', alergias: 'Aspirina', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
  { identificacion: '0801199533333', nombre: 'Carlos', apellido: 'Morales Ávila', fechaNacimiento: new Date('1995-07-18'), email: 'carlos.morales@email.com', telefono: '50498005001', direccion: 'Col. Lomas del Guijarro', ciudad: 'Tegucigalpa', ocupacion: 'Diseñador Gráfico', alergias: 'Ninguna', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
  { identificacion: '0801200044444', nombre: 'Sofía', apellido: 'Reyes Turcios', fechaNacimiento: new Date('2000-01-25'), email: 'sofia.reyes@email.com', telefono: '50498006001', direccion: 'Res. Villa Real, Bloque 3', ciudad: 'Comayagüela', ocupacion: 'Estudiante', alergias: 'Ninguna', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
  { identificacion: '0801197855555', nombre: 'Roberto', apellido: 'Zelaya Fúnez', fechaNacimiento: new Date('1978-09-05'), email: 'roberto.zelaya@email.com', telefono: '50498007001', direccion: 'Barrio La Granja, 5ta Ave.', ciudad: 'Tegucigalpa', ocupacion: 'Empresario', alergias: 'Ninguna', medicamentos: 'Losartán 50mg, Atorvastatina', enfermedades: 'Hipertensión arterial', observaciones: 'Paciente con hipertensión controlada' },
  { identificacion: '0801198366666', nombre: 'Andrea', apellido: 'Bustillo Cárcamo', fechaNacimiento: new Date('1983-04-12'), email: 'andrea.bustillo@email.com', telefono: '50498008001', direccion: 'Col. Palmira, Calle Principal', ciudad: 'Tegucigalpa', ocupacion: 'Médico General', alergias: 'Sulfas', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
  { identificacion: '0801200177777', nombre: 'Diego', apellido: 'Aguilar Sosa', fechaNacimiento: new Date('2001-12-08'), email: 'diego.aguilar@email.com', telefono: '50498009001', direccion: 'Col. Las Colinas, Bloque B', ciudad: 'Tegucigalpa', ocupacion: 'Estudiante Universitario', alergias: 'Ninguna', medicamentos: 'Ninguno', enfermedades: 'Ninguna' },
  { identificacion: '0801197088888', nombre: 'Carmen', apellido: 'Valladares Ortiz', fechaNacimiento: new Date('1970-06-20'), email: 'carmen.valladares@email.com', telefono: '50498010001', direccion: 'Barrio El Centro, 2da Calle', ciudad: 'Tegucigalpa', ocupacion: 'Jubilada', alergias: 'Anestesia con epinefrina', medicamentos: 'Omeprazol, Calcio + Vitamina D', enfermedades: 'Osteoporosis, Gastritis crónica', observaciones: 'Usar anestesia sin vasoconstrictor' },
];


const PRODUCTOS_SERVICIOS = [
  { codigo: 'SRV-001', nombre: 'Consulta General', precio: 300.00, tipo: 'SERVICIO', descripcion: 'Evaluación dental completa con diagnóstico' },
  { codigo: 'SRV-002', nombre: 'Limpieza Dental (Profilaxis)', precio: 450.00, tipo: 'SERVICIO', descripcion: 'Limpieza profesional con ultrasonido' },
  { codigo: 'SRV-003', nombre: 'Obturación con Resina', precio: 600.00, tipo: 'SERVICIO', descripcion: 'Restauración dental con resina compuesta' },
  { codigo: 'SRV-004', nombre: 'Extracción Simple', precio: 500.00, tipo: 'SERVICIO', descripcion: 'Extracción de pieza dental sin complicaciones' },
  { codigo: 'SRV-005', nombre: 'Extracción de Cordal', precio: 1500.00, tipo: 'SERVICIO', descripcion: 'Extracción quirúrgica de tercer molar' },
  { codigo: 'SRV-006', nombre: 'Endodoncia (Conducto)', precio: 2500.00, tipo: 'SERVICIO', descripcion: 'Tratamiento de conducto radicular' },
  { codigo: 'SRV-007', nombre: 'Corona de Porcelana', precio: 4500.00, tipo: 'SERVICIO', descripcion: 'Corona dental de porcelana sobre metal' },
  { codigo: 'SRV-008', nombre: 'Puente Dental (3 piezas)', precio: 12000.00, tipo: 'SERVICIO', descripcion: 'Puente fijo de 3 unidades' },
  { codigo: 'SRV-009', nombre: 'Blanqueamiento Dental', precio: 2000.00, tipo: 'SERVICIO', descripcion: 'Blanqueamiento profesional en consultorio' },
  { codigo: 'SRV-010', nombre: 'Radiografía Periapical', precio: 150.00, tipo: 'SERVICIO', descripcion: 'Radiografía dental individual' },
  { codigo: 'SRV-011', nombre: 'Radiografía Panorámica', precio: 400.00, tipo: 'SERVICIO', descripcion: 'Radiografía panorámica completa' },
  { codigo: 'SRV-012', nombre: 'Aplicación de Flúor', precio: 200.00, tipo: 'SERVICIO', descripcion: 'Aplicación tópica de flúor' },
  { codigo: 'SRV-013', nombre: 'Sellante Dental', precio: 250.00, tipo: 'SERVICIO', descripcion: 'Sellante de fosas y fisuras por pieza' },
  { codigo: 'SRV-014', nombre: 'Prótesis Removible Parcial', precio: 6000.00, tipo: 'SERVICIO', descripcion: 'Prótesis parcial removible acrílica' },
  { codigo: 'SRV-015', nombre: 'Prótesis Total', precio: 8000.00, tipo: 'SERVICIO', descripcion: 'Prótesis total superior o inferior' },
  { codigo: 'PRD-001', nombre: 'Cepillo Dental Profesional', precio: 85.00, tipo: 'PRODUCTO', descripcion: 'Cepillo de cerdas suaves' },
  { codigo: 'PRD-002', nombre: 'Pasta Dental con Flúor', precio: 120.00, tipo: 'PRODUCTO', descripcion: 'Pasta dental profesional 100ml' },
  { codigo: 'PRD-003', nombre: 'Enjuague Bucal', precio: 180.00, tipo: 'PRODUCTO', descripcion: 'Enjuague bucal antiséptico 500ml' },
  { codigo: 'PRD-004', nombre: 'Hilo Dental', precio: 65.00, tipo: 'PRODUCTO', descripcion: 'Hilo dental encerado 50m' },
];

const INVENTARIO_ITEMS = [
  { codigo: 'MAT-001', nombre: 'Guantes de Nitrilo Talla M', categoria: 'CONSUMIBLE', unidadMedida: 'Caja x100', stock: 45, stockMinimo: 20, precioCompra: 180.00, precioVenta: 250.00, proveedor: 'Dental Supply Honduras' },
  { codigo: 'MAT-002', nombre: 'Guantes de Nitrilo Talla S', categoria: 'CONSUMIBLE', unidadMedida: 'Caja x100', stock: 30, stockMinimo: 15, precioCompra: 180.00, precioVenta: 250.00, proveedor: 'Dental Supply Honduras' },
  { codigo: 'MAT-003', nombre: 'Mascarillas Quirúrgicas', categoria: 'CONSUMIBLE', unidadMedida: 'Caja x50', stock: 60, stockMinimo: 25, precioCompra: 95.00, precioVenta: 150.00, proveedor: 'MediHonduras S.A.' },
  { codigo: 'MAT-004', nombre: 'Resina Compuesta A2 (3M)', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Jeringa 4g', stock: 25, stockMinimo: 10, precioCompra: 450.00, precioVenta: 650.00, proveedor: '3M Dental' },
  { codigo: 'MAT-005', nombre: 'Resina Compuesta A3 (3M)', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Jeringa 4g', stock: 20, stockMinimo: 10, precioCompra: 450.00, precioVenta: 650.00, proveedor: '3M Dental' },
  { codigo: 'MAT-006', nombre: 'Ácido Grabador 37%', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Jeringa 5ml', stock: 35, stockMinimo: 15, precioCompra: 120.00, precioVenta: 200.00, proveedor: 'Ivoclar Vivadent' },
  { codigo: 'MAT-007', nombre: 'Adhesivo Single Bond', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Frasco 6ml', stock: 15, stockMinimo: 8, precioCompra: 380.00, precioVenta: 550.00, proveedor: '3M Dental' },
  { codigo: 'MAT-008', nombre: 'Algodón en Rollos', categoria: 'CONSUMIBLE', unidadMedida: 'Bolsa x500', stock: 40, stockMinimo: 15, precioCompra: 65.00, precioVenta: 100.00, proveedor: 'MediHonduras S.A.' },
  { codigo: 'MAT-009', nombre: 'Eyectores de Saliva', categoria: 'CONSUMIBLE', unidadMedida: 'Bolsa x100', stock: 50, stockMinimo: 20, precioCompra: 45.00, precioVenta: 80.00, proveedor: 'MediHonduras S.A.' },
  { codigo: 'MED-001', nombre: 'Lidocaína 2% c/Epinefrina', categoria: 'MEDICAMENTO', unidadMedida: 'Cartucho', stock: 200, stockMinimo: 80, precioCompra: 18.00, precioVenta: 35.00, proveedor: 'Septodont' },
  { codigo: 'MED-002', nombre: 'Mepivacaína 3% s/Vasoconstrictor', categoria: 'MEDICAMENTO', unidadMedida: 'Cartucho', stock: 80, stockMinimo: 30, precioCompra: 22.00, precioVenta: 40.00, proveedor: 'Septodont' },
  { codigo: 'MED-003', nombre: 'Amoxicilina 500mg', categoria: 'MEDICAMENTO', unidadMedida: 'Cápsula', stock: 300, stockMinimo: 100, precioCompra: 2.50, precioVenta: 5.00, proveedor: 'Laboratorios Finlay' },
  { codigo: 'MED-004', nombre: 'Ibuprofeno 400mg', categoria: 'MEDICAMENTO', unidadMedida: 'Tableta', stock: 500, stockMinimo: 150, precioCompra: 1.50, precioVenta: 3.00, proveedor: 'Laboratorios Finlay' },
  { codigo: 'INS-001', nombre: 'Espejo Dental #5', categoria: 'INSTRUMENTAL', unidadMedida: 'Unidad', stock: 12, stockMinimo: 6, precioCompra: 85.00, precioVenta: 150.00, proveedor: 'Hu-Friedy' },
  { codigo: 'INS-002', nombre: 'Explorador Dental', categoria: 'INSTRUMENTAL', unidadMedida: 'Unidad', stock: 10, stockMinimo: 5, precioCompra: 95.00, precioVenta: 160.00, proveedor: 'Hu-Friedy' },
  { codigo: 'INS-003', nombre: 'Pinza Algodonera', categoria: 'INSTRUMENTAL', unidadMedida: 'Unidad', stock: 8, stockMinimo: 4, precioCompra: 110.00, precioVenta: 180.00, proveedor: 'Hu-Friedy' },
  { codigo: 'INS-004', nombre: 'Fórceps #150', categoria: 'INSTRUMENTAL', unidadMedida: 'Unidad', stock: 4, stockMinimo: 2, precioCompra: 650.00, precioVenta: 950.00, proveedor: 'Hu-Friedy' },
];


// ─── MAIN ──────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🦷 Seed de Datos de Prueba - Clínica Dental    ║');
  console.log('║  Modo: Aditivo (no borra datos existentes)      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── 1. Usuarios ──────────────────────────────────────────
  console.log('👤 USUARIOS');
  const usuarios = {};
  for (const u of USUARIOS) {
    const created = await upsertUsuario(u);
    usuarios[u.username] = created;
  }

  const admin = usuarios['admin'];
  const odontologos = [usuarios['dra.garcia'], usuarios['dr.martinez'], usuarios['dra.flores']];

  // ── 2. Configuración Empresa ─────────────────────────────
  console.log('\n🏢 CONFIGURACIÓN EMPRESA');
  const empresaExiste = await prisma.configuracionEmpresa.findFirst();
  if (!empresaExiste) {
    await prisma.configuracionEmpresa.create({
      data: {
        nombre: 'Clínica Odontológica San Rafael',
        rtn: '08019999123456',
        telefono: '+504 2234-5678',
        email: 'info@clinicasanrafael.hn',
        direccion: 'Col. Palmira, Ave. República de Chile, Edificio Médico San Rafael, 2do Piso',
        ciudad: 'Tegucigalpa',
        pais: 'Honduras',
        moneda: 'HNL',
        simboloMoneda: 'L.',
        formatoFecha: 'DD/MM/YYYY',
      },
    });
    console.log('  ✓ Configuración de empresa creada');
  } else {
    console.log('  ⏭  Configuración ya existe');
  }

  // ── 3. Pacientes ─────────────────────────────────────────
  console.log('\n👥 PACIENTES');
  const pacientes = [];
  for (const p of PACIENTES) {
    const created = await upsertPaciente(p);
    pacientes.push(created);
  }

  // ── 4. Productos y Servicios ─────────────────────────────
  console.log('\n🛍️  PRODUCTOS Y SERVICIOS');
  for (const ps of PRODUCTOS_SERVICIOS) {
    const existe = await prisma.productoServicio.findUnique({ where: { codigo: ps.codigo } });
    if (!existe) {
      await prisma.productoServicio.create({ data: ps });
      console.log(`  ✓ ${ps.nombre} — L.${ps.precio}`);
    } else {
      console.log(`  ⏭  ${ps.nombre} ya existe`);
    }
  }

  // ── 5. Inventario ────────────────────────────────────────
  console.log('\n📦 INVENTARIO');
  const inventarioCreado = [];
  for (const item of INVENTARIO_ITEMS) {
    const existe = await prisma.inventario.findUnique({ where: { codigo: item.codigo } });
    if (!existe) {
      const created = await prisma.inventario.create({ data: item });
      inventarioCreado.push(created);
      console.log(`  ✓ ${item.nombre} (stock: ${item.stock})`);
    } else {
      inventarioCreado.push(existe);
      console.log(`  ⏭  ${item.nombre} ya existe`);
    }
  }

  // Movimientos de inventario para los items nuevos
  console.log('\n📊 MOVIMIENTOS DE INVENTARIO');
  for (const inv of inventarioCreado) {
    const movExiste = await prisma.movimientoInventario.findFirst({ where: { inventarioId: inv.id } });
    if (!movExiste) {
      await prisma.movimientoInventario.create({
        data: { inventarioId: inv.id, tipo: 'ENTRADA', cantidad: inv.stock, motivo: 'Stock inicial', responsable: admin.nombre, fecha: diasAtras(30) },
      });
      console.log(`  ✓ Entrada inicial: ${inv.nombre}`);
    }
  }

  // ── 6. Citas ─────────────────────────────────────────────
  console.log('\n📅 CITAS');
  const citasData = [
    // Citas pasadas (completadas)
    { pacIdx: 0, odIdx: 0, dias: -15, hora: '09:00', fin: '09:30', dur: 30, tipo: 'CONSULTA', estado: 'COMPLETADA', motivo: 'Revisión general y diagnóstico inicial' },
    { pacIdx: 1, odIdx: 1, dias: -12, hora: '10:00', fin: '11:00', dur: 60, tipo: 'LIMPIEZA', estado: 'COMPLETADA', motivo: 'Profilaxis dental semestral' },
    { pacIdx: 2, odIdx: 0, dias: -10, hora: '14:00', fin: '15:00', dur: 60, tipo: 'EXTRACCION', estado: 'COMPLETADA', motivo: 'Extracción de tercer molar inferior derecho' },
    { pacIdx: 3, odIdx: 2, dias: -8, hora: '08:30', fin: '09:00', dur: 30, tipo: 'CONSULTA', estado: 'COMPLETADA', motivo: 'Dolor en molar superior izquierdo' },
    { pacIdx: 4, odIdx: 1, dias: -5, hora: '11:00', fin: '12:00', dur: 60, tipo: 'ENDODONCIA', estado: 'COMPLETADA', motivo: 'Tratamiento de conducto pieza 36' },
    { pacIdx: 5, odIdx: 0, dias: -3, hora: '15:00', fin: '15:30', dur: 30, tipo: 'CONTROL', estado: 'COMPLETADA', motivo: 'Control post-extracción' },
    { pacIdx: 6, odIdx: 2, dias: -2, hora: '09:00', fin: '10:00', dur: 60, tipo: 'CONSULTA', estado: 'NO_ASISTIO', motivo: 'Evaluación para prótesis' },
    // Citas de hoy
    { pacIdx: 0, odIdx: 0, dias: 0, hora: '09:00', fin: '10:00', dur: 60, tipo: 'ENDODONCIA', estado: 'PROGRAMADA', motivo: 'Inicio de endodoncia pieza 16' },
    { pacIdx: 7, odIdx: 1, dias: 0, hora: '10:00', fin: '10:30', dur: 30, tipo: 'CONSULTA', estado: 'CONFIRMADA', motivo: 'Primera consulta' },
    { pacIdx: 8, odIdx: 2, dias: 0, hora: '11:00', fin: '12:00', dur: 60, tipo: 'LIMPIEZA', estado: 'PROGRAMADA', motivo: 'Limpieza dental de rutina' },
    // Citas futuras
    { pacIdx: 1, odIdx: 0, dias: 1, hora: '09:00', fin: '10:30', dur: 90, tipo: 'ENDODONCIA', estado: 'PROGRAMADA', motivo: 'Tratamiento de conducto pieza 26' },
    { pacIdx: 3, odIdx: 2, dias: 2, hora: '14:00', fin: '15:00', dur: 60, tipo: 'PROTESIS', estado: 'PROGRAMADA', motivo: 'Toma de impresión para corona' },
    { pacIdx: 9, odIdx: 1, dias: 3, hora: '08:30', fin: '09:30', dur: 60, tipo: 'CONSULTA', estado: 'PROGRAMADA', motivo: 'Evaluación integral, paciente nueva' },
    { pacIdx: 4, odIdx: 0, dias: 5, hora: '10:00', fin: '10:30', dur: 30, tipo: 'CONTROL', estado: 'PROGRAMADA', motivo: 'Control post-endodoncia' },
    { pacIdx: 6, odIdx: 2, dias: 7, hora: '09:00', fin: '10:00', dur: 60, tipo: 'CONSULTA', estado: 'PROGRAMADA', motivo: 'Reprogramación evaluación prótesis' },
  ];

  let citasCreadas = 0;
  for (const c of citasData) {
    const fecha = diasDesdeHoy(c.dias);
    const existe = await prisma.cita.findFirst({
      where: { pacienteId: pacientes[c.pacIdx].id, odontologoId: odontologos[c.odIdx].id, fecha, horaInicio: c.hora },
    });
    if (!existe) {
      await prisma.cita.create({
        data: {
          pacienteId: pacientes[c.pacIdx].id, odontologoId: odontologos[c.odIdx].id,
          fecha, horaInicio: c.hora, horaFin: c.fin, duracion: c.dur,
          tipoCita: c.tipo, estado: c.estado, motivo: c.motivo,
        },
      });
      citasCreadas++;
    }
  }
  console.log(`  ✓ ${citasCreadas} citas creadas (${citasData.length - citasCreadas} ya existían)`);

  // ── 7. Expedientes Clínicos ──────────────────────────────
  console.log('\n📋 EXPEDIENTES CLÍNICOS');
  const expedientes = [];
  const expedientesData = [
    { pacIdx: 0, diagnostico: 'Caries profunda en pieza 16 (primer molar superior derecho). Gingivitis leve generalizada.', tratamiento: 'Endodoncia pieza 16 + obturación con resina. Profilaxis dental.', evolucion: 'Paciente responde bien. Se programa endodoncia.' },
    { pacIdx: 1, diagnostico: 'Cálculo dental moderado. Caries incipiente en pieza 26.', tratamiento: 'Profilaxis dental completa. Obturación preventiva pieza 26.', evolucion: 'Limpieza completada. Control de diabetes estable.' },
    { pacIdx: 2, diagnostico: 'Tercer molar inferior derecho semi-impactado con pericoronaritis.', tratamiento: 'Extracción quirúrgica de pieza 48. Antibioticoterapia.', evolucion: 'Extracción exitosa. Cicatrización normal a los 7 días.' },
    { pacIdx: 3, diagnostico: 'Fractura coronaria en pieza 26 por trauma. Pulpa vital.', tratamiento: 'Recubrimiento pulpar directo + corona de porcelana.', evolucion: 'En espera de corona definitiva. Provisional colocado.' },
    { pacIdx: 4, diagnostico: 'Necrosis pulpar pieza 36 por caries profunda no tratada.', tratamiento: 'Endodoncia pieza 36 + corona de porcelana.', evolucion: 'Endodoncia completada. Pendiente corona.' },
    { pacIdx: 5, diagnostico: 'Dentición mixta normal. Caries incipiente en piezas 55 y 65.', tratamiento: 'Obturaciones con ionómero de vidrio. Aplicación de flúor.', evolucion: 'Tratamiento completado. Control en 6 meses.' },
    { pacIdx: 6, diagnostico: 'Edentulismo parcial superior (ausencia de piezas 14, 15, 24, 25). Periodontitis crónica moderada.', tratamiento: 'Tratamiento periodontal + prótesis parcial removible superior.', evolucion: 'Pendiente evaluación para prótesis. Paciente no asistió a última cita.' },
    { pacIdx: 9, diagnostico: 'Desgaste dental generalizado por bruxismo. ATM con clic bilateral.', tratamiento: 'Placa oclusal nocturna. Ajuste oclusal selectivo.', evolucion: 'Paciente refiere mejoría con placa oclusal.' },
  ];

  for (const e of expedientesData) {
    const existe = await prisma.expediente.findFirst({ where: { pacienteId: pacientes[e.pacIdx].id } });
    if (!existe) {
      const exp = await prisma.expediente.create({
        data: {
          pacienteId: pacientes[e.pacIdx].id,
          diagnostico: e.diagnostico,
          tratamiento: e.tratamiento,
          evolucion: e.evolucion,
          proximaCita: diasDesdeHoy(15),
          odontograma: JSON.stringify({ dientes: {} }),
        },
      });
      expedientes.push(exp);
      console.log(`  ✓ Expediente: ${pacientes[e.pacIdx].nombre} ${pacientes[e.pacIdx].apellido}`);
    } else {
      expedientes.push(existe);
      console.log(`  ⏭  Expediente de ${pacientes[e.pacIdx].nombre} ya existe`);
    }
  }

  // ── 8. Procedimientos ────────────────────────────────────
  console.log('\n🔧 PROCEDIMIENTOS');
  const procedimientosData = [
    { expIdx: 0, odIdx: 0, nombre: 'Radiografía periapical', descripcion: 'Radiografía de pieza 16 para evaluar extensión de caries', diente: '16', precio: 150.00, duracion: 10 },
    { expIdx: 0, odIdx: 0, nombre: 'Apertura cameral', descripcion: 'Inicio de endodoncia pieza 16, apertura y localización de conductos', diente: '16', precio: 800.00, duracion: 45 },
    { expIdx: 1, odIdx: 1, nombre: 'Profilaxis dental', descripcion: 'Limpieza dental completa con ultrasonido y pulido', diente: null, precio: 450.00, duracion: 40 },
    { expIdx: 1, odIdx: 1, nombre: 'Obturación con resina', descripcion: 'Obturación preventiva pieza 26 con resina A2', diente: '26', precio: 600.00, duracion: 30 },
    { expIdx: 2, odIdx: 0, nombre: 'Extracción quirúrgica', descripcion: 'Extracción de tercer molar 48 semi-impactado', diente: '48', precio: 1500.00, duracion: 60 },
    { expIdx: 3, odIdx: 2, nombre: 'Recubrimiento pulpar', descripcion: 'Recubrimiento pulpar directo con MTA en pieza 26', diente: '26', precio: 700.00, duracion: 35 },
    { expIdx: 4, odIdx: 1, nombre: 'Endodoncia completa', descripcion: 'Tratamiento de conducto pieza 36, 3 conductos', diente: '36', precio: 2500.00, duracion: 90 },
    { expIdx: 5, odIdx: 0, nombre: 'Aplicación de flúor', descripcion: 'Aplicación tópica de flúor en barniz', diente: null, precio: 200.00, duracion: 15 },
  ];

  let procCreados = 0;
  for (const p of procedimientosData) {
    if (!expedientes[p.expIdx]) continue;
    const existe = await prisma.procedimiento.findFirst({
      where: { expedienteId: expedientes[p.expIdx].id, nombre: p.nombre },
    });
    if (!existe) {
      await prisma.procedimiento.create({
        data: {
          expedienteId: expedientes[p.expIdx].id,
          odontologoId: odontologos[p.odIdx].id,
          nombre: p.nombre, descripcion: p.descripcion,
          diente: p.diente, precio: p.precio, duracion: p.duracion,
          fecha: diasAtras(Math.floor(Math.random() * 15)),
        },
      });
      procCreados++;
    }
  }
  console.log(`  ✓ ${procCreados} procedimientos creados`);


  // ── 9. Tratamientos con Etapas ───────────────────────────
  console.log('\n🦷 TRATAMIENTOS');
  const tratamientosData = [
    {
      pacIdx: 0, nombre: 'Endodoncia + Corona Pieza 16', descripcion: 'Tratamiento de conducto y rehabilitación con corona de porcelana',
      estado: 'EN_PROGRESO', costoTotal: 7000.00, fechaInicio: diasAtras(15),
      etapas: [
        { orden: 1, nombre: 'Diagnóstico y radiografías', costo: 450.00, completada: true, fechaCompletada: diasAtras(15) },
        { orden: 2, nombre: 'Endodoncia (1ra sesión)', costo: 1500.00, completada: true, fechaCompletada: diasAtras(8) },
        { orden: 3, nombre: 'Endodoncia (2da sesión)', costo: 1000.00, completada: false },
        { orden: 4, nombre: 'Preparación para corona', costo: 800.00, completada: false },
        { orden: 5, nombre: 'Colocación de corona', costo: 3250.00, completada: false },
      ],
    },
    {
      pacIdx: 1, nombre: 'Rehabilitación Oral Parcial', descripcion: 'Obturaciones múltiples y profilaxis periodontal',
      estado: 'COMPLETADO', costoTotal: 2100.00, fechaInicio: diasAtras(30), fechaFin: diasAtras(12),
      etapas: [
        { orden: 1, nombre: 'Profilaxis dental', costo: 450.00, completada: true, fechaCompletada: diasAtras(30) },
        { orden: 2, nombre: 'Obturación pieza 26', costo: 600.00, completada: true, fechaCompletada: diasAtras(23) },
        { orden: 3, nombre: 'Obturación pieza 37', costo: 600.00, completada: true, fechaCompletada: diasAtras(16) },
        { orden: 4, nombre: 'Control final', costo: 450.00, completada: true, fechaCompletada: diasAtras(12) },
      ],
    },
    {
      pacIdx: 3, nombre: 'Corona Porcelana Pieza 26', descripcion: 'Rehabilitación con corona de porcelana sobre metal',
      estado: 'EN_PROGRESO', costoTotal: 5200.00, fechaInicio: diasAtras(8),
      etapas: [
        { orden: 1, nombre: 'Recubrimiento pulpar', costo: 700.00, completada: true, fechaCompletada: diasAtras(8) },
        { orden: 2, nombre: 'Toma de impresión', costo: 500.00, completada: false },
        { orden: 3, nombre: 'Prueba de metal', costo: 0, completada: false },
        { orden: 4, nombre: 'Cementación de corona', costo: 4000.00, completada: false },
      ],
    },
    {
      pacIdx: 4, nombre: 'Endodoncia + Corona Pieza 36', descripcion: 'Tratamiento de conducto y corona por necrosis pulpar',
      estado: 'EN_PROGRESO', costoTotal: 7000.00, fechaInicio: diasAtras(20),
      etapas: [
        { orden: 1, nombre: 'Endodoncia completa', costo: 2500.00, completada: true, fechaCompletada: diasAtras(5) },
        { orden: 2, nombre: 'Poste de fibra de vidrio', costo: 800.00, completada: false },
        { orden: 3, nombre: 'Corona de porcelana', costo: 3700.00, completada: false },
      ],
    },
    {
      pacIdx: 6, nombre: 'Prótesis Parcial Removible Superior', descripcion: 'Prótesis acrílica para reposición de piezas 14, 15, 24, 25',
      estado: 'PLANIFICADO', costoTotal: 8500.00,
      etapas: [
        { orden: 1, nombre: 'Tratamiento periodontal', costo: 1500.00, completada: false },
        { orden: 2, nombre: 'Impresiones primarias', costo: 500.00, completada: false },
        { orden: 3, nombre: 'Impresiones definitivas', costo: 500.00, completada: false },
        { orden: 4, nombre: 'Prueba de rodetes', costo: 0, completada: false },
        { orden: 5, nombre: 'Prueba de dientes', costo: 0, completada: false },
        { orden: 6, nombre: 'Entrega de prótesis', costo: 6000.00, completada: false },
      ],
    },
  ];

  for (const t of tratamientosData) {
    const existe = await prisma.tratamiento.findFirst({
      where: { pacienteId: pacientes[t.pacIdx].id, nombre: t.nombre },
    });
    if (!existe) {
      await prisma.tratamiento.create({
        data: {
          pacienteId: pacientes[t.pacIdx].id,
          nombre: t.nombre, descripcion: t.descripcion,
          estado: t.estado, costoTotal: t.costoTotal,
          fechaInicio: t.fechaInicio || null, fechaFin: t.fechaFin || null,
          etapas: { create: t.etapas },
        },
      });
      console.log(`  ✓ ${t.nombre} — ${pacientes[t.pacIdx].nombre}`);
    } else {
      console.log(`  ⏭  ${t.nombre} ya existe`);
    }
  }

  // ── 10. Facturas con Items y Pagos ───────────────────────
  console.log('\n💰 FACTURAS');
  const facturasData = [
    { pacIdx: 0, items: [{ desc: 'Consulta General', cant: 1, precio: 300 }, { desc: 'Radiografía Periapical', cant: 2, precio: 150 }], estado: 'PAGADA', metodo: 'EFECTIVO', descuento: 0 },
    { pacIdx: 1, items: [{ desc: 'Profilaxis Dental', cant: 1, precio: 450 }, { desc: 'Obturación con Resina', cant: 1, precio: 600 }], estado: 'PAGADA', metodo: 'TARJETA_CREDITO', descuento: 50 },
    { pacIdx: 2, items: [{ desc: 'Extracción de Cordal', cant: 1, precio: 1500 }, { desc: 'Radiografía Panorámica', cant: 1, precio: 400 }], estado: 'PAGADA', metodo: 'TRANSFERENCIA', descuento: 0 },
    { pacIdx: 3, items: [{ desc: 'Recubrimiento Pulpar', cant: 1, precio: 700 }, { desc: 'Corona Provisional', cant: 1, precio: 500 }], estado: 'PAGADA_PARCIAL', metodo: 'EFECTIVO', descuento: 0 },
    { pacIdx: 4, items: [{ desc: 'Endodoncia Completa', cant: 1, precio: 2500 }], estado: 'PENDIENTE', metodo: null, descuento: 100 },
    { pacIdx: 5, items: [{ desc: 'Obturación con Ionómero', cant: 2, precio: 400 }, { desc: 'Aplicación de Flúor', cant: 1, precio: 200 }], estado: 'PAGADA', metodo: 'EFECTIVO', descuento: 0 },
    { pacIdx: 7, items: [{ desc: 'Consulta General', cant: 1, precio: 300 }], estado: 'PENDIENTE', metodo: null, descuento: 0 },
    { pacIdx: 9, items: [{ desc: 'Consulta General', cant: 1, precio: 300 }, { desc: 'Placa Oclusal', cant: 1, precio: 1800 }], estado: 'PAGADA_PARCIAL', metodo: 'TARJETA_DEBITO', descuento: 100 },
  ];

  let factNum = 1;
  // Buscar el último número de factura existente
  const ultimaFactura = await prisma.factura.findFirst({ orderBy: { createdAt: 'desc' } });
  if (ultimaFactura) {
    const match = ultimaFactura.numero.match(/(\d+)$/);
    if (match) factNum = parseInt(match[1]) + 1;
  }

  for (const f of facturasData) {
    const existeFactura = await prisma.factura.findFirst({
      where: { pacienteId: pacientes[f.pacIdx].id },
    });
    if (existeFactura) {
      console.log(`  ⏭  Factura de ${pacientes[f.pacIdx].nombre} ya existe`);
      continue;
    }

    const items = f.items.map(i => ({ descripcion: i.desc, cantidad: i.cant, precioUnitario: i.precio, subtotal: i.cant * i.precio }));
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const impuesto = (subtotal - f.descuento) * 0.15;
    const total = subtotal - f.descuento + impuesto;
    const numero = `FAC-${String(factNum++).padStart(6, '0')}`;

    const pagos = [];
    if (f.estado === 'PAGADA') {
      pagos.push({ monto: total, metodoPago: f.metodo, referencia: `Pago completo ${numero}` });
    } else if (f.estado === 'PAGADA_PARCIAL') {
      const abono = Math.round(total * 0.5 * 100) / 100;
      pagos.push({ monto: abono, metodoPago: f.metodo || 'EFECTIVO', referencia: `Abono parcial ${numero}` });
    }

    await prisma.factura.create({
      data: {
        numero, pacienteId: pacientes[f.pacIdx].id, emitenteId: admin.id,
        subtotal, descuento: f.descuento, impuesto: Math.round(impuesto * 100) / 100, total: Math.round(total * 100) / 100,
        estado: f.estado, metodoPago: f.metodo,
        fecha: diasAtras(Math.floor(Math.random() * 20)),
        items: { create: items },
        pagos: pagos.length > 0 ? { create: pagos } : undefined,
      },
    });
    console.log(`  ✓ ${numero} — ${pacientes[f.pacIdx].nombre} — L.${Math.round(total * 100) / 100} (${f.estado})`);
  }


  // ── 11. Ingresos ─────────────────────────────────────────
  console.log('\n📈 INGRESOS');
  const facturasPagadas = await prisma.factura.findMany({
    where: { estado: { in: ['PAGADA', 'PAGADA_PARCIAL'] } },
    include: { ingreso: true },
  });

  let ingresosCreados = 0;
  for (const fac of facturasPagadas) {
    if (fac.ingreso) continue;
    await prisma.ingreso.create({
      data: {
        facturaId: fac.id,
        concepto: `Pago factura ${fac.numero}`,
        categoria: 'CONSULTA',
        monto: fac.estado === 'PAGADA' ? fac.total : Number(fac.total) * 0.5,
        fecha: fac.fecha,
        metodoPago: fac.metodoPago || 'EFECTIVO',
        estado: 'REGISTRADO',
      },
    });
    ingresosCreados++;
  }
  console.log(`  ✓ ${ingresosCreados} ingresos registrados`);

  // ── 12. Egresos ──────────────────────────────────────────
  console.log('\n📉 EGRESOS');
  const egresosData = [
    { concepto: 'Compra de resinas y materiales restauradores', categoria: 'MATERIALES_DENTALES', monto: 4500.00, metodo: 'TRANSFERENCIA', proveedor: '3M Dental Honduras', numFact: 'DS-2024-0891', estado: 'PAGADO', dias: 25 },
    { concepto: 'Compra de anestésicos y medicamentos', categoria: 'MEDICAMENTOS', monto: 2800.00, metodo: 'TRANSFERENCIA', proveedor: 'Septodont Centroamérica', numFact: 'SEP-2024-445', estado: 'PAGADO', dias: 20 },
    { concepto: 'Alquiler del local - mes actual', categoria: 'ALQUILER', monto: 15000.00, metodo: 'TRANSFERENCIA', proveedor: 'Inmobiliaria Palmira S.A.', numFact: 'ALQ-2024-04', estado: 'PAGADO', dias: 1 },
    { concepto: 'Servicio de energía eléctrica', categoria: 'SERVICIOS_PUBLICOS', monto: 3200.00, metodo: 'EFECTIVO', proveedor: 'ENEE', numFact: 'ENEE-04-2024', estado: 'PAGADO', dias: 5 },
    { concepto: 'Servicio de agua potable', categoria: 'SERVICIOS_PUBLICOS', monto: 850.00, metodo: 'EFECTIVO', proveedor: 'SANAA', numFact: 'SANAA-04-2024', estado: 'PAGADO', dias: 5 },
    { concepto: 'Internet y telefonía', categoria: 'SERVICIOS_PUBLICOS', monto: 1500.00, metodo: 'TARJETA_CREDITO', proveedor: 'Tigo Honduras', numFact: 'TIGO-04-2024', estado: 'PAGADO', dias: 3 },
    { concepto: 'Mantenimiento compresor dental', categoria: 'MANTENIMIENTO', monto: 2500.00, metodo: 'EFECTIVO', proveedor: 'TecniDental S.A.', numFact: 'TD-2024-112', estado: 'PAGADO', dias: 10 },
    { concepto: 'Compra de guantes y consumibles', categoria: 'MATERIALES_DENTALES', monto: 3600.00, metodo: 'TARJETA_CREDITO', proveedor: 'MediHonduras S.A.', numFact: 'MH-2024-789', estado: 'PAGADO', dias: 15 },
    { concepto: 'Publicidad en redes sociales', categoria: 'MARKETING', monto: 2000.00, metodo: 'TARJETA_CREDITO', proveedor: 'Meta Ads', numFact: 'META-04-2024', estado: 'APROBADO', dias: 2 },
    { concepto: 'Salario asistente dental', categoria: 'SALARIOS', monto: 12000.00, metodo: 'TRANSFERENCIA', proveedor: null, numFact: null, estado: 'PAGADO', dias: 1 },
    { concepto: 'Salario recepcionista', categoria: 'SALARIOS', monto: 10000.00, metodo: 'TRANSFERENCIA', proveedor: null, numFact: null, estado: 'PAGADO', dias: 1 },
    { concepto: 'Compra de instrumental nuevo (fórceps)', categoria: 'INSTRUMENTAL', monto: 3800.00, metodo: 'TRANSFERENCIA', proveedor: 'Hu-Friedy', numFact: 'HF-2024-056', estado: 'PENDIENTE', dias: 0 },
  ];

  let egresosCreados = 0;
  for (const e of egresosData) {
    const existe = await prisma.egreso.findFirst({ where: { concepto: e.concepto } });
    if (!existe) {
      await prisma.egreso.create({
        data: {
          concepto: e.concepto, categoria: e.categoria, monto: e.monto,
          metodoPago: e.metodo, proveedor: e.proveedor, numeroFactura: e.numFact,
          estado: e.estado, registradoPor: admin.id, fecha: diasAtras(e.dias),
        },
      });
      egresosCreados++;
    }
  }
  console.log(`  ✓ ${egresosCreados} egresos registrados`);

  // ── 13. Flujo de Caja ────────────────────────────────────
  console.log('\n💵 FLUJO DE CAJA');
  const flujoExiste = await prisma.flujoCaja.findFirst();
  if (!flujoExiste) {
    let saldo = 0;
    const movimientos = [
      { tipo: 'AJUSTE', concepto: 'Saldo inicial de apertura', monto: 50000.00, fecha: diasAtras(60) },
      { tipo: 'INGRESO', concepto: 'Ingresos por consultas - Semana 1', monto: 8500.00, fecha: diasAtras(45) },
      { tipo: 'EGRESO', concepto: 'Pago de alquiler', monto: 15000.00, fecha: diasAtras(40) },
      { tipo: 'INGRESO', concepto: 'Ingresos por procedimientos - Semana 2', monto: 12300.00, fecha: diasAtras(35) },
      { tipo: 'EGRESO', concepto: 'Compra de materiales', monto: 7200.00, fecha: diasAtras(30) },
      { tipo: 'INGRESO', concepto: 'Ingresos por consultas - Semana 3', monto: 9800.00, fecha: diasAtras(25) },
      { tipo: 'EGRESO', concepto: 'Servicios públicos', monto: 5550.00, fecha: diasAtras(20) },
      { tipo: 'INGRESO', concepto: 'Ingresos por tratamientos - Semana 4', monto: 15600.00, fecha: diasAtras(15) },
      { tipo: 'EGRESO', concepto: 'Salarios del personal', monto: 22000.00, fecha: diasAtras(10) },
      { tipo: 'INGRESO', concepto: 'Ingresos varios - Semana actual', monto: 6200.00, fecha: diasAtras(3) },
    ];

    for (const m of movimientos) {
      const saldoAnterior = saldo;
      saldo += m.tipo === 'EGRESO' ? -m.monto : m.monto;
      await prisma.flujoCaja.create({
        data: { tipo: m.tipo, concepto: m.concepto, monto: m.monto, saldoAnterior, saldoActual: saldo, fecha: m.fecha },
      });
    }
    console.log(`  ✓ ${movimientos.length} movimientos de flujo de caja (saldo actual: L.${saldo.toFixed(2)})`);
  } else {
    console.log('  ⏭  Flujo de caja ya tiene datos');
  }

  // ── 14. Estadísticas de Odontólogos ──────────────────────
  console.log('\n📊 ESTADÍSTICAS DE ODONTÓLOGOS');
  const mesActual = new Date().getMonth() + 1;
  const anioActual = new Date().getFullYear();
  const meses = [
    { mes: mesActual - 2 > 0 ? mesActual - 2 : mesActual + 10, anio: mesActual - 2 > 0 ? anioActual : anioActual - 1 },
    { mes: mesActual - 1 > 0 ? mesActual - 1 : mesActual + 11, anio: mesActual - 1 > 0 ? anioActual : anioActual - 1 },
    { mes: mesActual, anio: anioActual },
  ];

  let statsCreadas = 0;
  for (const od of odontologos) {
    for (const m of meses) {
      const existe = await prisma.estadisticaOdontologo.findFirst({
        where: { odontologoId: od.id, mes: m.mes, anio: m.anio },
      });
      if (!existe) {
        await prisma.estadisticaOdontologo.create({
          data: {
            odontologoId: od.id, mes: m.mes, anio: m.anio,
            pacientesAtendidos: 10 + Math.floor(Math.random() * 20),
            citasCompletadas: 15 + Math.floor(Math.random() * 15),
            citasCanceladas: Math.floor(Math.random() * 5),
            ingresos: 15000 + Math.floor(Math.random() * 25000),
          },
        });
        statsCreadas++;
      }
    }
  }
  console.log(`  ✓ ${statsCreadas} registros de estadísticas`);

  // ── 15. Correlativo SAR ──────────────────────────────────
  console.log('\n🔢 CORRELATIVOS SAR');
  const corrExiste = await prisma.correlativo.findFirst({ where: { activo: true } });
  if (!corrExiste) {
    await prisma.correlativo.create({
      data: {
        tipo: 'FACTURA',
        cai: 'A1B2C3-D4E5F6-G7H8I9-J0K1L2-M3N4O5-P6',
        sucursal: '000',
        puntoEmision: '001',
        tipoDoc: '01',
        rangoInicial: 1,
        rangoFinal: 5000,
        siguiente: factNum,
        fechaLimite: diasDesdeHoy(365),
        activo: true,
      },
    });
    console.log('  ✓ Correlativo SAR para facturas creado');
  } else {
    console.log('  ⏭  Correlativo SAR ya existe');
  }

  // ── RESUMEN ──────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  ✅ Seed completado exitosamente                ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('\n🔐 Credenciales de acceso:');
  console.log('┌──────────────┬──────────────┬──────────────────┐');
  console.log('│ Rol          │ Usuario      │ Contraseña       │');
  console.log('├──────────────┼──────────────┼──────────────────┤');
  console.log('│ Admin        │ admin        │ Admin123!        │');
  console.log('│ Odontólogo   │ dra.garcia   │ Odontologo123!   │');
  console.log('│ Odontólogo   │ dr.martinez  │ Odontologo123!   │');
  console.log('│ Odontólogo   │ dra.flores   │ Odontologo123!   │');
  console.log('│ Recepción    │ recepcion    │ Recepcion123!    │');
  console.log('│ Asistente    │ asistente    │ Asistente123!    │');
  console.log('└──────────────┴──────────────┴──────────────────┘');
  console.log('\n📊 Datos creados:');
  console.log('   • 6 usuarios (admin, 3 odontólogos, recepción, asistente)');
  console.log('   • 10 pacientes con historial médico');
  console.log('   • 19 productos/servicios');
  console.log('   • 17 items de inventario con movimientos');
  console.log('   • 15 citas (pasadas, hoy y futuras)');
  console.log('   • 8 expedientes clínicos con procedimientos');
  console.log('   • 5 planes de tratamiento con etapas');
  console.log('   • 8 facturas con items y pagos');
  console.log('   • Ingresos, egresos y flujo de caja');
  console.log('   • Estadísticas de odontólogos (3 meses)');
  console.log('   • Correlativo SAR configurado');
}

main()
  .catch((e) => {
    console.error('\n❌ Error durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
