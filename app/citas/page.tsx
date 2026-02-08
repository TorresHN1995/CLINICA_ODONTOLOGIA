'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, ChevronRight, ChevronLeft, Loader2, ArrowLeft } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import Link from 'next/link'

interface Slot {
    hora: string
    disponible: boolean
}

export default function BookingPage() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [slots, setSlots] = useState<Slot[]>([])

    // Form Data
    const [motivo, setMotivo] = useState('')
    const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [hora, setHora] = useState('')
    const [paciente, setPaciente] = useState({
        nombre: '',
        apellido: '',
        identificacion: '',
        telefono: '',
        email: '',
        fechaNacimiento: ''
    })

    // Estados para gestión
    const [view, setView] = useState<'BOOKING' | 'MANAGE'>('BOOKING')
    const [misCitas, setMisCitas] = useState<any[]>([])
    const [searchId, setSearchId] = useState('')
    const [managingCita, setManagingCita] = useState<any>(null)
    const [gestionAction, setGestionAction] = useState<'CANCEL' | 'RESCHEDULE' | null>(null)
    const [cancelMotivo, setCancelMotivo] = useState('')

    // Cargar slots cuando cambia la fecha
    useEffect(() => {
        if (step === 2 || gestionAction === 'RESCHEDULE') {
            fetchSlots()
        }
    }, [fecha, step, gestionAction])

    const fetchSlots = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/citas/disponibilidad?fecha=${fecha}`)
            if (res.ok) {
                const data = await res.json()
                setSlots(data)
            }
        } catch (error) {
            toast.error('Error cargando horarios')
        } finally {
            setLoading(false)
        }
    }

    const checkPaciente = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/citas/paciente?identificacion=${paciente.identificacion}`)

            if (res.ok) {
                const data = await res.json()
                if (data.found && data.paciente) {
                    // Paciente encontrado, autocompletar
                    setPaciente(prev => ({
                        ...prev,
                        nombre: data.paciente.nombre,
                        apellido: data.paciente.apellido,
                        telefono: data.paciente.telefono,
                        email: data.paciente.email || '',
                        fechaNacimiento: new Date(data.paciente.fechaNacimiento).toISOString().split('T')[0]
                    }))
                    toast.success(`Hola de nuevo, ${data.paciente.nombre}`)
                }
            } else {
                // No encontrado, limpiar datos (excepto ID) para que escriba
                setPaciente(prev => ({
                    ...prev,
                    nombre: '',
                    apellido: '',
                    telefono: '',
                    email: '',
                    fechaNacimiento: ''
                }))
                toast('Por favor completa tu registro', { icon: '📝' })
            }
            setStep(4)
        } catch (error) {
            toast.error('Error verificando identidad')
        } finally {
            setLoading(false)
        }
    }

    const handleBooking = async () => {
        if (!paciente.nombre || !paciente.apellido || !paciente.identificacion || !paciente.telefono || !paciente.fechaNacimiento) {
            toast.error('Por favor complete todos los campos obligatorios')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/citas/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha,
                    hora,
                    motivo,
                    paciente
                })
            })

            if (res.ok) {
                setStep(5) // Success (Was 4)
            } else {
                const data = await res.json()
                toast.error(data.error || 'Error al reservar cita')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    const buscarMisCitas = async () => {
        if (searchId.length < 5) return
        setLoading(true)
        try {
            const res = await fetch(`/api/citas/public/mis-citas?identificacion=${searchId}`)
            const data = await res.json()
            if (data.citas) {
                setMisCitas(data.citas)
                if (data.citas.length === 0) toast('No se encontraron citas futuras', { icon: 'ℹ️' })
            } else {
                setMisCitas([])
            }
        } catch (e) {
            toast.error('Error al buscar citas')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelar = async () => {
        if (!cancelMotivo) return toast.error('Debes indicar un motivo')

        setLoading(true)
        try {
            const res = await fetch('/api/citas/public/gestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'CANCELAR',
                    citaId: managingCita.id,
                    identificacion: searchId,
                    motivo: cancelMotivo
                })
            })
            if (res.ok) {
                toast.success('Cita cancelada exitosamente')
                setGestionAction(null)
                setManagingCita(null)
                buscarMisCitas() // Refresh
            } else {
                toast.error('Error al cancelar cita')
            }
        } catch (e) {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    const handleReprogramar = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/citas/public/gestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'REPROGRAMAR',
                    citaId: managingCita.id,
                    identificacion: searchId,
                    nuevaFecha: fecha,
                    nuevaHora: hora
                })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success('Cita reprogramada exitosamente')
                setGestionAction(null)
                setManagingCita(null)
                buscarMisCitas() // Refresh
            } else {
                toast.error(data.error || 'Error al reprogramar')
            }
        } catch (e) {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
            <Toaster position="top-center" />

            {/* Header Simple */}
            <div className="w-full max-w-lg mb-8 text-center">
                <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary-600 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
                </Link>
                <h1 className="text-3xl font-bold text-foreground">Agenda y Gestión</h1>
                <p className="text-muted-foreground mt-2">Clínica Odontológica Profesional</p>
            </div>

            <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transition-all">

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setView('BOOKING')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${view === 'BOOKING' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-muted-foreground hover:text-muted-foreground'}`}
                    >
                        Reservar Cita
                    </button>
                    <button
                        onClick={() => setView('MANAGE')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${view === 'MANAGE' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-muted-foreground hover:text-muted-foreground'}`}
                    >
                        Mis Citas
                    </button>
                </div>

                {view === 'BOOKING' && (
                    <>
                        {/* Progress Bar */}
                        <div className="bg-muted h-2 w-full">
                            <div
                                className="h-full transition-all duration-500 ease-in-out"
                                style={{ width: `${(step / 5) * 100}%`, backgroundColor: 'rgb(var(--accent))' }}
                            ></div>
                        </div>

                        <div className="p-6 md:p-8">

                            {/* STEP 1: Selección de Servicio */}
                            {step === 1 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h2 className="text-xl font-bold mb-6 text-gray-800">¿Qué servicio necesitas?</h2>
                                    <div className="space-y-4">
                                        {[
                                            'Consulta General',
                                            'Limpieza Dental',
                                            'Evaluación de Ortodoncia',
                                            'Dolor / Emergencia',
                                            'Otro'
                                        ].map((servicio) => (
                                            <button
                                                key={servicio}
                                                onClick={() => { setMotivo(servicio); setStep(2); }}
                                                className="w-full p-4 text-left border rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center justify-between group"
                                            >
                                                <span className="font-medium text-muted-foreground group-hover:text-primary-800">{servicio}</span>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Fecha y Hora */}
                            {step === 2 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center mb-6">
                                        <button onClick={() => setStep(1)} className="p-1 -ml-2 mr-2 hover:bg-muted rounded-full">
                                            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                                        </button>
                                        <h2 className="text-xl font-bold text-gray-800">Selecciona Fecha y Hora</h2>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Fecha</label>
                                        <input
                                            type="date"
                                            min={format(new Date(), 'yyyy-MM-dd')}
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Horarios Disponibles</label>
                                        {loading ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                            </div>
                                        ) : slots.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-3">
                                                {slots.map((slot) => (
                                                    <button
                                                        key={slot.hora}
                                                        onClick={() => { setHora(slot.hora); setStep(3); }}
                                                        className="py-2 px-3 text-sm font-medium text-center border rounded-lg hover:border-primary-500 hover:bg-primary-50 text-muted-foreground"
                                                    >
                                                        {format(new Date(`2000-01-01T${slot.hora}`), 'h:mm a')}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-muted rounded-xl">
                                                No hay horarios disponibles para esta fecha.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Identificación (Nuevo) */}
                            {step === 3 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center mb-6">
                                        <button onClick={() => setStep(2)} className="p-1 -ml-2 mr-2 hover:bg-muted rounded-full">
                                            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                                        </button>
                                        <h2 className="text-xl font-bold text-gray-800">Tu Identifiación</h2>
                                    </div>

                                    <p className="text-muted-foreground mb-4 text-sm">
                                        Ingresa tu número de identidad (sin guiones) para verificar si ya eres paciente.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Cédula / Identidad *</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: 0801199912345"
                                                className="w-full mt-1 p-3 border rounded-lg text-lg tracking-wide"
                                                value={paciente.identificacion}
                                                onChange={e => {
                                                    // Permitir solo números
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    setPaciente({ ...paciente, identificacion: val })
                                                }}
                                            />
                                        </div>

                                        <button
                                            onClick={checkPaciente}
                                            disabled={loading || paciente.identificacion.length < 5}
                                            className="w-full btn-primary py-3 text-lg mt-4 flex justify-center items-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : 'Continuar'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Datos Personales (Completar/Verificar) */}
                            {step === 4 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center mb-6">
                                        <button onClick={() => setStep(3)} className="p-1 -ml-2 mr-2 hover:bg-muted rounded-full">
                                            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                                        </button>
                                        <h2 className="text-xl font-bold text-gray-800">Tus Datos</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Nombre *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full mt-1 p-2 border rounded-lg"
                                                    value={paciente.nombre}
                                                    onChange={e => setPaciente({ ...paciente, nombre: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Apellido *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full mt-1 p-2 border rounded-lg"
                                                    value={paciente.apellido}
                                                    onChange={e => setPaciente({ ...paciente, apellido: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Teléfono / Celular *</label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full mt-1 p-2 border rounded-lg"
                                                value={paciente.telefono}
                                                onChange={e => setPaciente({ ...paciente, telefono: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento *</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full mt-1 p-2 border rounded-lg"
                                                value={paciente.fechaNacimiento}
                                                onChange={e => setPaciente({ ...paciente, fechaNacimiento: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Email (Opcional)</label>
                                            <input
                                                type="email"
                                                className="w-full mt-1 p-2 border rounded-lg"
                                                value={paciente.email}
                                                onChange={e => setPaciente({ ...paciente, email: e.target.value })}
                                            />
                                        </div>

                                        <div className="bg-primary-50 p-4 rounded-xl mt-6">
                                            <h3 className="font-semibold text-primary-900 mb-2">Resumen de Cita</h3>
                                            <div className="text-sm text-primary-800 space-y-1">
                                                <p><span className="font-medium">Servicio:</span> {motivo}</p>
                                                <p><span className="font-medium">Fecha:</span> {format(new Date(fecha), 'PPP', { locale: es })}</p>
                                                <p><span className="font-medium">Hora:</span> {hora && format(new Date(`2000-01-01T${hora}`), 'h:mm a')}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleBooking}
                                            disabled={loading}
                                            className="w-full btn-primary py-3 text-lg mt-4 flex justify-center items-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : 'Confirmar Reserva'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: Success */}
                            {step === 5 && (
                                <div className="text-center py-8 animate-in zoom-in-50 duration-500">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">¡Cita Confirmada!</h2>
                                    <p className="text-muted-foreground mb-8">
                                        Hemos registrado tu cita correctamente. Te esperamos el día <strong>{format(new Date(fecha), 'dd/MM/yyyy')}</strong> a las <strong>{format(new Date(`2000-01-01T${hora}`), 'h:mm a')}</strong>.
                                    </p>
                                    <button
                                        onClick={() => { setStep(1); setMotivo(''); setHora(''); setPaciente({ ...paciente, identificacion: '', nombre: '', apellido: '' }); }}
                                        className="btn-secondary w-full"
                                    >
                                        Reservar otra cita
                                    </button>
                                    <div className="mt-4">
                                        <Link href="/" className="text-sm text-muted-foreground hover:text-muted-foreground">
                                            Volver al inicio
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {view === 'MANAGE' && (
                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Search State */}
                        {!managingCita && (
                            <>
                                <h2 className="text-xl font-bold mb-4 text-gray-800">Ver Mis Citas</h2>
                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Tu Identidad (sin guiones)"
                                        className="flex-1 p-3 border rounded-lg"
                                        value={searchId}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setSearchId(val);
                                        }}
                                    />
                                    <button
                                        onClick={buscarMisCitas}
                                        className="btn-primary px-4"
                                        disabled={searchId.length < 5 || loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : 'Buscar'}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {misCitas.map(cita => (
                                        <div key={cita.id} className="p-4 border rounded-xl hover:border-primary-300 transition-all bg-muted">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-bold text-foreground">{format(new Date(cita.fecha), 'PPP', { locale: es })}</p>
                                                    <p className="text-muted-foreground text-sm">{cita.horaInicio} - {cita.tipoCita}</p>
                                                    <p className="text-xs text-blue-600 font-medium">Dr. {cita.odontologo.nombre} {cita.odontologo.apellido}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                                                <button
                                                    onClick={() => { setManagingCita(cita); setGestionAction('RESCHEDULE'); }}
                                                    className="flex-1 text-xs py-2 bg-blue-50 text-blue-700 rounded font-medium hover:bg-blue-100"
                                                >
                                                    Reprogramar
                                                </button>
                                                <button
                                                    onClick={() => { setManagingCita(cita); setGestionAction('CANCEL'); }}
                                                    className="flex-1 text-xs py-2 bg-red-50 text-red-700 rounded font-medium hover:bg-red-100"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Cancel Mode */}
                        {managingCita && gestionAction === 'CANCEL' && (
                            <div>
                                <div className="flex items-center mb-6">
                                    <button onClick={() => { setManagingCita(null); setGestionAction(null); }} className="p-1 -ml-2 mr-2 hover:bg-muted rounded-full">
                                        <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                                    </button>
                                    <h2 className="text-xl font-bold text-red-600">Cancelar Cita</h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Estás cancelando tu cita del <strong>{format(new Date(managingCita.fecha), 'PPP', { locale: es })}</strong>.
                                    Por favor indícanos el motivo:
                                </p>
                                <textarea
                                    className="w-full p-3 border rounded-lg mb-4"
                                    rows={3}
                                    placeholder="Ej: Enfermedad, Trabajo, Viaje..."
                                    value={cancelMotivo}
                                    onChange={(e) => setCancelMotivo(e.target.value)}
                                />
                                <button
                                    onClick={handleCancelar}
                                    disabled={loading || !cancelMotivo}
                                    className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar Cancelación'}
                                </button>
                            </div>
                        )}

                        {/* Reschedule Mode */}
                        {managingCita && gestionAction === 'RESCHEDULE' && (
                            <div>
                                <div className="flex items-center mb-6">
                                    <button onClick={() => { setManagingCita(null); setGestionAction(null); }} className="p-1 -ml-2 mr-2 hover:bg-muted rounded-full">
                                        <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                                    </button>
                                    <h2 className="text-xl font-bold text-blue-600">Reprogramar Cita</h2>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Nueva Fecha</label>
                                    <input
                                        type="date"
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Nuevos Horarios</label>
                                    {loading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                        </div>
                                    ) : slots.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {slots.map((slot) => (
                                                <button
                                                    key={slot.hora}
                                                    onClick={() => { setHora(slot.hora); handleReprogramar(); /* Direct logic or confirm step */ }}
                                                    onMouseEnter={() => setHora(slot.hora)} // Preview?
                                                    className={`py-2 px-3 text-sm font-medium text-center border rounded-lg hover:border-primary-500 hover:bg-primary-50 text-muted-foreground ${hora === slot.hora ? 'border-primary-500 bg-primary-50' : ''}`}
                                                >
                                                    {format(new Date(`2000-01-01T${slot.hora}`), 'h:mm a')}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground bg-muted rounded-xl">
                                            No hay horarios disponibles.
                                        </div>
                                    )}
                                </div>

                                {hora && (
                                    <button
                                        onClick={handleReprogramar}
                                        disabled={loading}
                                        className="w-full mt-6 py-3 btn-primary rounded-lg font-bold"
                                    >
                                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar Cambio'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>

            <div className="mt-8 text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Clínica Odontológica
            </div>
        </div>
    )
}
