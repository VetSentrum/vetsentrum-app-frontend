'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EditarCitaForm } from '@/components/EditarCitaForm'
import axios from 'axios'

interface Cliente {
  id: string
  nombre_completo: string
}

interface Mascota {
  id: string
  nombre: string
}

interface Cita {
  id: string
  fecha: string
  cliente_id: string
  cliente_nombre: string
  mascota_id: string
  mascota_nombre: string
  motivo: string
  estado: string
}

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensajeGlobal, setMensajeGlobal] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [sortField, setSortField] = useState<'fecha' | 'cliente_nombre' | 'mascota_nombre'>('fecha')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [usuario, setUsuario] = useState<{ id: string; rol: 'admin' | 'recepcion' | 'veterinario' } | null>(null)

  // nuevos estados para filtros
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false)
  const [mostrarCanceladas, setMostrarCanceladas] = useState(false)

  const fetchCitas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/citas`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Error al obtener citas')
      const data = await res.json()

      const citasNormalizadas = data.map((c: any) => ({
        id: c.id,
        fecha: c.fecha_hora,
        motivo: c.motivo,
        estado: c.estado,
        cliente_id: c.cliente_id,
        mascota_id: c.mascota_id,
        cliente_nombre: c.cliente?.nombre_completo ?? '',
        mascota_nombre: c.mascota?.nombre ?? ''
      }))
      setCitas(citasNormalizadas)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchCitas() }, [])

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { withCredentials: true })
      .then(res => setUsuario(res.data))
      .catch(() => setUsuario(null))
  }, [])

  const abrirModal = (cita: Cita | null) => {
    if (cita) {
      const fechaLocal = new Date(cita.fecha).toISOString().slice(0, 16)
      setCitaSeleccionada({ ...cita, fecha: fechaLocal })
    } else {
      setCitaSeleccionada(null)
    }
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setCitaSeleccionada(null)
  }

  const handleSort = (field: 'fecha' | 'cliente_nombre' | 'mascota_nombre') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // aplica filtros de búsqueda y estados
  const citasFiltradas = citas.filter(c => {
    const coincideBusqueda =
      c.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.mascota_nombre.toLowerCase().includes(busqueda.toLowerCase())

    const esPendiente = c.estado === 'pendiente'
    const esCompletada = c.estado === 'completada'
    const esCancelada = c.estado === 'cancelada'

    if (esPendiente) return coincideBusqueda
    if (esCompletada && mostrarCompletadas) return coincideBusqueda
    if (esCancelada && mostrarCanceladas) return coincideBusqueda
    return false
  })

  const citasOrdenadas = [...citasFiltradas].sort((a, b) => {
    let valA: string | number = a[sortField] ?? ''
    let valB: string | number = b[sortField] ?? ''
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const totalPaginas = Math.ceil(citasFiltradas.length / porPagina)
  const citasPaginadas = citasOrdenadas.slice((pagina - 1) * porPagina, pagina * porPagina)

  return (
    <main className="max-w-6xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Citas</h1>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
            className="border rounded px-3 py-1"
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={mostrarCompletadas}
              onChange={(e) => setMostrarCompletadas(e.target.checked)}
            />
            Completadas
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={mostrarCanceladas}
              onChange={(e) => setMostrarCanceladas(e.target.checked)}
            />
            Canceladas
          </label>
          <Button onClick={() => abrirModal(null)}>Nueva Cita</Button>
        </div>
      </div>

      {mensajeGlobal && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{mensajeGlobal}</div>
      )}

      <div className="overflow-auto max-h-[55vh] border rounded shadow">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="cursor-pointer p-2 border-b text-center" onClick={() => handleSort('fecha')}>
                Fecha {sortField === 'fecha' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="cursor-pointer p-2 border-b text-center" onClick={() => handleSort('cliente_nombre')}>
                Cliente {sortField === 'cliente_nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="cursor-pointer p-2 border-b text-center" onClick={() => handleSort('mascota_nombre')}>
                Mascota {sortField === 'mascota_nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-2 border-b text-center">Motivo</th>
              <th className="p-2 border-b text-center">Estado</th>
              <th className="p-2 border-b text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {citasPaginadas.map(cita => (
              <tr key={cita.id} className="border-t">
                <td className="p-2 text-center">
                  {cita.fecha ? new Date(cita.fecha).toLocaleString("es-MX", {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'UTC'
                  }) : ''}
                </td>
                <td className="p-2 text-center">{cita.cliente_nombre}</td>
                <td className="p-2 text-center">{cita.mascota_nombre}</td>
                <td className="p-2 text-center">{cita.motivo}</td>
                <td className="p-2 text-center">{cita.estado}</td>
                <td className="p-2 text-center flex gap-2">
                  {(usuario?.rol === 'admin' || usuario?.rol === 'recepcion') && (
                    <>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => abrirModal(cita)}
                        disabled={cita.estado !== "pendiente"}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await axios.patch(
                              `${process.env.NEXT_PUBLIC_BACKEND_URL}/citas/${cita.id}/ingreso`,
                              {},
                              { withCredentials: true }
                            )
                            setMensajeGlobal('Ingreso registrado')
                            setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: 'completada' } : c))
                          } catch (err: any) {
                            setMensajeGlobal(err?.response?.data?.message || 'Error al registrar ingreso')
                          }
                        }}
                        disabled={cita.estado !== "pendiente"}
                      >
                        Registrar ingreso
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div>
          Mostrar{' '}
          <select value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1) }}
            className="border rounded px-2 py-1">
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>{' '}
          citas
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={() => setPagina(p => Math.max(p - 1, 1))} disabled={pagina === 1}>Anterior</Button>
          <span>Página</span>
          <select value={pagina} onChange={(e) => setPagina(Number(e.target.value))} className="border rounded px-2 py-1">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <span>de {totalPaginas}</span>
          <Button onClick={() => setPagina(p => Math.min(p + 1, totalPaginas))} disabled={pagina === totalPaginas}>Siguiente</Button>
        </div>
      </div>

      <Dialog open={modalAbierto} onOpenChange={cerrarModal}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>{citaSeleccionada ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
            <DialogDescription>
              Completa los datos de la cita y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto pr-2">
            <EditarCitaForm
              cita={citaSeleccionada ?? {} as Cita}
              onClose={cerrarModal}
              onSuccess={(mensaje: string) => { 
                setMensajeGlobal(mensaje)
                fetchCitas()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}