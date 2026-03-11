'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { ESPECIES_ICONOS, calcularEdad } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

interface Mascota {
  id: string
  expediente: number
  nombre: string
  raza: string
  sexo: string
  edad_aproximada?: number
  fecha_creacion?: string
  especie?: { nombre: string }
  cliente_nombre: string
  cliente?: { telefono: string }
  activo: boolean
}

export default function ExpedientesPage() {
  const router = useRouter()
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(20)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedBusqueda(busqueda); setPagina(1) }, 300)
    return () => clearTimeout(t)
  }, [busqueda])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get<Mascota[]>(`${API}/mascotas`, { withCredentials: true })
      setMascotas(data)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { cargar() }, [cargar])

  const filtradas = debouncedBusqueda.trim()
    ? mascotas.filter(m => {
        const q = debouncedBusqueda.toLowerCase()
        return (
          String(m.expediente).includes(q) ||
          m.nombre.toLowerCase().includes(q) ||
          m.raza.toLowerCase().includes(q) ||
          m.cliente_nombre.toLowerCase().includes(q)
        )
      })
    : mascotas

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
  const paginadas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expedientes</h1>
        <span className="text-sm text-gray-500">{filtradas.length} paciente{filtradas.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Buscador */}
      <div className="mb-5">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por #EXP, nombre, raza o propietario…"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando expedientes…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {debouncedBusqueda ? 'Sin resultados para esa búsqueda.' : 'No hay pacientes registrados.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="text-left px-4 py-3 font-semibold">#EXP</th>
                <th className="text-left px-4 py-3 font-semibold">Paciente</th>
                <th className="text-left px-4 py-3 font-semibold">Especie / Raza</th>
                <th className="text-left px-4 py-3 font-semibold">Edad</th>
                <th className="text-left px-4 py-3 font-semibold">Propietario</th>
                <th className="text-left px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginadas.map(m => {
                const icono = ESPECIES_ICONOS[m.especie?.nombre ?? ''] ?? '🐾'
                const edad = m.edad_aproximada != null && m.fecha_creacion
                  ? calcularEdad(m.edad_aproximada, m.fecha_creacion, true)
                  : '—'
                return (
                  <tr
                    key={m.id}
                    onClick={() => router.push(`/expedientes/${m.expediente}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-700">
                      #{m.expediente}
                    </td>
                    <td className="px-4 py-3">
                      <span className="mr-1.5">{icono}</span>
                      <span className="font-medium text-gray-900">{m.nombre}</span>
                      <span className="ml-2 text-gray-400 text-xs">{m.sexo}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {[m.especie?.nombre, m.raza].filter(Boolean).join(' · ')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{edad}</td>
                    <td className="px-4 py-3 text-gray-700">{m.cliente_nombre}</td>
                    <td className="px-4 py-3">
                      {m.activo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {!loading && filtradas.length > 0 && (
        <div className="flex justify-between items-center mt-3">
          <div className="text-sm text-gray-500">
            Mostrar{' '}
            <select
              value={porPagina}
              onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1) }}
              className="border rounded px-2 py-1 mx-1"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>{' '}
            por página
          </div>
          <div className="flex gap-2 items-center text-sm">
            <Button variant="outline" size="sm" onClick={() => setPagina(p => Math.max(p - 1, 1))} disabled={pagina === 1}>
              Anterior
            </Button>
            <span className="text-gray-600">
              Página {pagina} de {totalPaginas}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPagina(p => Math.min(p + 1, totalPaginas))} disabled={pagina === totalPaginas}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
