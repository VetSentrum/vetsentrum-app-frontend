'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

const schema = z.object({
  email: z.string().email('Email inválido'),
  contraseña: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      const validarSesion = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { withCredentials: true });
          if (res.data) {
            router.push('/dashboard');
          }
        } catch (err: unknown) {
          if (typeof err === 'object' && err !== null && 'response' in err) {
            const e = err as { response?: { status?: number } };
            if (e.response?.status !== 401) {
              console.error('Error inesperado al validar sesión:', err);
            }
          } else {
            console.error('Error inesperado al validar sesión:', err);
          }
        }        
      };
    
      validarSesion();
    }, [])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      contraseña: '',
    },
  })

  async function onSubmit(data: FormData) {
    setError(null)
  
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
        { email: data.email, contraseña: data.contraseña },
        { withCredentials: true }
      )
  
      router.push('/dashboard')
    } catch (e: unknown) {
      console.error('Error al iniciar sesión:', e);
    
      let mensajeError = 'Error al iniciar sesión. Revisa tus credenciales.';
    
      if (e instanceof Error) {
        mensajeError = e.message || mensajeError;
      } else if (typeof e === 'object' && e !== null && 'response' in e) {
        const err = e as { response?: { data?: { message?: string } } };
        if (err.response?.data?.message) {
          mensajeError = err.response.data.message;
        }
      }
    
      setError(mensajeError);
    }    
  }

  return (
    <main className="max-w-md min-w-[480px] mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl font-semibold mb-6 text-center">Iniciar sesión</h1>

      <Form {...form}>
        <form className="w-full max-w-md" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contraseña"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="mt-4 text-red-600 text-center font-medium">{error}</p>
          )}

          <Button type="submit" className="w-full mt-4">
            Entrar
          </Button>
        </form>
      </Form>
    </main>
  )
}