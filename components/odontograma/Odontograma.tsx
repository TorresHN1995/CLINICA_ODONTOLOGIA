'use client'

import { useState } from 'react'

interface DienteEstado {
  numero: number
  estado: 'sano' | 'caries' | 'obturado' | 'corona' | 'extraccion' | 'ausente' | 'endodoncia' | 'fractura'
  notas: string
}

interface OdontogramaProps {
  data?: Record<number, DienteEstado>
  editable?: boolean
  onChange?: (data: Record<number, DienteEstado>) => void
}

const estadosColores = {
  sano: '#ffffff',
  caries: '#ef4444',
  obturado: '#3b82f6',
  corona: '#f59e0b',
  extraccion: '#000000',
  ausente: '#9ca3af',
  endodoncia: '#8b5cf6',
  fractura: '#ec4899',
}

const estadosLabels = {
  sano: 'Sano',
  caries: 'Caries',
  obturado: 'Obturado',
  corona: 'Corona',
  extraccion: 'Extracción',
  ausente: 'Ausente',
  endodoncia: 'Endodoncia',
  fractura: 'Fractura',
}

export default function Odontograma({ data = {}, editable = true, onChange }: OdontogramaProps) {
  const [selectedDiente, setSelectedDiente] = useState<number | null>(null)
  const [odontogramaData, setOdontogramaData] = useState<Record<number, DienteEstado>>(data)

  // Numeración dental FDI (32 dientes permanentes)
  const dientesSuperiores = {
    derecha: [18, 17, 16, 15, 14, 13, 12, 11],
    izquierda: [21, 22, 23, 24, 25, 26, 27, 28],
  }
  
  const dientesInferiores = {
    derecha: [48, 47, 46, 45, 44, 43, 42, 41],
    izquierda: [31, 32, 33, 34, 35, 36, 37, 38],
  }

  const handleDienteClick = (numero: number) => {
    if (!editable) return
    setSelectedDiente(numero)
  }

  const handleEstadoChange = (estado: DienteEstado['estado']) => {
    if (!editable || selectedDiente === null) return
    
    const nuevoEstado = {
      ...odontogramaData,
      [selectedDiente]: {
        numero: selectedDiente,
        estado,
        notas: odontogramaData[selectedDiente]?.notas || '',
      },
    }
    
    setOdontogramaData(nuevoEstado)
    onChange?.(nuevoEstado)
  }

  const renderDiente = (numero: number) => {
    const estado = odontogramaData[numero]?.estado || 'sano'
    const color = estadosColores[estado]
    const isSelected = selectedDiente === numero

    return (
      <div
        key={numero}
        onClick={() => handleDienteClick(numero)}
        className={`relative cursor-pointer transition-all ${
          isSelected ? 'scale-110 z-10' : ''
        }`}
        title={`Diente ${numero} - ${estadosLabels[estado]}`}
      >
        <svg width="40" height="50" viewBox="0 0 40 50" className="drop-shadow-md">
          {/* Diente */}
          <path
            d="M20 5 C15 5, 10 8, 10 15 L10 35 C10 40, 15 45, 20 45 C25 45, 30 40, 30 35 L30 15 C30 8, 25 5, 20 5 Z"
            fill={color}
            stroke={isSelected ? '#3b82f6' : '#666'}
            strokeWidth={isSelected ? '3' : '1.5'}
          />
          {/* Marca de X para extracción */}
          {estado === 'extraccion' && (
            <>
              <line x1="10" y1="10" x2="30" y2="40" stroke="#fff" strokeWidth="2" />
              <line x1="30" y1="10" x2="10" y2="40" stroke="#fff" strokeWidth="2" />
            </>
          )}
          {/* Marca de - para ausente */}
          {estado === 'ausente' && (
            <line x1="10" y1="25" x2="30" y2="25" stroke="#fff" strokeWidth="2" />
          )}
        </svg>
        <div className="text-center text-xs font-bold text-gray-700 mt-1">
          {numero}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Odontograma */}
      <div className="bg-gray-50 p-8 rounded-xl border-2 border-gray-200">
        {/* Dientes superiores */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {/* Derecha superior */}
            <div className="flex space-x-1">
              {dientesSuperiores.derecha.map(renderDiente)}
            </div>
            <div className="w-4"></div>
            {/* Izquierda superior */}
            <div className="flex space-x-1">
              {dientesSuperiores.izquierda.map(renderDiente)}
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t-2 border-gray-400 my-4"></div>

        {/* Dientes inferiores */}
        <div className="mt-8">
          <div className="flex justify-center space-x-2">
            {/* Derecha inferior */}
            <div className="flex space-x-1">
              {dientesInferiores.derecha.map(renderDiente)}
            </div>
            <div className="w-4"></div>
            {/* Izquierda inferior */}
            <div className="flex space-x-1">
              {dientesInferiores.izquierda.map(renderDiente)}
            </div>
          </div>
        </div>
      </div>

      {/* Panel de control */}
      {editable && selectedDiente && (
        <div className="card animate-slide-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Diente #{selectedDiente}
          </h3>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            {Object.entries(estadosLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleEstadoChange(key as DienteEstado['estado'])}
                className={`p-3 rounded-lg border-2 transition-all ${
                  odontogramaData[selectedDiente]?.estado === key
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div
                  className="w-6 h-6 rounded mx-auto mb-2 border border-gray-400"
                  style={{ backgroundColor: estadosColores[key as DienteEstado['estado']] }}
                ></div>
                <div className="text-xs font-medium text-center">{label}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="label">Notas del Diente</label>
            <textarea
              rows={2}
              className="input-field"
              placeholder="Agregar notas sobre este diente..."
              value={odontogramaData[selectedDiente]?.notas || ''}
              onChange={(e) => {
                const nuevoEstado = {
                  ...odontogramaData,
                  [selectedDiente]: {
                    ...odontogramaData[selectedDiente],
                    numero: selectedDiente,
                    estado: odontogramaData[selectedDiente]?.estado || 'sano',
                    notas: e.target.value,
                  },
                }
                setOdontogramaData(nuevoEstado)
                onChange?.(nuevoEstado)
              }}
            />
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="card">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Leyenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(estadosLabels).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded border border-gray-400"
                style={{ backgroundColor: estadosColores[key as DienteEstado['estado']] }}
              ></div>
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

