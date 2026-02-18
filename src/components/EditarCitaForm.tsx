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
  const [clientesSearch, setClientesSearch] = useState('')
  const [clientesOpen, setClientesOpen] = useState(false)
  const [clientesLoading, setClientesLoading] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
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

  // Función para cargar mascotas de un cliente
  const cargarMascotasPorCliente = async (clienteId: string) => {
    try {
      const res = await axios.get<Mascota[]>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${clienteId}/mascotas`,
        { withCredentials: true }
      )
      setMascotasFiltradas(res.data)
      return res.data
    } catch (err) {
      setMascotasFiltradas([])
      return []
    }
  }

  useEffect(() => {
    if (!clientesOpen) return

    if (clientesSearch.trim().length < 3) {
      setClientes([])
      return
    }

    setClientesLoading(true)

    const timeoutId = setTimeout(() => {
      buscarClientes(clientesSearch)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [clientesSearch, clientesOpen])

  useEffect(() => {
    if (clienteSeleccionado) {
      cargarMascotasPorCliente(clienteSeleccionado.id)
      form.setValue('mascota_id', '')
    } else {
      setMascotasFiltradas([])
    }
  }, [clienteSeleccionado, form])

  useEffect(() => {
    const cargarEdicion = async () => {
      if (!cita.cliente_id || !cita.cliente_nombre) return

      const cliente = {
        id: cita.cliente_id,
        nombre_completo: cita.cliente_nombre,
      }

      setClienteSeleccionado(cliente)
      form.setValue('cliente_id', cliente.id)

      const mascotas = await cargarMascotasPorCliente(cliente.id)

      // ⚠️ SOLO después de que existan las opciones
      if (mascotas.find(m => m.id === cita.mascota_id)) {
        form.setValue('mascota_id', cita.mascota_id)
      }
    }

    cargarEdicion()
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

  const buscarClientes = async (search: string) => {
    try {
      const res = await axios.get<Cliente[]>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes?search=${encodeURIComponent(search)}&limit=20`,
        { withCredentials: true }
      )
      setClientes(res.data)
    } catch {
      setClientes([])
    } finally {
      setClientesLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
            name="fecha_hora"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y hora</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          name="cliente_id"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>

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

              {clientesOpen && (
                <div className="border rounded mt-2 p-2 bg-white space-y-2">
                  <Input
                    placeholder="Escribe al menos 3 letras..."
                    value={clientesSearch}
                    onChange={e => setClientesSearch(e.target.value)}
                    autoFocus
                  />

                  {clientesLoading && <p className="text-sm">Buscando...</p>}

                  {clientes.map(c => (
                    <div
                      key={c.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                      onClick={() => {
                        field.onChange(c.id)
                        setClienteSeleccionado(c)
                        setClientesOpen(false)
                        setClientesSearch('')
                        setClientes([])
                      }}
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

        <FormField
          name="mascota_id"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mascota</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={mascotasFiltradas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una mascota" />
                </SelectTrigger>
                <SelectContent>
                  {mascotasFiltradas.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="motivo"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mensaje && <div className="text-green-600">{mensaje}</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="flex justify-end gap-2">
          {cita.id && (
            <Button variant="outline" onClick={onCancelarCita}>
              Cancelar cita
            </Button>
          )}
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Form>
  )
}