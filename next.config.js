/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Las imágenes se almacenan localmente y se sirven con rutas relativas (/uploads/...),
    // por lo que no se requiere permitir hosts remotos arbitrarios. Si en el futuro se
    // cargan imágenes desde un CDN/almacenamiento externo, añadir aquí su hostname específico.
    domains: ['localhost'],
  },
  experimental: {
    // Habilita instrumentation.ts (fija la zona horaria del servidor a Honduras)
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig

