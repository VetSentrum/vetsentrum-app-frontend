'use client'

import { useState, useEffect } from 'react'
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form'

const schema = z.object({
  nombre_completo: z.string().min(3, 'El nombre es obligatorio'),
  telefono: z.string().min(7, 'Teléfono inválido'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  calle: z.string().max(30).optional(),
  numero: z.string().max(5).optional(),
  municipio: z.string().optional(),
  colonia: z.string().optional(),
  codigo_postal: z.string().optional()
})

type FormData = z.infer<typeof schema>

interface Cliente {
  id: string
  nombre_completo: string
  telefono: string
  email?: string
  direccion?: string
  activo: boolean
  calle?: string
  numero?: string
  municipio?: string
  colonia?: string
  codigo_postal?: string
}

interface Props {
  cliente: Cliente | null
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

const municipios = [
  { municipio: 1, nombre: 'Abasolo' },
  { municipio: 2, nombre: 'Agualeguas' },
  { municipio: 3, nombre: 'Los Aldamas' },
  { municipio: 4, nombre: 'Allende' },
  { municipio: 5, nombre: 'Anáhuac' },
  { municipio: 6, nombre: 'Apodaca' },
  { municipio: 7, nombre: 'Aramberri' },
  { municipio: 8, nombre: 'Bustamante' },
  { municipio: 9, nombre: 'Cadereyta Jiménez' },
  { municipio: 10, nombre: 'El Carmen' },
  { municipio: 11, nombre: 'Cerralvo' },
  { municipio: 12, nombre: 'Ciénega de Flores' },
  { municipio: 13, nombre: 'China' },
  { municipio: 14, nombre: 'Dr. Arroyo' },
  { municipio: 15, nombre: 'Dr. Coss' },
  { municipio: 16, nombre: 'Dr. González' },
  { municipio: 17, nombre: 'Galeana' },
  { municipio: 18, nombre: 'García' },
  { municipio: 19, nombre: 'San Pedro Garza García' },
  { municipio: 20, nombre: 'Gral. Bravo' },
  { municipio: 21, nombre: 'Gral. Escobedo' },
  { municipio: 22, nombre: 'Gral. Terán' },
  { municipio: 23, nombre: 'Gral. Treviño' },
  { municipio: 24, nombre: 'Gral. Zaragoza' },
  { municipio: 25, nombre: 'Gral. Zuazua' },
  { municipio: 26, nombre: 'Guadalupe' },
  { municipio: 27, nombre: 'Los Herreras' },
  { municipio: 28, nombre: 'Hidalgo' },
  { municipio: 29, nombre: 'Higueras' },
  { municipio: 30, nombre: 'Hualahuises' },
  { municipio: 31, nombre: 'Iturbide' },
  { municipio: 32, nombre: 'Juárez' },
  { municipio: 33, nombre: 'Lampazos de Naranjo' },
  { municipio: 34, nombre: 'Linares' },
  { municipio: 35, nombre: 'Marín' },
  { municipio: 36, nombre: 'Melchor Ocampo' },
  { municipio: 37, nombre: 'Mier Y Noriega' },
  { municipio: 38, nombre: 'Mina' },
  { municipio: 39, nombre: 'Montemorelos' },
  { municipio: 40, nombre: 'Monterrey' },
  { municipio: 41, nombre: 'Parás' },
  { municipio: 42, nombre: 'Pesquería' },
  { municipio: 43, nombre: 'Los Ramones' },
  { municipio: 44, nombre: 'Rayones' },
  { municipio: 45, nombre: 'Sabinas Hidalgo' },
  { municipio: 46, nombre: 'Salinas Victoria' },
  { municipio: 47, nombre: 'San Nicolás De Los Garza' },
  { municipio: 48, nombre: 'Santa Catarina' },
  { municipio: 49, nombre: 'Santiago' },
  { municipio: 50, nombre: 'Vallecillo' },
  { municipio: 51, nombre: 'Villaldama' }
]

interface Colonia {
  id: number
  municipioId: number
  nombre: string
  codigoPostal: string
}

function parseDireccion(direccion?: string) {
  if (!direccion) return null;
  try {
    // Quitar ", Nuevo León"
    const sinEstado = direccion.replace(", Nuevo León", "").trim();

    // Separar por coma
    const partes = sinEstado.split(",").map(p => p.trim());

    // Debe tener al menos 4 partes: calle#numero, colonia, municipio, cp
    if (partes.length < 4) return null;

    // Calle y número
    let calle = "";
    let numero = "";
    if (partes[0].includes("#")) {
      [calle, numero] = partes[0].split("#").map(p => p.trim());
    } else {
      calle = partes[0];
    }

    const colonia = partes[1];
    const municipio = partes[2];
    const codigo_postal = partes[3];

    return { calle, numero, colonia, municipio, codigo_postal };
  } catch (err) {
    console.error("Error parseando dirección:", err);
    return null;
  }
}

export function EditarClienteForm({ cliente, onClose, onSuccess }: Props) {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | JSX.Element | null>(null);
  const [coloniasFiltradas, setColoniasFiltradas] = useState<Colonia[]>([])
  const [usuario, setUsuario] = useState<{ id: string; rol: "admin" | "recepcion" | "veterinario" } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const parsed = parseDireccion(cliente?.direccion)
  const necesitaActualizar = !parsed

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...cliente,
      ...(parsed || {}),
      email: cliente?.email || ""
    }
  })

  const municipioWatch = form.watch("municipio");

  // Cargar colonias según municipio seleccionado
  useEffect(() => {
    const municipioObj = municipios.find(m => m.nombre === municipioWatch)
    const municipioId = municipioObj?.municipio

    if (municipioId) {
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/colonias/municipio/${municipioId}`, { withCredentials: true })
        .then(res => setColoniasFiltradas(res.data))
        .catch(() => setColoniasFiltradas([]))
    } else {
      setColoniasFiltradas([])
      form.setValue("colonia", "")
      form.setValue("codigo_postal", "")
    }
  }, [municipioWatch, form])

  // Inicializar colonia y CP si hay cliente
  useEffect(() => {
    if (cliente?.colonia && cliente?.municipio) {
      const municipioObj = municipios.find(m => m.nombre === cliente.municipio)
      if (municipioObj) {
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/colonias/municipio/${municipioObj.municipio}`, { withCredentials: true })
          .then(res => {
            setColoniasFiltradas(res.data)
            form.setValue("colonia", cliente.colonia)
            form.setValue("codigo_postal", cliente.codigo_postal || "")
          })
          .catch(() => setColoniasFiltradas([]))
      }
    }
  }, [cliente, form])

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { withCredentials: true })
      .then(res => setUsuario(res.data))
      .catch(() => setUsuario(null));
  }, []);
  const rolActual = usuario?.rol;

  const onSubmit = async (data: FormData) => {
    setError(null)
    setMensaje(null)

    try {
      setGuardando(true);
      const direccion = `${data.calle || ''} ${data.numero || ''}, ${data.colonia || ''}, ${data.municipio || ''}. ${data.codigo_postal || ''}, Nuevo León`

      if (cliente) {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${cliente.id}/`,
          { ...data, direccion },
          { withCredentials: true }
        )
        setMensaje('Cliente actualizado correctamente')
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes`,
          { ...data, direccion },
          { withCredentials: true }
        )
        setMensaje('Cliente creado correctamente')
      }

      onSuccess(mensaje || 'Operación exitosa')
      onClose()
    } catch (e: unknown) {
      let mensajeError = 'Error al guardar cliente'

      if (typeof e === 'object' && e !== null && 'response' in e) {
        const err = e as { response?: { data?: { message?: string } } }
        if (err.response?.data?.message) {
          mensajeError = err.response.data.message
        }
      } else if (e instanceof Error) {
        mensajeError = e.message || mensajeError
      }

      setError(mensajeError)
    } finally {
      setGuardando(false);
    }
  }

  const toggleActivo = async (id: string, activo: boolean) => {
    const nuevoEstado = !activo;
  
    try {
      setGuardando(true);
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${id}/${activo ? 'inactivar' : 'activar'}`,
        { activo: nuevoEstado },
        { withCredentials: true }
      );
  
      onSuccess(
        nuevoEstado
          ? 'Cliente reactivado correctamente'
          : 'Cliente inactivado correctamente'
      );
      onClose();
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      setError(
        nuevoEstado
          ? e.response?.data?.message || 'Error al reactivar cliente'
          : e.response?.data?.message || 'Error al inactivar cliente'
      );
    } finally {
      setGuardando(false);
    }
  };
  
  const eliminarCliente = async () => {
    if (!cliente) return

    if (rolActual === "admin" && cliente.activo) {
      setConfirmOpen(true);
      return;
    }

    await toggleActivo(cliente.id, cliente.activo);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-h-[80vh] overflow-y-auto pr-2"
      >
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

        {necesitaActualizar && cliente?.direccion && (
          <div className="p-2 border border-red-500 rounded">
            <p className="font-semibold">Dirección anterior:</p>
            <p>{cliente.direccion}</p>
            <p className="text-red-600 text-sm mt-1">
              Es obligatorio actualizar la dirección al nuevo formato
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-[4]">
            <FormField control={form.control} name="calle" render={({ field }) => (
              <FormItem>
                <FormLabel>Calle</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="flex-[1]">
            <FormField control={form.control} name="numero" render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-[4]">
            <FormField control={form.control} name="municipio" render={({ field }) => (
              <FormItem>
                <FormLabel>Municipio</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Selecciona un municipio</option>
                    {municipios.map(m => (
                      <option key={m.municipio} value={m.nombre}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>
          <div className="flex-[1]">
            <FormField control={form.control} name="codigo_postal" render={({ field }) => (
              <FormItem>
                <FormLabel>C. P.</FormLabel>
                <FormControl><Input {...field} disabled /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>
        </div>

        <FormField control={form.control} name="colonia" render={({ field }) => (
          <FormItem>
            <FormLabel>Colonia</FormLabel>
            <FormControl>
              <select
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  const selected = coloniasFiltradas.find(c => c.nombre === e.target.value)
                  if (selected) {
                    field.onChange(selected.nombre)
                    form.setValue("codigo_postal", selected.codigoPostal)
                  } else {
                    field.onChange("")
                    form.setValue("codigo_postal", "")
                  }
                }}
                className="border p-2 rounded w-full"
              >
                <option value="">Selecciona una colonia</option>
                {coloniasFiltradas.map(c => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}/>

        <div className="flex items-center justify-between w-full">
          {guardando ? <Button type="submit" disabled >Guardar cambios</Button> : <Button type="submit" >Guardar cambios</Button>}
          
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
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar cliente también?</DialogTitle>
              <DialogDescription>
                También puede eliminar definitivamente el registro.
                Eliminar el registro no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (cliente) {
                    toggleActivo(cliente.id, cliente.activo);
                  }
                  setConfirmOpen(false);
                }}
              >
                Sólo inactivar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await axios.delete(
                      `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${cliente?.id}`,
                      { withCredentials: true }
                    );
                    onSuccess("Cliente eliminado definitivamente");
                    onClose();
                    setConfirmOpen(false);
                  } catch (err) {
                    setConfirmOpen(false);
                    const e = err as AxiosError<{ message: string; mascotas?: { nombre: string }[] }>;
                    if (e.response?.data?.mascotas) {
                      setError(
                        <span>
                          {e.response.data.message} Ejemplo:{" "}
                          {e.response.data.mascotas.map((m) => m.nombre).join(", ")}.{" "}
                          Puedes ver las{" "}
                          <a
                            href={`/mascotas?cliente=${cliente?.id}`}
                            className="text-blue-600 underline"
                          >
                            mascotas aquí
                          </a>
                          .
                        </span>
                      );
                    } else {
                      setError(e.response?.data?.message || "Error al eliminar cliente");
                    }
                  }
                }}
              >
                Eliminar definitivamente
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {mensaje && <p className="text-green-600">{mensaje}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </Form>
  )
}