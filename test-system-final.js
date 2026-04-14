/**
 * Script de Pruebas Exhaustivas del Sistema de Gestión Dental
 * Versión final con manejo correcto de cookies
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

let cookies = {};
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

// Función para hacer requests HTTP
function makeHttpRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      // Construir cookie string
      let cookieString = '';
      for (const [key, value] of Object.entries(cookies)) {
        if (cookieString) cookieString += '; ';
        cookieString += `${key}=${value}`;
      }

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (cookieString) {
        options.headers['Cookie'] = cookieString;
      }

      const req = client.request(options, (res) => {
        let data = '';

        // Capturar cookies de respuesta
        const setCookieHeaders = res.headers['set-cookie'];
        if (setCookieHeaders) {
          const cookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
          cookieArray.forEach((cookie) => {
            const parts = cookie.split(';')[0].split('=');
            if (parts.length === 2) {
              cookies[parts[0].trim()] = parts[1].trim();
            }
          });
        }

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: jsonData,
              ok: res.statusCode >= 200 && res.statusCode < 300,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: { error: data },
              ok: res.statusCode >= 200 && res.statusCode < 300,
            });
          }
        });
      });

      req.on('error', (error) => {
        logError(`Error en request: ${error.message}`);
        resolve({
          status: 0,
          data: null,
          ok: false,
          error: error.message,
        });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    } catch (error) {
      logError(`Error: ${error.message}`);
      resolve({
        status: 0,
        data: null,
        ok: false,
        error: error.message,
      });
    }
  });
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

  const response = await makeHttpRequest(
    'POST',
    'http://localhost:3000/api/auth/signin',
    loginData
  );

  if (response.ok || response.status === 302) {
    logSuccess(`Login exitoso para: ${loginData.username}`);
    logSuccess(`Cookies capturadas: ${Object.keys(cookies).join(', ')}`);
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

  const response = await makeHttpRequest(
    'GET',
    'http://localhost:3000/api/usuarios?rol=ODONTOLOGO'
  );

  if (response.ok && response.data.length > 0) {
    logSuccess(`Odontólogo obtenido: ${response.data[0].nombre}`);
    testData.odontologo = response.data[0];
    return true;
  } else if (response.ok && response.data.data && response.data.data.length > 0) {
    logSuccess(`Odontólogo obtenido: ${response.data.data[0].nombre}`);
    testData.odontologo = response.data.data[0];
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
  };

  const response = await makeHttpRequest(
    'POST',
    'http://localhost:3000/api/pacientes',
    pacienteData
  );

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

  if (!testData.paciente || !testData.odontologo) {
    logWarning('Saltando: Paciente u odontólogo no disponible');
    return false;
  }

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

  const response = await makeHttpRequest(
    'POST',
    'http://localhost:3000/api/citas',
    citaData
  );

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

  if (!testData.paciente) {
    logWarning('Saltando: Paciente no disponible');
    return false;
  }

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

  const response = await makeHttpRequest(
    'POST',
    'http://localhost:3000/api/expedientes',
    expedienteData
  );

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
// TEST 6: Crear Tratamiento
// ============================================
async function testCreateTratamiento() {
  logTest('Crear Tratamiento');

  if (!testData.paciente) {
    logWarning('Saltando: Paciente no disponible');
    return false;
  }

  const tratamientoData = {
    pacienteId: testData.paciente.id,
    nombre: 'Tratamiento de Ortodoncia',
    descripcion: 'Corrección de maloclusión con brackets metálicos',
    estado: 'PLANIFICADO',
    costoTotal: 2500.00,
    observaciones: 'Tratamiento de 24 meses',
  };

  const response = await makeHttpRequest(
    'POST',
    'http://localhost:3000/api/tratamientos',
    tratamientoData
  );

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
// TEST 7: Crear Factura
// ============================================
async function testCreateFactura() {
  logTest('Crear Factura');

  if (!testData.paciente) {
    logWarning('Saltando: Paciente no disponible');
    return false;
  }

  const facturaData = {
    pacienteId: testData.paciente.id,
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

  const response = await makeHttpRequest(
    'POST',
    'http://localhost:3000/api/facturas',
    facturaData
  );

  if (response.ok) {
    logSuccess(`Factura creada: ${response.data.numero || response.data.id}`);
    testData.factura = response.data;
    return true;
  } else {
    logError(`Error al crear factura: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 8: Obtener Pacientes
// ============================================
async function testGetPacientes() {
  logTest('Obtener Listado de Pacientes');

  const response = await makeHttpRequest(
    'GET',
    'http://localhost:3000/api/pacientes?page=1&limit=10'
  );

  if (response.ok) {
    const count = response.data.length || response.data.pacientes?.length || 0;
    logSuccess(`Pacientes obtenidos: ${count}`);
    return true;
  } else {
    logWarning(`Error al obtener pacientes: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 9: Obtener Citas
// ============================================
async function testGetCitas() {
  logTest('Obtener Listado de Citas');

  const response = await makeHttpRequest(
    'GET',
    'http://localhost:3000/api/citas?page=1&limit=10'
  );

  if (response.ok) {
    const count = response.data.length || response.data.citas?.length || 0;
    logSuccess(`Citas obtenidas: ${count}`);
    return true;
  } else {
    logWarning(`Error al obtener citas: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 10: Obtener Facturas
// ============================================
async function testGetFacturas() {
  logTest('Obtener Listado de Facturas');

  const response = await makeHttpRequest(
    'GET',
    'http://localhost:3000/api/facturas?page=1&limit=10'
  );

  if (response.ok) {
    const count = response.data.length || response.data.facturas?.length || 0;
    logSuccess(`Facturas obtenidas: ${count}`);
    return true;
  } else {
    logWarning(`Error al obtener facturas: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================
// TEST 11: Obtener Inventario
// ============================================
async function testGetInventario() {
  logTest('Obtener Listado de Inventario');

  const response = await makeHttpRequest(
    'GET',
    'http://localhost:3000/api/inventario?page=1&limit=10'
  );

  if (response.ok) {
    const count = response.data.length || response.data.inventario?.length || 0;
    logSuccess(`Inventario obtenido: ${count}`);
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
  log('║              (Versión Final - Con Cookies)                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const tests = [
    { name: 'Login como Administrador', fn: testLoginAdmin },
    { name: 'Obtener Odontólogo Existente', fn: testGetOdontologo },
    { name: 'Crear Paciente', fn: testCreatePaciente },
    { name: 'Agendar Cita', fn: testCreateCita },
    { name: 'Crear Expediente Clínico', fn: testCreateExpediente },
    { name: 'Crear Tratamiento', fn: testCreateTratamiento },
    { name: 'Crear Factura', fn: testCreateFactura },
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
