'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EditarCitaForm } from '@/components/EditarCitaForm'

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

  // 🔹 Mocks de ejemplo
  useEffect(() => {
    const clientesMock: Cliente[] = [
      { id: 'c1', nombre_completo: 'Carlos Marrufo' },
      { id: 'c2', nombre_completo: 'Ana Pérez' },
    ]
    const mascotasMock: Mascota[] = [
      { id: 'm1', nombre: 'Mili' },
      { id: 'm2', nombre: 'Rex' },
    ]
    const citasMock: Cita[] = [
      { id: '1', fecha: '2025-09-01T10:00', cliente_id: 'c1', cliente_nombre: 'Carlos Marrufo', mascota_id: 'm1', mascota_nombre: 'Mili', motivo: 'Vacuna anual' },
      { id: '2', fecha: '2025-09-01T11:00', cliente_id: 'c2', cliente_nombre: 'Ana Pérez', mascota_id: 'm2', mascota_nombre: 'Rex', motivo: 'Chequeo general' },
    ]
    setCitas(citasMock)
  }, [])

  const abrirModal = (cita: Cita | null) => {
    setCitaSeleccionada(cita)
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

  const citasFiltradas = citas.filter(c =>
    c.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.mascota_nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

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
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
            className="border rounded px-3 py-1"
          />
          {(usuario?.rol === 'admin' || usuario?.rol === 'recepcion') && (
            <Button onClick={() => abrirModal(null)}>Nueva Cita</Button>
          )}
        </div>
      </div>

      {mensajeGlobal && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{mensajeGlobal}</div>
      )}

      <div className="overflow-auto max-h-[55vh] border rounded shadow">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="cursor-pointer p-2 border-b" onClick={() => handleSort('fecha')}>
                Fecha {sortField === 'fecha' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="cursor-pointer p-2 border-b" onClick={() => handleSort('cliente_nombre')}>
                Cliente {sortField === 'cliente_nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="cursor-pointer p-2 border-b" onClick={() => handleSort('mascota_nombre')}>
                Mascota {sortField === 'mascota_nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-2 border-b">Motivo</th>
              <th className="text-left p-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {citasPaginadas.map(cita => (
              <tr key={cita.id} className="border-t">
                <td className="p-2">{new Date(cita.fecha).toLocaleString()}</td>
                <td className="p-2">{cita.cliente_nombre}</td>
                <td className="p-2">{cita.mascota_nombre}</td>
                <td className="p-2">{cita.motivo}</td>
                <td className="p-2 flex gap-2">
                  {(usuario?.rol === 'admin' || usuario?.rol === 'recepcion') && (
                    <Button variant="outline" size="sm" onClick={() => abrirModal(cita)}>Editar</Button>
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
              onSuccess={(mensaje: string) => { setMensajeGlobal(mensaje) }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}