'use client'

import { Check, ShieldCheck } from 'lucide-react'
import {
  GRUPOS,
  MODULOS,
  PRESETS_POR_ROL,
  TODAS_LAS_KEYS,
  normalizarPermisos,
} from '@/lib/modulos'

interface SelectorPermisosProps {
  rol: string
  value: string[]
  onChange: (permisos: string[]) => void
  /** Compacta la cuadrícula y oculta las descripciones (para el modal de edición). */
  compacto?: boolean
}

export default function SelectorPermisos({ rol, value, onChange, compacto = false }: SelectorPermisosProps) {
  // El administrador siempre entra a todo: dejarle quitar módulos permitiría
  // que se cerrara la puerta del propio módulo de usuarios.
  const esAdmin = rol === 'ADMINISTRADOR'
  const seleccionados = esAdmin ? TODAS_LAS_KEYS : normalizarPermisos(value)

  const toggle = (key: string) => {
    if (esAdmin) return
    onChange(
      seleccionados.includes(key)
        ? seleccionados.filter((k) => k !== key)
        : normalizarPermisos([...seleccionados, key])
    )
  }

  const toggleGrupo = (grupo: string) => {
    if (esAdmin) return
    const keys = MODULOS.filter((m) => m.grupo === grupo).map((m) => m.key)
    const todosPuestos = keys.every((k) => seleccionados.includes(k))
    onChange(
      normalizarPermisos(
        todosPuestos
          ? seleccionados.filter((k) => !keys.includes(k))
          : [...seleccionados, ...keys]
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <ShieldCheck className="h-5 w-5" />
            Permisos de acceso
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {esAdmin
              ? 'El administrador entra a todos los módulos; no se puede limitar.'
              : `Marca los módulos que verá este usuario. ${seleccionados.length} de ${TODAS_LAS_KEYS.length} seleccionados.`}
          </p>
        </div>

        {!esAdmin && (
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => onChange(TODAS_LAS_KEYS)}
              className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Marcar todo
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Ninguno
            </button>
            <button
              type="button"
              onClick={() => onChange(PRESETS_POR_ROL[rol] || [])}
              className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Volver al preset del rol
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {GRUPOS.map((grupo) => {
          const modulos = MODULOS.filter((m) => m.grupo === grupo)
          const marcados = modulos.filter((m) => seleccionados.includes(m.key)).length
          return (
            <fieldset key={grupo} className="rounded-xl border border-border p-4">
              <legend className="flex items-center gap-3 px-2">
                <span className="text-sm font-bold text-foreground">{grupo}</span>
                <span className="text-xs text-muted-foreground">
                  {marcados}/{modulos.length}
                </span>
                {!esAdmin && (
                  <button
                    type="button"
                    onClick={() => toggleGrupo(grupo)}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    {marcados === modulos.length ? 'Quitar grupo' : 'Marcar grupo'}
                  </button>
                )}
              </legend>

              <div className={`grid gap-2 ${compacto ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {modulos.map((modulo) => {
                  const activo = seleccionados.includes(modulo.key)
                  return (
                    <label
                      key={modulo.key}
                      className={[
                        'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors',
                        activo ? 'border-sky-500 bg-sky-500/10' : 'border-border hover:border-slate-500',
                        esAdmin ? 'cursor-not-allowed opacity-70' : '',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={activo}
                        disabled={esAdmin}
                        onChange={() => toggle(modulo.key)}
                      />
                      <span
                        className={[
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          activo ? 'border-sky-500 bg-sky-500 text-white' : 'border-border',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        {activo && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{modulo.label}</span>
                        {!compacto && (
                          <span className="block text-xs text-muted-foreground">{modulo.descripcion}</span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )
        })}
      </div>
    </div>
  )
}
