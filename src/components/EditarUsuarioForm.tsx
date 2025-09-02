// components/EditarUsuarioForm.tsx
'use client'

import { useState } from 'react'
import axios, { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  rol: z.enum(['admin', 'recepcion', 'veterinario']),
})

type FormData = z.infer<typeof schema>

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'recepcion' | 'veterinario'
  activo: boolean
}

interface Props {
  usuario: Usuario | null
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

export function EditarUsuarioForm({ usuario, onClose, onSuccess }: Props) {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: usuario?.nombre || '',
      email: usuario?.email || '',
      rol: usuario?.rol || 'recepcion',
    },
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    setMensaje(null)
    try {
      if (usuario) {
        // Modo edición
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/usuarios/${usuario.id}`,
          data,
          { withCredentials: true }
        )
        setMensaje('Usuario actualizado correctamente')
      } else {
        // Modo creación
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/usuarios`,
          data,
          { withCredentials: true }
        )
        setMensaje('Usuario creado correctamente. Se ha enviado un correo de activación de cuenta.')
      }

    } catch (e: unknown) {
      let mensajeError = 'Error al actualizar';
    
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

  const enviarReset = async () => {
    if(!usuario) return

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/solicitar-reset`,
        { email: usuario.email },
        { withCredentials: true }
      )
      setMensaje('Correo de restablecimiento enviado')
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setError(e.response?.data?.message || 'Error al enviar el correo');
    }
  }

  const eliminaUsuario = async () => {
    if (!usuario) return
  
    const nuevoEstado = !usuario.activo
  
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/usuarios/${usuario.id}`,
        { activo: nuevoEstado },
        { withCredentials: true }
      )
  
      onSuccess(
        nuevoEstado
          ? 'Usuario reactivado correctamente'
          : 'Usuario inactivado correctamente'
      )
      onClose()
    } catch (e: unknown) {
      let mensajeError = nuevoEstado
        ? 'Error al reactivar al usuario.'
        : 'Error al inactivar al usuario.'
  
      if (e instanceof Error) {
        mensajeError = e.message || mensajeError
      } else if (
        typeof e === 'object' &&
        e !== null &&
        'response' in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message
      ) {
        mensajeError = (
          e as { response?: { data?: { message?: string } } }
        ).response!.data!.message!
      }
  
      setError(mensajeError)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="rol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <FormControl>
                <select {...field} className="border p-2 rounded w-full">
                  <option value="admin">Admin</option>
                  <option value="recepcion">Recepción</option>
                  <option value="veterinario">Veterinario</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between w-full">
          <Button type="submit">Guardar cambios</Button>
          {usuario &&(
            <div className="flex items-end flex-col gap-1">
              <button
                type="button"
                onClick={enviarReset}
                className="text-sm text-blue-600 underline"
              >
                Enviar correo de restablecimiento
              </button>
              <button
                type="button"
                onClick={eliminaUsuario}
                className={`text-sm underline ${usuario?.activo ? "text-red-600" : "text-green-600"}`}
              >
                {usuario?.activo ? "Eliminar usuario" : "Reactivar usuario"}
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