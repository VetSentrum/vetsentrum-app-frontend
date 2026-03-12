'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface ModuloInfo {
  key: string;
  nombre: string;
  descripcion: string;
}

interface ModulosData {
  disponibles: ModuloInfo[];
  config: Record<string, boolean>;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

// ── Módulo WhatsApp: modal de credenciales ─────────────────────────────────

function WhatsAppModal({
  onClose,
  onActivado,
}: {
  onClose: () => void;
  onActivado: () => void;
}) {
  const [phoneId, setPhoneId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [probando, setProbando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; numero?: string; nombre?: string; error?: string } | null>(null);

  const probar = async () => {
    setProbando(true);
    setResultado(null);
    try {
      const { data } = await axios.post(
        `${API}/empresa/modulos/whatsapp/probar`,
        { phone_number_id: phoneId, access_token: accessToken },
        { withCredentials: true }
      );
      setResultado(data);
    } catch {
      setResultado({ ok: false, error: 'Error de conexión' });
    } finally {
      setProbando(false);
    }
  };

  const activar = async () => {
    setGuardando(true);
    try {
      await axios.patch(
        `${API}/empresa/modulos/credenciales`,
        { key: 'whatsapp', credenciales: { phone_number_id: phoneId, access_token: accessToken } },
        { withCredentials: true }
      );
      await axios.patch(
        `${API}/empresa/modulos`,
        { key: 'whatsapp', activo: true },
        { withCredentials: true }
      );
      onActivado();
    } catch {
      setResultado({ ok: false, error: 'No se pudo guardar la configuración' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Configurar WhatsApp Business</h3>
            <p className="text-xs text-gray-500 mt-0.5">Meta WhatsApp Cloud API</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label>Phone Number ID</Label>
            <p className="text-xs text-gray-400 mb-1">
              developers.facebook.com → tu App → WhatsApp → Configuración → Número de teléfono
            </p>
            <Input
              value={phoneId}
              onChange={e => setPhoneId(e.target.value)}
              placeholder="Ej. 123456789012345"
            />
          </div>

          <div>
            <Label>Access Token</Label>
            <p className="text-xs text-gray-400 mb-1">
              Meta Business Suite → Configuración → Tokens de sistema → o token temporal en la app
            </p>
            <Input
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="EAAxxxxxx..."
              type="password"
            />
          </div>

          {resultado && (
            <div className={`rounded-lg px-4 py-3 text-sm ${resultado.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {resultado.ok ? (
                <>
                  <span className="font-semibold">Conexión exitosa.</span>
                  {resultado.numero && <span className="ml-1">Número: {resultado.numero}</span>}
                  {resultado.nombre && <span className="ml-1">({resultado.nombre})</span>}
                </>
              ) : (
                <><span className="font-semibold">Error:</span> {resultado.error}</>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={probar}
            disabled={!phoneId || !accessToken || probando}
          >
            {probando ? 'Probando...' : 'Probar conexión'}
          </Button>
          <Button
            onClick={activar}
            disabled={!resultado?.ok || guardando}
          >
            {guardando ? 'Activando...' : 'Activar módulo'}
          </Button>
          <button onClick={onClose} className="ml-auto text-sm text-gray-400 hover:text-gray-600">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────

function Toggle({ activo, onChange }: { activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!activo)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export default function EmpresaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modulos, setModulos] = useState<ModulosData | null>(null);
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [togglingModulo, setTogglingModulo] = useState<string | null>(null);
  const [puedeVerModulos, setPuedeVerModulos] = useState(false);

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

  const cargarModulos = useCallback(async () => {
    try {
      const { data } = await axios.get<ModulosData>(`${API}/empresa/modulos`, { withCredentials: true });
      setModulos(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    axios.get<{ email?: string }>(`${API}/auth/me`, { withCredentials: true })
      .then(({ data }) => setPuedeVerModulos(data.email === 'carlos-al.ma@hotmail.com'))
      .catch(() => {});

    Promise.all([
      axios.get(`${API}/empresa`, { withCredentials: true }),
      axios.get<ModulosData>(`${API}/empresa/modulos`, { withCredentials: true }),
    ]).then(([empresaRes, modulosRes]) => {
      if (empresaRes.data) {
        reset({
          nombre: empresaRes.data.nombre ?? '',
          nombre_app: empresaRes.data.nombre_app ?? '',
          subtitulo: empresaRes.data.subtitulo ?? '',
          universidad: empresaRes.data.universidad ?? '',
          direccion: empresaRes.data.direccion ?? '',
          ciudad: empresaRes.data.ciudad ?? '',
          cp: empresaRes.data.cp ?? '',
          telefono: empresaRes.data.telefono ?? '',
          whatsapp: empresaRes.data.whatsapp ?? '',
          email: empresaRes.data.email ?? '',
          cedula_profesional: empresaRes.data.cedula_profesional ?? '',
          logo_url: empresaRes.data.logo_url ?? '',
        });
      }
      setModulos(modulosRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
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

  const toggleModulo = async (key: string, activo: boolean) => {
    // WhatsApp al activar requiere credenciales
    if (key === 'whatsapp' && activo) {
      setWhatsappModal(true);
      return;
    }
    setTogglingModulo(key);
    try {
      await axios.patch(`${API}/empresa/modulos`, { key, activo }, { withCredentials: true });
      await cargarModulos();
    } catch { /* ignore */ } finally {
      setTogglingModulo(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <>
      {whatsappModal && (
        <WhatsAppModal
          onClose={() => setWhatsappModal(false)}
          onActivado={() => { setWhatsappModal(false); cargarModulos(); }}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Datos de la Clínica</h1>

        {/* ── Información de la empresa ───────────────────────────────── */}
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

        {/* ── Módulos ─────────────────────────────────────────────────── */}
        {puedeVerModulos && modulos && (
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Módulos</h2>
              <p className="text-sm text-gray-500 mt-0.5">Activa o desactiva funcionalidades adicionales.</p>
            </div>
            <div className="divide-y">
              {modulos.disponibles.map((modulo) => {
                const activo = modulos.config[modulo.key] ?? false;
                const toggling = togglingModulo === modulo.key;
                return (
                  <div key={modulo.key} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{modulo.nombre}</span>
                        {activo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{modulo.descripcion}</p>
                      {modulo.key === 'whatsapp' && activo && (
                        <button
                          type="button"
                          onClick={() => setWhatsappModal(true)}
                          className="text-xs text-indigo-600 hover:underline mt-1"
                        >
                          Actualizar credenciales
                        </button>
                      )}
                    </div>
                    <div className="flex-shrink-0 pt-0.5">
                      {toggling ? (
                        <span className="text-xs text-gray-400">...</span>
                      ) : (
                        <Toggle activo={activo} onChange={(v) => toggleModulo(modulo.key, v)} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
