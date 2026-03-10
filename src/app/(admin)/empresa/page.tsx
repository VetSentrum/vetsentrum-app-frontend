'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmpresaForm {
  nombre: string;
  nombre_app: string;
  subtitulo: string;
  universidad: string;
  direccion: string;
  ciudad: string;
  cp: string;
  telefono: string;
  whatsapp: string;
  email: string;
  cedula_profesional: string;
  logo_url: string;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function EmpresaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset } = useForm<EmpresaForm>({
    defaultValues: {
      nombre: '',
      nombre_app: '',
      subtitulo: '',
      universidad: '',
      direccion: '',
      ciudad: '',
      cp: '',
      telefono: '',
      whatsapp: '',
      email: '',
      cedula_profesional: '',
      logo_url: '',
    },
  });

  useEffect(() => {
    axios
      .get(`${API}/empresa`, { withCredentials: true })
      .then((res) => {
        if (res.data) {
          reset({
            nombre: res.data.nombre ?? '',
            nombre_app: res.data.nombre_app ?? '',
            subtitulo: res.data.subtitulo ?? '',
            universidad: res.data.universidad ?? '',
            direccion: res.data.direccion ?? '',
            ciudad: res.data.ciudad ?? '',
            cp: res.data.cp ?? '',
            telefono: res.data.telefono ?? '',
            whatsapp: res.data.whatsapp ?? '',
            email: res.data.email ?? '',
            cedula_profesional: res.data.cedula_profesional ?? '',
            logo_url: res.data.logo_url ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: EmpresaForm) => {
    setSaving(true);
    setSaved(false);
    try {
      await axios.patch(`${API}/empresa`, data, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Datos de la Clínica</h1>
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Información de la empresa</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nombre de la clínica *</Label>
              <Input {...register('nombre')} placeholder="Ej. Clínica Veterinaria VetSentrum" />
            </div>

            <div className="col-span-2">
              <Label>Nombre de la app (barra lateral)</Label>
              <p className="text-xs text-muted-foreground mb-1">
                Nombre corto que aparece en el sidebar. Si se deja vacío, se usa el nombre completo de la clínica.
              </p>
              <Input {...register('nombre_app')} placeholder="Ej. VetSentrum" />
            </div>

            <div className="col-span-2">
              <Label>Subtítulo / Eslogan</Label>
              <Input {...register('subtitulo')} placeholder="Ej. Nuestro compromiso... salvar vidas" />
            </div>

            <div className="col-span-2">
              <Label>Universidad / Institución</Label>
              <Input {...register('universidad')} placeholder="Ej. UNAM - Medicina Veterinaria y Zootecnia" />
            </div>

            <div className="col-span-2">
              <Label>Dirección</Label>
              <Input {...register('direccion')} placeholder="Calle, número, colonia" />
            </div>

            <div>
              <Label>Ciudad</Label>
              <Input {...register('ciudad')} placeholder="Ej. Ciudad de México" />
            </div>

            <div>
              <Label>Código Postal</Label>
              <Input {...register('cp')} placeholder="Ej. 06600" />
            </div>

            <div>
              <Label>Teléfono</Label>
              <Input {...register('telefono')} placeholder="Ej. 55 1234 5678" />
            </div>

            <div>
              <Label>WhatsApp</Label>
              <Input {...register('whatsapp')} placeholder="Ej. 55 9876 5432" />
            </div>

            <div className="col-span-2">
              <Label>Email</Label>
              <Input {...register('email')} type="email" placeholder="contacto@clinica.com" />
            </div>

            <div className="col-span-2">
              <Label>Cédula Profesional</Label>
              <Input {...register('cedula_profesional')} placeholder="Ej. 12345678" />
            </div>

            <div className="col-span-2">
              <Label>URL del Logo</Label>
              <Input {...register('logo_url')} placeholder="https://... (imagen pública)" />
            </div>

            <div className="col-span-2 flex items-center gap-4 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              {saved && <span className="text-sm text-green-600">Guardado correctamente.</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
