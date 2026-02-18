'use client'

import { useState, useEffect, useRef } from 'react'
import axios, { AxiosError }from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form'

const schema = z.object({
  expediente: z.number().int().optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  especie_id: z.number().int({ message : 'La especie es obligatoria' }),
  raza: z.string().min(1, 'La raza es obligatoria'),
  sexo: z.enum(['Macho', 'Hembra']),
  edad_aproximada: z.number().int().optional(),
  esterilizado: z.boolean(),
  peso: z.number().min(0, 'Peso inválido'),
  cliente_id: z.string().min(1, 'Debe seleccionar un cliente'),
})

type FormData = z.infer<typeof schema>

interface Cliente {
  id: string
  nombre_completo: string
}

interface Especie {
  id: number
  nombre: string
}

interface Mascota {
  id?: string
  nombre: string
  expediente?: number
  especie_id: number
  raza: string
  sexo: 'Macho' | 'Hembra'
  edad_aproximada?: number
  esterilizado: boolean
  peso: number
  cliente_id: string
  fecha_creacion: Date
}

interface Props {
  mascota: Mascota | null
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

export function EditarMascotaForm({ mascota, onClose, onSuccess }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesSearch, setClientesSearch] = useState('')
  const [clientesOpen, setClientesOpen] = useState(false)
  const [clientesLoading, setClientesLoading] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)

  const [mensaje, setMensaje] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [especies, setEspecies] = useState<Especie[]>([])
  const [usuario, setUsuario] = useState<{ id: string; rol: "admin" | "recepcion" | "veterinario" } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {  
      nombre: mascota?.nombre || '',
      especie_id: mascota?.especie_id || 0,
      raza: mascota?.raza || '',
      sexo: mascota?.sexo || 'Macho',
      edad_aproximada: mascota?.edad_aproximada || 0,
      esterilizado: mascota?.esterilizado || false,
      peso: mascota?.peso || 0,
      cliente_id: mascota?.cliente_id || '',
    },
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (clientesOpen) {
      if (clientesSearch.trim().length < 3) {
        setClientes([])
        return
      }

      setClientesLoading(true)
      timeoutId = setTimeout(() => {
        buscarClientes(clientesSearch)
      }, 400)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [clientesOpen, clientesSearch])

  useEffect(() => {
    if (mascota?.cliente_id) {
      axios
        .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${mascota.cliente_id}`, {
          withCredentials: true,
        })
        .then(res => {
          setClientes([res.data])
          setClienteSeleccionado(res.data)
          form.setValue('cliente_id', res.data.id)
        })
    }
  }, [mascota])

  useEffect(() => {
    const cargarEspecies = async () => {
      try {
        const { data } = await axios.get<Especie[]>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/especies`,
          { withCredentials: true }
        )
        setEspecies(data)
      } catch (e) {
        console.error('Error cargando especies', e)
      }
    }
    cargarEspecies()
  }, [])

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { withCredentials: true })
      .then(res => setUsuario(res.data))
      .catch(() => setUsuario(null));
  }, [])
  
  useEffect(() => {
  if (error && errorRef.current) {
    const el = errorRef.current;
    const parent = el.closest('[data-scrollable]') as HTMLElement || el.offsetParent as HTMLElement;

    if (parent) {
      parent.scrollTo({
        top: el.offsetTop - 40, // deja un margen de 40px arriba
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: el.offsetTop - 40,
        behavior: "smooth",
      });
    }
  }
  }, [error]);

  const rolActual = usuario?.rol;

  const handleClienteSeleccionado = (cliente: Cliente) => {
    setClienteSeleccionado(cliente)
    form.setValue('cliente_id', cliente.id)

    setClientesOpen(false)
    setClientesSearch('')
    setClientes([])
  }

  const onSubmit = async (data: FormData) => {
    setError(null)
    setMensaje(null)
    try {
      if (mascota?.id) {
        const { edad_aproximada, ...rest } = data
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/mascotas/${mascota.id}`,
          rest,
          { withCredentials: true }
        )
        setMensaje('Mascota actualizada correctamente')
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/mascotas`,
          data,
          { withCredentials: true }
        )
        setMensaje('Mascota creada correctamente')
      }
      onSuccess(mensaje || 'Operación exitosa')
      onClose()
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      let mensajeError = 'Error al guardar mascota';
    
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const err = e as { response?: { data?: { message?: string } } };
        if (err.response?.data?.message) {
          mensajeError = err.response.data.message;
        }
      } else if (e instanceof Error) {
        mensajeError = e.message || mensajeError;
      }
    
      setError(mensajeError);
    }
  }

  const buscarClientes = (search: string) => {
    const searchTrimmed = search.trim()
    if (searchTrimmed.length < 3) return

    axios
      .get<Cliente[]>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes?search=${encodeURIComponent(searchTrimmed)}&limit=50`,
        { withCredentials: true }
      )
      .then(res => setClientes(res.data))
      .catch(() => setClientes([]))
      .finally(() => setClientesLoading(false))
  }

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="expediente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>#EXP</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  {...field}
                  disabled={rolActual !== "admin"}
                  className={`border rounded px-3 py-2 w-full ${
                    rolActual === "admin" ? "bg-white text-black" : "bg-gray-100 text-gray-600"
                  }`}
                  value={field.value ?? mascota?.expediente ?? "—"}
                  onChange={(e) => {
                    if (rolActual === "admin") {
                      field.onChange(Number(e.target.value))
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="especie_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especie</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value ? String(field.value) : ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una especie" />
                  </SelectTrigger>
                  <SelectContent>
                    {especies.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="raza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Raza</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sexo"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-4 items-center">
                {/* Select Sexo */}
                <FormLabel>Sexo</FormLabel>
                <div className="flex flex-col">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? 'Macho'}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Macho">Macho</SelectItem>
                      <SelectItem value="Hembra">Hembra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkbox Esterilizado */}
                <FormField
                  control={form.control}
                  name="esterilizado"
                  render={({ field: chkField }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={chkField.value || false}
                          onChange={(e) => chkField.onChange(e.target.checked)}
                          className="w-4 h-4"
                        />
                      </FormControl>
                      <FormLabel>Esterilizado</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="edad_aproximada"
          render={() => {
            const edadMeses = form.watch("edad_aproximada")
              ? Number(form.watch("edad_aproximada"))
              : 0

            let años = Math.floor(edadMeses / 12)
            let meses = edadMeses % 12

            // Si existe fecha_registro, calculamos edad actual
            const fechaRegistro = mascota?.fecha_creacion
            let edadActual = null
            if (fechaRegistro) {
              edadActual = calcularEdadActual(fechaRegistro, edadMeses)
              años = edadActual.años
              meses = edadActual.meses
            }

            const esEdicion = Boolean(mascota?.id)

            return (
              <FormItem>
                <FormLabel>Edad</FormLabel>
                <div className="flex gap-2">
                  {/* Select Años */}
                  <FormLabel>Años</FormLabel>
                  <Select
                    disabled={esEdicion}
                    onValueChange={(value) => {
                      const totalMeses = Number(value) * 12 + meses
                      form.setValue("edad_aproximada", Number(totalMeses))
                    }}
                    value={String(años)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Años" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Select Meses */}
                  <FormLabel>Meses</FormLabel>
                  <Select
                    disabled={esEdicion}
                    onValueChange={(value) => {
                      const totalMeses = años * 12 + Number(value)
                      form.setValue("edad_aproximada", Number(totalMeses))
                    }}
                    value={String(meses)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Meses" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <FormField
          control={form.control}
          name="peso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso (kg)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  {...field}
                  value={field.value ?? '0'}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cliente_id"
          render={() => (
            <FormItem className="relative">
              <FormLabel>Cliente</FormLabel>

              {/* Trigger */}
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setClientesOpen(true)}
              >
                {clienteSeleccionado
                  ? clienteSeleccionado.nombre_completo
                  : 'Buscar cliente'}
              </Button>

              {/* Dropdown — absolute so it overlays instead of shifting the form */}
              {clientesOpen && (
                <div className="absolute z-50 w-full border rounded mt-1 p-2 bg-white shadow-md space-y-2">
                  <Input
                    placeholder="Escribe al menos 3 letras..."
                    value={clientesSearch}
                    onChange={e => setClientesSearch(e.target.value)}
                    autoFocus
                  />

                  {clientesLoading && <p className="text-sm text-gray-500">Buscando...</p>}

                  {clientes.map(c => (
                    <div
                      key={c.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                      onClick={() => handleClienteSeleccionado(c)}
                    >
                      {c.nombre_completo}
                    </div>
                  ))}
                </div>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Guardar cambios</Button>
        {mensaje && <p className="text-green-600">{mensaje}</p>}
        {error && <p ref={errorRef} className="text-red-600">{error}</p>}
      </form>
    </Form>
  )
}