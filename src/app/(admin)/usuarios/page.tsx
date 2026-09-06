'use client'

import { useState, useEffect, useCallback }     from 'react'
import axios                                    from 'axios'
import { useRouter }                            from 'next/navigation'
import { Dialog, DialogContent, DialogHeader }  from '@/components/ui/dialog'
import { Button }                               from '@/components/ui/button'
import { EditarUsuarioForm }                    from '@/components/EditarUsuarioForm'
import { ExportarButton }                       from '@/components/ExportarButton'
import { DialogDescription, DialogTitle }       from '@radix-ui/react-dialog'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'recepcion' | 'veterinario'
  activo: boolean
}

export default function UsuariosPage() {
  const router                                        = useRouter()
  const [miUsuarioId, setMiUsuarioId]                 = useState<string | null>(null)
  const [miRol, setMiRol]                             = useState<string | null>(null)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [usuarios, setUsuarios]                       = useState<Usuario[]>([])
  const [mostrarInactivos, setMostrarInactivos]       = useState(false);
  const [busqueda, setBusqueda]                       = useState("");
  const [loading, setLoading]                         = useState(true)
  const [modalAbierto, setModalAbierto]               = useState(false)
  const [mensajeGlobal, setMensajeGlobal]             = useState<string | null>(null)

  // Función para cargar usuarios según estado y búsqueda
  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const { data: yo } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { withCredentials: true })
      setMiUsuarioId(yo.id)
      setMiRol(yo.rol)

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/usuarios?inactivos=${mostrarInactivos}`

      const { data: lista } = await axios.get<Usuario[]>(url, { withCredentials: true })

      // Guardamos la lista base ya filtrada de "yo"
      setUsuarios(lista.filter(u => u.id !== yo.id))

    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [mostrarInactivos, router])

  // Cargar solo al inicio y cuando cambie mostrarInactivos
  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  // Filtrado en memoria
  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setMostrarInactivos(false)
  }

  const filasExportables = usuariosFiltrados.map(u => ({
    Nombre: u.nombre,
    Email: u.email,
    Rol: u.rol,
    Activo: u.activo ? 'Sí' : 'No',
  }))

  const abrirModal = (usuario: Usuario | null) => {
    setUsuarioSeleccionado(usuario)
    setModalAbierto(true)
  }
  
  const cerrarModal = () => {
    setModalAbierto(false)
    setUsuarioSeleccionado(null)
  }
  if (loading) return <p>Cargando usuarios...</p>

  return (
    <main className="max-w-6xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <div className="flex gap-4 flex-wrap items-center">
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border rounded px-3 py-1"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar inactivos
          </label>

          <Button variant="outline" onClick={limpiarFiltros}>Limpiar filtros</Button>
          <ExportarButton
            rol={miRol}
            filas={filasExportables}
            columnas={['Nombre', 'Email', 'Rol', 'Activo']}
            nombreArchivo="usuarios"
          />

          <Button
            onClick={() => abrirModal(null)}
          >
            Nuevo usuario
          </Button>
        </div>
      </div>

      {mensajeGlobal && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {mensajeGlobal}
        </div>
      )}

      {usuariosFiltrados.length === 0 ? (
        <p>No hay otros usuarios registrados.</p>
      ) : (
        
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Rol</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id}
              className={`border-t ${usuario.activo ? "" : "bg-red-50"}`}>

                <td className="p-2">{usuario.nombre}</td>
                <td className="p-2">{usuario.email}</td>
                <td className="p-2 capitalize">{usuario.rol}</td>
                <td className="p-2">
                  <Button
                    variant="outline"
                    onClick={() => abrirModal(usuario)}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={modalAbierto} onOpenChange={cerrarModal}>
        <DialogContent>
          <DialogHeader >
              <DialogTitle className='text-center font-medium'>
                {usuarioSeleccionado ? 'Edición de usuario' : 'Nuevo usuario'}
              </DialogTitle>
              <DialogDescription className='font-medium'></DialogDescription>
          </DialogHeader>
            {usuarioSeleccionado !== undefined && (
              <EditarUsuarioForm
                usuario={usuarioSeleccionado}
                onClose={cerrarModal}
                onSuccess={(mensaje: string) => {
                  setMensajeGlobal(mensaje)
                  cargarUsuarios()
                }}
              />
            )}
        </DialogContent>
      </Dialog>
    </main>
  )
}