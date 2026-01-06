'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Heart,
  CreditCard,
  Package,
  BarChart3,
  UserCog,
  Calculator,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface MenuItem {
  name: string
  href: string
  icon: any
  roles?: string[]
  children?: { name: string; href: string; icon: any }[]
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/dashboard/pacientes', icon: Users },
  { name: 'Agenda y Citas', href: '/dashboard/citas', icon: Calendar },
  { name: 'Expedientes', href: '/dashboard/expedientes', icon: FileText },
  { name: 'Tratamientos', href: '/dashboard/tratamientos', icon: Heart },
  { name: 'Facturación', href: '/dashboard/facturacion', icon: CreditCard },
  { name: 'Contabilidad', href: '/dashboard/contabilidad', icon: Calculator },
  { name: 'Inventario', href: '/dashboard/inventario', icon: Package },
  { name: 'Reportes', href: '/dashboard/reportes', icon: BarChart3 },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: UserCog, roles: ['ADMINISTRADOR'] },
  {
    name: 'Configuración',
    href: '/dashboard/configuracion',
    icon: Settings,
    roles: ['ADMINISTRADOR'],
    children: [
      { name: 'Empresa', href: '/dashboard/configuracion', icon: Settings },
      { name: 'Facturación SAR', href: '/dashboard/configuracion/facturacion', icon: ShieldCheck }
    ]
  },
]

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>([])

  const filteredItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(userRole)
  )

  const toggleSubmenu = (name: string) => {
    setExpanded(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-20">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Clínica</h2>
            <p className="text-xs text-gray-600">Odontológica</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expanded.includes(item.name) || isActive

            return (
              <li key={item.name}>
                {hasChildren ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-gray-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 pl-2">
                        {item.children?.map(child => {
                          const ChildIcon = child.icon
                          const isChildActive = pathname === child.href
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isChildActive
                                  ? 'text-primary-600 font-medium bg-primary-50'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                  }`}
                              >
                                <ChildIcon className="w-4 h-4" />
                                <span>{child.name}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}

