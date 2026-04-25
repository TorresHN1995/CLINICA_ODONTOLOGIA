/**
 * Seed completo: insumos, servicios con insumos vinculados, y datos de prueba
 * Ejecutar: node seed-insumos-completo.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── TODOS LOS ITEMS DE INVENTARIO ───────────────────────────────────────────
const TODO_INVENTARIO = [
  // Existentes del seed anterior
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
  // Nuevos consumibles
  { codigo: 'CON-003', nombre: 'Babero Desechable', categoria: 'CONSUMIBLE', unidadMedida: 'Unidad', stock: 1000, stockMinimo: 200, precioCompra: 1.50, precioVenta: 3.00, proveedor: 'Dental Supply Honduras' },
  { codigo: 'CON-004', nombre: 'Vaso Desechable', categoria: 'CONSUMIBLE', unidadMedida: 'Unidad', stock: 2000, stockMinimo: 500, precioCompra: 0.50, precioVenta: 1.00, proveedor: 'Dental Supply Honduras' },
  { codigo: 'CON-005', nombre: 'Hoja de Bisturí #15', categoria: 'CONSUMIBLE', unidadMedida: 'Unidad', stock: 150, stockMinimo: 30, precioCompra: 12.00, precioVenta: 20.00, proveedor: 'Hu-Friedy' },
  { codigo: 'CON-006', nombre: 'Gasa Estéril 4x4', categoria: 'CONSUMIBLE', unidadMedida: 'Paquete x10', stock: 300, stockMinimo: 60, precioCompra: 15.00, precioVenta: 25.00, proveedor: 'MediHonduras S.A.' },
  { codigo: 'CON-007', nombre: 'Hilo de Sutura 3-0', categoria: 'CONSUMIBLE', unidadMedida: 'Unidad', stock: 100, stockMinimo: 20, precioCompra: 35.00, precioVenta: 60.00, proveedor: 'Ethicon' },
  { codigo: 'CON-008', nombre: 'Puntas de Irrigación', categoria: 'CONSUMIBLE', unidadMedida: 'Bolsa x100', stock: 50, stockMinimo: 10, precioCompra: 85.00, precioVenta: 140.00, proveedor: 'Dentsply' },
  { codigo: 'CON-009', nombre: 'Limas Endodónticas K-File #15-40', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Caja x6', stock: 80, stockMinimo: 15, precioCompra: 120.00, precioVenta: 200.00, proveedor: 'Dentsply' },
  { codigo: 'CON-010', nombre: 'Papel Articular 40 micras', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Caja', stock: 40, stockMinimo: 10, precioCompra: 95.00, precioVenta: 160.00, proveedor: 'Bausch' },
  { codigo: 'CON-011', nombre: 'Cemento de Ionómero de Vidrio', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Kit', stock: 25, stockMinimo: 5, precioCompra: 380.00, precioVenta: 600.00, proveedor: 'GC Corporation' },
  { codigo: 'CON-012', nombre: 'Pasta Profiláctica', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Tarro 200g', stock: 30, stockMinimo: 8, precioCompra: 180.00, precioVenta: 300.00, proveedor: 'Oral-B Professional' },
  { codigo: 'CON-013', nombre: 'Copa de Goma para Profilaxis', categoria: 'CONSUMIBLE', unidadMedida: 'Bolsa x100', stock: 60, stockMinimo: 15, precioCompra: 65.00, precioVenta: 110.00, proveedor: 'Dental Supply Honduras' },
  { codigo: 'CON-014', nombre: 'Cepillo Interproximal Profilaxis', categoria: 'CONSUMIBLE', unidadMedida: 'Bolsa x100', stock: 40, stockMinimo: 10, precioCompra: 75.00, precioVenta: 125.00, proveedor: 'Dental Supply Honduras' },
  { codigo: 'CON-015', nombre: 'Hilo Retractor #000', categoria: 'MATERIAL_DENTAL', unidadMedida: 'Rollo', stock: 20, stockMinimo: 5, precioCompra: 220.00, precioVenta: 380.00, proveedor: 'Ultradent' },
  { codigo: 'MED-005', nombre: 'Clindamicina 300mg', categoria: 'MEDICAMENTO', unidadMedida: 'Cápsula', stock: 200, stockMinimo: 50, precioCompra: 4.50, precioVenta: 8.00, proveedor: 'Laboratorios Finlay' },
  { codigo: 'MED-006', nombre: 'Metronidazol 500mg', categoria: 'MEDICAMENTO', unidadMedida: 'Tableta', stock: 300, stockMinimo: 80, precioCompra: 2.00, precioVenta: 4.00, proveedor: 'Laboratorios Finlay' },
  { codigo: 'MED-007', nombre: 'Dexametasona 4mg', categoria: 'MEDICAMENTO', unidadMedida: 'Ampolla', stock: 80, stockMinimo: 20, precioCompra: 18.00, precioVenta: 35.00, proveedor: 'Laboratorios Finlay' },
];

// ─── TODOS LOS SERVICIOS ──────────────────────────────────────────────────────
const TODO_SERVICIOS = [
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
  { codigo: 'SRV-016', nombre: 'Curetaje Periodontal', precio: 1800.00, tipo: 'SERVICIO', descripcion: 'Raspado y alisado radicular por cuadrante' },
  { codigo: 'SRV-017', nombre: 'Cirugía Periodontal', precio: 3500.00, tipo: 'SERVICIO', descripcion: 'Cirugía de colgajo periodontal' },
  { codigo: 'SRV-018', nombre: 'Exodoncia Simple', precio: 500.00, tipo: 'SERVICIO', descripcion: 'Extracción de pieza dental sin complicaciones' },
  { codigo: 'SRV-019', nombre: 'Exodoncia Quirúrgica', precio: 1500.00, tipo: 'SERVICIO', descripcion: 'Extracción quirúrgica con colgajo' },
  { codigo: 'SRV-020', nombre: 'Obturación Amalgama', precio: 450.00, tipo: 'SERVICIO', descripcion: 'Restauración con amalgama dental' },
  { codigo: 'SRV-021', nombre: 'Incrustación Cerámica', precio: 3200.00, tipo: 'SERVICIO', descripcion: 'Incrustación de porcelana (inlay/onlay)' },
  { codigo: 'SRV-022', nombre: 'Carilla de Porcelana', precio: 5500.00, tipo: 'SERVICIO', descripcion: 'Carilla estética de porcelana por pieza' },
  { codigo: 'SRV-023', nombre: 'Implante Dental', precio: 25000.00, tipo: 'SERVICIO', descripcion: 'Implante de titanio con corona' },
  { codigo: 'SRV-024', nombre: 'Ortodoncia Mensualidad', precio: 1200.00, tipo: 'SERVICIO', descripcion: 'Control mensual de ortodoncia fija' },
  { codigo: 'SRV-025', nombre: 'Placa Oclusal', precio: 2500.00, tipo: 'SERVICIO', descripcion: 'Placa de relajación para bruxismo' },
  { codigo: 'PRD-001', nombre: 'Cepillo Dental Profesional', precio: 85.00, tipo: 'PRODUCTO', descripcion: 'Cepillo de cerdas suaves' },
  { codigo: 'PRD-002', nombre: 'Pasta Dental con Flúor', precio: 120.00, tipo: 'PRODUCTO', descripcion: 'Pasta dental profesional 100ml' },
  { codigo: 'PRD-003', nombre: 'Enjuague Bucal', precio: 180.00, tipo: 'PRODUCTO', descripcion: 'Enjuague bucal antiséptico 500ml' },
  { codigo: 'PRD-004', nombre: 'Hilo Dental', precio: 65.00, tipo: 'PRODUCTO', descripcion: 'Hilo dental encerado 50m' },
];

// ─── INSUMOS POR SERVICIO ─────────────────────────────────────────────────────
const INSUMOS_POR_SERVICIO = {
  'SRV-001': [ // Consulta General
    { cod: 'MAT-001', cant: 1 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 }, { cod: 'CON-004', cant: 1 },
  ],
  'SRV-002': [ // Limpieza Dental
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 }, { cod: 'CON-004', cant: 1 },
    { cod: 'CON-012', cant: 1 }, { cod: 'CON-013', cant: 2 }, { cod: 'CON-014', cant: 2 },
  ],
  'SRV-003': [ // Obturación con Resina
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 },
    { cod: 'MAT-004', cant: 1 }, { cod: 'MAT-006', cant: 1 }, { cod: 'MAT-007', cant: 1 }, { cod: 'CON-010', cant: 1 },
  ],
  'SRV-004': [ // Extracción Simple
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 },
    { cod: 'MED-001', cant: 2 }, { cod: 'CON-006', cant: 2 },
  ],
  'SRV-005': [ // Extracción de Cordal
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 },
    { cod: 'MED-001', cant: 3 }, { cod: 'CON-005', cant: 1 }, { cod: 'CON-006', cant: 4 },
    { cod: 'CON-007', cant: 1 }, { cod: 'MED-007', cant: 1 },
  ],
  'SRV-006': [ // Endodoncia
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 },
    { cod: 'MED-001', cant: 2 }, { cod: 'CON-008', cant: 1 }, { cod: 'CON-009', cant: 1 },
  ],
  'SRV-009': [ // Blanqueamiento
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 }, { cod: 'CON-004', cant: 1 },
  ],
  'SRV-012': [ // Aplicación de Flúor
    { cod: 'MAT-001', cant: 1 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 }, { cod: 'CON-004', cant: 1 },
  ],
  'SRV-016': [ // Curetaje Periodontal
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 },
    { cod: 'MED-001', cant: 2 }, { cod: 'CON-006', cant: 2 },
  ],
  'SRV-017': [ // Cirugía Periodontal
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 },
    { cod: 'MED-001', cant: 3 }, { cod: 'CON-005', cant: 1 }, { cod: 'CON-006', cant: 4 }, { cod: 'CON-007', cant: 2 },
  ],
  'SRV-018': [ // Exodoncia Simple
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 },
    { cod: 'MED-001', cant: 2 }, { cod: 'CON-006', cant: 2 },
  ],
  'SRV-019': [ // Exodoncia Quirúrgica
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 },
    { cod: 'MED-001', cant: 3 }, { cod: 'CON-005', cant: 1 }, { cod: 'CON-006', cant: 4 }, { cod: 'CON-007', cant: 1 },
  ],
  'SRV-020': [ // Obturación Amalgama
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 }, { cod: 'CON-010', cant: 1 },
  ],
  'SRV-025': [ // Placa Oclusal
    { cod: 'MAT-001', cant: 2 }, { cod: 'MAT-003', cant: 1 }, { cod: 'CON-003', cant: 1 }, { cod: 'CON-015', cant: 1 },
  ],
};

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🦷 Seed Insumos + Servicios + Datos de Prueba  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMINISTRADOR' } });

  // ── 1. Inventario completo ───────────────────────────
  console.log('📦 INVENTARIO');
  const invMap = {};

  for (const item of TODO_INVENTARIO) {
    let inv = await prisma.inventario.findUnique({ where: { codigo: item.codigo } });
    if (!inv) {
      // Buscar por nombre por si existe con otro código
      inv = await prisma.inventario.findFirst({ where: { nombre: item.nombre } });
    }
    if (!inv) {
      inv = await prisma.inventario.create({ data: item });
      await prisma.movimientoInventario.create({
        data: { inventarioId: inv.id, tipo: 'ENTRADA', cantidad: item.stock, motivo: 'Stock inicial', responsable: admin?.nombre || 'Sistema' }
      });
      console.log(`  ✓ ${item.nombre}`);
    }
    invMap[item.codigo] = inv;
  }
  console.log(`  Total en BD: ${await prisma.inventario.count()}`);

  // ── 2. Servicios y productos ─────────────────────────
  console.log('\n🛍️  SERVICIOS Y PRODUCTOS');
  const srvMap = {};

  for (const srv of TODO_SERVICIOS) {
    let s = await prisma.productoServicio.findUnique({ where: { codigo: srv.codigo } });
    if (!s) {
      s = await prisma.productoServicio.create({ data: { ...srv, isv: 15 } });
      console.log(`  ✓ ${srv.nombre}`);
    }
    srvMap[srv.codigo] = s;
  }
  console.log(`  Total en BD: ${await prisma.productoServicio.count()}`);

  // ── 3. Vincular insumos a servicios ─────────────────
  console.log('\n🔗 INSUMOS POR SERVICIO');
  let insumosCreados = 0;
  let insumosOmitidos = 0;

  for (const [codigoSrv, insumos] of Object.entries(INSUMOS_POR_SERVICIO)) {
    const servicio = srvMap[codigoSrv];
    if (!servicio) { console.log(`  ⚠️  Servicio ${codigoSrv} no encontrado`); continue; }

    let nuevos = 0;
    for (const { cod, cant } of insumos) {
      const inv = invMap[cod];
      if (!inv) { console.log(`  ⚠️  Inventario ${cod} no encontrado`); continue; }

      const existe = await prisma.servicioInsumo.findUnique({
        where: { servicioId_inventarioId: { servicioId: servicio.id, inventarioId: inv.id } }
      });

      if (!existe) {
        await prisma.servicioInsumo.create({ data: { servicioId: servicio.id, inventarioId: inv.id, cantidad: cant } });
        nuevos++;
        insumosCreados++;
      } else {
        insumosOmitidos++;
      }
    }
    if (nuevos > 0) console.log(`  ✓ ${servicio.nombre} → +${nuevos} insumos`);
    else console.log(`  ⏭  ${servicio.nombre} ya tiene insumos`);
  }

  // ── RESUMEN ──────────────────────────────────────────
  const [totalSrv, totalInv, totalInsumos] = await Promise.all([
    prisma.productoServicio.count(),
    prisma.inventario.count(),
    prisma.servicioInsumo.count(),
  ]);

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  ✅ Seed completado                             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n  Servicios/Productos en BD: ${totalSrv}`);
  console.log(`  Items de inventario en BD: ${totalInv}`);
  console.log(`  Insumos vinculados en BD:  ${totalInsumos}`);
  console.log(`  Insumos nuevos creados:    ${insumosCreados}`);
}

main()
  .catch((e) => { console.error('\n❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
