-- CreateTable
CREATE TABLE `notas_evolucion` (
    `id` VARCHAR(191) NOT NULL,
    `expedienteId` VARCHAR(191) NOT NULL,
    `odontologoId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motivo` TEXT NULL,
    `hallazgos` TEXT NULL,
    `procedimiento` TEXT NULL,
    `indicaciones` TEXT NULL,
    `piezas` VARCHAR(191) NULL,
    `proximaCita` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notas_evolucion_expedienteId_idx`(`expedienteId`),
    INDEX `notas_evolucion_odontologoId_idx`(`odontologoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notas_evolucion` ADD CONSTRAINT `notas_evolucion_expedienteId_fkey` FOREIGN KEY (`expedienteId`) REFERENCES `expedientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notas_evolucion` ADD CONSTRAINT `notas_evolucion_odontologoId_fkey` FOREIGN KEY (`odontologoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
