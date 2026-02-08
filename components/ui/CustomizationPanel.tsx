'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Settings, X, Check, Sun, Moon, Monitor } from 'lucide-react'

const ACCENT_COLORS = [
  { name: 'Azul', value: '2 132 199', light: '56 189 248', hover: '3 105 161', hex: '#0284c7' },
  { name: 'Cian', value: '6 182 212', light: '103 232 249', hover: '8 145 178', hex: '#06b6d4' },
  { name: 'Violeta', value: '139 92 246', light: '167 139 250', hover: '124 58 237', hex: '#8b5cf6' },
  { name: 'Naranja', value: '249 115 22', light: '251 146 60', hover: '234 88 12', hex: '#f97316' },
  { name: 'Rosa', value: '236 72 153', light: '244 114 182', hover: '219 39 119', hex: '#ec4899' },
  { name: 'Verde', value: '16 185 129', light: '52 211 153', hover: '5 150 105', hex: '#10b981' },
  { name: 'Rojo', value: '239 68 68', light: '248 113 113', hover: '220 38 38', hex: '#ef4444' },
  { name: 'Índigo', value: '99 102 241', light: '129 140 248', hover: '79 70 229', hex: '#6366f1' },
]

type SidebarTheme = 'auto' | 'light' | 'dark'

export function CustomizationPanel() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [accentIndex, setAccentIndex] = useState(0)
  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>('auto')

  // Apply accent color to CSS variables
  const applyAccent = useCallback((index: number) => {
    const color = ACCENT_COLORS[index]
    if (!color) return
    const root = document.documentElement
    root.style.setProperty('--accent', color.value)
    root.style.setProperty('--accent-light', color.light)
    root.style.setProperty('--accent-hover', color.hover)
  }, [])

  // Apply sidebar theme class
  const applySidebarTheme = useCallback((st: SidebarTheme, currentTheme?: string) => {
    const sidebar = document.querySelector('[data-sidebar]')
    if (!sidebar) return
    sidebar.classList.remove('sidebar-light', 'sidebar-dark')
    if (st === 'light') sidebar.classList.add('sidebar-light')
    else if (st === 'dark') sidebar.classList.add('sidebar-dark')
    // 'auto' = no override class, follows system/theme
  }, [])

  // Load saved preferences on mount
  useEffect(() => {
    setMounted(true)
    const savedAccent = localStorage.getItem('accent-color-index')
    const savedSidebar = localStorage.getItem('sidebar-theme') as SidebarTheme | null

    if (savedAccent !== null) {
      const idx = parseInt(savedAccent, 10)
      setAccentIndex(idx)
      applyAccent(idx)
    }
    if (savedSidebar) {
      setSidebarTheme(savedSidebar)
    }
  }, [applyAccent])

  // Re-apply sidebar theme when theme changes or on mount
  useEffect(() => {
    if (!mounted) return
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => applySidebarTheme(sidebarTheme, theme), 100)
    return () => clearTimeout(timer)
  }, [mounted, sidebarTheme, theme, applySidebarTheme])

  const handleAccentChange = (index: number) => {
    setAccentIndex(index)
    applyAccent(index)
    localStorage.setItem('accent-color-index', String(index))
  }

  const handleSidebarTheme = (st: SidebarTheme) => {
    setSidebarTheme(st)
    applySidebarTheme(st, theme)
    localStorage.setItem('sidebar-theme', st)
  }

  if (!mounted) return null

  return (
    <>
      {/* Floating gear button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: `rgb(${ACCENT_COLORS[accentIndex].value})` }}
        aria-label="Personalización"
      >
        <Settings className="w-5 h-5 text-white animate-spin-slow" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Personalización</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-8 overflow-y-auto h-[calc(100%-65px)]">
          {/* MODO DEL SISTEMA */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Modo del Sistema
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  theme === 'light'
                    ? 'border-current text-white'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
                style={theme === 'light' ? { backgroundColor: `rgb(${ACCENT_COLORS[accentIndex].value})` } : {}}
              >
                <Sun className="w-4 h-4" />
                Claro
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  theme === 'dark'
                    ? 'border-current text-white'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
                style={theme === 'dark' ? { backgroundColor: `rgb(${ACCENT_COLORS[accentIndex].value})` } : {}}
              >
                <Moon className="w-4 h-4" />
                Oscuro
              </button>
            </div>
          </section>

          {/* COLOR DE ACENTO */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Color de Acento
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {ACCENT_COLORS.map((color, i) => (
                <button
                  key={color.name}
                  onClick={() => handleAccentChange(i)}
                  className="relative w-10 h-10 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card"
                  style={{
                    backgroundColor: color.hex,
                    boxShadow: accentIndex === i ? `0 0 0 3px rgb(var(--card)), 0 0 0 5px ${color.hex}` : 'none',
                  }}
                  title={color.name}
                  aria-label={`Color ${color.name}`}
                >
                  {accentIndex === i && (
                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* TEMA DEL MENÚ */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tema del Menú
            </h3>
            <div className="space-y-2">
              {([
                { key: 'auto' as SidebarTheme, label: 'Automático (Sigue al sistema)', icon: Monitor },
                { key: 'light' as SidebarTheme, label: 'Claro Siempre', icon: Sun },
                { key: 'dark' as SidebarTheme, label: 'Oscuro Siempre', icon: Moon },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleSidebarTheme(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-all ${
                    sidebarTheme === key
                      ? 'border-current text-white'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                  style={sidebarTheme === key ? { backgroundColor: `rgb(${ACCENT_COLORS[accentIndex].value})` } : {}}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{label}</span>
                  {sidebarTheme === key && <Check className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
