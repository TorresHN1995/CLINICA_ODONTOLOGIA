'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Building2,
  Save,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface ConfiguracionEmpresa {
  id?: number;
  nombre: string;
  rtn?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  pais: string;
  moneda: string;
  simboloMoneda: string;
  formatoFecha: string;
  logo?: string;
}

export default function ConfiguracionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>({
    nombre: '',
    pais: 'Honduras',
    moneda: 'HNL',
    simboloMoneda: 'L.',
    formatoFecha: 'DD/MM/YYYY'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        handleInputChange('logo', data.url);
        toast.success('Logo subido exitosamente');
      } else {
        toast.error('Error al subir el logo');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Verificar si es admin
    if (session.user?.role !== 'ADMINISTRADOR') {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/dashboard');
      return;
    }

    cargarConfiguracion();
  }, [session, status, router]);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracion/empresa');

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfiguracion(data);
        }
      } else if (response.status === 404) {
        // No hay configuración, usar valores por defecto
        console.log('No hay configuración previa, usando valores por defecto');
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!configuracion.nombre.trim()) {
      toast.error('El nombre de la empresa es requerido');
      return;
    }

    try {
      setSaving(true);

      const method = 'PUT';
      const url = '/api/configuracion/empresa';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configuracion),
      });

      if (response.ok) {
        const data = await response.json();
        setConfiguracion(data);
        toast.success('Configuración guardada exitosamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ConfiguracionEmpresa, value: string) => {
    setConfiguracion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Building2 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración de Empresa</h1>
          <p className="text-muted-foreground">Gestiona la información de tu clínica odontológica</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Información Básica
              </h3>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  value={configuracion.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Clínica Odontológica..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  RTN
                </label>
                <input
                  type="text"
                  value={configuracion.rtn || ''}
                  onChange={(e) => handleInputChange('rtn', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678901234"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Globe className="h-5 w-5 mr-2 text-green-600" />
                Ubicación
              </h3>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={configuracion.pais}
                  onChange={(e) => handleInputChange('pais', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={configuracion.ciudad || ''}
                  onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tegucigalpa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Dirección
                </label>
                <textarea
                  value={configuracion.direccion || ''}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Col. Centro, Ave. República de Chile..."
                />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <Phone className="h-5 w-5 mr-2 text-purple-600" />
              Información de Contacto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={configuracion.telefono || ''}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+504 2234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={configuracion.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="info@clinica.com"
                />
              </div>
            </div>
          </div>

          {/* Configuración Regional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-yellow-600" />
              Configuración Regional
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Moneda
                </label>
                <select
                  value={configuracion.moneda}
                  onChange={(e) => handleInputChange('moneda', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HNL">Lempira (HNL)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Símbolo de Moneda
                </label>
                <input
                  type="text"
                  value={configuracion.simboloMoneda}
                  onChange={(e) => handleInputChange('simboloMoneda', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="L."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Formato de Fecha
                </label>
                <select
                  value={configuracion.formatoFecha}
                  onChange={(e) => handleInputChange('formatoFecha', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Logo de la Empresa
            </h3>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Subir Logo
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md hover:border-blue-500 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <label
                      htmlFor="logo-upload"
                      className="relative cursor-pointer bg-card rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span className="px-2">Subir un archivo</span>
                      <input
                        id="logo-upload"
                        name="logo-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF hasta 5MB
                  </p>
                </div>
              </div>
              {uploading && (
                <p className="text-sm text-blue-600 mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Subiendo imagen...
                </p>
              )}
            </div>

            {configuracion.logo && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Vista previa:</p>
                <img
                  src={configuracion.logo}
                  alt="Logo"
                  className="h-20 w-auto border border-border rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
