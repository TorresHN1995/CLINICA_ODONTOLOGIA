/**
 * Script de Pruebas Exhaustivas del Sistema de Gestión Dental
 * Simula flujos reales para detectar bugs y errores
 */

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testData = {};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`TEST: ${name}`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function makeRequest(method, endpoint, body = null, headers = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Agregar token si existe
    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

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
  } catch (error) {
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
// TEST 1: Login como Administrador
// ============================================
async function testLoginAdmin() {
  logTest('Login como Administrador');

  const loginData = {
    username: 'admin',
    password: 'Admin123!',
  };

  const response = await makeRequest('POST', '/auth/login', loginData);

  if (response.ok && response.data.user) {
    logSuccess(`Login exitoso para: ${loginData.username}`);
    testData.admin = response.data.user;
    return true;
  } else {
    logError(`Error en login: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 2: Obtener Odontólogo Existente
// ============================================
async function testGetOdontologo() {
  logTest('Obtener Odontólogo Existente');

  const response = await makeRequest('GET', '/usuarios?rol=ODONTOLOGO');

  if (response.ok && response.data.usuarios && response.data.usuarios.length > 0) {
    logSuccess(`Odontólogo obtenido: ${response.data.usuarios[0].nombre}`);
    testData.odontologo = response.data.usuarios[0];
    return true;
  } else {
    logError(`Error al obtener odontólogo: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 3: Crear Paciente
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
// TEST 4: Agendar Cita
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
// TEST 5: Crear Expediente Clínico
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
// TEST 6: Crear Procedimiento
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
// TEST 7: Crear Tratamiento
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
// TEST 8: Crear Factura
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
// TEST 9: Registrar Pago
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
// TEST 10: Crear Inventario
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
// TEST 11: Registrar Movimiento de Inventario
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
// TEST 12: Obtener Pacientes
// ============================================
async function testGetPacientes() {
  logTest('Obtener Listado de Pacientes');

  const response = await makeRequest('GET', '/pacientes?page=1&limit=10');

  if (response.ok) {
    logSuccess(`Pacientes obtenidos: ${response.data.length || response.data.data?.length || 0}`);
    return true;
  } else {
    logWarning(`Error al obtener pacientes: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 13: Obtener Citas
// ============================================
async function testGetCitas() {
  logTest('Obtener Listado de Citas');

  const response = await makeRequest('GET', '/citas?page=1&limit=10');

  if (response.ok) {
    logSuccess(`Citas obtenidas: ${response.data.length || response.data.data?.length || 0}`);
    return true;
  } else {
    logWarning(`Error al obtener citas: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 14: Obtener Facturas
// ============================================
async function testGetFacturas() {
  logTest('Obtener Listado de Facturas');

  const response = await makeRequest('GET', '/facturas?page=1&limit=10');

  if (response.ok) {
    logSuccess(`Facturas obtenidas: ${response.data.length || response.data.data?.length || 0}`);
    return true;
  } else {
    logWarning(`Error al obtener facturas: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 15: Obtener Inventario
// ============================================
async function testGetInventario() {
  logTest('Obtener Listado de Inventario');

  const response = await makeRequest('GET', '/inventario?page=1&limit=10');

  if (response.ok) {
    logSuccess(`Inventario obtenido: ${response.data.length || response.data.data?.length || 0}`);
    return true;
  } else {
    logWarning(`Error al obtener inventario: ${JSON.stringify(response.data)}`);
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
    { name: 'Login como Administrador', fn: testLoginAdmin },
    { name: 'Obtener Odontólogo Existente', fn: testGetOdontologo },
    { name: 'Crear Paciente', fn: testCreatePaciente },
    { name: 'Agendar Cita', fn: testCreateCita },
    { name: 'Crear Expediente Clínico', fn: testCreateExpediente },
    { name: 'Crear Procedimiento', fn: testCreateProcedimiento },
    { name: 'Crear Tratamiento', fn: testCreateTratamiento },
    { name: 'Crear Factura', fn: testCreateFactura },
    { name: 'Registrar Pago', fn: testCreatePago },
    { name: 'Crear Inventario', fn: testCreateInventario },
    { name: 'Registrar Movimiento de Inventario', fn: testCreateMovimientoInventario },
    { name: 'Obtener Listado de Pacientes', fn: testGetPacientes },
    { name: 'Obtener Listado de Citas', fn: testGetCitas },
    { name: 'Obtener Listado de Facturas', fn: testGetFacturas },
    { name: 'Obtener Listado de Inventario', fn: testGetInventario },
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
    } catch (error) {
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
  console.log(JSON.stringify(testData, null, 2));
}

// Ejecutar
runAllTests().catch(console.error);
