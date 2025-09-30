'use client';

import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check } from 'lucide-react';

interface ConsultaFormData {
  id?: string;
  mascota_id: string;
  veterinario_id?: string;
  
  // Datos generales
  paciente: string;
  cliente: string; // Dueño
  fecha: string;
  peso: string;
  edad: string;
  raza: string;
  especie: string;
  otra_especie: string;
  sexo: string;
  motivo_consulta: string;
  desde_cuando_mascota: string;
  otras_mascotas_check: boolean;
  otras_mascotas: string;
  habitat: string;
  dieta: string;
  historial_enfermedades: string;
  
  // Estado general
  vacunas: string;
  desparasitacion: string;
  desparasitacion_tipo: string[];
  rf: string;
  fr: string;
  reflejo_pupilar: string;
  anisocoria: string;
  nistagmo: string;
  mucosas: string;
  pe: string;
  pop: string;
  temperatura: string;
  fc: string;
  sonido_cardiaco: string;
  tllc: string;
  deshidratacion: string;
  condicion_corporal: string;
  palp_abdom: string;
  actitud: string;
  historia_clinica: string;
  
  // Sistemas
  // Digestivo
  sistema_digestivo_na: boolean;
  apetito: string;
  ingesta_agua: string;
  vomito: string;
  vomito_frecuencia: string;
  vomito_aspecto: string;
  defeca: string;
  defeca_frecuencia: string;
  defeca_aspecto: string;
  estrenimiento: string;
  flatulencia: string;
  
  // Cavidad oral
  cavidad_oral_na: boolean;
  sarro: string;
  gingivitis: string;
  sangrado: string;
  halitosis: string;
  hipersalivacion: string;
  
  // Nariz/Faringe
  nariz_faringe_na: boolean;
  aspecto_nasal: string;
  epistaxis: string;
  descarga_nasal: string;
  resequedad_nariz: string;
  
  // Respiratorio
  respiratorio_na: boolean;
  estornudos: string;
  estornudos_frecuencia: string;
  disnea_respiratorio: string;
  disnea_frecuencia: string;
  tos: string;
  tos_frecuencia: string;
  
  // Urogenital
  urogenital_na: boolean;
  orina: string;
  orina_frecuencia: string;
  orina_aspecto: string;
  castrado: string;
  se_ha_cruzado: string;
  estado_gestante: string;
  ultimo_parto: string;
  descarga_vulva_prepucio: string;
  
  // Tegumentario
  tegumentario_na: boolean;
  alopecia: string;
  lesiones: string;
  aspecto_lesiones: string;
  tipo_lesion: string;
  parasitos_tegumentario: string;
  parasitos_tipo: string[];
  
  // Musculoesquelético
  musculoesqueletico_na: boolean;
  movimiento: string;
  movimiento_desde_cuando: string;
  miembro_afectado: string;
  
  // Nervioso
  nervioso_na: boolean;
  incoordinacion: string;
  golpes_cabeza: string;
  dismetria: string;
  propiocepcion: string;
  
  // Cardiaco
  cardiaco_na: boolean;
  fatiga: string;
  fatiga_frecuencia: string;
  tos_nocturna: string;
  tos_nocturna_frecuencia: string;
  disnea_cardiaco: string;
  cianosis: string;
  descarga_cardiaco: string;
  
  // Oídos
  oidos_na: boolean;
  mal_olor_oidos: string;
  se_rasca_oidos: string;
  escucha: string;
  parasitos_oidos: string;
  parasitos_oidos_cual: string;
  descarga_oidos: string;
  
  // Ojos
  ojos_na: boolean;
  descarga_ojos: string;
  schirmer: string;
  fluoresceina: string;
  observaciones_ojos: string;
  
  // Diagnóstico y manejo
  diagnostico_presuntivo: string;
  diagnostico_diferencial: string;
  examenes_laboratorio: string[];
  manejo: string[];
  detalle_medicamentos: string;
  indicaciones: string;
  proxima_cita: string;
  notas: string;
}

interface Props {
  consulta: ConsultaFormData | null;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

export function EditarConsultaForm({ consulta, onClose, onSuccess }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ConsultaFormData>({
    defaultValues: consulta ?? {
      mascota_id: '',
      motivo_consulta: '',
      // Inicializar todos los campos con valores por defecto
      paciente: '',
      cliente: '',
      fecha: new Date().toISOString().split('T')[0],
      peso: '',
      edad: '',
      raza: '',
      especie: '',
      otra_especie: '',
      sexo: '',
      desde_cuando_mascota: '',
      otras_mascotas_check: false,
      otras_mascotas: '',
      habitat: '',
      dieta: '',
      historial_enfermedades: '',
      vacunas: '',
      desparasitacion: '',
      desparasitacion_tipo: [],
      rf: '',
      fr: '',
      reflejo_pupilar: '',
      anisocoria: '',
      nistagmo: '',
      mucosas: '',
      pe: '',
      pop: '',
      temperatura: '',
      fc: '',
      sonido_cardiaco: '',
      tllc: '',
      deshidratacion: '',
      condicion_corporal: '',
      palp_abdom: '',
      actitud: '',
      historia_clinica: '',
      sistema_digestivo_na: true,
      apetito: '',
      ingesta_agua: '',
      vomito: '',
      vomito_frecuencia: '',
      vomito_aspecto: '',
      defeca: '',
      defeca_frecuencia: '',
      defeca_aspecto: '',
      estrenimiento: '',
      flatulencia: '',
      cavidad_oral_na: true,
      sarro: '',
      gingivitis: '',
      sangrado: '',
      halitosis: '',
      hipersalivacion: '',
      nariz_faringe_na: true,
      aspecto_nasal: '',
      epistaxis: '',
      descarga_nasal: '',
      resequedad_nariz: '',
      respiratorio_na: true,
      estornudos: '',
      estornudos_frecuencia: '',
      disnea_respiratorio: '',
      disnea_frecuencia: '',
      tos: '',
      tos_frecuencia: '',
      urogenital_na: true,
      orina: '',
      orina_frecuencia: '',
      orina_aspecto: '',
      castrado: '',
      se_ha_cruzado: '',
      estado_gestante: '',
      ultimo_parto: '',
      descarga_vulva_prepucio: '',
      tegumentario_na: true,
      alopecia: '',
      lesiones: '',
      aspecto_lesiones: '',
      tipo_lesion: '',
      parasitos_tegumentario: '',
      parasitos_tipo: [],
      musculoesqueletico_na: true,
      movimiento: '',
      movimiento_desde_cuando: '',
      miembro_afectado: '',
      nervioso_na: true,
      incoordinacion: '',
      golpes_cabeza: '',
      dismetria: '',
      propiocepcion: '',
      cardiaco_na: true,
      fatiga: '',
      fatiga_frecuencia: '',
      tos_nocturna: '',
      tos_nocturna_frecuencia: '',
      disnea_cardiaco: '',
      cianosis: '',
      descarga_cardiaco: '',
      oidos_na: true,
      mal_olor_oidos: '',
      se_rasca_oidos: '',
      escucha: '',
      parasitos_oidos: '',
      parasitos_oidos_cual: '',
      descarga_oidos: '',
      ojos_na: true,
      descarga_ojos: '',
      schirmer: '',
      fluoresceina: '',
      observaciones_ojos: '',
      diagnostico_presuntivo: '',
      diagnostico_diferencial: '',
      examenes_laboratorio: [],
      manejo: [],
      indicaciones: '',
      proxima_cita: '',
      notas: '',
    },
  });

  const onSubmit = async (data: ConsultaFormData) => {
    setGuardando(true);
    setError(null);

    try {
      if (consulta?.id) {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/consultas/${consulta.id}`,
          data,
          { withCredentials: true }
        );
        onSuccess('Consulta actualizada');
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/consultas`,
          data,
          { withCredentials: true }
        );
        onSuccess('Consulta creada');
      }
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al guardar consulta');
    } finally {
      setGuardando(false);
    }
  };


  const manejoSeleccionado = form.watch("manejo");
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="datos-generales">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="datos-generales">Datos Generales</TabsTrigger>
            <TabsTrigger value="estado-general">Estado General</TabsTrigger>
            <TabsTrigger value="sistemas">Sistemas</TabsTrigger>
            <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
            <TabsTrigger value="indicaciones">Indicaciones</TabsTrigger>
          </TabsList>

          {/* Datos Generales */}
          <TabsContent value="datos-generales" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="paciente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente TO-DO: Autoload</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dueño TO-DO: Autoload</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="raza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raza TO-DO: Autoload</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="especie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especie TO-DO: Autoload</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              <FormField
                control={form.control}
                name="sexo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo TO-DO: Autoload</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="edad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad TO-DO: Autoload</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="habitat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hábitat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione hábitat" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="interior">Interior</SelectItem>
                        <SelectItem value="exterior">Exterior</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="peso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desde_cuando_mascota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Desde cuándo tiene a su mascota?</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otras_mascotas_check"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                    <div className="flex items-center gap-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer text-sm mb-0">
                        Otras mascotas
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="otras_mascotas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indique</FormLabel>
                    <FormControl><Input {...field} disabled={form.watch('otras_mascotas_check') !== true} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="motivo_consulta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de consulta</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dieta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dieta</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="historial_enfermedades"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Historial de enfermedades</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </TabsContent>

          {/* Estado General */}
          <TabsContent value="estado-general" className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              <FormField
                control={form.control}
                name="vacunas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vacunas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desparasitacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desparasitación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desparasitacion_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de desparasitación</FormLabel>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="desparasitacion_int"
                          checked={field.value?.includes('interna')}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, 'interna']);
                            } else {
                              field.onChange(currentValue.filter(v => v !== 'interna'));
                            }
                          }}
                          disabled={form.watch('desparasitacion') !== 'si'}
                        />
                        <label htmlFor="desparasitacion_int">Interna</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="desparasitacion_ext"
                          checked={field.value?.includes('externa')}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, 'externa']);
                            } else {
                              field.onChange(currentValue.filter(v => v !== 'externa'));
                            }
                          }}
                          disabled={form.watch('desparasitacion') !== 'si'}
                        />
                        <label htmlFor="desparasitacion_ext">Externa</label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actitud</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione actitud" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="alerta">Alerta</SelectItem>
                        <SelectItem value="agresivo">Agresivo</SelectItem>
                        <SelectItem value="exitado">Exitado</SelectItem>
                        <SelectItem value="deprimido">Deprimido</SelectItem>
                        <SelectItem value="comatoso">Comatoso</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperatura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>T°</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="fc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FC</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FR</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sonido_cardiaco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sonido cardiaco</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mucosas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mucosas</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-6 gap-2">
              <FormField
                control={form.control}
                name="reflejo_pupilar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reflejo Pupilar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="+/-" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+">+</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="anisocoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anisocoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="+/-" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+">+</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nistagmo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nistagmo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="+/-" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+">+</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RF</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="+/-" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+">+</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PE</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="+/-" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+">+</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>POP</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="+/-" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+">+</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tllc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TLLC</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deshidratacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deshidratación</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condicion_corporal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición Corporal</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="palp_abdom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palpación Abdominal</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="historia_clinica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historia clínica</FormLabel>
                  <FormControl><Textarea {...field} rows={3}/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </TabsContent>

          {/* Sistemas */}
          <TabsContent value="sistemas" className="space-y-6">
            {/* Sistema digestivo */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Sistema Digestivo</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="sistema_digestivo_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('sistema_digestivo_na') && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-2">
                  <FormField
                    control={form.control}
                    name="apetito"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Apetito</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estrenimiento"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Estreñimiento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="flatulencia"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Flatulencia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                      control={form.control}
                      name="ingesta_agua"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Ingesta de agua</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="mas">Más</SelectItem>
                              <SelectItem value="menos">Menos</SelectItem>
                          </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                      )}
                  />

                </div>

                <div className="grid grid-cols-3 gap-3 mb-2">
                  <FormField
                    control={form.control}
                    name="vomito"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vómito</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="si">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                    )}
                  />
                  {form.watch('vomito') === 'si' && (
                    <>
                      <FormField
                        control={form.control}
                        name="vomito_frecuencia"
                        render={({ field }) => (
                        <FormItem>
                          <FormLabel>Veces por día</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vomito_aspecto"
                        render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspecto</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-2">
                  <FormField
                    control={form.control}
                    name="defeca"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defeca</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="si">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                    )}
                  />
                  {form.watch('defeca') === 'si' && (
                    <>
                      <FormField
                        control={form.control}
                        name="defeca_frecuencia"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Veces por día</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="defeca_aspecto"
                        render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspecto</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </>
              )}
            </div>
            
            {/* Cavidad oral */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Cavidad Oral</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="cavidad_oral_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
                            
              {!form.watch('cavidad_oral_na') && (
                <>
                  <div className="grid grid-cols-5 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="sarro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sarro</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gingivitis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gingivitis</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sangrado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sangrado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="halitosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Halitosis</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hipersalivacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hipersalivación</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Nariz / Faringe */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Nariz / Faringe</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="nariz_faringe_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-poiner text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('nariz_faringe_na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="descarga_nasal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descarga nasal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('descarga_nasal') === 'si' && (
                      <>
                        <FormField
                          control={form.control}
                          name="aspecto_nasal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Aspecto</FormLabel>
                              <FormControl><Input { ...field }/></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {form.watch('descarga_nasal') !== 'si' && (
                      <></>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="epistaxis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Epistaxis</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="resequedad_nariz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resequedad</FormLabel>
                          <FormControl><Input { ... field }/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Sistema respiratorio */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Sistema Respiratorio</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="respiratorio_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('respiratorio_na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="tos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tos</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tos_frecuencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('tos') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="disnea_respiratorio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disnea</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="disnea_frecuencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('disnea_respiratorio') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estornudos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estornudos</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estornudos_frecuencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('estornudos') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Sistema urogenital */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Sistema Urogenital</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="urogenital_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('urogenital_na') && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="orina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orina</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="orina_frecuencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('orina') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="orina_aspecto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspecto</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('orina') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="castrado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Castrado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="se_ha_cruzado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Se ha cruzado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estado_gestante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>A estado gestado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ultimo_parto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Último parto</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('estado_gestante') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descarga_vulva_prepucio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descarga vulva/prepucio</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Sistema tegumentario */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Sistema Tegumentario</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="tegumentario_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('tegumentario_na') && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="alopecia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alopecia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parasitos_tegumentario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parasitos</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parasitos_tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} disabled={form.watch('parasitos_tegumentario') !== "si"} >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="pulgas">Pulgas</SelectItem>
                            <SelectItem value="garrapatas">Garrapatas</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lesiones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesiones</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tipo_lesion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de lesión</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('lesiones') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="aspecto_lesiones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspecto</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('lesiones') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </>
              )}
            </div>

            {/* Sistema muscoesqueletico */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Sistema Muscoesquelético</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="musculoesqueletico_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('musculoesqueletico_na') && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="movimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Movimiento</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="movimiento_desde_cuando"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desde cuando</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="miembro_afectado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Miembro afectado</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>TO-DO: Agregar imagen de miembros afectados</FormLabel>
                    </FormItem>

                  </div>
                </>
              )}
            </div>

            {/* Sistema nervioso */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Sistema Nervioso</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="nervioso_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('nervioso_na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="incoordinacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incordinación</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="golpes_cabeza"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Golpes en cabeza</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dismetria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dismetria</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propiocepcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Propiocepción</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </>
              )}
            </div>

            {/* Sistema cardiaco */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Sistema Cardiaco</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="cardiaco_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('cardiaco_na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="disnea_cardiaco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disnea</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cianosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cianosis</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fatiga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fatiga</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fatiga_frecuencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('fatiga') !== "si"} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tos_nocturna"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tos nocturna</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tos_nocturna_frecuencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('tos_nocturna') !== "si"}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </>
              )}
            </div>

            {/* Oidos */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Oídos TO-DO: ¿DER | IZQ?</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="oidos_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('oidos_na') && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="descarga_oidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descarga</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="parasitos_oidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parásitos</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parasitos_oidos_cual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuál</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('parasitos_oidos') !== "si"}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mal_olor_oidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mal olor</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="se_rasca_oidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Se rasca</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="escucha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escucha</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </>
              )}
            </div>

            {/* Ojos */}
            <div className="border p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Ojos TO-DO: ¿OD | OI?</h3>
                <span className="text-muted-foreground">—</span>
                <FormField
                  control={form.control}
                  name="ojos_na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm mb-0">
                          No aplica
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('ojos_na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="descarga_ojos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descarga</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schirmer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schirmer</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fluoresceina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fluorescencia</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="observaciones_ojos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observaciones</FormLabel>
                          <FormControl><Input { ...field } /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </>
              )}
            </div>
            
          </TabsContent>

          {/* Diagnóstico */}
          <TabsContent value="diagnostico" className="space-y-4">
            <FormField
              control={form.control}
              name="diagnostico_presuntivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico presuntivo</FormLabel>
                  <FormControl><Textarea {...field} rows={3} /></FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostico_diferencial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico diferencial</FormLabel>
                  <FormControl><Textarea {...field} rows={3} /></FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="examenes_laboratorio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exámenes de laboratorio</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {['Hemograma', 'Química Sanguínea', 'Urianálisis', 'Coprológico', 'Raspado de piel', 'Citología', 'Otro'].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lab_${item}`}
                          checked={field.value?.includes(item)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, item]);
                            } else {
                              field.onChange(currentValue.filter(v => v !== item));
                            }
                          }}
                        />
                        <label htmlFor={`lab_${item}`}>{item}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manejo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manejo</FormLabel>
                  <div className="grid grid-cols-5 gap-2">
                    {['Hospitalización', 'Medicamentos', 'Cirugía', 'Control', 'Otro'].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`manejo_${item}`}
                          checked={field.value?.includes(item)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, item]);
                            } else {
                              field.onChange(currentValue.filter(v => v !== item));
                            }
                          }}
                        />
                        <label htmlFor={`manejo_${item}`}>{item}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo condicional */}
            {manejoSeleccionado === "Medicamentos" && (
              <FormField
                control={form.control}
                name="detalle_medicamentos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalle de medicamentos</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Especifica medicamentos y dosis" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </TabsContent>

          {/* Indicaciones */}
          <TabsContent value="indicaciones" className="space-y-4">
            <FormField
              control={form.control}
              name="indicaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indicaciones</FormLabel>
                  <FormControl><Textarea {...field} rows={3} /></FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proxima_cita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima cita</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl><Textarea {...field} rows={3} /></FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>

        {error && <p className="text-red-600">{error}</p>}
      </form>
    </Form>
  );
}