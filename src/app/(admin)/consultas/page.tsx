// page.tsx - actualizado
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EditarConsultaForm } from '@/components/EditarConsultaForm';
import { useSearchParams } from 'next/navigation';

interface ConsultaResumen {
    id: string
    motivo_consulta: string
    fecha: string
    mascota: { nombre: string }
}

export interface ConsultaFormData {
    id?: string
    mascota_id: string
    motivo_consulta: string
    historia_clinica?: string
    diagnostico_presuntivo?: string
    diagnostico_diferencial?: string
    indicaciones?: string
    proxima_cita?: string
    notas?: string
}

export default function ConsultasPage() {
  const searchParams = useSearchParams();
  const citaId = searchParams.get('cita_id');
  
  const [consultas, setConsultas] = useState<ConsultaResumen[]>([]);
  const [seleccionada, setSeleccionada] = useState<ConsultaResumen | null>(null);
  const [open, setOpen] = useState(false);
  const [citaData, setCitaData] = useState<any>(null);

  const cargar = async () => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/consultas`, { withCredentials: true });
    setConsultas(data);
  };

  // Cargar datos de la cita si viene desde registrar ingreso
  useEffect(() => {
    const cargarCitaData = async () => {
      if (citaId) {
        try {
          const { data } = await axios.patch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/citas/${citaId}/ingreso`,
            {},
            { withCredentials: true }
          );
          setCitaData(data);
          setOpen(true); // Abrir automáticamente el formulario
        } catch (error) {
          console.error('Error al cargar datos de la cita:', error);
        }
      }
    };

    if (citaId) {
      cargarCitaData();
    }
  }, [citaId]);

  useEffect(() => { 
    cargar(); 
  }, []);

  const handleNuevaConsulta = () => {
    setSeleccionada(null);
    setCitaData(null);
    setOpen(true);
  };

  const handleEditarConsulta = (consulta: ConsultaResumen) => {
    setSeleccionada(consulta);
    setCitaData(null);
    setOpen(true);
  };

  return (
    <main className="max-w-6xl mx-auto mt-10">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Consultas</h1>
        <Button onClick={handleNuevaConsulta}>Nueva Consulta</Button>
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Fecha</th><th>Mascota</th><th>Motivo</th><th></th>
          </tr>
        </thead>
        <tbody>
          {consultas.map(c => (
            <tr key={c.id}>
              <td>{new Date(c.fecha).toLocaleDateString()}</td>
              <td>{c.mascota?.nombre}</td>
              <td>{c.motivo_consulta}</td>
              <td><Button size="sm" onClick={() => handleEditarConsulta(c)}>Editar</Button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl min-w-[80vw] w-full">
            <DialogHeader className="px-1 pt-1 pb-1 border-b">
            <DialogTitle>
              {seleccionada ? 'Editar consulta' : citaData ? 'Consulta desde cita' : 'Nueva consulta'}
            </DialogTitle>
            <DialogDescription className="font-medium"></DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[80vh] overflow-y-auto pr-2">
            <EditarConsultaForm
              consulta={
                seleccionada
                ? {
                    id: seleccionada.id,
                    mascota_id: '',
                    motivo_consulta: seleccionada.motivo_consulta,
                  }
                : null
              }
              citaData={citaData}
              onSuccess={() => {
                cargar();
                setOpen(false);
                setCitaData(null);
              }}
              onClose={() => {
                setOpen(false);
                setCitaData(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}