'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditarClienteForm } from '@/components/EditarClienteForm';

interface Mascota {
  id: string;
  nombre: string;
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
  const [clientes, setClientes]                       = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [modalAbierto, setModalAbierto]               = useState(false);
  const [mensajeGlobal, setMensajeGlobal]             = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos]       = useState(false);
  const [busqueda, setBusqueda]                       = useState('');
  const [loading, setLoading]                         = useState(true);
  const [pagina, setPagina]                           = useState(1);
  const [porPagina, setPorPagina]                     = useState(10);

  const cargarClientes = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes?inactivos=${mostrarInactivos}`
      const { data } = await axios.get<Cliente[]>(url, { withCredentials: true });

      setClientes(data);
    } catch (error) {
      console.error(error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [mostrarInactivos, router]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const abrirModal = (cliente: Cliente | null) => {
    setClienteSeleccionado(cliente);
    setModalAbierto(true);
  };
  const cerrarModal = () => {
    setModalAbierto(false);
    setClienteSeleccionado(null);
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda) ||
    (c.email?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
  );
  
  const totalPaginas = Math.ceil(clientesFiltrados.length / porPagina);
  const clientesPaginados = clientesFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  if (loading) return <p>Cargando clientes...</p>;

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
          
          <Button onClick={() => abrirModal(null)}>Nuevo Cliente</Button>
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
                  <Button size="sm" variant="outline" onClick={() => router.push(`/mascotas?cliente=${cliente.id}`)}>
                    Ver
                  </Button>
                </td>
                <td className="p-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => abrirModal(cliente)}>Editar</Button>
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
    </main>

  );
}