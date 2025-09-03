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
    fecha_creacion: Date
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
    const [sortField, setSortField] = useState<'expediente' | 'nombre' | 'cliente_nombre'>('expediente');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [usuario, setUsuario] = useState<{ id: string; rol: "admin" | "recepcion" | "veterinario" } | null>(null);

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
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { withCredentials: true })
        .then(res => setUsuario(res.data))
        .catch(() => setUsuario(null));
    }, []);

    useEffect(() => {
      cargarMascotas();
    }, [cargarMascotas]);

    useEffect(() => {
      setPagina(1);
    }, [busqueda, clienteFiltro]);

    const rolActual = usuario?.rol;

    const abrirModal = (mascota: Mascota | null) => {
      setMascotaSeleccionada(mascota);
      setModalAbierto(true);
    };
    const cerrarModal = () => {
      setModalAbierto(false);
      setMascotaSeleccionada(null);
    };

    const handleSort = (field: 'expediente' | 'nombre' | 'cliente_nombre') => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    };

    const mascotasFiltradas = mascotas.filter(m =>
      (!clienteFiltro || m.cliente_id === clienteFiltro) &&
      (m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.raza.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const mascotasOrdenadas = [...mascotasFiltradas].sort((a, b) => {
      let valA: string | number = a[sortField] ?? '';
      let valB: string | number = b[sortField] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const totalPaginas = Math.ceil(mascotasFiltradas.length / porPagina);
    const mascotasPaginadas = mascotasOrdenadas.slice((pagina - 1) * porPagina, pagina * porPagina);

    if (loading) return <p>Cargando mascotas...</p>;

    function calcularEdadActual(
      fechaRegistro: Date | string,
      edadEnMeses: number
    ): { años: number; meses: number } {
      const fecha = typeof fechaRegistro === "string" ? new Date(fechaRegistro) : fechaRegistro
    
      // edad en meses al momento del registro
      const edadRegistroMs = edadEnMeses * 30.44 * 24 * 60 * 60 * 1000 // meses -> ms aprox
      const nacimientoEst = new Date(fecha.getTime() - edadRegistroMs)
    
      // diferencia contra hoy
      const hoy = new Date()
      let diffMeses =
        (hoy.getFullYear() - nacimientoEst.getFullYear()) * 12 +
        (hoy.getMonth() - nacimientoEst.getMonth())
    
      if (hoy.getDate() < nacimientoEst.getDate()) {
        diffMeses -= 1
      }
    
      const años = Math.floor(diffMeses / 12)
      const meses = diffMeses % 12
    
      return { años, meses }
    }

    return (
      <main className="max-w-6xl mx-auto mt-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Mascotas</h1>
          <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar mascota..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            className="border rounded px-3 py-1"
          />
            {(rolActual === 'recepcion' || rolActual === 'admin') && (
              <Button onClick={() => abrirModal(null)}>Nueva Mascota</Button>
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
                <th className="cursor-pointer p-2 border-b" onClick={() => handleSort('expediente')}>
                  #EXP {sortField === 'expediente' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="cursor-pointer p-2 border-b" onClick={() => handleSort('nombre')}>
                  Nombre {sortField === 'nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-2 border-b">Especie</th>
                <th className="text-left p-2 border-b">Raza</th>
                <th className="text-left p-2 border-b">Edad</th>
                <th className="text-left p-2 border-b">Peso</th>
                <th className="cursor-pointer p-2 border-b" onClick={() => handleSort('cliente_nombre')}>
                  Dueño {sortField === 'cliente_nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
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
                    {mascota.fecha_creacion && mascota.edad_aproximada
                      ? (() => {
                          const { años, meses } = calcularEdadActual(
                            mascota.fecha_creacion,
                            Number(mascota.edad_aproximada)
                          )
                          return `${años}a ${meses}m`
                        })()
                      : '—'}
                  </td>
                  <td className="p-2">{mascota.peso}</td>
                  <td className="p-2">
                    {mascota.cliente_nombre ? (
                      <button
                        className="text-blue-600 underline"
                        onClick={() => {
                          router.push(`/clientes?cliente=${mascota.cliente_id}`);
                        }}
                      >
                        {mascota.cliente_nombre}
                      </button>
                    ) : '—'}
                  </td>
                  <td className="p-2 flex gap-2">
                    {rolActual === 'veterinario' && (
                      <Button variant="outline" size="sm" disabled>Editar</Button>
                    )}
                    {(rolActual === 'recepcion' || rolActual === 'admin') && (
                      <Button variant="outline" size="sm" onClick={() => abrirModal(mascota)}>Editar</Button>
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
          <DialogContent className="max-w-3xl w-full">
            <DialogHeader>
              <DialogTitle>{mascotaSeleccionada ? 'Editar Mascota' : 'Nueva Mascota'}</DialogTitle>
              <DialogDescription>
                {mascotaSeleccionada ? 'Completa los datos de la mascota y guarda los cambios.' : 'Completa los datos de la mascota y guarda sus datos.'}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[80vh] overflow-y-auto pr-2">
              <EditarMascotaForm
                mascota={mascotaSeleccionada ?? {} as Mascota}
                onClose={cerrarModal}
                onSuccess={(mensaje: string) => {
                  setMensajeGlobal(mensaje);
                  cargarMascotas();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </main>
    );
  }