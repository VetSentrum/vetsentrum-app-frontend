'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

const schema = z.object({
  fecha: z.string().min(1, 'Fecha obligatoria'),
  cliente_id: z.string().min(1, 'Cliente obligatorio'),
  mascota_id: z.string().min(1, 'Mascota obligatorio'),
  motivo: z.string().min(1, 'Motivo obligatorio'),
})

type FormData = z.infer<typeof schema>

interface Cita {
  id?: string
  fecha: string
  cliente_id: string
  cliente_nombre?: string
  mascota_id: string
  mascota_nombre?: string
  motivo: string
}

interface Cliente {
  id: string
  nombre_completo: string
}

interface Mascota {
  id: string
  nombre: string
}

interface Props {
  cita: Cita
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

export function EditarCitaForm({ cita, onClose, onSuccess }: Props) {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clientesMock: Cliente[] = [
    { id: 'c1', nombre_completo: 'Carlos Marrufo' },
    { id: 'c2', nombre_completo: 'Ana Pérez' },
  ]
  const mascotasMock: Mascota[] = [
    { id: 'm1', nombre: 'Mili' },
    { id: 'm2', nombre: 'Rex' },
  ]

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: cita.fecha || '',
      cliente_id: cita.cliente_id || '',
      mascota_id: cita.mascota_id || '',
      motivo: cita.motivo || '',
    }
  })

  const onSubmit = (data: FormData) => {
    // 🔹 Mock de guardar
    console.log('Guardando cita', data)
    onSuccess(`Cita ${cita.id ? 'actualizada' : 'creada'} correctamente`)
    onClose()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="fecha" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha y hora</FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="cliente_id" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientesMock.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre_completo}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="mascota_id" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Mascota</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una mascota" />
              </SelectTrigger>
              <SelectContent>
                {mascotasMock.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="motivo" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Motivo</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {mensaje && <div className="text-green-600">{mensaje}</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Form>
  )
}