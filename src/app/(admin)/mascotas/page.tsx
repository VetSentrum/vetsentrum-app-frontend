'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditarMascotaForm } from '@/components/EditarMascotaForm';

interface Mascota {
  id: string;
  expediente: number;
  nombre: string;
  especie_id: number;
  especie?: { id: number; nombre: string };
  raza: string;
  sexo: 'Macho' | 'Hembra';
  edad_aproximada: number;
  esterilizado: boolean;
  peso: number;
  cliente_id: string;
  cliente_nombre: string;
}

export default function MascotasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteFiltro = searchParams.get('cliente');

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<Mascota | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensajeGlobal, setMensajeGlobal] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const cargarMascotas = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/mascotas`;
      if (clienteFiltro) url += `?cliente=${clienteFiltro}`;
      const { data } = await axios.get<Mascota[]>(url, { withCredentials: true });
      setMascotas(data);
    } catch (error) {
      console.error(error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [clienteFiltro, router]);

  useEffect(() => {
    cargarMascotas();
  }, [cargarMascotas]);

  const abrirModal = (mascota: Mascota | null) => {
    setMascotaSeleccionada(mascota);
    setModalAbierto(true);
  };
  const cerrarModal = () => {
    setModalAbierto(false);
    setMascotaSeleccionada(null);
  };

  useEffect(() => {
    setPagina(1);
  }, [busqueda]);

  const mascotasFiltradas = mascotas.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.raza.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(mascotasFiltradas.length / porPagina);
  const mascotasPaginadas = mascotasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  if (loading) return <p>Cargando mascotas...</p>;

  return (
    <main className="max-w-6xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Mascotas</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, especie o raza..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border rounded px-3 py-1"
          />
          <Button onClick={() => abrirModal(null)}>Nueva Mascota</Button>
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
              <th className="text-left p-2 border-b">#EXP</th>
              <th className="text-left p-2 border-b">Nombre</th>
              <th className="text-left p-2 border-b">Especie</th>
              <th className="text-left p-2 border-b">Raza</th>
              <th className="text-left p-2 border-b">Edad</th>
              <th className="text-left p-2 border-b">Peso</th>
              <th className="text-left p-2 border-b">Dueño</th>
              <th className="text-left p-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mascotasPaginadas.map((mascota) => (
              <tr key={mascota.id} className="border-t">
                <td className="p-2">{mascota.expediente}</td>
                <td className="p-2">{mascota.nombre}</td>
                <td className="p-2">{mascota.especie?.nombre ?? 'Desconocido'}</td>
                <td className="p-2">{mascota.raza}</td>
                <td className="p-2">
                  {mascota.edad_aproximada
                    ? `${Math.floor(Number(mascota.edad_aproximada) / 12)}a ${Number(mascota.edad_aproximada) % 12}m`
                    : '—'}
                </td>
                <td className="p-2">{mascota.peso}</td>
                <td className="p-2">
                  {mascota.cliente_nombre ? (
                    <button
                      className="text-blue-600 underline"
                      onClick={() => {
                        // Aquí podrías abrir un modal de cliente pasando cliente_id
                        router.push(`/clientes?cliente=${mascota.cliente_id}`);
                      }}
                    >
                      {mascota.cliente_nombre}
                    </button>
                  ) : '—'}
                </td>
                <td className="p-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => abrirModal(mascota)}>Editar</Button>
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
          </select>{' '}
          mascotas
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={() => setPagina((p) => Math.max(p - 1, 1))} disabled={pagina === 1}>Anterior</Button>
          <span>Página</span>
          <select
            value={pagina}
            onChange={(e) => setPagina(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <span>de {totalPaginas}</span>
          <Button onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))} disabled={pagina === totalPaginas}>Siguiente</Button>
        </div>
      </div>

      <Dialog open={modalAbierto} onOpenChange={cerrarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-center font-medium'>
              {mascotaSeleccionada ? 'Edición de Mascota' : 'Nueva Mascota'}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <EditarMascotaForm
            mascota={mascotaSeleccionada ?? {} as Mascota}
            onClose={cerrarModal}
            onSuccess={(mensaje: string) => {
              setMensajeGlobal(mensaje);
              cargarMascotas();
            }}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}