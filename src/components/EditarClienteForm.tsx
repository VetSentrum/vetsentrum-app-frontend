'use client'

import { useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form'

const schema = z.object({
  nombre_completo: z.string().min(3, 'El nombre es obligatorio'),
  telefono: z.string().min(7, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional(),
  direccion: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Cliente {
  id: string
  nombre_completo: string
  telefono: string
  email?: string
  direccion?: string
  activo: Boolean
}

interface Props {
  cliente: Cliente | null
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

export function EditarClienteForm({ cliente, onClose, onSuccess }: Props) {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre_completo: cliente?.nombre_completo || '',
      telefono: cliente?.telefono || '',
      email: cliente?.email || '',
      direccion: cliente?.direccion || '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    setMensaje(null)
    try {
      if (cliente) {
        // Edición
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${cliente.id}`,
          data,
          { withCredentials: true }
        )
        setMensaje('Cliente actualizado correctamente')
      } else {
        // Creación
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes`,
          data,
          { withCredentials: true }
        )
        setMensaje('Cliente creado correctamente')
      }
      onSuccess(mensaje || 'Operación exitosa')
      onClose()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al guardar cliente')
    }
  }

  const eliminarCliente = async () => {
    if (!cliente) return
    let activo = cliente.activo

    if(activo == true){
      try {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${cliente.id}`,
          { activo: false },
          { withCredentials: true }
        )
        onSuccess('Cliente inactivado correctamente')
        onClose()
      } catch (e: any) {
        setError(e.response?.data?.message || 'Error al eliminar cliente')
      }
    } else if(activo == false){
      try {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${cliente.id}`,
          { activo: true },
          { withCredentials: true }
        )
        onSuccess('Cliente reactivado correctamente')
        onClose()
      } catch (e: any) {
        setError(e.response?.data?.message || 'Error al modificar el estado del cliente')
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre_completo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between w-full">
          <Button type="submit">Guardar cambios</Button>
          {cliente && (
            <div className="flex items-end flex-col gap-1">
              <button
                type="button"
                onClick={eliminarCliente}
                className={`text-sm underline ${cliente?.activo ? "text-red-600" : "text-green-600"}`}
              >
                {cliente?.activo ? "Inactivar cliente" : "Reactivar cliente"}
              </button>
            </div>
          )}
        </div>

        {mensaje && <p className="text-green-600">{mensaje}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </Form>
  )
}