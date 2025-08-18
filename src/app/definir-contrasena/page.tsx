'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z
  .object({
    contraseña: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmarContraseña: z.string(),
  })
  .refine((data) => data.contraseña === data.confirmarContraseña, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContraseña'],
  })

type FormData = z.infer<typeof schema>

export default function DefinirContrasenaPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const router = useRouter()

  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  })

  async function onSubmit(data: FormData) {
    setMensaje(null)
    setError(null)

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/usuarios/definir-contrasena`,
        {
          token,
          nuevaContrasena: data.contraseña,
        }
      )
      setMensaje('Contraseña guardada correctamente. Puedes iniciar sesión.')
      setTimeout(() => router.push('/login'), 3000)
    } catch (e: any) {
      setError(
        e.response?.data?.message === 'Token inválido'
          ? 'El enlace no es válido. Solicita uno nuevo.'
          : e.response?.data?.message === 'Token expirado'
          ? 'El enlace ha expirado. Solicita uno nuevo.'
          : e.response?.data?.message || 'Error inesperado. Intenta de nuevo.'
      );
    }
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Definir nueva contraseña
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField
            control={form.control}
            name="contraseña"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmarContraseña"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-4">
            Guardar
          </Button>
        </form>
      </Form>

      {mensaje && (
        <p className="mt-4 text-green-600 text-center font-medium">{mensaje}</p>
      )}

      {error && (
        <p className="mt-4 text-red-600 text-center font-medium">{error}</p>
      )}
    </main>
  )
}