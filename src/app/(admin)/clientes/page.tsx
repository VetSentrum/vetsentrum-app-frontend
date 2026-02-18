'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditarClienteForm } from '@/components/EditarClienteForm';
import { EditarMascotaForm } from '@/components/EditarMascotaForm';
import axios from 'axios';

interface Mascota {
  id: string;
  nombre: string;
}

interface MascotaDetalle {
  id: string;
  nombre: string;
  expediente?: number;
  especie_id: number;
  raza: string;
  sexo: 'Macho' | 'Hembra';
  edad_aproximada?: number;
  esterilizado: boolean;
  peso: number;
  cliente_id: string;
  fecha_creacion: Date;
}

interface Cliente {
  id: string;
  nombre_completo: string;
  telefono: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  mascotas: Mascota[];
}

export default function ClientesPage() {
  const router                                        = useRouter();
  const searchParams                                  = useSearchParams();
  const [clientes, setClientes]                       = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [modalAbierto, setModalAbierto]               = useState(false);
  const [mensajeGlobal, setMensajeGlobal]             = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos]       = useState(false);
  const [busqueda, setBusqueda]                       = useState('');
  const [busquedaDebounced, setBusquedaDebounced]     = useState('');
  const [loading, setLoading]                         = useState(false);
  const [initialLoading, setInitialLoading]           = useState(true);
  const [pagina, setPagina]                           = useState(1);
  const [porPagina, setPorPagina]                     = useState(10);
  const [usuario, setUsuario] = useState<{ id: string; rol: "admin" | "recepcion" | "veterinario" } | null>(null);
  const [mascotaSeleccionada, setMascotaSeleccionada]   = useState<MascotaDetalle | null>(null);
  const [modalMascotaAbierto, setModalMascotaAbierto]   = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const cargarClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ inactivos: String(mostrarInactivos), limit: '9999' });
      if (busquedaDebounced) params.set('search', busquedaDebounced);
      const { data } = await axios.get<Cliente[]>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes?${params}`,
        { withCredentials: true }
      );
      setClientes(data);
    } catch (error) {
      console.error(error);
      router.push('/login');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [mostrarInactivos, busquedaDebounced, router]);

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { withCredentials: true })
      .then(res => setUsuario(res.data))
      .catch(() => setUsuario(null));
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    if (!initialLoading) {
      const clienteId = searchParams.get('cliente');
      if (clienteId) {
        const cliente = clientes.find(c => c.id === clienteId);
        if (cliente) abrirModal(cliente);
      }
    }
  }, [searchParams, clientes, loading]);

  useEffect(() => {
    setPagina(1);
  }, [busquedaDebounced]);

  const rolActual = usuario?.rol;

  const abrirModal = (cliente: Cliente | null) => {
    setClienteSeleccionado(cliente);
    setModalAbierto(true);
  };
  const cerrarModal = () => {
    setModalAbierto(false);
    setClienteSeleccionado(null);
  };

  const abrirMascota = async (mascotaId: string) => {
    try {
      const { data } = await axios.get<MascotaDetalle>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/mascotas/${mascotaId}`,
        { withCredentials: true }
      );
      setMascotaSeleccionada(data);
      setModalMascotaAbierto(true);
    } catch (error) {
      console.error('Error al cargar mascota:', error);
    }
  };

  const cerrarModalMascota = () => {
    setModalMascotaAbierto(false);
    setMascotaSeleccionada(null);
  };

  const totalPaginas = Math.ceil(clientes.length / porPagina);
  const clientesPaginados = clientes.slice((pagina - 1) * porPagina, pagina * porPagina);

  if (initialLoading) return <p>Cargando clientes...</p>;

  return (
    <main className="max-w-6xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar cliente..."
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
          
          {(rolActual === 'recepcion' || rolActual === 'admin') && (
            <Button onClick={() => abrirModal(null)}>Nuevo Cliente</Button>
          )}
        </div>
      </div>

      {mensajeGlobal && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {mensajeGlobal}
        </div>
      )}

      <div className="overflow-auto max-h-[55vh] border rounded shadow">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="text-left p-2 border-b">Nombre</th>
              <th className="text-left p-2 border-b">Teléfono</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">Dirección</th>
              <th className="text-left p-2 border-b">Mascotas</th>
              <th className="text-left p-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clientesPaginados.map((cliente) => (
              <tr key={cliente.id}
                className={`border-t ${cliente.activo ? "" : "bg-red-50"}`}>

                <td className="p-2">{cliente.nombre_completo}</td>
                <td className="p-2">{cliente.telefono}</td>
                <td className="p-2">{cliente.email}</td>
                <td className="p-2">{cliente.direccion}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {(cliente.mascotas ?? []).length === 0 ? (
                      <span className="text-gray-400 text-sm">—</span>
                    ) : (
                      (cliente.mascotas ?? []).map(m => (
                        <button
                          key={m.id}
                          onClick={() => abrirMascota(m.id)}
                          className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                          {m.nombre}
                        </button>
                      ))
                    )}
                  </div>
                </td>
                <td className="p-2 flex gap-2">
                  {/* Veterinario: botón deshabilitado */}
                  {rolActual === 'veterinario' && (
                    <Button variant="outline" size="sm" disabled>Editar</Button>
                  )}

                  {/* Recepción/Admin: pueden editar */}
                  {(rolActual === 'recepcion' || rolActual === 'admin') && (
                    <Button variant="outline" size="sm" onClick={() => abrirModal(cliente)}>Editar</Button>
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
        <select
          value={porPagina}
          onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}
          className="border rounded px-2 py-1"
        >
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        {' '}clientes
      </div>
      <div className="flex gap-2 items-center">
        <Button onClick={() => setPagina((p) => Math.max(p - 1, 1))} disabled={pagina === 1}>
          Anterior
        </Button>

        <span>Página</span>

        <select
          value={pagina}
          onChange={(e) => setPagina(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>

        <span>de {totalPaginas}</span>

        <Button onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))} disabled={pagina === totalPaginas}>
          Siguiente
        </Button>
      </div>
    </div>
    
      <Dialog open={modalAbierto} onOpenChange={cerrarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-center font-medium'>
              {clienteSeleccionado ? 'Edición de Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <EditarClienteForm
            cliente={clienteSeleccionado ?? null}
            onClose={cerrarModal}
            onSuccess={(mensaje: string) => {
              setMensajeGlobal(mensaje);
              cargarClientes();
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={modalMascotaAbierto} onOpenChange={cerrarModalMascota}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center font-medium">
              {mascotaSeleccionada?.nombre}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <EditarMascotaForm
            mascota={mascotaSeleccionada}
            onClose={cerrarModalMascota}
            onSuccess={() => {
              cargarClientes();
              cerrarModalMascota();
            }}
          />
        </DialogContent>
      </Dialog>
    </main>

  );
}