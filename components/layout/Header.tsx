'use client'

import { Bell, Search, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-card border-b border-border h-16 fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Búsqueda */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar pacientes, citas..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notificaciones */}
          <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Usuario */}
          <div className="flex items-center space-x-3 pl-4 border-l border-border">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--accent))' }}>
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

