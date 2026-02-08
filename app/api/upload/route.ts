import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se subió ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de archivo no permitido. Use: JPG, PNG, WEBP, GIF o PDF',
        },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El archivo excede el tamaño máximo de 5MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Nombre único seguro
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const filename = `upload-${uniqueSuffix}.${ext}`

    // Asegurar que el directorio existe
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filePath = join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const url = `/uploads/${filename}`
    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('Error al subir archivo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al subir archivo' },
      { status: 500 }
    )
  }
}
