import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { ConfiguracionProvider } from '@/components/providers/ConfiguracionProvider'
import { CustomizationPanel } from '@/components/ui/CustomizationPanel'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <ConfiguracionProvider>
      <div className="min-h-screen bg-background">
        <Sidebar userRole={session.user.role} />
        <Header />
        <main className="ml-64 pt-16">
          <div className="p-6">
            {children}
          </div>
        </main>
        <CustomizationPanel />
      </div>
    </ConfiguracionProvider>
  )
}

