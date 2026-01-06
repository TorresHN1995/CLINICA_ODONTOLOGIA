import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creando usuario administrador...')

  // Verificar si ya existe un admin
  const adminExistente = await prisma.usuario.findFirst({
    where: {
      OR: [
        { email: 'admin@clinica.com' },
        { username: 'admin' },
        { rol: 'ADMINISTRADOR' }
      ]
    }
  })

  if (adminExistente) {
    console.log('⚠️  Ya existe un usuario administrador')
    console.log(`   Email: ${adminExistente.email}`)
    console.log(`   Username: ${adminExistente.username}`)
    return
  }

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@clinica.com',
      username: 'admin',
      password: adminPassword,
      nombre: 'Admin',
      apellido: 'Sistema',
      telefono: '555-0100',
      rol: 'ADMINISTRADOR',
    },
  })

  console.log('✅ Usuario administrador creado exitosamente!')
  console.log('')
  console.log('📋 Credenciales de acceso:')
  console.log('   Username: admin')
  console.log('   Contraseña: admin123')
  console.log('   Email: admin@clinica.com')
  console.log('')
  console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

