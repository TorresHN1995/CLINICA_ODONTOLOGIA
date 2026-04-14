/**
 * Script de Pruebas Exhaustivas del Sistema de Gestión Dental
 * Simula flujos reales para detectar bugs y errores
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
let authToken: string = '';
let testData: any = {};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name: string) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`TEST: ${name}`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

async function makeRequest(
  method: string,
  endpoint: string,
  body?: any,
  headers?: any
) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return {
      status: response.status,
      data,
      ok: response.ok,
    };
  } catch (error: any) {
    logError(`Error en request: ${error.message}`);
    return {
      status: 0,
      data: null,
      ok: false,
      error: error.message,
    };
  }
}

// ============================================
// TEST 1: Crear Usuario Administrador
// ============================================
async function testCreateAdmin() {
  logTest('Crear Usuario Administrador');

  const userData = {
    email: `admin-${Date.now()}@clinica.com`,
    username: `admin_${Date.now()}`,
    password: 'Admin123!',
    nombre: 'Juan',
    apellido: 'Pérez',
    telefono: '50412345678',
    rol: 'ADMINISTRADOR',
  };

  const response = await makeRequest('POST', '/usuarios', userData);

  if (response.ok) {
    logSuccess(`Usuario creado: ${userData.username}`);
    testData.admin = response.data;
    return true;
  } else {
    logError(`Error al crear usuario: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 2: Crear Usuario Odontólogo
// ============================================
async function testCreateOdontologo() {
  logTest('Crear Usuario Odontólogo');

  const userData = {
    email: `odontologo-${Date.now()}@clinica.com`,
    username: `odontologo_${Date.now()}`,
    password: 'Odontologo123!',
    nombre: 'Carlos',
    apellido: 'López',
    telefono: '50412345679',
    rol: 'ODONTOLOGO',
  };

  const response = await makeRequest('POST', '/usuarios', userData);

  if (response.ok) {
    logSuccess(`Odontólogo creado: ${userData.username}`);
    testData.odontologo = response.data;
    return true;
  } else {
    logError(`Error al crear odontólogo: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 3: Login
// ============================================
async function testLogin() {
  logTest('Login de Usuario');

  const loginData = {
    username: testData.admin.username,
    password: 'Admin123!',
  };

  const response = await makeRequest('POST', '/auth/signin', loginData);

  if (response.ok && response.data.token) {
    logSuccess(`Login exitoso para: ${loginData.username}`);
    authToken = response.data.token;
    return true;
  } else {
    logError(`Error en login: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 4: Crear Paciente
// ============================================
async function testCreatePaciente() {
  logTest('Crear Paciente');

  const pacienteData = {
    identificacion: `ID-${Date.now()}`,
    nombre: 'María',
    apellido: 'González',
    fechaNacimiento: '1990-05-15',
    email: `paciente-${Date.now()}@example.com`,
    telefono: '50412345680',
    celular: '50487654321',
    direccion: 'Calle Principal 123',
    ciudad: 'Tegucigalpa',
    ocupacion: 'Ingeniera',
    contactoEmergencia: 'Juan González',
    telefonoEmergencia: '50412345681',
    alergias: 'Penicilina',
    medicamentos: 'Ninguno',
    enfermedades: 'Diabetes tipo 2',
    observaciones: 'Paciente con historial de ansiedad dental',
    consentimiento: true,
  };

  const response = await makeRequest('POST', '/pacientes', pacienteData);

  if (response.ok) {
    logSuccess(`Paciente creado: ${pacienteData.nombre} ${pacienteData.apellido}`);
    testData.paciente = response.data;
    return true;
  } else {
    logError(`Error al crear paciente: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 5: Obtener Disponibilidad de Citas
// ============================================
async function testGetDisponibilidad() {
  logTest('Obtener Disponibilidad de Citas');

  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  const fechaStr = fecha.toISOString().split('T')[0];

  const response = await makeRequest(
    'GET',
    `/citas/disponibilidad?odontologoId=${testData.odontologo.id}&fecha=${fechaStr}`
  );

  if (response.ok) {
    logSuccess(`Disponibilidad obtenida para ${fechaStr}`);
    logSuccess(`Horarios disponibles: ${response.data.length}`);
    return true;
  } else {
    logWarning(`No hay disponibilidad o error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 6: Agendar Cita
// ============================================
async function testCreateCita() {
  logTest('Agendar Cita');

  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  const fechaStr = fecha.toISOString().split('T')[0];

  const citaData = {
    pacienteId: testData.paciente.id,
    odontologoId: testData.odontologo.id,
    fecha: fechaStr,
    horaInicio: '09:00',
    horaFin: '09:30',
    duracion: 30,
    tipoCita: 'CONSULTA',
    motivo: 'Revisión general',
    observaciones: 'Primera cita del paciente',
  };

  const response = await makeRequest('POST', '/citas', citaData);

  if (response.ok) {
    logSuccess(`Cita agendada para ${fechaStr} a las ${citaData.horaInicio}`);
    testData.cita = response.data;
    return true;
  } else {
    logError(`Error al agendar cita: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 7: Crear Expediente Clínico
// ============================================
async function testCreateExpediente() {
  logTest('Crear Expediente Clínico');

  const expedienteData = {
    pacienteId: testData.paciente.id,
    diagnostico: 'Caries en piezas 1.6 y 2.6. Gingivitis leve.',
    tratamiento: 'Obturación de caries. Profilaxis y educación en higiene.',
    evolucion: 'Paciente responde bien al tratamiento',
    proximaCita: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    odontograma: JSON.stringify({
      dientes: {
        '16': { estado: 'caries', tratamiento: 'obturacion' },
        '26': { estado: 'caries', tratamiento: 'obturacion' },
      },
    }),
  };

  const response = await makeRequest('POST', '/expedientes', expedienteData);

  if (response.ok) {
    logSuccess(`Expediente creado para paciente ${testData.paciente.nombre}`);
    testData.expediente = response.data;
    return true;
  } else {
    logError(`Error al crear expediente: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 8: Crear Procedimiento
// ============================================
async function testCreateProcedimiento() {
  logTest('Crear Procedimiento');

  const procedimientoData = {
    expedienteId: testData.expediente.id,
    odontologoId: testData.odontologo.id,
    nombre: 'Obturación de caries',
    descripcion: 'Obturación con resina compuesta en pieza 1.6',
    diente: '16',
    precio: 150.00,
    duracion: 45,
    materiales: JSON.stringify(['Resina compuesta', 'Ácido grabador', 'Adhesivo']),
    observaciones: 'Procedimiento sin complicaciones',
  };

  const response = await makeRequest('POST', '/expedientes/procedimientos', procedimientoData);

  if (response.ok) {
    logSuccess(`Procedimiento registrado: ${procedimientoData.nombre}`);
    testData.procedimiento = response.data;
    return true;
  } else {
    logError(`Error al crear procedimiento: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 9: Crear Tratamiento
// ============================================
async function testCreateTratamiento() {
  logTest('Crear Tratamiento');

  const tratamientoData = {
    pacienteId: testData.paciente.id,
    nombre: 'Tratamiento de Ortodoncia',
    descripcion: 'Corrección de maloclusión con brackets metálicos',
    estado: 'PLANIFICADO',
    costoTotal: 2500.00,
    observaciones: 'Tratamiento de 24 meses',
  };

  const response = await makeRequest('POST', '/tratamientos', tratamientoData);

  if (response.ok) {
    logSuccess(`Tratamiento creado: ${tratamientoData.nombre}`);
    testData.tratamiento = response.data;
    return true;
  } else {
    logError(`Error al crear tratamiento: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 10: Crear Etapa de Tratamiento
// ============================================
async function testCreateEtapaTratamiento() {
  logTest('Crear Etapa de Tratamiento');

  const etapaData = {
    tratamientoId: testData.tratamiento.id,
    orden: 1,
    nombre: 'Colocación de brackets',
    descripcion: 'Colocación de brackets metálicos en arcada superior e inferior',
    costo: 500.00,
    observaciones: 'Primera etapa del tratamiento',
  };

  const response = await makeRequest('POST', `/tratamientos/${testData.tratamiento.id}/etapas`, etapaData);

  if (response.ok) {
    logSuccess(`Etapa creada: ${etapaData.nombre}`);
    testData.etapa = response.data;
    return true;
  } else {
    logError(`Error al crear etapa: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 11: Crear Factura
// ============================================
async function testCreateFactura() {
  logTest('Crear Factura');

  const facturaData = {
    pacienteId: testData.paciente.id,
    emitenteId: testData.admin.id,
    subtotal: 150.00,
    descuento: 0,
    impuesto: 22.50,
    total: 172.50,
    metodoPago: 'EFECTIVO',
    observaciones: 'Factura por servicios dentales',
    items: [
      {
        descripcion: 'Obturación de caries',
        cantidad: 1,
        precioUnitario: 150.00,
        subtotal: 150.00,
      },
    ],
  };

  const response = await makeRequest('POST', '/facturas', facturaData);

  if (response.ok) {
    logSuccess(`Factura creada: ${response.data.numero}`);
    testData.factura = response.data;
    return true;
  } else {
    logError(`Error al crear factura: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 12: Registrar Pago
// ============================================
async function testCreatePago() {
  logTest('Registrar Pago');

  const pagoData = {
    facturaId: testData.factura.id,
    monto: 172.50,
    metodoPago: 'EFECTIVO',
    referencia: 'PAGO-001',
    observaciones: 'Pago completo de factura',
  };

  const response = await makeRequest('POST', `/facturas/${testData.factura.id}/pagos`, pagoData);

  if (response.ok) {
    logSuccess(`Pago registrado: L. ${pagoData.monto}`);
    testData.pago = response.data;
    return true;
  } else {
    logError(`Error al registrar pago: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 13: Crear Producto/Servicio
// ============================================
async function testCreateProducto() {
  logTest('Crear Producto/Servicio');

  const productoData = {
    codigo: `PROD-${Date.now()}`,
    nombre: 'Resina Compuesta A2',
    descripcion: 'Resina compuesta de alta calidad para obturaciones',
    tipo: 'PRODUCTO',
    precio: 45.00,
    isv: 15,
  };

  const response = await makeRequest('POST', '/productos', productoData);

  if (response.ok) {
    logSuccess(`Producto creado: ${productoData.nombre}`);
    testData.producto = response.data;
    return true;
  } else {
    logError(`Error al crear producto: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 14: Crear Inventario
// ============================================
async function testCreateInventario() {
  logTest('Crear Inventario');

  const inventarioData = {
    codigo: `INV-${Date.now()}`,
    nombre: 'Guantes de Nitrilo Talla M',
    descripcion: 'Guantes de nitrilo sin polvo, caja de 100 unidades',
    categoria: 'CONSUMIBLE',
    unidadMedida: 'Caja',
    stock: 50,
    stockMinimo: 10,
    precioCompra: 25.00,
    precioVenta: 35.00,
    proveedor: 'Distribuidora Dental S.A.',
  };

  const response = await makeRequest('POST', '/inventario', inventarioData);

  if (response.ok) {
    logSuccess(`Inventario creado: ${inventarioData.nombre}`);
    testData.inventario = response.data;
    return true;
  } else {
    logError(`Error al crear inventario: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 15: Registrar Movimiento de Inventario
// ============================================
async function testCreateMovimientoInventario() {
  logTest('Registrar Movimiento de Inventario');

  const movimientoData = {
    inventarioId: testData.inventario.id,
    tipo: 'SALIDA',
    cantidad: 5,
    motivo: 'Uso en procedimientos',
    responsable: testData.odontologo.nombre,
  };

  const response = await makeRequest('POST', '/inventario/movimientos', movimientoData);

  if (response.ok) {
    logSuccess(`Movimiento registrado: ${movimientoData.tipo} de ${movimientoData.cantidad} unidades`);
    testData.movimiento = response.data;
    return true;
  } else {
    logError(`Error al registrar movimiento: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 16: Obtener Estadísticas
// ============================================
async function testGetEstadisticas() {
  logTest('Obtener Estadísticas');

  const mes = new Date().getMonth() + 1;
  const anio = new Date().getFullYear();

  const response = await makeRequest(
    'GET',
    `/contabilidad/estadisticas?odontologoId=${testData.odontologo.id}&mes=${mes}&anio=${anio}`
  );

  if (response.ok) {
    logSuccess(`Estadísticas obtenidas para ${mes}/${anio}`);
    logSuccess(`Citas completadas: ${response.data.citasCompletadas}`);
    logSuccess(`Ingresos: L. ${response.data.ingresos}`);
    return true;
  } else {
    logWarning(`Error al obtener estadísticas: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 17: Obtener Flujo de Caja
// ============================================
async function testGetFlujoCaja() {
  logTest('Obtener Flujo de Caja');

  const response = await makeRequest('GET', '/contabilidad/flujo?limit=10');

  if (response.ok) {
    logSuccess(`Flujo de caja obtenido`);
    logSuccess(`Registros: ${response.data.length}`);
    if (response.data.length > 0) {
      logSuccess(`Saldo actual: L. ${response.data[0].saldoActual}`);
    }
    return true;
  } else {
    logWarning(`Error al obtener flujo de caja: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 18: Validar Conflictos de Horario
// ============================================
async function testConflictoCitas() {
  logTest('Validar Conflictos de Horario');

  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 2);
  const fechaStr = fecha.toISOString().split('T')[0];

  const citaConflicto = {
    pacienteId: testData.paciente.id,
    odontologoId: testData.odontologo.id,
    fecha: fechaStr,
    horaInicio: '09:00', // Mismo horario que la cita anterior
    horaFin: '09:30',
    duracion: 30,
    tipoCita: 'LIMPIEZA',
    motivo: 'Limpieza dental',
  };

  const response = await makeRequest('POST', '/citas', citaConflicto);

  if (!response.ok && response.data.error?.includes('conflicto')) {
    logSuccess(`Validación de conflicto funcionando correctamente`);
    return true;
  } else if (response.ok) {
    logWarning(`Se permitió crear cita en horario conflictivo`);
    testData.citaConflicto = response.data;
    return false;
  } else {
    logError(`Error inesperado: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 19: Actualizar Estado de Cita
// ============================================
async function testUpdateCita() {
  logTest('Actualizar Estado de Cita');

  const updateData = {
    estado: 'COMPLETADA',
    observaciones: 'Cita completada sin complicaciones',
  };

  const response = await makeRequest('PUT', `/citas/${testData.cita.id}`, updateData);

  if (response.ok) {
    logSuccess(`Estado de cita actualizado a: ${updateData.estado}`);
    return true;
  } else {
    logError(`Error al actualizar cita: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 20: Obtener Reportes
// ============================================
async function testGetReportes() {
  logTest('Obtener Reportes');

  const response = await makeRequest('GET', '/reportes?tipo=ingresos&mes=1&anio=2024');

  if (response.ok) {
    logSuccess(`Reporte obtenido`);
    return true;
  } else {
    logWarning(`Error al obtener reporte: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// EJECUTAR TODAS LAS PRUEBAS
// ============================================
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   PRUEBAS EXHAUSTIVAS DEL SISTEMA DE GESTIÓN DENTAL        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const tests = [
    { name: 'Crear Usuario Administrador', fn: testCreateAdmin },
    { name: 'Crear Usuario Odontólogo', fn: testCreateOdontologo },
    { name: 'Login', fn: testLogin },
    { name: 'Crear Paciente', fn: testCreatePaciente },
    { name: 'Obtener Disponibilidad de Citas', fn: testGetDisponibilidad },
    { name: 'Agendar Cita', fn: testCreateCita },
    { name: 'Crear Expediente Clínico', fn: testCreateExpediente },
    { name: 'Crear Procedimiento', fn: testCreateProcedimiento },
    { name: 'Crear Tratamiento', fn: testCreateTratamiento },
    { name: 'Crear Etapa de Tratamiento', fn: testCreateEtapaTratamiento },
    { name: 'Crear Factura', fn: testCreateFactura },
    { name: 'Registrar Pago', fn: testCreatePago },
    { name: 'Crear Producto/Servicio', fn: testCreateProducto },
    { name: 'Crear Inventario', fn: testCreateInventario },
    { name: 'Registrar Movimiento de Inventario', fn: testCreateMovimientoInventario },
    { name: 'Obtener Estadísticas', fn: testGetEstadisticas },
    { name: 'Obtener Flujo de Caja', fn: testGetFlujoCaja },
    { name: 'Validar Conflictos de Horario', fn: testConflictoCitas },
    { name: 'Actualizar Estado de Cita', fn: testUpdateCita },
    { name: 'Obtener Reportes', fn: testGetReportes },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error: any) {
      logError(`Excepción en ${test.name}: ${error.message}`);
      failed++;
    }
  }

  // Resumen
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    RESUMEN DE PRUEBAS                      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`Total de pruebas: ${tests.length}`, 'blue');
  log(`Exitosas: ${passed}`, 'green');
  log(`Fallidas: ${failed}`, 'red');
  log(`Tasa de éxito: ${((passed / tests.length) * 100).toFixed(2)}%`, 'yellow');

  log('\n📊 Datos de prueba generados:', 'cyan');
  log(JSON.stringify(testData, null, 2), 'yellow');
}

// Ejecutar
runAllTests().catch(console.error);
