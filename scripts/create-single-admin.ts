import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Eliminando todos los usuarios existentes...')

  // Eliminar todos los usuarios
  await prisma.usuario.deleteMany()

  console.log('✅ Usuarios eliminados')

  // Crear un único usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@clinica.com',
      username: 'admin',
      password: adminPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      telefono: '555-0100',
      rol: 'ADMINISTRADOR',
    },
  })

  console.log('✅ Usuario administrador creado')
  console.log('\n📧 Credenciales de acceso:')
  console.log('Email: admin@clinica.com')
  console.log('Contraseña: admin123')
  console.log(`\n✨ Usuario ID: ${admin.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
