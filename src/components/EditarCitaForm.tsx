'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

const schema = z.object({
  fecha_hora: z.string().min(1, 'Fecha obligatoria'),
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
  cliente_id: string
}

interface Props {
  cita: Cita
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

export function EditarCitaForm({ cita, onClose, onSuccess }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [mascotasFiltradas, setMascotasFiltradas] = useState<Mascota[]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fechaLocal = cita.fecha
    ? new Date(cita.fecha).toLocaleString('sv', { timeZone: 'America/Monterrey' }).replace(' ', 'T').slice(0, 16)
    : ''

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha_hora: fechaLocal || '',
      cliente_id: cita.cliente_id || '',
      mascota_id: cita.mascota_id || '',
      motivo: cita.motivo || '',
    },
  })

  const clienteSeleccionado = form.watch('cliente_id')

  // Cargar clientes al inicio
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const res = await axios.get<Cliente[]>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes?inactivos=false`,
          { withCredentials: true }
        )
        setClientes(res.data)
      } catch (err) {
        const axiosError = err as AxiosError<{ message: string }>
        console.error('Error cargando clientes:', axiosError)
        setError(axiosError.response?.data?.message || 'No se pudieron cargar los clientes')
      }
    }
    cargarClientes()
  }, [])

  // Función para cargar mascotas de un cliente
  const cargarMascotasPorCliente = async (clienteId: string) => {
    try {
      const res = await axios.get<Mascota[]>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${clienteId}/mascotas`,
        { withCredentials: true }
      )
      setMascotasFiltradas(res.data)
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      console.error('Error cargando mascotas:', axiosError)
      setMascotasFiltradas([])
      setError(axiosError.response?.data?.message || 'No se pudieron cargar las mascotas')
    }
  }

  // Cargar mascotas cuando cambia el cliente
  useEffect(() => {
    if (clienteSeleccionado) {
      cargarMascotasPorCliente(clienteSeleccionado)
      form.setValue('mascota_id', '') // limpiar selección de mascota
    } else {
      setMascotasFiltradas([])
    }
  }, [clienteSeleccionado, form])

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (cita.cliente_id) {
      form.setValue('cliente_id', cita.cliente_id)
      form.setValue('mascota_id', cita.mascota_id)
      cargarMascotasPorCliente(cita.cliente_id)
    }
  }, [cita, form])

  const onSubmit = async (data: FormData) => {
    setError(null)
    setMensaje(null)

    try {
      const payload = { ...data, fecha_hora: data.fecha_hora.replace('T', ' ') }
      if (cita.id) {
        await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/citas/${cita.id}`, payload, { withCredentials: true })
        setMensaje('Cita actualizada correctamente')
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/citas`, payload, { withCredentials: true })
        setMensaje('Cita creada correctamente')
      }

      onSuccess(mensaje || 'Operación exitosa')
      onClose()
      form.reset()
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      setError(axiosError.response?.data?.message || 'Error al guardar la cita')
    }
  }

  const onCancelarCita = async () => {
    setError(null)
    setMensaje(null)
    if (!cita.id) return

    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/citas/${cita.id}/cancelar`, {}, { withCredentials: true })
      onSuccess('Cita cancelada correctamente')
      form.reset()
      onClose()
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      setError(axiosError.response?.data?.message || 'Error al cancelar la cita')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos del formulario (fecha, cliente, mascota, motivo) */}
        {/* ... idéntico a tu código ... */}
        {mensaje && <div className="text-green-600">{mensaje}</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="flex justify-end gap-2">
          {cita.id && (
            <Button variant="outline" onClick={onCancelarCita}>
              Cancelar
            </Button>
          )}
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Form>
  )
}