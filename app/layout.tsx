import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Gestión - Clínica Odontológica',
  description: 'Sistema completo de gestión para clínica odontológica',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}

