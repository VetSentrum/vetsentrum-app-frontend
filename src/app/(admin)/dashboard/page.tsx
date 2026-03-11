'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

// ── Tipos ────────────────────────────────────────────────────────────────────

type Rol = 'admin' | 'veterinario' | 'recepcion' | string

interface CitaHoy {
  id: string
  fecha_hora: string
  motivo: string
  estado: string
  cliente: { nombre_completo: string; telefono: string }
  mascota: { nombre: string; expediente: number; especie?: { nombre: string } | null }
}

interface EntradaEspera {
  id: string
  tipo: 'cita' | 'walk_in'
  estado: 'esperando' | 'en_consulta' | 'completado' | 'expirado'
  es_nuevo_cliente: boolean
  es_nueva_mascota: boolean
  confirmado: boolean
  motivo?: string | null
  created_at: string
  cliente: { id: string; nombre_completo: string; telefono: string }
  mascota: {
    id: string; nombre: string; expediente: number; raza: string; sexo: string
    especie?: { nombre: string } | null
  }
}

const ICONOS: Record<string, string> = {
  Canino: '🐕', Felino: '🐈', Ave: '🦜', Conejo: '🐇',
}

const ESTADO_CITA_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
  en_curso: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Llegó' },
  completada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completada' },
  cancelada: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [rol, setRol] = useState<Rol | null>(null)
  const [citas, setCitas] = useState<CitaHoy[]>([])
  const [espera, setEspera] = useState<EntradaEspera[]>([])
  const [loading, setLoading] = useState(true)
  const [checkinActivo, setCheckinActivo] = useState(false)
  const router = useRouter()

  const cargarDatos = useCallback(async (moduloCheckin: boolean) => {
    if (!moduloCheckin) return
    try {
      const [citasRes, esperaRes] = await Promise.all([
        axios.get<CitaHoy[]>(`${API}/lista-espera/citas-hoy`, { withCredentials: true }),
        axios.get<EntradaEspera[]>(`${API}/lista-espera`, { withCredentials: true }),
      ])
      setCitas(citasRes.data)
      setEspera(esperaRes.data)
    } catch { /* ignore errors on load */ }
  }, [])

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/auth/me`, { withCredentials: true }),
      axios.get<{ config: Record<string, boolean> }>(`${API}/empresa/modulos`),
    ])
      .then(([authRes, modulosRes]) => {
        setRol(authRes.data.rol)
        const checkin = modulosRes.data.config?.checkin ?? false
        setCheckinActivo(checkin)
        setLoading(false)
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!rol) return
    cargarDatos(checkinActivo)
    const interval = setInterval(() => cargarDatos(checkinActivo), 10000)
    return () => clearInterval(interval)
  }, [rol, checkinActivo, cargarDatos])

  // ── Acciones ──────────────────────────────────────────────────────────────

  const cambiarEstado = async (id: string, estado: string) => {
    await axios.patch(`${API}/lista-espera/${id}/estado`, { estado }, { withCredentials: true })
    await cargarDatos(checkinActivo)
  }

  const confirmarEntrada = async (id: string) => {
    await axios.patch(`${API}/lista-espera/${id}/confirmar`, {}, { withCredentials: true })
    await cargarDatos(checkinActivo)
  }

  if (loading || !rol) return null

  // Separar lista de espera por tipo
  const esperaCitas = espera.filter((e) => e.tipo === 'cita')
  const esperaWalkIn = espera.filter((e) => e.tipo === 'walk_in')

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* ── Citas de hoy (solo si check-in activo) ────────────────────────── */}
      {checkinActivo && <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Citas agendadas hoy
          </h2>
          <span className="text-xs text-gray-400">{citas.length} cita{citas.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {citas.length === 0 ? (
            <p className="p-6 text-center text-gray-400 text-sm">No hay citas agendadas para hoy</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="text-left px-4 py-3 font-semibold">Hora</th>
                  <th className="text-left px-4 py-3 font-semibold">Paciente</th>
                  <th className="text-left px-4 py-3 font-semibold">Propietario</th>
                  <th className="text-left px-4 py-3 font-semibold">Motivo</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {citas.map((c) => {
                  const hora = new Date(c.fecha_hora).toLocaleTimeString('es-MX', {
                    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Monterrey',
                  })
                  const badge = ESTADO_CITA_BADGE[c.estado] ?? ESTADO_CITA_BADGE.pendiente
                  const icono = ICONOS[c.mascota.especie?.nombre ?? ''] ?? '🐾'
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-700">{hora}</td>
                      <td className="px-4 py-3">
                        <span className="mr-1.5">{icono}</span>
                        <span className="font-medium text-gray-900">{c.mascota.nombre}</span>
                        <span className="ml-2 text-xs text-gray-400">#{c.mascota.expediente}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.cliente.nombre_completo}</td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{c.motivo}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>}

      {checkinActivo && (
        <>
          {/* ── Lista de espera — con cita ────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Lista de espera — Con cita
              </h2>
              <span className="text-xs text-gray-400">{esperaCitas.length}</span>
            </div>
            <ListaEsperaTable
              entradas={esperaCitas}
              onCambiarEstado={cambiarEstado}
              onConfirmar={confirmarEntrada}
              router={router}
            />
          </section>

          {/* ── Lista de espera — Sin cita (walk-in) ──────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Lista de espera — Sin cita
              </h2>
              <span className="text-xs text-gray-400">{esperaWalkIn.length}</span>
            </div>
            <ListaEsperaTable
              entradas={esperaWalkIn}
              onCambiarEstado={cambiarEstado}
              onConfirmar={confirmarEntrada}
              router={router}
            />
          </section>
        </>
      )}
    </div>
  )
}

// ── Componente tabla de lista de espera ──────────────────────────────────────

function ListaEsperaTable({
  entradas,
  onCambiarEstado,
  onConfirmar,
  router,
}: {
  entradas: EntradaEspera[]
  onCambiarEstado: (id: string, estado: string) => Promise<void>
  onConfirmar: (id: string) => Promise<void>
  router: ReturnType<typeof useRouter>
}) {
  if (entradas.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">
        Sin pacientes en espera
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="text-left px-4 py-3 font-semibold">#</th>
            <th className="text-left px-4 py-3 font-semibold">Paciente</th>
            <th className="text-left px-4 py-3 font-semibold">Propietario</th>
            <th className="text-left px-4 py-3 font-semibold">Motivo</th>
            <th className="text-left px-4 py-3 font-semibold">Hora llegada</th>
            <th className="text-left px-4 py-3 font-semibold">Estado</th>
            <th className="text-right px-4 py-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entradas.map((e, idx) => {
            const icono = ICONOS[e.mascota.especie?.nombre ?? ''] ?? '🐾'
            const hora = new Date(e.created_at).toLocaleTimeString('es-MX', {
              hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Monterrey',
            })
            const necesitaValidacion = (e.es_nuevo_cliente || e.es_nueva_mascota) && !e.confirmado

            return (
              <tr key={e.id} className={`hover:bg-gray-50 ${necesitaValidacion ? 'bg-amber-50/50' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{icono}</span>
                    <div>
                      <span className="font-medium text-gray-900">{e.mascota.nombre}</span>
                      <span className="ml-2 text-xs text-gray-400">#{e.mascota.expediente}</span>
                      {necesitaValidacion && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                          {e.es_nuevo_cliente ? 'NUEVO CLIENTE' : 'NUEVA MASCOTA'}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-700">{e.cliente.nombre_completo}</span>
                  <span className="block text-xs text-gray-400">{e.cliente.telefono}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]">{e.motivo ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{hora}</td>
                <td className="px-4 py-3">
                  {e.estado === 'esperando' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Esperando
                    </span>
                  )}
                  {e.estado === 'en_consulta' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      En consulta
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {necesitaValidacion && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                          // Ir a editar cliente/mascota, luego confirmar
                          if (e.es_nuevo_cliente) {
                            router.push(`/clientes?edit=${e.cliente.id}`)
                          } else {
                            router.push(`/mascotas?edit=${e.mascota.id}`)
                          }
                        }}
                      >
                        Validar
                      </Button>
                    )}
                    {necesitaValidacion && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => onConfirmar(e.id)}
                      >
                        Confirmar
                      </Button>
                    )}
                    {e.estado === 'esperando' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => onCambiarEstado(e.id, 'en_consulta')}
                      >
                        Atender
                      </Button>
                    )}
                    {e.estado === 'en_consulta' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => onCambiarEstado(e.id, 'completado')}
                      >
                        Completar
                      </Button>
                    )}
                    {e.estado === 'esperando' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => onCambiarEstado(e.id, 'expirado')}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
