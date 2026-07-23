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
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  FilePlus,
  Lock,
  ScrollText,
  Wallet,
  ClipboardList,
  Banknote,
  ShoppingCart
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { permisosEfectivos } from '@/lib/modulos'

interface MenuItem {
  name: string
  href: string
  icon: any
  /** Key del módulo en lib/modulos.ts. Sin key, el ítem se ve siempre. */
  modulo?: string
  children?: { name: string; href: string; icon: any }[]
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/dashboard/pacientes', icon: Users, modulo: 'pacientes' },
  { name: 'Odontólogos', href: '/dashboard/odontologos', icon: Stethoscope, modulo: 'odontologos' },
  { name: 'Agenda y Citas', href: '/dashboard/citas', icon: Calendar, modulo: 'citas' },
  { name: 'Expedientes', href: '/dashboard/expedientes', icon: FileText, modulo: 'expedientes' },
  { name: 'Tratamientos', href: '/dashboard/tratamientos', icon: Heart, modulo: 'tratamientos' },
  { name: 'Cotizaciones', href: '/dashboard/presupuestos', icon: ClipboardList, modulo: 'presupuestos' },
  { name: 'Documentos', href: '/dashboard/documentos', icon: FilePlus, modulo: 'documentos' },
  { name: 'Facturación', href: '/dashboard/facturacion', icon: CreditCard, modulo: 'facturacion' },
  { name: 'Cuentas por Cobrar', href: '/dashboard/cuentas-por-cobrar', icon: Wallet, modulo: 'cuentas-por-cobrar' },
  { name: 'Productos/Servicios', href: '/dashboard/productos', icon: ShoppingBag, modulo: 'productos' },
  { name: 'Contabilidad', href: '/dashboard/contabilidad', icon: Calculator, modulo: 'contabilidad' },
  { name: 'Cierre de Caja', href: '/dashboard/cierre-caja', icon: Banknote, modulo: 'cierre-caja' },
  { name: 'Inventario', href: '/dashboard/inventario', icon: Package, modulo: 'inventario' },
  { name: 'Compras', href: '/dashboard/compras', icon: ShoppingCart, modulo: 'compras' },
  { name: 'Reportes', href: '/dashboard/reportes', icon: BarChart3, modulo: 'reportes' },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: UserCog, modulo: 'usuarios' },
  { name: 'Auditoría', href: '/dashboard/auditoria', icon: ScrollText, modulo: 'auditoria' },
  { name: 'Administración', href: '/dashboard/admin', icon: Lock, modulo: 'admin' },
  {
    name: 'Configuración',
    href: '/dashboard/configuracion',
    icon: Settings,
    modulo: 'configuracion',
    children: [
      { name: 'Empresa', href: '/dashboard/configuracion', icon: Settings },
      { name: 'Facturación SAR', href: '/dashboard/configuracion/facturacion', icon: ShieldCheck },
      { name: 'Orden de Pedido', href: '/dashboard/configuracion/orden-pedido', icon: FileText }
    ]
  },
]

export default function Sidebar({ userRole, permisos }: { userRole: string; permisos?: string[] }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>([])

  // El menú muestra solo los módulos habilitados para el usuario; el bloqueo
  // real de la URL lo hace middleware.ts.
  const habilitados = permisosEfectivos(userRole, permisos)
  const filteredItems = menuItems.filter(item => !item.modulo || habilitados.includes(item.modulo))

  const toggleSubmenu = (name: string) => {
    setExpanded(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    )
  }

  return (
    <aside data-sidebar className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-border flex flex-col z-20">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--accent))' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-foreground">Clínica</h2>
            <p className="text-xs text-muted-foreground">Odontológica</p>
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
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-muted' : 'text-sidebar-foreground hover:bg-muted'
                        }`}
                      style={isActive ? { color: 'rgb(var(--accent))' } : {}}
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
                      <ul className="mt-1 ml-4 space-y-1 border-l-2 border-border pl-2">
                        {item.children?.map(child => {
                          const ChildIcon = child.icon
                          const isChildActive = pathname === child.href
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isChildActive
                                  ? 'font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                  }`}
                                style={isChildActive ? { color: 'rgb(var(--accent))', backgroundColor: 'rgb(var(--accent) / 0.1)' } : {}}
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
                      ? 'text-white shadow-md'
                      : 'text-sidebar-foreground hover:bg-muted'
                      }`}
                    style={isActive ? { backgroundColor: 'rgb(var(--accent))' } : {}}
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
      <div className="p-4 border-t border-border">
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

