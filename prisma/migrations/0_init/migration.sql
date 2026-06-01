-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `rol` ENUM('ADMINISTRADOR', 'ODONTOLOGO', 'ASISTENTE', 'RECEPCION') NOT NULL DEFAULT 'RECEPCION',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    UNIQUE INDEX `usuarios_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacientes` (
    `id` VARCHAR(191) NOT NULL,
    `identificacion` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `fechaNacimiento` DATETIME(3) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `celular` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `ciudad` VARCHAR(191) NULL,
    `ocupacion` VARCHAR(191) NULL,
    `contactoEmergencia` VARCHAR(191) NULL,
    `telefonoEmergencia` VARCHAR(191) NULL,
    `alergias` TEXT NULL,
    `medicamentos` TEXT NULL,
    `enfermedades` TEXT NULL,
    `observaciones` TEXT NULL,
    `consentimiento` BOOLEAN NOT NULL DEFAULT false,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pacientes_identificacion_key`(`identificacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citas` (
    `id` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `odontologoId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `horaInicio` VARCHAR(191) NOT NULL,
    `horaFin` VARCHAR(191) NOT NULL,
    `duracion` INTEGER NOT NULL,
    `tipoCita` ENUM('CONSULTA', 'LIMPIEZA', 'EXTRACCION', 'ENDODONCIA', 'ORTODONCIA', 'PROTESIS', 'CIRUGIA', 'CONTROL', 'EMERGENCIA', 'OTRO') NOT NULL,
    `estado` ENUM('PROGRAMADA', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO') NOT NULL DEFAULT 'PROGRAMADA',
    `motivo` TEXT NULL,
    `observaciones` TEXT NULL,
    `recordatorio` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `citas_pacienteId_idx`(`pacienteId`),
    INDEX `citas_odontologoId_idx`(`odontologoId`),
    INDEX `citas_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expedientes` (
    `id` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diagnostico` TEXT NOT NULL,
    `tratamiento` TEXT NOT NULL,
    `evolucion` TEXT NULL,
    `proximaCita` DATETIME(3) NULL,
    `odontograma` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expedientes_pacienteId_idx`(`pacienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procedimientos` (
    `id` VARCHAR(191) NOT NULL,
    `expedienteId` VARCHAR(191) NOT NULL,
    `odontologoId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `diente` VARCHAR(191) NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `duracion` INTEGER NULL,
    `materiales` TEXT NULL,
    `observaciones` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `procedimientos_expedienteId_idx`(`expedienteId`),
    INDEX `procedimientos_odontologoId_idx`(`odontologoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tratamientos` (
    `id` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `estado` ENUM('PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'PLANIFICADO',
    `fechaInicio` DATETIME(3) NULL,
    `fechaFin` DATETIME(3) NULL,
    `costoTotal` DECIMAL(10, 2) NOT NULL,
    `observaciones` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tratamientos_pacienteId_idx`(`pacienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etapas_tratamiento` (
    `id` VARCHAR(191) NOT NULL,
    `tratamientoId` VARCHAR(191) NOT NULL,
    `orden` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `costo` DECIMAL(10, 2) NOT NULL,
    `completada` BOOLEAN NOT NULL DEFAULT false,
    `fechaCompletada` DATETIME(3) NULL,
    `observaciones` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `etapas_tratamiento_tratamientoId_idx`(`tratamientoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `emitenteId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `impuesto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `estado` ENUM('PENDIENTE', 'PAGADA_PARCIAL', 'PAGADA', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE',
    `metodoPago` ENUM('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO') NULL,
    `observaciones` TEXT NULL,
    `enviada` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cai` VARCHAR(191) NULL,
    `tipoDocumento` ENUM('FACTURA', 'ORDEN_PEDIDO') NOT NULL DEFAULT 'FACTURA',
    `correlativoId` VARCHAR(191) NULL,

    UNIQUE INDEX `facturas_numero_key`(`numero`),
    INDEX `facturas_pacienteId_idx`(`pacienteId`),
    INDEX `facturas_numero_idx`(`numero`),
    INDEX `facturas_correlativoId_idx`(`correlativoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `correlativos` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('FACTURA', 'ORDEN_PEDIDO') NOT NULL,
    `cai` VARCHAR(191) NULL,
    `sucursal` VARCHAR(191) NOT NULL,
    `puntoEmision` VARCHAR(191) NOT NULL,
    `tipoDoc` VARCHAR(191) NOT NULL,
    `rangoInicial` INTEGER NOT NULL,
    `rangoFinal` INTEGER NOT NULL,
    `siguiente` INTEGER NOT NULL,
    `fechaLimite` DATETIME(3) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items_factura` (
    `id` VARCHAR(191) NOT NULL,
    `facturaId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precioUnitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `tasaIsv` DECIMAL(5, 2) NOT NULL DEFAULT 15,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `items_factura_facturaId_idx`(`facturaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` VARCHAR(191) NOT NULL,
    `facturaId` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `metodoPago` ENUM('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO') NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `referencia` VARCHAR(191) NULL,
    `observaciones` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagos_facturaId_idx`(`facturaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventario` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `categoria` ENUM('MATERIAL_DENTAL', 'INSTRUMENTAL', 'MEDICAMENTO', 'CONSUMIBLE', 'EQUIPAMIENTO', 'OTRO') NOT NULL,
    `unidadMedida` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `stockMinimo` INTEGER NOT NULL DEFAULT 10,
    `precioCompra` DECIMAL(10, 2) NOT NULL,
    `precioVenta` DECIMAL(10, 2) NULL,
    `proveedor` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventario_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_inventario` (
    `id` VARCHAR(191) NOT NULL,
    `inventarioId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `responsable` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `movimientos_inventario_inventarioId_idx`(`inventarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentos` (
    `id` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` ENUM('RADIOGRAFIA', 'FOTOGRAFIA', 'CONSENTIMIENTO', 'RECETA', 'ORDEN_LABORATORIO', 'OTRO') NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `tamanio` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documentos_pacienteId_idx`(`pacienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imagenes_clinicas` (
    `id` VARCHAR(191) NOT NULL,
    `expedienteId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `url` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `tamanio` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `imagenes_clinicas_expedienteId_idx`(`expedienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estadisticas_odontologo` (
    `id` VARCHAR(191) NOT NULL,
    `odontologoId` VARCHAR(191) NOT NULL,
    `mes` INTEGER NOT NULL,
    `anio` INTEGER NOT NULL,
    `pacientesAtendidos` INTEGER NOT NULL DEFAULT 0,
    `citasCompletadas` INTEGER NOT NULL DEFAULT 0,
    `citasCanceladas` INTEGER NOT NULL DEFAULT 0,
    `ingresos` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `estadisticas_odontologo_odontologoId_idx`(`odontologoId`),
    UNIQUE INDEX `estadisticas_odontologo_odontologoId_mes_anio_key`(`odontologoId`, `mes`, `anio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingresos` (
    `id` VARCHAR(191) NOT NULL,
    `facturaId` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `categoria` ENUM('CONSULTA', 'LIMPIEZA', 'EXTRACCION', 'ENDODONCIA', 'ORTODONCIA', 'PROTESIS', 'CIRUGIA', 'CONTROL', 'EMERGENCIA', 'MATERIALES', 'OTROS_SERVICIOS') NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metodoPago` ENUM('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO') NOT NULL,
    `estado` ENUM('REGISTRADO', 'CONFIRMADO', 'CONTABILIZADO') NOT NULL DEFAULT 'REGISTRADO',
    `observaciones` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ingresos_facturaId_key`(`facturaId`),
    INDEX `ingresos_fecha_idx`(`fecha`),
    INDEX `ingresos_categoria_idx`(`categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `egresos` (
    `id` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `categoria` ENUM('MATERIALES_DENTALES', 'INSTRUMENTAL', 'MEDICAMENTOS', 'EQUIPAMIENTO', 'SERVICIOS_PUBLICOS', 'ALQUILER', 'SALARIOS', 'SEGUROS', 'MANTENIMIENTO', 'MARKETING', 'CAPACITACION', 'OTROS_GASTOS') NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metodoPago` ENUM('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO') NOT NULL,
    `proveedor` VARCHAR(191) NULL,
    `numeroFactura` VARCHAR(191) NULL,
    `estado` ENUM('PENDIENTE', 'APROBADO', 'PAGADO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    `observaciones` TEXT NULL,
    `registradoPor` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `egresos_fecha_idx`(`fecha`),
    INDEX `egresos_categoria_idx`(`categoria`),
    INDEX `egresos_registradoPor_idx`(`registradoPor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flujo_caja` (
    `id` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` ENUM('INGRESO', 'EGRESO', 'AJUSTE') NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `saldoAnterior` DECIMAL(10, 2) NOT NULL,
    `saldoActual` DECIMAL(10, 2) NOT NULL,
    `referencia` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `flujo_caja_fecha_idx`(`fecha`),
    INDEX `flujo_caja_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos_servicios` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `tipo` ENUM('PRODUCTO', 'SERVICIO') NOT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `isv` DECIMAL(5, 2) NOT NULL DEFAULT 15,
    `inventarioId` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `productos_servicios_codigo_key`(`codigo`),
    INDEX `productos_servicios_tipo_idx`(`tipo`),
    INDEX `productos_servicios_nombre_idx`(`nombre`),
    INDEX `productos_servicios_inventarioId_idx`(`inventarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicio_insumos` (
    `id` VARCHAR(191) NOT NULL,
    `servicioId` VARCHAR(191) NOT NULL,
    `inventarioId` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `servicio_insumos_servicioId_idx`(`servicioId`),
    INDEX `servicio_insumos_inventarioId_idx`(`inventarioId`),
    UNIQUE INDEX `servicio_insumos_servicioId_inventarioId_key`(`servicioId`, `inventarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `rtn` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `ciudad` VARCHAR(191) NULL,
    `pais` VARCHAR(191) NOT NULL DEFAULT 'Honduras',
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'HNL',
    `simboloMoneda` VARCHAR(191) NOT NULL DEFAULT 'L.',
    `formatoFecha` VARCHAR(191) NOT NULL DEFAULT 'DD/MM/YYYY',
    `logo` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configuracion_empresa_nombre_key`(`nombre`),
    UNIQUE INDEX `configuracion_empresa_rtn_key`(`rtn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accion` ENUM('CREAR', 'ACTUALIZAR', 'ANULAR', 'ELIMINAR', 'EXPORTAR', 'LIMPIAR', 'OTRO') NOT NULL,
    `entidad` VARCHAR(191) NOT NULL,
    `entidadId` VARCHAR(191) NULL,
    `descripcion` TEXT NOT NULL,
    `datos` JSON NULL,
    `usuarioId` VARCHAR(191) NULL,
    `usuarioNombre` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auditoria_fecha_idx`(`fecha`),
    INDEX `auditoria_entidad_idx`(`entidad`),
    INDEX `auditoria_entidadId_idx`(`entidadId`),
    INDEX `auditoria_usuarioId_idx`(`usuarioId`),
    INDEX `auditoria_accion_idx`(`accion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presupuestos` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `creadoPorNombre` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validoHasta` DATETIME(3) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `impuesto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `estado` ENUM('PROPUESTO', 'APROBADO', 'RECHAZADO', 'FACTURADO', 'VENCIDO') NOT NULL DEFAULT 'PROPUESTO',
    `observaciones` TEXT NULL,
    `facturaId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `presupuestos_numero_key`(`numero`),
    INDEX `presupuestos_pacienteId_idx`(`pacienteId`),
    INDEX `presupuestos_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items_presupuesto` (
    `id` VARCHAR(191) NOT NULL,
    `presupuestoId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precioUnitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `tasaIsv` DECIMAL(5, 2) NOT NULL DEFAULT 15,
    `productoId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `items_presupuesto_presupuestoId_idx`(`presupuestoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cierres_caja` (
    `id` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `usuarioId` VARCHAR(191) NULL,
    `usuarioNombre` VARCHAR(191) NULL,
    `fondoInicial` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalIngresos` DECIMAL(10, 2) NOT NULL,
    `totalEfectivo` DECIMAL(10, 2) NOT NULL,
    `totalEgresos` DECIMAL(10, 2) NOT NULL,
    `egresosEfectivo` DECIMAL(10, 2) NOT NULL,
    `efectivoEsperado` DECIMAL(10, 2) NOT NULL,
    `efectivoContado` DECIMAL(10, 2) NOT NULL,
    `diferencia` DECIMAL(10, 2) NOT NULL,
    `desglosePorMetodo` JSON NULL,
    `observaciones` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cierres_caja_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_odontologoId_fkey` FOREIGN KEY (`odontologoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedientes` ADD CONSTRAINT `expedientes_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procedimientos` ADD CONSTRAINT `procedimientos_expedienteId_fkey` FOREIGN KEY (`expedienteId`) REFERENCES `expedientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procedimientos` ADD CONSTRAINT `procedimientos_odontologoId_fkey` FOREIGN KEY (`odontologoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tratamientos` ADD CONSTRAINT `tratamientos_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etapas_tratamiento` ADD CONSTRAINT `etapas_tratamiento_tratamientoId_fkey` FOREIGN KEY (`tratamientoId`) REFERENCES `tratamientos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_emitenteId_fkey` FOREIGN KEY (`emitenteId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_correlativoId_fkey` FOREIGN KEY (`correlativoId`) REFERENCES `correlativos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items_factura` ADD CONSTRAINT `items_factura_facturaId_fkey` FOREIGN KEY (`facturaId`) REFERENCES `facturas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_facturaId_fkey` FOREIGN KEY (`facturaId`) REFERENCES `facturas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_inventarioId_fkey` FOREIGN KEY (`inventarioId`) REFERENCES `inventario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos` ADD CONSTRAINT `documentos_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imagenes_clinicas` ADD CONSTRAINT `imagenes_clinicas_expedienteId_fkey` FOREIGN KEY (`expedienteId`) REFERENCES `expedientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estadisticas_odontologo` ADD CONSTRAINT `estadisticas_odontologo_odontologoId_fkey` FOREIGN KEY (`odontologoId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingresos` ADD CONSTRAINT `ingresos_facturaId_fkey` FOREIGN KEY (`facturaId`) REFERENCES `facturas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresos` ADD CONSTRAINT `egresos_registradoPor_fkey` FOREIGN KEY (`registradoPor`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos_servicios` ADD CONSTRAINT `productos_servicios_inventarioId_fkey` FOREIGN KEY (`inventarioId`) REFERENCES `inventario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicio_insumos` ADD CONSTRAINT `servicio_insumos_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `productos_servicios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicio_insumos` ADD CONSTRAINT `servicio_insumos_inventarioId_fkey` FOREIGN KEY (`inventarioId`) REFERENCES `inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presupuestos` ADD CONSTRAINT `presupuestos_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items_presupuesto` ADD CONSTRAINT `items_presupuesto_presupuestoId_fkey` FOREIGN KEY (`presupuestoId`) REFERENCES `presupuestos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

