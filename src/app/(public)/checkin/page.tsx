'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ClienteInfo {
  id: string
  nombre_completo: string
  telefono: string
}

interface MascotaInfo {
  id: string
  nombre: string
  expediente: number
  especie?: { nombre: string } | null
  raza: string
  sexo: string
}

interface CitaHoy {
  id: string
  fecha_hora: string
  motivo: string
  mascota_id: string
  mascota_nombre: string
}

interface Especie {
  id: number
  nombre: string
}

interface PosicionInfo {
  id: string
  estado: string
  tipo: string
  posicion: number
  total_delante: number
  mensaje: string
}

type Paso =
  | 'telefono'
  | 'cliente_encontrado'
  | 'registrar_cliente'
  | 'seleccionar_mascota'
  | 'registrar_mascota'
  | 'motivo'
  | 'confirmacion'

// ── Iconos de especie ────────────────────────────────────────────────────────

const ICONOS: Record<string, string> = {
  Canino: '🐕', Felino: '🐈', Ave: '🦜', Conejo: '🐇',
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function CheckinPage() {
  const [moduloActivo, setModuloActivo] = useState<boolean | null>(null)
  const [paso, setPaso] = useState<Paso>('telefono')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Verificar si el módulo check-in está habilitado
  useEffect(() => {
    axios
      .get<{ config: Record<string, boolean> }>(`${API}/empresa/modulos`)
      .then((res) => setModuloActivo(res.data.config?.checkin ?? false))
      .catch(() => setModuloActivo(false))
  }, [])

  // Datos
  const [telefono, setTelefono] = useState('')
  const [cliente, setCliente] = useState<ClienteInfo | null>(null)
  const [mascotas, setMascotas] = useState<MascotaInfo[]>([])
  const [citaHoy, setCitaHoy] = useState<CitaHoy | null>(null)
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<MascotaInfo | null>(null)
  const [especies, setEspecies] = useState<Especie[]>([])
  const [esNuevoCliente, setEsNuevoCliente] = useState(false)
  const [esNuevaMascota, setEsNuevaMascota] = useState(false)
  const [motivo, setMotivo] = useState('')

  // Formulario nuevo cliente
  const [nuevoNombre, setNuevoNombre] = useState('')

  // Formulario nueva mascota
  const [mascotaNombre, setMascotaNombre] = useState('')
  const [mascotaEspecieId, setMascotaEspecieId] = useState<number | undefined>()
  const [mascotaRaza, setMascotaRaza] = useState('')
  const [mascotaSexo, setMascotaSexo] = useState('')

  // Resultado
  const [posicion, setPosicion] = useState<PosicionInfo | null>(null)
  const [entradaId, setEntradaId] = useState<string | null>(null)

  // Cargar especies al necesitarlas
  const cargarEspecies = useCallback(async () => {
    if (especies.length > 0) return
    try {
      const { data } = await axios.get<Especie[]>(`${API}/checkin/especies`)
      setEspecies(data)
    } catch { /* ignore */ }
  }, [especies.length])

  // ── Paso 1: Buscar por teléfono ───────────────────────────────────────────

  const buscarTelefono = async () => {
    if (telefono.replace(/\D/g, '').length < 10) {
      setError('Ingresa un número de 10 dígitos')
      return
    }
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API}/checkin/buscar`, { telefono })

      if (data.encontrado) {
        setCliente(data.cliente)
        setMascotas(data.mascotas ?? [])
        setCitaHoy(data.citaHoy ?? null)
        setPaso('cliente_encontrado')
      } else {
        setEsNuevoCliente(true)
        setNuevoNombre('')
        setPaso('registrar_cliente')
      }
    } catch {
      setError('Error al buscar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2a: Cliente encontrado → seleccionar mascota ─────────────────────

  const irASeleccionarMascota = () => {
    setPaso('seleccionar_mascota')
  }

  const seleccionarMascota = (m: MascotaInfo) => {
    setMascotaSeleccionada(m)
    setEsNuevaMascota(false)
    // Si tiene cita, ir directo a confirmar
    if (citaHoy && citaHoy.mascota_id === m.id) {
      setMotivo(citaHoy.motivo)
      setPaso('motivo')
    } else {
      setPaso('motivo')
    }
  }

  const irARegistrarMascota = async () => {
    await cargarEspecies()
    setMascotaNombre('')
    setMascotaEspecieId(undefined)
    setMascotaRaza('')
    setMascotaSexo('')
    setPaso('registrar_mascota')
  }

  // ── Paso 2b: Registrar cliente nuevo ──────────────────────────────────────

  const registrarCliente = async () => {
    if (!nuevoNombre.trim()) {
      setError('Ingresa tu nombre')
      return
    }
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API}/checkin/registrar-cliente`, {
        nombre_completo: nuevoNombre.trim(),
        telefono,
      })
      setCliente(data)
      setMascotas([])
      await cargarEspecies()
      setPaso('registrar_mascota')
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Error al registrar'
      setError(typeof msg === 'string' ? msg : 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 3: Registrar mascota nueva ───────────────────────────────────────

  const registrarMascota = async () => {
    if (!mascotaNombre.trim() || !mascotaRaza.trim() || !mascotaSexo) {
      setError('Completa todos los campos')
      return
    }
    if (!cliente) return
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.post<MascotaInfo>(`${API}/checkin/registrar-mascota`, {
        cliente_id: cliente.id,
        nombre: mascotaNombre.trim(),
        especie_id: mascotaEspecieId ?? null,
        raza: mascotaRaza.trim(),
        sexo: mascotaSexo,
      })
      setMascotaSeleccionada(data)
      setEsNuevaMascota(true)
      setMascotas((prev) => [...prev, data])
      setPaso('motivo')
    } catch {
      setError('Error al registrar mascota')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 4: Motivo + ingresar ─────────────────────────────────────────────

  const ingresarAListaEspera = async () => {
    if (!cliente || !mascotaSeleccionada) return
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API}/checkin/ingresar`, {
        cliente_id: cliente.id,
        mascota_id: mascotaSeleccionada.id,
        telefono,
        cita_id: citaHoy?.mascota_id === mascotaSeleccionada.id ? citaHoy.id : undefined,
        motivo: motivo.trim() || undefined,
        es_nuevo_cliente: esNuevoCliente,
        es_nueva_mascota: esNuevaMascota,
      })
      setEntradaId(data.id)

      // Obtener posición
      const pos = await axios.get<PosicionInfo>(`${API}/checkin/posicion/${data.id}`)
      setPosicion(pos.data)
      setPaso('confirmacion')
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Error al ingresar'
      setError(typeof msg === 'string' ? msg : 'Error al ingresar a la lista')
    } finally {
      setLoading(false)
    }
  }

  // ── Polling de posición ───────────────────────────────────────────────────

  useEffect(() => {
    if (paso !== 'confirmacion' || !entradaId) return
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get<PosicionInfo>(`${API}/checkin/posicion/${entradaId}`)
        setPosicion(data)
      } catch { /* ignore */ }
    }, 15000) // Cada 15 segundos
    return () => clearInterval(interval)
  }, [paso, entradaId])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (moduloActivo === null) return null // Cargando estado del módulo

  if (!moduloActivo) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Vet&apos;Sentrum</h1>
        <p className="text-gray-500">El registro de llegada no está disponible en este momento.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Vet&apos;Sentrum</h1>
        <p className="text-sm text-gray-500 mt-1">Registro de llegada</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* ── Paso: Teléfono ──────────────────────────────────────────────── */}
      {paso === 'telefono' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Ingresa tu número de teléfono
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
              placeholder="10 dígitos"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && buscarTelefono()}
            />
            <p className="text-xs text-gray-400 text-center">
              Ejemplo: 8121234567
            </p>
          </div>
          <button
            onClick={buscarTelefono}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Buscando...' : 'Continuar'}
          </button>
        </div>
      )}

      {/* ── Paso: Cliente encontrado ────────────────────────────────────── */}
      {paso === 'cliente_encontrado' && cliente && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-500">Bienvenido</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{cliente.nombre_completo}</p>
          </div>

          {citaHoy && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-800">Tienes una cita agendada</p>
              <p className="text-indigo-700 mt-1">
                <span className="font-bold">
                  {new Date(citaHoy.fecha_hora).toLocaleTimeString('es-MX', {
                    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Monterrey',
                  })}
                </span>
                {' — '}{citaHoy.mascota_nombre}
              </p>
              <p className="text-xs text-indigo-600 mt-2">
                Tu cita tiene prioridad. Serás atendido en la brevedad dentro de tu horario agendado.
              </p>
            </div>
          )}

          <button
            onClick={irASeleccionarMascota}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {/* ── Paso: Registrar cliente nuevo ───────────────────────────────── */}
      {paso === 'registrar_cliente' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <p className="text-sm text-gray-500">No encontramos tu número. Regístrate:</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                disabled
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-gray-500"
              />
            </div>
          </div>
          <button
            onClick={registrarCliente}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Registrando...' : 'Registrarme'}
          </button>
          <button
            onClick={() => { setPaso('telefono'); setError('') }}
            className="w-full text-gray-500 text-sm py-2"
          >
            Volver
          </button>
        </div>
      )}

      {/* ── Paso: Seleccionar mascota ───────────────────────────────────── */}
      {paso === 'seleccionar_mascota' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-sm font-medium text-gray-700 mb-4">Selecciona a tu mascota</p>
            {mascotas.length === 0 ? (
              <p className="text-sm text-gray-400">No hay mascotas registradas.</p>
            ) : (
              <div className="space-y-2">
                {mascotas.map((m) => {
                  const icono = ICONOS[m.especie?.nombre ?? ''] ?? '🐾'
                  const esCita = citaHoy?.mascota_id === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => seleccionarMascota(m)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        esCita
                          ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icono}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{m.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {[m.especie?.nombre, m.raza, m.sexo].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-gray-400">#{m.expediente}</span>
                      </div>
                      {esCita && (
                        <span className="inline-block mt-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          Cita agendada
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button
            onClick={irARegistrarMascota}
            className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            + Registrar nueva mascota
          </button>
          <button
            onClick={() => { setPaso('cliente_encontrado'); setError('') }}
            className="w-full text-gray-500 text-sm py-2"
          >
            Volver
          </button>
        </div>
      )}

      {/* ── Paso: Registrar mascota nueva ───────────────────────────────── */}
      {paso === 'registrar_mascota' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <p className="text-sm font-medium text-gray-700">Datos de tu mascota</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                value={mascotaNombre}
                onChange={(e) => setMascotaNombre(e.target.value)}
                placeholder="Nombre de tu mascota"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Especie</label>
              <div className="grid grid-cols-2 gap-2">
                {especies.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setMascotaEspecieId(e.id)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      mascotaEspecieId === e.id
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {ICONOS[e.nombre] ?? '🐾'} {e.nombre}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Raza</label>
              <input
                type="text"
                value={mascotaRaza}
                onChange={(e) => setMascotaRaza(e.target.value)}
                placeholder="Raza"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
              <div className="grid grid-cols-2 gap-2">
                {['Macho', 'Hembra'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setMascotaSexo(s)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      mascotaSexo === s
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={registrarMascota}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Registrando...' : 'Registrar mascota'}
          </button>
          <button
            onClick={() => {
              setError('')
              setPaso(mascotas.length > 0 ? 'seleccionar_mascota' : 'cliente_encontrado')
            }}
            className="w-full text-gray-500 text-sm py-2"
          >
            Volver
          </button>
        </div>
      )}

      {/* ── Paso: Motivo + confirmar ingreso ────────────────────────────── */}
      {paso === 'motivo' && mascotaSeleccionada && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{ICONOS[mascotaSeleccionada.especie?.nombre ?? ''] ?? '🐾'}</span>
              <div>
                <p className="font-bold text-gray-900">{mascotaSeleccionada.nombre}</p>
                <p className="text-xs text-gray-500">
                  {[mascotaSeleccionada.especie?.nombre, mascotaSeleccionada.raza].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            {citaHoy?.mascota_id !== mascotaSeleccionada.id && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Motivo de la visita <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Vacunación, revisión general..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            )}
            {citaHoy?.mascota_id === mascotaSeleccionada.id && (
              <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700">
                Check-in para tu cita de las{' '}
                <strong>
                  {new Date(citaHoy.fecha_hora).toLocaleTimeString('es-MX', {
                    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Monterrey',
                  })}
                </strong>
              </div>
            )}
          </div>
          <button
            onClick={ingresarAListaEspera}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar a la lista de espera'}
          </button>
          <button
            onClick={() => { setPaso('seleccionar_mascota'); setError('') }}
            className="w-full text-gray-500 text-sm py-2"
          >
            Volver
          </button>
        </div>
      )}

      {/* ── Paso: Confirmación + posición ───────────────────────────────── */}
      {paso === 'confirmacion' && posicion && (
        <div className="space-y-4 text-center">
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <div className="text-5xl mb-4">
              {posicion.tipo === 'cita' ? '📋' : '🕐'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {posicion.tipo === 'cita' ? 'Check-in registrado' : 'Estás en la lista de espera'}
            </h2>

            {posicion.estado === 'esperando' && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 my-4">
                  <p className="text-4xl font-bold text-indigo-600">{posicion.posicion}</p>
                  <p className="text-sm text-gray-500 mt-1">Tu posición</p>
                </div>
                <p className="text-sm text-gray-600">{posicion.mensaje}</p>
              </>
            )}

            {posicion.estado === 'en_consulta' && (
              <div className="bg-green-50 rounded-xl p-4 my-4">
                <p className="text-lg font-semibold text-green-700">Es tu turno</p>
                <p className="text-sm text-green-600">Pasa al consultorio</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-6">
              Esta pantalla se actualiza automáticamente
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
