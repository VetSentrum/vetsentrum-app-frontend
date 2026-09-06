'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EditarConsultaForm, ConsultaFormData } from '@/components/EditarConsultaForm'
import { EditarRecetaForm, RenglonReceta } from '@/components/EditarRecetaForm'
import { ExportarButton, HojaOpcionalExport } from '@/components/ExportarButton'
import { ColumnaExportable, filasDesdeColumnas, encabezadosDeColumnas } from '@/lib/exportar'
import axios from 'axios'

interface Consulta {
  id: string
  fecha: string
  creado_en: string
  cliente_id: string
  mascota_id: string
  veterinario_id: string
  motivo: string
  evaluacion_clinica?: { datos_generales?: { peso?: string | number; [key: string]: unknown }; [key: string]: unknown }
  receta?: { id: string } | null
  mascota?: {
    nombre: string
    cliente?: { nombre_completo: string }
  }
  veterinario?: { id: string; nombre: string }
}

const fechaExportable = (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-MX', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC',
}) : ''

const COLUMNAS_EXPORT_CONSULTAS: ColumnaExportable<Consulta>[] = [
  { encabezado: 'Fecha', valor: c => fechaExportable(c.fecha) },
  { encabezado: 'Mascota', valor: c => c.mascota?.nombre ?? '' },
  { encabezado: 'Cliente', valor: c => c.mascota?.cliente?.nombre_completo ?? '' },
  { encabezado: 'Motivo', valor: c => c.motivo },
  { encabezado: 'Veterinario', valor: c => c.veterinario?.nombre ?? '' },
  { encabezado: 'Receta', valor: c => c.receta ? 'Sí' : 'No' },
]

// Aún no hay un módulo de Pesos: se ofrece como opción al exportar Consultas,
// a partir del peso ya registrado en la evaluación clínica de cada consulta.
const COLUMNAS_EXPORT_PESO_EXTRA: ColumnaExportable<Consulta>[] = [
  { encabezado: 'Peso (kg)', valor: c => c.evaluacion_clinica?.datos_generales?.peso ?? '' },
]

const COLUMNAS_HISTORIAL_PESOS: ColumnaExportable<Consulta>[] = [
  { encabezado: 'Fecha', valor: c => fechaExportable(c.fecha) },
  { encabezado: 'Mascota', valor: c => c.mascota?.nombre ?? '' },
  { encabezado: 'Cliente', valor: c => c.mascota?.cliente?.nombre_completo ?? '' },
  { encabezado: 'Peso (kg)', valor: c => c.evaluacion_clinica?.datos_generales?.peso ?? '' },
]

interface Usuario {
  id: string
  rol: 'admin' | 'recepcion' | 'veterinario'
}

export default function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<ConsultaFormData | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensajeGlobal, setMensajeGlobal] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [sortField, setSortField] = useState<'fecha' | 'mascota_nombre' | 'cliente_nombre'>('fecha')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [modalRecetaAbierto, setModalRecetaAbierto] = useState(false)
  const [recetaConsultaId, setRecetaConsultaId] = useState<string | null>(null)
  const [recetaId, setRecetaId] = useState<string | undefined>(undefined)
  const [recetaIndicaciones, setRecetaIndicaciones] = useState<RenglonReceta[]>([])

  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]
  const [fechaDesde, setFechaDesde] = useState(primerDiaMes)
  const [fechaHasta, setFechaHasta] = useState(ultimoDiaMes)

  const fetchConsultas = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/consultas`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Error al obtener consultas')
      const data: Consulta[] = await response.json()
      setConsultas(data)
    } catch (error) {
      const e = error as Error
      console.error(e.message)
    }
  }

  useEffect(() => { fetchConsultas() }, [])

  useEffect(() => {
    axios.get<Usuario>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { withCredentials: true })
      .then(({ data }) => setUsuario(data))
      .catch(() => setUsuario(null))
  }, [])

  const abrirModal = (consulta: Consulta | null) => {
    setConsultaSeleccionada(consulta as ConsultaFormData | null)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setConsultaSeleccionada(null)
  }

  const abrirModalReceta = async (consulta: Consulta) => {
    setRecetaConsultaId(consulta.id)
    setRecetaId(consulta.receta?.id)
    if (consulta.receta?.id) {
      try {
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/recetas/${consulta.receta.id}`,
          { withCredentials: true },
        )
        setRecetaIndicaciones(data.indicaciones ?? [])
      } catch {
        setRecetaIndicaciones([])
      }
    } else {
      setRecetaIndicaciones([])
    }
    setModalRecetaAbierto(true)
  }

  const eliminarConsulta = async (id: string) => {
    if (!window.confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) return
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/consultas/${id}`, { withCredentials: true })
      setMensajeGlobal('Consulta eliminada')
      fetchConsultas()
    } catch { alert('Error al eliminar la consulta') }
  }

  const eliminarReceta = async (id: string) => {
    if (!window.confirm('¿Eliminar esta receta?')) return
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/recetas/${id}`, { withCredentials: true })
      setMensajeGlobal('Receta eliminada')
      fetchConsultas()
    } catch { alert('Error al eliminar la receta') }
  }

  const handleSort = (field: 'fecha' | 'mascota_nombre' | 'cliente_nombre') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const consultasFiltradas = consultas.filter(c => {
    const mascotaNombre = c.mascota?.nombre ?? ''
    const clienteNombre = c.mascota?.cliente?.nombre_completo ?? ''
    const veterinarioNombre = c.veterinario?.nombre ?? ''

    const coincideBusqueda =
      c.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
      mascotaNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      veterinarioNombre.toLowerCase().includes(busqueda.toLowerCase())

    const fechaConsulta = new Date(c.fecha)
    if (fechaDesde && fechaConsulta < new Date(fechaDesde + 'T00:00:00.000Z')) return false
    if (fechaHasta && fechaConsulta > new Date(fechaHasta + 'T23:59:59.999Z')) return false

    return coincideBusqueda
  })

  const consultasOrdenadas = [...consultasFiltradas].sort((a, b) => {
    let valA = ''
    let valB = ''
    if (sortField === 'fecha') {
      valA = a.fecha ?? ''
      valB = b.fecha ?? ''
    } else if (sortField === 'mascota_nombre') {
      valA = a.mascota?.nombre ?? ''
      valB = b.mascota?.nombre ?? ''
    } else {
      valA = a.mascota?.cliente?.nombre_completo ?? ''
      valB = b.mascota?.cliente?.nombre_completo ?? ''
    }
    valA = valA.toLowerCase()
    valB = valB.toLowerCase()
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const totalPaginas = Math.max(1, Math.ceil(consultasFiltradas.length / porPagina))
  const consultasPaginadas = consultasOrdenadas.slice((pagina - 1) * porPagina, pagina * porPagina)

  const limpiarFiltros = () => {
    setBusqueda('')
    setFechaDesde(primerDiaMes)
    setFechaHasta(ultimoDiaMes)
    setPagina(1)
  }

  const filasExportables = filasDesdeColumnas(consultasOrdenadas, COLUMNAS_EXPORT_CONSULTAS)

  const hojasOpcionalesExport: HojaOpcionalExport[] = [
    {
      key: 'pesos',
      etiqueta: 'Incluir historial de pesos (columna en Consultas + hoja aparte)',
      columnasExtra: encabezadosDeColumnas(COLUMNAS_EXPORT_PESO_EXTRA),
      filasExtra: filasDesdeColumnas(consultasOrdenadas, COLUMNAS_EXPORT_PESO_EXTRA),
      hoja: {
        nombre: 'Historial de Pesos',
        columnas: encabezadosDeColumnas(COLUMNAS_HISTORIAL_PESOS),
        filas: filasDesdeColumnas(
          consultasOrdenadas.filter(c => c.evaluacion_clinica?.datos_generales?.peso),
          COLUMNAS_HISTORIAL_PESOS,
        ),
      },
    },
  ]

  return (
    <main className="max-w-6xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Consultas</h1>
        <div className="flex gap-4 items-center flex-wrap">
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
            className="border rounded px-3 py-1"
          />
          <div className="flex items-center gap-1 text-sm">
            <span>Del</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPagina(1) }}
              className="border rounded px-2 py-1 text-sm"
            />
            <span>al</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPagina(1) }}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <Button variant="outline" onClick={limpiarFiltros}>Limpiar filtros</Button>
          <ExportarButton
            rol={usuario?.rol}
            filas={filasExportables}
            columnas={encabezadosDeColumnas(COLUMNAS_EXPORT_CONSULTAS)}
            nombreArchivo="consultas"
            hojasOpcionales={hojasOpcionalesExport}
          />
          {(usuario?.rol === 'admin' || usuario?.rol === 'veterinario') && (
            <Button onClick={() => abrirModal(null)}>Nueva Consulta</Button>
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
              <th className="cursor-pointer p-2 border-b text-center" onClick={() => handleSort('fecha')}>
                Fecha {sortField === 'fecha' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="cursor-pointer p-2 border-b text-center" onClick={() => handleSort('mascota_nombre')}>
                Mascota {sortField === 'mascota_nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="cursor-pointer p-2 border-b text-center" onClick={() => handleSort('cliente_nombre')}>
                Cliente {sortField === 'cliente_nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-2 border-b text-center">Motivo</th>
              <th className="p-2 border-b text-center">Veterinario</th>
              <th className="p-2 border-b text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {consultasPaginadas.map(consulta => (
              <tr key={consulta.id} className="border-t">
                <td className="p-2 text-center">
                  {consulta.fecha ? new Date(consulta.fecha).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'UTC',
                  }) : ''}
                </td>
                <td className="p-2 text-center">{consulta.mascota?.nombre ?? '—'}</td>
                <td className="p-2 text-center">{consulta.mascota?.cliente?.nombre_completo ?? '—'}</td>
                <td className="p-2 text-center">{consulta.motivo}</td>
                <td className="p-2 text-center">{consulta.veterinario?.nombre ?? '—'}</td>
                <td className="p-2">
                  <div className="flex flex-col gap-1">
                    {/* Grupo Consulta */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-gray-400 w-14 shrink-0">Consulta</span>
                      <a href={`/consultas/${consulta.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">Ver</Button>
                      </a>
                      {(usuario?.rol === 'admin' || usuario?.rol === 'veterinario') && (
                        <Button variant="outline" size="sm" onClick={() => abrirModal(consulta)}>Editar</Button>
                      )}
                      {usuario?.rol === 'admin' && (
                        <Button variant="destructive" size="sm" onClick={() => eliminarConsulta(consulta.id)}>Eliminar</Button>
                      )}
                    </div>
                    {/* Grupo Receta */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-gray-400 w-14 shrink-0">Receta</span>
                      {consulta.receta ? (
                        <>
                          <a href={`/recetas/${consulta.receta.id}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">Ver</Button>
                          </a>
                          {(usuario?.rol === 'admin' || usuario?.rol === 'veterinario') && (
                            <Button variant="outline" size="sm" onClick={() => abrirModalReceta(consulta)}>Editar</Button>
                          )}
                          {usuario?.rol === 'admin' && (
                            <Button variant="destructive" size="sm" onClick={() => eliminarReceta(consulta.receta!.id)}>Eliminar</Button>
                          )}
                        </>
                      ) : (
                        (usuario?.rol === 'admin' || usuario?.rol === 'veterinario') && (
                          <Button variant="outline" size="sm" onClick={() => abrirModalReceta(consulta)}>Crear</Button>
                        )
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {consultasPaginadas.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">Sin consultas en el rango seleccionado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-2">
        <div>
          Mostrar{' '}
          <select value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1) }}
            className="border rounded px-2 py-1">
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>{' '}
          consultas
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

      {/* Modal Consulta */}
      <Dialog open={modalAbierto} onOpenChange={cerrarModal}>
        <DialogContent className="w-full sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{consultaSeleccionada ? 'Editar Consulta' : 'Nueva Consulta'}</DialogTitle>
            <DialogDescription>
              Completa los datos de la consulta y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto pr-2">
            <EditarConsultaForm
              consulta={consultaSeleccionada}
              onClose={cerrarModal}
              onSuccess={(mensaje: string) => {
                setMensajeGlobal(mensaje)
                fetchConsultas()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Receta */}
      <Dialog open={modalRecetaAbierto} onOpenChange={setModalRecetaAbierto}>
        <DialogContent className="w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{recetaId ? 'Editar Receta' : 'Nueva Receta'}</DialogTitle>
            <DialogDescription>
              Agrega los medicamentos e indicaciones del tratamiento.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {recetaConsultaId && (
              <EditarRecetaForm
                consultaId={recetaConsultaId}
                recetaId={recetaId}
                initialIndicaciones={recetaIndicaciones}
                onGuardado={() => {
                  setModalRecetaAbierto(false)
                  fetchConsultas()
                }}
                onCancelar={() => setModalRecetaAbierto(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
