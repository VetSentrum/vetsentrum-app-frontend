'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';

export interface ConsultaFormData {
  id?: string;
  cliente_id: string;
  mascota_id: string;
  veterinario_id: string;
  fecha: string;
  motivo: string;
  evaluacion_clinica: EvaluacionClinica;
  creado_en?: string;
  actualizado_en?: string;
}

export interface EvaluacionClinica {
  datos_generales: DatosGenerales;
  estado_general: EstadoGeneral;
  sistemas: Sistemas;
  diagnostico: Diagnostico;
  indicaciones: Indicaciones;
}

export interface DatosGenerales {
  raza: string;
  especie: string;
  sexo: string;
  edad: string;
  peso: string;
  habitat: string;
  otras_mascotas_check: boolean;
  otras_mascotas: string;
  desde_cuando_mascota: string;
  dieta: string;
  historial_enfermedades: string;
}

export interface EstadoGeneral {
  vacunas: boolean;
  desparasitacion: boolean;
  tipo_desparacitacion: string[];
  actitud: string;
  temperatura: string;
  fc: string;
  fr: string;
  sonido_cardiaco: string;
  mucosas: string;
  reflejo_pupilar: string;
  anisocoria: string;
  nistagmo: string;
  rf: string;
  pe: string;
  pop: string;
  tllc: string;
  deshidratacion: string;
  condicion_corporal: string;
  palpacion_abdominal: string;
  historia_clinica: string;
}

export interface Sistemas {
  sistema_digestivo: SistemaDigestivo;
  cavidad_oral: CavidadOral;
  nariz_faringe: NarizFaringe;
  sistema_respiratorio: SistemaRespiratorio;
  sistema_urogenital: SistemaUrogenital;
  sistema_tegumentario: SistemaTegumentario;
  sistema_muscoesqueletico: SistemaMuscoesqueletico;
  sistema_nervioso: SistemaNervioso;
  sistema_cardiaco: SistemaCardiaco;
  oidos: Oidos;
  ojos: Ojos;
}

export interface SistemaDigestivo {
  na: boolean;
  apetito: string;
  estrenimiento: string;
  flatulencia: string;
  ingesta_agua: string;
  vomito: boolean;
  veces_vomito: string;
  aspecto_vomito: string;
  defeca: boolean;
  veces_defeca: string;
  aspecto_defeca: string;
}

export interface CavidadOral {
  na: boolean;
  sarro: string;
  gingivitis: string;
  sangrado: boolean;
  halitosis: boolean;
  hipersalivacion: boolean;
}

export interface NarizFaringe {
  na: boolean;
  descarga_nasal: boolean;
  aspecto_descarga: string;
  epistaxis: boolean;
  resequedad: string;
}

export interface SistemaRespiratorio {
  na: boolean;
  tos: boolean;
  frecuencia_tos: string;
  disnea: boolean;
  frecuencia_disnea: string;
  estornudos: boolean;
  frecuencia_estornudos: string;
}

export interface SistemaUrogenital {
  na: boolean;
  orina: boolean;
  frecuencia_orina: string;
  aspecto_orina: string;
  castrado: boolean;
  se_ha_cruzado: boolean;
  ha_gestado: boolean;
  ultimo_parto: string;
  descarga_vulva_prepucio: string;
}

export interface SistemaTegumentario {
  na: boolean;
  alopecia: boolean;
  parasitos: boolean;
  tipo_parasitos: string;
  lesiones: boolean;
  tipo_lesion: string;
  aspecto_lesion: string;
}

export interface SistemaMuscoesqueletico {
  na: boolean;
  movimiento: string;
  desde_cuando: string;
  miembro_afectado: string;
}

export interface SistemaNervioso {
  na: boolean;
  incordinacion: boolean;
  golpes_cabeza: boolean;
  dismetria: string;
  propiocepcion: string;
}

export interface SistemaCardiaco {
  na: boolean;
  disnea: boolean;
  cianosis: boolean;
  fatiga: boolean;
  frecuencia_fatiga: string;
  tos_nocturna: boolean;
  frecuencia_tos_nocturna: string;
}

export interface Oidos {
  na: boolean;
  izq_der: string;
  descarga: string;
  parasitos: boolean;
  tipo_parasitos: string;
  mal_olor: boolean;
  se_rasca: boolean;
  escucha: boolean;
}

export interface Ojos {
  na: boolean;
  izq_der: string;
  descarga: string;
  schirmer: string;
  fluorescencia: string;
  observaciones: string;
}

export interface Diagnostico {
  dx_presuntivo: string;
  dx_diferencial: string;
  examenes_laboratorio: ExamenesLaboratorio;
  manejo: Manejo;
}

export interface ExamenesLaboratorio {
  hemograma: boolean;
  quimica_sanguinea: boolean;
  urianalisis: boolean;
  coprologico: boolean;
  raspado_piel: boolean;
  citologia: boolean;
  otro: boolean;
  especifique_otro: string;
}

export interface Manejo {
  hospitalizacion: boolean;
  medicamentos: boolean;
  especifique_medicamentos: string;
  cirugia: boolean;
  control: boolean;
  otro: boolean;
  especifique_otro: string;
}

export interface Indicaciones {
  indicaciones: string;
  proxima_cita?: string; // Puede vincularse con la tabla Cita
  notas: string;
}

interface Props {
  consulta: ConsultaFormData | null;
  citaData?: any;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

interface Cliente {
  id: string;
  nombre_completo: string;
  telefono?: string;
  email?: string;
}

interface Mascota {
  id: string;
  nombre: string;
  raza?: string;
  especie?: { nombre: string };
  sexo?: string;
  edad_aproximada?: number;
  peso?: number;
  cliente_id: string;
}

export function EditarConsultaForm({ consulta, citaData, onClose, onSuccess }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabsEnabled, setTabsEnabled] = useState(false);
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState('');
  const [clientesOpen, setClientesOpen] = useState(false);
  const [clientesSearch, setClientesSearch] = useState('');
  const [clientesLoading, setClientesLoading] = useState(false);
  
  const form = useForm<ConsultaFormData>({
    defaultValues: consulta ?? {
      id: '',
      cliente_id: '',
      mascota_id: '',
      veterinario_id: '',
      fecha: new Date().toISOString().split('T')[0],
      motivo: '',
  
      evaluacion_clinica: {
        datos_generales: {
          raza: '',
          especie: '',
          sexo: '',
          edad: '',
          peso: '',
          habitat: '',
          otras_mascotas_check: false,
          otras_mascotas: '',
          desde_cuando_mascota: '',
          dieta: '',
          historial_enfermedades: '',
        },
  
        estado_general: {
          vacunas: false,
          desparasitacion: false,
          tipo_desparacitacion: [],
          actitud: '',
          temperatura: '',
          fc: '',
          fr: '',
          sonido_cardiaco: '',
          mucosas: '',
          reflejo_pupilar: '',
          anisocoria: '',
          nistagmo: '',
          rf: '',
          pe: '',
          pop: '',
          tllc: '',
          deshidratacion: '',
          condicion_corporal: '',
          palpacion_abdominal: '',
          historia_clinica: '',
        },
  
        sistemas: {
          sistema_digestivo: {
            na: true,
            apetito: '',
            estrenimiento: '',
            flatulencia: '',
            ingesta_agua: '',
            vomito: false,
            veces_vomito: '',
            aspecto_vomito: '',
            defeca: false,
            veces_defeca: '',
            aspecto_defeca: '',
          },
          cavidad_oral: {
            na: true,
            sarro: '',
            gingivitis: '',
            sangrado: false,
            halitosis: false,
            hipersalivacion: false,
          },
          nariz_faringe: {
            na: true,
            descarga_nasal: false,
            aspecto_descarga: '',
            epistaxis: false,
            resequedad: '',
          },
          sistema_respiratorio: {
            na: true,
            tos: false,
            frecuencia_tos: '',
            disnea: false,
            frecuencia_disnea: '',
            estornudos: false,
            frecuencia_estornudos: '',
          },
          sistema_urogenital: {
            na: true,
            orina: false,
            frecuencia_orina: '',
            aspecto_orina: '',
            castrado: false,
            se_ha_cruzado: false,
            ha_gestado: false,
            ultimo_parto: '',
            descarga_vulva_prepucio: '',
          },
          sistema_tegumentario: {
            na: true,
            alopecia: false,
            parasitos: false,
            tipo_parasitos: '',
            lesiones: false,
            tipo_lesion: '',
            aspecto_lesion: '',
          },
          sistema_muscoesqueletico: {
            na: true,
            movimiento: '',
            desde_cuando: '',
            miembro_afectado: '',
          },
          sistema_nervioso: {
            na: true,
            incordinacion: false,
            golpes_cabeza: false,
            dismetria: '',
            propiocepcion: '',
          },
          sistema_cardiaco: {
            na: true,
            disnea: false,
            cianosis: false,
            fatiga: false,
            frecuencia_fatiga: '',
            tos_nocturna: false,
            frecuencia_tos_nocturna: '',
          },
          oidos: {
            na: true,
            izq_der: '',
            descarga: '',
            parasitos: false,
            tipo_parasitos: '',
            mal_olor: false,
            se_rasca: false,
            escucha: false,
          },
          ojos: {
            na: true,
            izq_der: '',
            descarga: '',
            schirmer: '',
            fluorescencia: '',
            observaciones: '',
          },
        },
  
        diagnostico: {
          dx_presuntivo: '',
          dx_diferencial: '',
          examenes_laboratorio: {
            hemograma: false,
            quimica_sanguinea: false,
            urianalisis: false,
            coprologico: false,
            raspado_piel: false,
            citologia: false,
            otro: false,
            especifique_otro: '',
          },
          manejo: {
            hospitalizacion: false,
            medicamentos: false,
            especifique_medicamentos: '',
            cirugia: false,
            control: false,
            otro: false,
            especifique_otro: '',
          },
        },
  
        indicaciones: {
          indicaciones: '',
          proxima_cita: '',
          notas: '',
        },
      },
  
      creado_en: '',
      actualizado_en: '',
    },
  });

  useEffect(() => {
    if (consulta?.id) {
      // Si estamos editando una consulta existente, habilitar tabs
      setTabsEnabled(true);
      
      // También cargar cliente y mascota si es necesario
      if (consulta.mascota_id && !citaData) {
        // Cargar datos de la mascota y cliente
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/mascotas/${consulta.mascota_id}`, { withCredentials: true })
          .then(res => {
            const mascota = res.data;
            setMascotaSeleccionada(mascota.id);
            setClienteSeleccionado(mascota.cliente_id);
          })
          .catch(console.error);
      }
    }
  }, [consulta, citaData]);

  // Autocompletar desde datos de cita
  useEffect(() => {
    if (citaData) {
      const mascota = citaData.mascota;
  
      form.setValue('mascota_id', mascota.id);
      form.setValue('motivo', citaData.motivo);
      form.setValue('fecha', new Date().toISOString().split('T')[0]);
  
      setClienteSeleccionado(mascota.cliente_id);
      setMascotaSeleccionada(mascota.id);
  
      setTabsEnabled(true);
    }
  }, [citaData, form]);
  
  useEffect(() => {
    if (mascotaSeleccionada && !citaData) {
      axios
        .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/mascotas/${mascotaSeleccionada}`, {
          withCredentials: true,
        })
        .then((res) => {
          const mascota = res.data;
          form.setValue('mascota_id', mascota.id);
          setClienteSeleccionado(mascota.cliente_id);
          setTabsEnabled(true);
        })
        .catch(console.error);
    }
  }, [mascotaSeleccionada, citaData, form]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (clientesOpen) {
      // Limpiar clientes si la búsqueda es muy corta
      if (clientesSearch.trim().length < 3) {
        setClientes([]);
        return;
      }
      
      setClientesLoading(true);
      timeoutId = setTimeout(() => {
        buscarClientes(clientesSearch);
      }, 400); // Aumentamos un poco el debounce
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [clientesOpen, clientesSearch]);

  const handleClienteSeleccionado = (clienteId: string) => {
    console.log('Cliente seleccionado:', clienteId);
    setClienteSeleccionado(clienteId);
    setClientesOpen(false);
    setClientesSearch('');
  
    // Limpiar selección anterior
    setMascotaSeleccionada('');
    form.setValue('mascota_id', '');
    setTabsEnabled(false);
  
    // Cargar mascotas del cliente seleccionado
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${clienteId}/mascotas`, {
        withCredentials: true,
      })
      .then((res) => {
        setMascotas(res.data);
      })
      .catch((err) => {
        console.error('Error al cargar mascotas:', err);
        setMascotas([]);
      });
  };

  const buscarClientes = (search: string) => {
    const searchTrimmed = search.trim();
    
    // No buscar si tiene menos de 3 caracteres
    if (searchTrimmed.length < 3) {
      setClientes([]);
      setClientesLoading(false);
      return;
    }
    
    console.log('Buscando:', searchTrimmed);
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes?search=${encodeURIComponent(searchTrimmed)}&limit=50`;
    
    console.log('URL de búsqueda:', url);
    
    axios.get<Cliente[]>(url, { withCredentials: true })
      .then(res => {
        console.log('Clientes encontrados:', res.data.length);
        setClientes(res.data);
      })
      .catch(error => {
        console.error('Error buscando clientes:', error);
        setClientes([]);
      })
      .finally(() => {
        setClientesLoading(false);
      });
  };

  // Y en el mensaje informativo, muestra qué cliente está seleccionado:
  {!citaData && !tabsEnabled && (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
      {!clienteSeleccionado 
        ? "Selecciona un cliente para habilitar la selección de mascota"
        : !mascotaSeleccionada 
        ? `Cliente seleccionado: ${clientes.find(c => c.id === clienteSeleccionado)?.nombre_completo}. Selecciona una mascota para habilitar el resto del formulario`
        : "Todos los campos están habilitados"
      }
    </div>
  )}

  const onSubmit = async (data: ConsultaFormData) => {
    setGuardando(true);
    setError(null);

    try {
      const { veterinario_id, creado_en, actualizado_en, ...payload } = data;
      if (consulta?.id) {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/consultas/${consulta.id}`,
          payload,
          { withCredentials: true }
        );
        onSuccess('Consulta actualizada');
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/consultas`,
          payload,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="datos-generales">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="datos-generales">Datos Generales</TabsTrigger>
            <TabsTrigger value="estado-general" disabled={!tabsEnabled}>Estado General</TabsTrigger>
            <TabsTrigger value="sistemas" disabled={!tabsEnabled}>Sistemas</TabsTrigger>
            <TabsTrigger value="diagnostico" disabled={!tabsEnabled}>Diagnóstico</TabsTrigger>
            <TabsTrigger value="indicaciones" disabled={!tabsEnabled}>Indicaciones</TabsTrigger>
          </TabsList>

          {/* Datos Generales */}
          <TabsContent value="datos-generales" className="space-y-4">
            {/* Selects de Cliente y Mascota - solo mostrar si no viene de cita */}
            {!citaData && (
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                <div>
                  <Label>Cliente</Label>
                  
                  <Popover open={clientesOpen} onOpenChange={(open) => {
                    setClientesOpen(open);
                    
                    // Cuando se abre el popover, resetear todo
                    if (open) {
                      setClienteSeleccionado('');
                      setMascotaSeleccionada('');
                      setMascotas([]);
                      setClientesSearch('');
                      setTabsEnabled(false);
                      
                      // También limpiar los valores del formulario
                      form.setValue('mascota_id', '');
                      form.setValue('cliente_id', '');
                      form.setValue('evaluacion_clinica.datos_generales.raza', '');
                      form.setValue('evaluacion_clinica.datos_generales.especie', '');
                      form.setValue('evaluacion_clinica.datos_generales.sexo', '');
                      form.setValue('evaluacion_clinica.datos_generales.edad', '');
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {clienteSeleccionado 
                          ? clientes.find(c => c.id === clienteSeleccionado)?.nombre_completo 
                          : "Seleccionar cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    
                    {/* Renderizar directamente en el flujo del documento */}
                    {clientesOpen && (
                      <div 
                        className="absolute w-80 z-[9999] mt-1 border rounded-md bg-white shadow-md"
                        style={{ 
                          position: 'fixed',
                          top: 'auto',
                          left: 'auto'
                        }}
                      >
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Buscar cliente (mín. 3 caracteres)..."
                            value={clientesSearch}
                            onChange={(e) => setClientesSearch(e.target.value)}
                            className="w-full"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {clientesSearch.trim().length < 3 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Ingresa al menos 3 caracteres para buscar
                            </div>
                          ) : clientesLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Buscando clientes...
                            </div>
                          ) : clientes.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No se encontraron clientes
                            </div>
                          ) : (
                            clientes.map((cliente) => (
                              <button
                                key={cliente.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => handleClienteSeleccionado(cliente.id)}
                              >
                                {cliente.nombre_completo}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </Popover>
                </div>

                <div>
                  <Label>Mascota</Label>
                  <Select 
                    value={mascotaSeleccionada} 
                    onValueChange={setMascotaSeleccionada}
                    disabled={!clienteSeleccionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={clienteSeleccionado ? "Seleccionar mascota" : "Primero selecciona un cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {mascotas.map((mascota) => (
                        <SelectItem key={mascota.id} value={mascota.id}>
                          {mascota.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
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
                </div>
              </div>
            )}

            {/* Mensaje informativo */}
            {!citaData && !tabsEnabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
                {!clienteSeleccionado 
                  ? "Selecciona un cliente para habilitar la selección de mascota"
                  : !mascotaSeleccionada 
                  ? "Selecciona una mascota para habilitar el resto del formulario"
                  : "Todos los campos están habilitados"
                }
              </div>
            )}

            <div className="grid grid-cols-5 gap-4">
              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.raza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raza</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.especie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especie</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.sexo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.edad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.peso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso actual</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.habitat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hábitat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.datos_generales.otras_mascotas_check"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                    <div className="flex items-center gap-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-4 w-4"
                          disabled={!tabsEnabled}
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
                name="evaluacion_clinica.datos_generales.otras_mascotas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indique</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={form.watch('evaluacion_clinica.datos_generales.otras_mascotas_check') !== true || !tabsEnabled} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.desde_cuando_mascota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Desde cuándo tiene a su mascota?</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de consulta</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly={citaData !== undefined} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.dieta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dieta</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.datos_generales.historial_enfermedades"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Historial de enfermedades</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
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
                name="evaluacion_clinica.estado_general.vacunas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vacunas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.desparasitacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desparasitación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ? 'Si' : 'No'} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.tipo_desparacitacion"
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
                          disabled={form.watch('evaluacion_clinica.estado_general.desparasitacion') !== true || !tabsEnabled}
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
                          disabled={form.watch('evaluacion_clinica.estado_general.desparasitacion') !== true || !tabsEnabled}
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
                name="evaluacion_clinica.estado_general.actitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actitud</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.temperatura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>T°</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="evaluacion_clinica.estado_general.fc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FC</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.estado_general.fr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FR</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.estado_general.sonido_cardiaco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sonido cardiaco</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.estado_general.mucosas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mucosas</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-6 gap-2">
              <FormField
                control={form.control}
                name="evaluacion_clinica.estado_general.reflejo_pupilar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reflejo Pupilar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.anisocoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anisocoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.nistagmo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nistagmo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.rf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RF</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.pe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PE</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.pop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>POP</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                name="evaluacion_clinica.estado_general.tllc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TLLC</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.estado_general.deshidratacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deshidratación</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.estado_general.condicion_corporal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición Corporal</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluacion_clinica.estado_general.palpacion_abdominal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palpación Abdominal</FormLabel>
                    <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="evaluacion_clinica.estado_general.historia_clinica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historia clínica</FormLabel>
                  <FormControl><Textarea {...field} rows={3} disabled={!tabsEnabled} /></FormControl>
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
                  name="evaluacion_clinica.sistemas.sistema_digestivo.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.sistema_digestivo.na') && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-2">
                  <FormField
                    control={form.control}
                    name="evaluacion_clinica.sistemas.sistema_digestivo.apetito"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Apetito</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                    name="evaluacion_clinica.sistemas.sistema_digestivo.estrenimiento"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Estreñimiento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                    name="evaluacion_clinica.sistemas.sistema_digestivo.flatulencia"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Flatulencia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_digestivo.ingesta_agua"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Ingesta de agua</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!tabsEnabled}>
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
                    name="evaluacion_clinica.sistemas.sistema_digestivo.vomito"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vómito</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? (field.value == true ? 'Sí' : 'No') : 'Seleccione'} disabled={!tabsEnabled}>
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
                  {form.watch('evaluacion_clinica.sistemas.sistema_digestivo.vomito') === true && (
                    <>
                      <FormField
                        control={form.control}
                        name="evaluacion_clinica.sistemas.sistema_digestivo.veces_vomito"
                        render={({ field }) => (
                        <FormItem>
                          <FormLabel>Veces por día</FormLabel>
                          <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="evaluacion_clinica.sistemas.sistema_digestivo.aspecto_vomito"
                        render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspecto</FormLabel>
                          <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
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
                    name="evaluacion_clinica.sistemas.sistema_digestivo.defeca"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defeca</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                  {form.watch('evaluacion_clinica.sistemas.sistema_digestivo.defeca') === true && (
                    <>
                      <FormField
                        control={form.control}
                        name="evaluacion_clinica.sistemas.sistema_digestivo.veces_defeca"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Veces por día</FormLabel>
                            <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="evaluacion_clinica.sistemas.sistema_digestivo.aspecto_defeca"
                        render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspecto</FormLabel>
                          <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
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
                  name="evaluacion_clinica.sistemas.cavidad_oral.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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
              {/* IMPLEMENTATION */}
              {!form.watch('evaluacion_clinica.sistemas.cavidad_oral.na') && (
                <>
                  <div className="grid grid-cols-5 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.cavidad_oral.sarro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sarro</FormLabel>
                          <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.cavidad_oral.gingivitis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gingivitis</FormLabel>
                          <FormControl><Input {...field} disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.cavidad_oral.sangrado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sangrado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.cavidad_oral.halitosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Halitosis</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.cavidad_oral.hipersalivacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hipersalivación</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                  name="evaluacion_clinica.sistemas.nariz_faringe.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.nariz_faringe.na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.nariz_faringe.descarga_nasal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descarga nasal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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

                    {form.watch('evaluacion_clinica.sistemas.nariz_faringe.descarga_nasal') === true && (
                      <>
                        <FormField
                          control={form.control}
                          name="evaluacion_clinica.sistemas.nariz_faringe.aspecto_descarga"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Aspecto</FormLabel>
                              <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {form.watch('evaluacion_clinica.sistemas.nariz_faringe.descarga_nasal') !== true && (
                      <></>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.nariz_faringe.epistaxis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Epistaxis</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.nariz_faringe.resequedad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resequedad</FormLabel>
                          <FormControl><Input { ... field } disabled={!tabsEnabled} /></FormControl>
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
                  name="evaluacion_clinica.sistemas.sistema_respiratorio.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.sistema_respiratorio.na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_respiratorio.tos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tos</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_respiratorio.frecuencia_tos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_respiratorio.tos') !== true || !tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_respiratorio.disnea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disnea</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_respiratorio.frecuencia_disnea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_respiratorio.disnea') !== true || !tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_respiratorio.estornudos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estornudos</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_respiratorio.frecuencia_estornudos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_respiratorio.estornudos') !== true || !tabsEnabled} /></FormControl>
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
                  name="evaluacion_clinica.sistemas.sistema_urogenital.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.sistema_urogenital.na') && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_urogenital.orina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orina</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_urogenital.frecuencia_orina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_urogenital.orina') !== true || !tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_urogenital.aspecto_orina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspecto</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_urogenital.orina') !== true || !tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_urogenital.castrado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Castrado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_urogenital.se_ha_cruzado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Se ha cruzado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_urogenital.ha_gestado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ha estado gestado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_urogenital.ultimo_parto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Último parto</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_urogenital.ha_gestado') !== true || !tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_urogenital.descarga_vulva_prepucio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descarga vulva/prepucio</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
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
                  name="evaluacion_clinica.sistemas.sistema_tegumentario.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.sistema_tegumentario.na') && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_tegumentario.alopecia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alopecia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_tegumentario.parasitos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parasitos</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_tegumentario.tipo_parasitos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} disabled={form.watch('evaluacion_clinica.sistemas.sistema_tegumentario.parasitos') !== true || !tabsEnabled} >
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
                      name="evaluacion_clinica.sistemas.sistema_tegumentario.lesiones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesiones</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_tegumentario.tipo_lesion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de lesión</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_tegumentario.lesiones') !== true || !tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_tegumentario.aspecto_lesion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspecto</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_tegumentario.lesiones') !== true || !tabsEnabled} /></FormControl>
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
                  name="evaluacion_clinica.sistemas.sistema_muscoesqueletico.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.sistema_muscoesqueletico.na') && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_muscoesqueletico.movimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Movimiento</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_muscoesqueletico.desde_cuando"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desde cuando</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_muscoesqueletico.miembro_afectado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Miembro afectado</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
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
                  name="evaluacion_clinica.sistemas.sistema_nervioso.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.sistema_nervioso.na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_nervioso.incordinacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incordinación</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_nervioso.golpes_cabeza"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Golpes en cabeza</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_nervioso.dismetria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dismetria</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_nervioso.propiocepcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Propiocepción</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
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
                  name="evaluacion_clinica.sistemas.sistema_cardiaco.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.sistema_cardiaco.na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_cardiaco.disnea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disnea</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_cardiaco.cianosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cianosis</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_cardiaco.fatiga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fatiga</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_cardiaco.frecuencia_fatiga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_cardiaco.fatiga') !== true || !tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.sistema_cardiaco.tos_nocturna"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tos nocturna</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.sistema_cardiaco.frecuencia_tos_nocturna"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.sistema_cardiaco.tos_nocturna') !== true || !tabsEnabled}/></FormControl>
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
                  name="evaluacion_clinica.sistemas.oidos.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.oidos.na') && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.oidos.descarga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descarga</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.oidos.parasitos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parásitos</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.oidos.tipo_parasitos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuál</FormLabel>
                          <FormControl><Input { ...field } disabled={form.watch('evaluacion_clinica.sistemas.oidos.parasitos') !== true || !tabsEnabled}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.oidos.mal_olor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mal olor</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.oidos.se_rasca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Se rasca</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                      name="evaluacion_clinica.sistemas.oidos.escucha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escucha</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ? 'Sí' : 'No'} disabled={!tabsEnabled}>
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
                  name="evaluacion_clinica.sistemas.ojos.na"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-0 space-y-0">
                      <div className="flex items-center gap-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4"
                            disabled={!tabsEnabled}
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

              {!form.watch('evaluacion_clinica.sistemas.ojos.na') && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.ojos.descarga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descarga</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.ojos.schirmer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schirmer</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.ojos.fluorescencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fluorescencia</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.sistemas.ojos.observaciones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observaciones</FormLabel>
                          <FormControl><Input { ...field } disabled={!tabsEnabled} /></FormControl>
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
              name="evaluacion_clinica.diagnostico.dx_presuntivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico presuntivo</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} disabled={!tabsEnabled} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluacion_clinica.diagnostico.dx_diferencial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico diferencial</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} disabled={!tabsEnabled} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluacion_clinica.diagnostico.examenes_laboratorio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exámenes de laboratorio</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lab_hemograma"
                        checked={field.value?.hemograma}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            hemograma: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="lab_hemograma">Hemograma</label>
                    </div>
                  </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lab_quimica_sanguinea"
                        checked={field.value?.hemograma}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            quimica_sanguinea: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="lab_quimica_sanguinea">Química Sanguínea</label>
                    </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lab_urianalisis"
                        checked={field.value?.hemograma}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            urianalisis: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="lab_urianalisis">Urianálisis</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lab_coprologico"
                        checked={field.value?.hemograma}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            coprologico: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="lab_coprologico">Coprológico</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lab_raspado_piel"
                        checked={field.value?.hemograma}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            raspado_piel: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="lab_raspado_piel">Raspado de piel</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lab_citologia"
                        checked={field.value?.hemograma}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            citologia: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="lab_citologia">Citología</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lab_otro"
                        checked={field.value?.hemograma}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            otro: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="lab_otro">Otro</label>
                    </div>
                  </div>

                  {/* Campo para "otro" */}
                  {field.value?.otro && (
                    <FormField
                      control={form.control}
                      name="evaluacion_clinica.diagnostico.examenes_laboratorio.especifique_otro"
                      render={({ field: otroField }) => (
                        <FormItem>
                          <FormLabel>Especifique otro</FormLabel>
                          <FormControl>
                            <Input {...otroField} disabled={!tabsEnabled} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluacion_clinica.diagnostico.manejo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manejo</FormLabel>
                  <div className="grid grid-cols-5 gap-2">
                    {/* Hospitalización */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manejo_hospitalizacion"
                        checked={field.value?.hospitalizacion}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            hospitalizacion: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="manejo_hospitalizacion">Hospitalización</label>
                    </div>

                    {/* Medicamentos */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manejo_medicamentos"
                        checked={field.value?.medicamentos}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            medicamentos: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="manejo_medicamentos">Medicamentos</label>
                    </div>

                    {/* Cirugía */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manejo_cirugia"
                        checked={field.value?.cirugia}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            cirugia: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="manejo_cirugia">Cirugía</label>
                    </div>

                    {/* Control */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manejo_control"
                        checked={field.value?.control}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            control: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="manejo_control">Control</label>
                    </div>

                    {/* Otro */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manejo_otro"
                        checked={field.value?.otro}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            otro: checked
                          });
                        }}
                        disabled={!tabsEnabled}
                      />
                      <label htmlFor="manejo_otro">Otro</label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos condicionales */}
            {form.watch("evaluacion_clinica.diagnostico.manejo.medicamentos") && (
              <FormField
                control={form.control}
                name="evaluacion_clinica.diagnostico.manejo.especifique_medicamentos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalle de medicamentos</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={3} 
                        placeholder="Especifica medicamentos y dosis" 
                        disabled={!tabsEnabled} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("evaluacion_clinica.diagnostico.manejo.otro") && (
              <FormField
                control={form.control}
                name="evaluacion_clinica.diagnostico.manejo.especifique_otro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalle de manejo</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={3} 
                        placeholder="Especifica el manejo dado" 
                        disabled={!tabsEnabled} 
                      />
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
              name="evaluacion_clinica.indicaciones.indicaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indicaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} disabled={!tabsEnabled} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluacion_clinica.indicaciones.proxima_cita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima cita</FormLabel>
                  <FormControl><Input type="date" {...field} disabled={!tabsEnabled} /></FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluacion_clinica.indicaciones.notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} disabled={!tabsEnabled} />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={guardando || !tabsEnabled}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>

        {error && <p className="text-red-600">{error}</p>}
      </form>
    </Form>
  );
}