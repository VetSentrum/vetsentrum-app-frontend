'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
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
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  especie: z.string().min(1, 'La especie es obligatoria'),
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

interface Mascota {
  id?: string
  nombre: string
  especie: string
  raza: string
  sexo: 'Macho' | 'Hembra'
  edad_aproximada?: number
  esterilizado: boolean
  peso: number
  cliente_id: string
}

interface Props {
  mascota: Mascota | null
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

export function EditarMascotaForm({ mascota, onClose, onSuccess }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: mascota?.nombre || '',
      especie: mascota?.especie || '',
      raza: mascota?.raza || '',
      sexo: mascota?.sexo || 'Macho',
      edad_aproximada: mascota?.edad_aproximada || 0,
      esterilizado: mascota?.esterilizado || false,
      peso: mascota?.peso || 0,
      cliente_id: mascota?.cliente_id || '',
    },
  })

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const { data } = await axios.get<Cliente[]>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes?inactivos=false`,
          { withCredentials: true }
        )
        setClientes(data)
      } catch (e) {
        console.error('Error cargando clientes', e)
      }
    }
    cargarClientes()
  }, [])

  const onSubmit = async (data: FormData) => {
    setError(null)
    setMensaje(null)
    try {
      if (mascota?.id) {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/mascotas/${mascota.id}`,
          data,
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
    } catch (e: unknown) {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
          name="especie"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especie</FormLabel>
              <FormControl>
                <Input {...field} />
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

            const años = Math.floor(edadMeses / 12)
            const meses = edadMeses % 12

            return (
              <FormItem>
                <FormLabel>Edad</FormLabel>
                <div className="flex gap-2">
                  {/* Select Años */}
                  <FormLabel>Años</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const totalMeses = Number(value) * 12 + meses
                      form.setValue("edad_aproximada", Number(totalMeses))
                    }}
                    defaultValue={String(años)}
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
                    onValueChange={(value) => {
                      const totalMeses = años * 12 + Number(value)
                      form.setValue("edad_aproximada", Number(totalMeses))
                    }}
                    defaultValue={String(meses)}
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Guardar cambios</Button>
        {mensaje && <p className="text-green-600">{mensaje}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </Form>
  )
}