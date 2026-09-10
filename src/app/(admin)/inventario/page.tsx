'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

const TIPOS = ['alimento', 'medicamento', 'accesorio', 'material_interno', 'vacuna', 'servicio'] as const
type TipoProducto = (typeof TIPOS)[number]
const TIPO_LABEL: Record<TipoProducto, string> = {
  alimento: 'Alimento', medicamento: 'Medicamento', accesorio: 'Accesorio',
  material_interno: 'Material interno', vacuna: 'Vacuna', servicio: 'Servicio',
}

interface Producto {
  id: string
  nombre: string
  codigo_barras: string | null
  tipo: TipoProducto
  unidad: string
  precio_base: number | null
  precio_actual: number | null
  stock_minimo: number
  stock_seguridad: number
  prioritario: boolean
  activo: boolean
  stock: number
  proxima_caducidad: string | null
  alerta_stock: boolean
  alerta_caducidad: boolean
}
interface Proveedor {
  id: string; nombre: string; contacto: string | null; telefono: string | null
  email: string | null; notas: string | null; activo: boolean
}
interface RenglonPedido {
  id: string; producto_id: string; cantidad_pedida: number; cantidad_recibida: number
  costo_unitario: number | null; producto?: { nombre: string; unidad: string }
}
interface Pedido {
  id: string; folio: number; estado: string; notas: string | null; creado_en: string
  fecha_recepcion: string | null
  proveedor: { nombre: string }
  renglones: { cantidad_pedida: number; cantidad_recibida: number }[]
}
interface PedidoDetalle {
  id: string; folio: number; estado: string; notas: string | null; creado_en: string
  fecha_recepcion: string | null
  proveedor: { nombre: string }
  renglones: RenglonPedido[]
}
interface Movimiento {
  id: string; tipo: string; cantidad: number; motivo: string | null; referencia: string | null
  fecha: string; lote?: { codigo_lote: string | null; caducidad: string | null } | null
}

const fechaCorta = (f?: string | null) =>
  f ? new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : '—'
const fechaHora = (f: string) =>
  new Date(f).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })

const ESTADO_PEDIDO: Record<string, { label: string; cls: string }> = {
  borrador: { label: 'Borrador', cls: 'bg-gray-100 text-gray-600' },
  enviado: { label: 'Enviado', cls: 'bg-blue-100 text-blue-700' },
  recibido_parcial: { label: 'Recibido parcial', cls: 'bg-amber-100 text-amber-700' },
  recibido: { label: 'Recibido', cls: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
}

export default function InventarioPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState<boolean | null>(null)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/auth/me`, { withCredentials: true }),
      axios.get<{ config: Record<string, boolean> }>(`${API}/empresa/modulos`),
    ])
      .then(([me, mod]) => {
        const rolOk = me.data.rol === 'admin' || me.data.rol === 'recepcion'
        setAutorizado(rolOk && (mod.data.config?.inventario ?? false))
      })
      .catch(() => setAutorizado(false))
  }, [])

  if (autorizado === null) return <p className="text-sm text-gray-400">Cargando…</p>
  if (!autorizado) return (
    <div className="max-w-3xl mx-auto">
      <p className="text-gray-500">El módulo de Inventario no está disponible para tu usuario.</p>
      <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>Volver al dashboard</Button>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>
      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="reposicion">Reposición</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
        </TabsList>
        <TabsContent value="catalogo"><CatalogoTab /></TabsContent>
        <TabsContent value="reposicion"><ReposicionTab /></TabsContent>
        <TabsContent value="pedidos"><PedidosTab /></TabsContent>
        <TabsContent value="proveedores"><ProveedoresTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ── Catálogo ─────────────────────────────────────────────────────────────────

function CatalogoTab() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [editar, setEditar] = useState<Producto | null | 'nuevo'>(null)
  const [movProducto, setMovProducto] = useState<Producto | null>(null)
  const [kardexProducto, setKardexProducto] = useState<Producto | null>(null)
  const [enReposicion, setEnReposicion] = useState<Set<string>>(new Set())

  const agregarAReposicion = async (id: string) => {
    try {
      await axios.post(`${API}/inventario/reposicion`, { producto_id: id }, { withCredentials: true })
      setEnReposicion((s) => new Set(s).add(id))
    } catch { /* noop */ }
  }

  const cargar = useCallback(() => {
    const params = new URLSearchParams()
    if (busqueda.trim()) params.set('search', busqueda.trim())
    if (tipo) params.set('tipo', tipo)
    if (soloAlertas) params.set('soloAlertas', 'true')
    axios.get<Producto[]>(`${API}/inventario/productos?${params}`, { withCredentials: true })
      .then((r) => setProductos(r.data))
      .catch(() => setProductos([]))
  }, [busqueda, tipo, soloAlertas])

  useEffect(() => {
    const t = setTimeout(cargar, 250)
    return () => clearTimeout(t)
  }, [cargar])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 my-4">
        <Input
          placeholder="Buscar por nombre o escanear código…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-72"
          autoFocus
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="border rounded px-2 py-2 text-sm">
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={soloAlertas} onCheckedChange={(v) => setSoloAlertas(!!v)} />
          Solo con alertas
        </label>
        <Button className="ml-auto" onClick={() => setEditar('nuevo')}>Nuevo producto</Button>
      </div>

      <div className="overflow-auto max-h-[60vh] border rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr className="text-left">
              <th className="p-2">Producto</th>
              <th className="p-2">Tipo</th>
              <th className="p-2 text-right">Stock</th>
              <th className="p-2 text-right">Mínimo</th>
              <th className="p-2">Próx. caducidad</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {productos.map((p) => (
              <tr key={p.id} className={p.alerta_stock ? 'bg-red-50' : ''}>
                <td className="p-2">
                  <div className="font-medium text-gray-900">
                    {p.prioritario && <span className="text-amber-500" title="Prioritario">★ </span>}
                    {p.nombre}
                    {!p.activo && <span className="ml-1 text-xs text-gray-400">(inactivo)</span>}
                  </div>
                  {p.codigo_barras && <div className="text-xs text-gray-400 font-mono">{p.codigo_barras}</div>}
                </td>
                <td className="p-2 text-gray-600">{TIPO_LABEL[p.tipo]}</td>
                <td className={`p-2 text-right font-medium ${p.alerta_stock ? 'text-red-600' : 'text-gray-900'}`}>
                  {p.stock} {p.unidad}
                </td>
                <td className="p-2 text-right text-gray-500">{p.stock_minimo}</td>
                <td className={`p-2 ${p.alerta_caducidad ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {fechaCorta(p.proxima_caducidad)}
                </td>
                <td className="p-2">
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setMovProducto(p)}>Movimiento</Button>
                    <Button size="sm" variant="outline" onClick={() => setKardexProducto(p)}>Kardex</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditar(p)}>Editar</Button>
                    <Button
                      size="sm" variant="outline"
                      disabled={enReposicion.has(p.id)}
                      onClick={() => agregarAReposicion(p.id)}
                    >
                      {enReposicion.has(p.id) ? 'En reposición ✓' : '+ Reposición'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Sin productos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editar !== null && (
        <ProductoDialog
          producto={editar === 'nuevo' ? null : editar}
          onClose={() => setEditar(null)}
          onGuardado={() => { setEditar(null); cargar() }}
        />
      )}
      {movProducto && (
        <MovimientoDialog
          producto={movProducto}
          onClose={() => setMovProducto(null)}
          onGuardado={() => { setMovProducto(null); cargar() }}
        />
      )}
      {kardexProducto && (
        <KardexDialog producto={kardexProducto} onClose={() => setKardexProducto(null)} />
      )}
    </div>
  )
}

function ProductoDialog({ producto, onClose, onGuardado }: {
  producto: Producto | null; onClose: () => void; onGuardado: () => void
}) {
  const [f, setF] = useState({
    nombre: producto?.nombre ?? '',
    codigo_barras: producto?.codigo_barras ?? '',
    tipo: (producto?.tipo ?? 'medicamento') as TipoProducto,
    unidad: producto?.unidad ?? 'pieza',
    precio_base: producto?.precio_base?.toString() ?? '',
    precio_actual: producto?.precio_actual?.toString() ?? '',
    stock_minimo: (producto?.stock_minimo ?? 0).toString(),
    stock_seguridad: (producto?.stock_seguridad ?? 0).toString(),
    prioritario: producto?.prioritario ?? false,
    activo: producto?.activo ?? true,
  })
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    setGuardando(true); setError(null)
    const payload = {
      nombre: f.nombre.trim(),
      codigo_barras: f.codigo_barras.trim() || undefined,
      tipo: f.tipo,
      unidad: f.unidad.trim() || 'pieza',
      precio_base: f.precio_base ? Number(f.precio_base) : null,
      precio_actual: f.precio_actual ? Number(f.precio_actual) : null,
      stock_minimo: Number(f.stock_minimo) || 0,
      stock_seguridad: Number(f.stock_seguridad) || 0,
      prioritario: f.prioritario,
      activo: f.activo,
    }
    try {
      if (producto) await axios.patch(`${API}/inventario/productos/${producto.id}`, payload, { withCredentials: true })
      else await axios.post(`${API}/inventario/productos`, payload, { withCredentials: true })
      onGuardado()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo guardar')
    } finally { setGuardando(false) }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{producto ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          <DialogDescription>El stock no se edita aquí: se ajusta con movimientos y pedidos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Campo label="Nombre">
            <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Código de barras">
              <Input value={f.codigo_barras} onChange={(e) => setF({ ...f, codigo_barras: e.target.value })} />
            </Campo>
            <Campo label="Tipo">
              <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoProducto })}
                className="border rounded px-2 py-2 text-sm w-full">
                {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Unidad">
              <Input value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} />
            </Campo>
            <Campo label="Precio venta">
              <Input type="number" value={f.precio_actual} onChange={(e) => setF({ ...f, precio_actual: e.target.value })} />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Stock mínimo (alerta)">
              <Input type="number" value={f.stock_minimo} onChange={(e) => setF({ ...f, stock_minimo: e.target.value })} />
            </Campo>
            <Campo label="Stock de seguridad (reposición)">
              <Input type="number" value={f.stock_seguridad} onChange={(e) => setF({ ...f, stock_seguridad: e.target.value })} />
            </Campo>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={f.prioritario} onCheckedChange={(v) => setF({ ...f, prioritario: !!v })} /> Prioritario
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={f.activo} onCheckedChange={(v) => setF({ ...f, activo: !!v })} /> Activo
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando || !f.nombre.trim()}>{guardando ? 'Guardando…' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MovimientoDialog({ producto, onClose, onGuardado }: {
  producto: Producto; onClose: () => void; onGuardado: () => void
}) {
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'merma'>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [codigoLote, setCodigoLote] = useState('')
  const [caducidad, setCaducidad] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    setGuardando(true); setError(null)
    try {
      await axios.post(`${API}/inventario/movimientos`, {
        producto_id: producto.id,
        tipo,
        cantidad: Number(cantidad),
        motivo: motivo.trim() || undefined,
        codigo_lote: tipo === 'entrada' ? codigoLote.trim() || undefined : undefined,
        caducidad: tipo === 'entrada' && caducidad ? caducidad : undefined,
      }, { withCredentials: true })
      onGuardado()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo registrar')
    } finally { setGuardando(false) }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimiento — {producto.nombre}</DialogTitle>
          <DialogDescription>Stock actual: {producto.stock} {producto.unidad}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Campo label="Tipo">
            <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}
              className="border rounded px-2 py-2 text-sm w-full">
              <option value="entrada">Entrada (nuevo lote)</option>
              <option value="salida">Salida</option>
              <option value="merma">Merma</option>
            </select>
          </Campo>
          <Campo label="Cantidad">
            <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </Campo>
          {tipo === 'entrada' && (
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Código de lote"><Input value={codigoLote} onChange={(e) => setCodigoLote(e.target.value)} /></Campo>
              <Campo label="Caducidad"><Input type="date" value={caducidad} onChange={(e) => setCaducidad(e.target.value)} /></Campo>
            </div>
          )}
          <Campo label="Motivo"><Input value={motivo} onChange={(e) => setMotivo(e.target.value)} /></Campo>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando || !(Number(cantidad) > 0)}>{guardando ? 'Guardando…' : 'Registrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function KardexDialog({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  const [movs, setMovs] = useState<Movimiento[] | null>(null)
  useEffect(() => {
    axios.get<Movimiento[]>(`${API}/inventario/productos/${producto.id}/movimientos`, { withCredentials: true })
      .then((r) => setMovs(r.data)).catch(() => setMovs([]))
  }, [producto.id])
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kardex — {producto.nombre}</DialogTitle>
          <DialogDescription>Últimos movimientos de stock.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          {!movs ? <p className="text-sm text-gray-400 p-4">Cargando…</p> : movs.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">Sin movimientos</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0"><tr className="text-left">
                <th className="p-2">Fecha</th><th className="p-2">Tipo</th><th className="p-2 text-right">Cant.</th>
                <th className="p-2">Lote</th><th className="p-2">Motivo</th>
              </tr></thead>
              <tbody className="divide-y">
                {movs.map((m) => (
                  <tr key={m.id}>
                    <td className="p-2 text-gray-500">{fechaHora(m.fecha)}</td>
                    <td className="p-2 capitalize">{m.tipo}</td>
                    <td className={`p-2 text-right font-medium ${m.cantidad < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                    </td>
                    <td className="p-2 text-gray-500">
                      {m.lote?.codigo_lote ?? '—'}{m.lote?.caducidad ? ` · vence ${fechaCorta(m.lote.caducidad)}` : ''}
                    </td>
                    <td className="p-2 text-gray-600">{m.motivo ?? m.referencia ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Proveedores ──────────────────────────────────────────────────────────────

function ProveedoresTab() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [editar, setEditar] = useState<Proveedor | null | 'nuevo'>(null)
  const [verPedidos, setVerPedidos] = useState<Proveedor | null>(null)

  const cargar = useCallback(() => {
    axios.get<Proveedor[]>(`${API}/inventario/proveedores`, { withCredentials: true })
      .then((r) => setProveedores(r.data)).catch(() => setProveedores([]))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex my-4">
        <Button className="ml-auto" onClick={() => setEditar('nuevo')}>Nuevo proveedor</Button>
      </div>
      <div className="border rounded shadow overflow-auto max-h-[60vh]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0"><tr className="text-left">
            <th className="p-2">Nombre</th><th className="p-2">Contacto</th><th className="p-2">Teléfono</th>
            <th className="p-2">Email</th><th className="p-2"></th>
          </tr></thead>
          <tbody className="divide-y">
            {proveedores.map((p) => (
              <tr key={p.id}>
                <td className="p-2 font-medium">{p.nombre}{!p.activo && <span className="ml-1 text-xs text-gray-400">(inactivo)</span>}</td>
                <td className="p-2 text-gray-600">{p.contacto ?? '—'}</td>
                <td className="p-2 text-gray-600">{p.telefono ?? '—'}</td>
                <td className="p-2 text-gray-600">{p.email ?? '—'}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setVerPedidos(p)}>Ver pedidos</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditar(p)}>Editar</Button>
                  </div>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Sin proveedores</td></tr>}
          </tbody>
        </table>
      </div>
      {editar !== null && (
        <ProveedorDialog
          proveedor={editar === 'nuevo' ? null : editar}
          onClose={() => setEditar(null)}
          onGuardado={() => { setEditar(null); cargar() }}
        />
      )}
      {verPedidos && <ProveedorPedidosDialog proveedor={verPedidos} onClose={() => setVerPedidos(null)} />}
    </div>
  )
}

function ProveedorPedidosDialog({ proveedor, onClose }: { proveedor: Proveedor; onClose: () => void }) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null)
  useEffect(() => {
    axios.get<Pedido[]>(`${API}/inventario/proveedores/${proveedor.id}/pedidos`, { withCredentials: true })
      .then((r) => setPedidos(r.data)).catch(() => setPedidos([]))
  }, [proveedor.id])
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Pedidos — {proveedor.nombre}</DialogTitle>
          <DialogDescription>Pedidos registrados a este proveedor.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          {!pedidos ? <p className="text-sm text-gray-400 p-4">Cargando…</p> : pedidos.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">Sin pedidos</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left">
                <th className="p-2">Folio</th><th className="p-2">Fecha</th><th className="p-2">Estado</th><th className="p-2">Recibido</th>
              </tr></thead>
              <tbody className="divide-y">
                {pedidos.map((p) => {
                  const est = ESTADO_PEDIDO[p.estado] ?? { label: p.estado, cls: 'bg-gray-100 text-gray-600' }
                  const ped = p.renglones.reduce((s, r) => s + r.cantidad_pedida, 0)
                  const rec = p.renglones.reduce((s, r) => s + r.cantidad_recibida, 0)
                  return (
                    <tr key={p.id}>
                      <td className="p-2 font-mono">#{p.folio}</td>
                      <td className="p-2 text-gray-500">{fechaCorta(p.creado_en)}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${est.cls}`}>{est.label}</span></td>
                      <td className="p-2 text-gray-600">{rec} / {ped}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProveedorDialog({ proveedor, onClose, onGuardado }: {
  proveedor: Proveedor | null; onClose: () => void; onGuardado: () => void
}) {
  const [f, setF] = useState({
    nombre: proveedor?.nombre ?? '', contacto: proveedor?.contacto ?? '', telefono: proveedor?.telefono ?? '',
    email: proveedor?.email ?? '', notas: proveedor?.notas ?? '', activo: proveedor?.activo ?? true,
  })
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    setGuardando(true); setError(null)
    const payload = {
      nombre: f.nombre.trim(), contacto: f.contacto.trim() || undefined, telefono: f.telefono.trim() || undefined,
      email: f.email.trim() || undefined, notas: f.notas.trim() || undefined, activo: f.activo,
    }
    try {
      if (proveedor) await axios.patch(`${API}/inventario/proveedores/${proveedor.id}`, payload, { withCredentials: true })
      else await axios.post(`${API}/inventario/proveedores`, payload, { withCredentials: true })
      onGuardado()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo guardar')
    } finally { setGuardando(false) }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          <DialogDescription>Datos de contacto del proveedor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Campo label="Nombre"><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Contacto"><Input value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} /></Campo>
            <Campo label="Teléfono"><Input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} /></Campo>
          </div>
          <Campo label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Campo>
          <Campo label="Notas"><Input value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} /></Campo>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={f.activo} onCheckedChange={(v) => setF({ ...f, activo: !!v })} /> Activo
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando || !f.nombre.trim()}>{guardando ? 'Guardando…' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Reposición ───────────────────────────────────────────────────────────────

interface ReposicionItem {
  id: string
  cantidad: number
  nota: string | null
  producto: { id: string; nombre: string; unidad: string; stock_minimo: number; stock_seguridad: number; stock: number }
}

function ReposicionTab() {
  const [items, setItems] = useState<ReposicionItem[]>([])
  const [proc, setProc] = useState(false)
  const [crearPedido, setCrearPedido] = useState(false)

  const cargar = useCallback(() => {
    axios.get<ReposicionItem[]>(`${API}/inventario/reposicion`, { withCredentials: true })
      .then((r) => setItems(r.data)).catch(() => setItems([]))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const recalcular = async () => {
    setProc(true)
    try {
      const r = await axios.post<ReposicionItem[]>(`${API}/inventario/reposicion/recalcular`, {}, { withCredentials: true })
      setItems(r.data)
    } catch { /* noop */ } finally { setProc(false) }
  }

  const setCantidad = async (id: string, cantidad: number) => {
    setItems((its) => its.map((i) => (i.id === id ? { ...i, cantidad } : i)))
    await axios.patch(`${API}/inventario/reposicion/${id}`, { cantidad }, { withCredentials: true }).catch(() => {})
  }
  const quitar = async (id: string) => {
    await axios.delete(`${API}/inventario/reposicion/${id}`, { withCredentials: true }).catch(() => {})
    cargar()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 my-4">
        <p className="text-sm text-gray-500">
          Productos por reponer. Cantidad sugerida = stock de seguridad − stock actual.
        </p>
        <Button variant="outline" onClick={recalcular} disabled={proc} className="ml-auto">
          {proc ? 'Recalculando…' : 'Recalcular'}
        </Button>
        <Button onClick={() => setCrearPedido(true)} disabled={items.length === 0}>Crear pedido</Button>
      </div>
      <div className="border rounded shadow overflow-auto max-h-[60vh]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0"><tr className="text-left">
            <th className="p-2">Producto</th><th className="p-2 text-right">Stock</th>
            <th className="p-2 text-right">Mínimo</th><th className="p-2 text-right">Seguridad</th>
            <th className="p-2 text-right">A pedir</th><th className="p-2"></th>
          </tr></thead>
          <tbody className="divide-y">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="p-2 font-medium">{i.producto.nombre}</td>
                <td className="p-2 text-right">{i.producto.stock} {i.producto.unidad}</td>
                <td className="p-2 text-right text-gray-500">{i.producto.stock_minimo}</td>
                <td className="p-2 text-right text-gray-500">{i.producto.stock_seguridad}</td>
                <td className="p-2 text-right">
                  <Input
                    type="number"
                    value={i.cantidad}
                    onChange={(e) => setCantidad(i.id, Number(e.target.value))}
                    className="w-24 ml-auto"
                  />
                </td>
                <td className="p-2"><Button size="sm" variant="outline" onClick={() => quitar(i.id)}>Quitar</Button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Lista vacía. Usa &quot;Recalcular&quot; o &quot;+ Reposición&quot; desde el catálogo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {crearPedido && (
        <CrearPedidoReposicionDialog
          items={items}
          onClose={() => setCrearPedido(false)}
          onCreado={() => { setCrearPedido(false); cargar() }}
        />
      )}
    </div>
  )
}

function CrearPedidoReposicionDialog({ items, onClose, onCreado }: {
  items: ReposicionItem[]; onClose: () => void; onCreado: () => void
}) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [proveedorId, setProveedorId] = useState('')
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(items.map((i) => i.id)))
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [proc, setProc] = useState(false)

  useEffect(() => {
    axios.get<Proveedor[]>(`${API}/inventario/proveedores`, { withCredentials: true })
      .then((r) => setProveedores(r.data)).catch(() => {})
  }, [])

  const toggle = (id: string) => setSeleccion((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })

  const crear = async () => {
    if (!proveedorId || seleccion.size === 0) { setError('Elige proveedor y al menos un producto'); return }
    setProc(true); setError(null)
    try {
      await axios.post(`${API}/inventario/reposicion/crear-pedido`, {
        proveedor_id: proveedorId,
        item_ids: [...seleccion],
        notas: notas.trim() || undefined,
      }, { withCredentials: true })
      onCreado()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo crear el pedido')
    } finally { setProc(false) }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear pedido desde reposición</DialogTitle>
          <DialogDescription>Los productos elegidos salen de la lista al crear el pedido.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-auto">
          <Campo label="Proveedor">
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} className="border rounded px-2 py-2 text-sm w-full">
              <option value="">Selecciona…</option>
              {proveedores.filter((p) => p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Campo>
          <div>
            <p className="text-sm font-medium mb-1">Productos</p>
            {items.map((i) => (
              <label key={i.id} className="flex items-center gap-2 text-sm py-1">
                <Checkbox checked={seleccion.has(i.id)} onCheckedChange={() => toggle(i.id)} />
                <span className="flex-1">{i.producto.nombre}</span>
                <span className="text-gray-500">{i.cantidad} {i.producto.unidad}</span>
              </label>
            ))}
          </div>
          <Campo label="Notas"><Input value={notas} onChange={(e) => setNotas(e.target.value)} /></Campo>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={crear} disabled={proc}>{proc ? 'Creando…' : 'Crear pedido'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Pedidos ──────────────────────────────────────────────────────────────────

function PedidosTab() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [nuevo, setNuevo] = useState(false)
  const [verId, setVerId] = useState<string | null>(null)

  const cargar = useCallback(() => {
    axios.get<Pedido[]>(`${API}/inventario/pedidos`, { withCredentials: true })
      .then((r) => setPedidos(r.data)).catch(() => setPedidos([]))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex my-4">
        <Button className="ml-auto" onClick={() => setNuevo(true)}>Nuevo pedido</Button>
      </div>
      <div className="border rounded shadow overflow-auto max-h-[60vh]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0"><tr className="text-left">
            <th className="p-2">Folio</th><th className="p-2">Proveedor</th><th className="p-2">Fecha</th>
            <th className="p-2">Estado</th><th className="p-2">Recibido</th><th className="p-2"></th>
          </tr></thead>
          <tbody className="divide-y">
            {pedidos.map((p) => {
              const pedidoTot = p.renglones.reduce((s, r) => s + r.cantidad_pedida, 0)
              const recibidoTot = p.renglones.reduce((s, r) => s + r.cantidad_recibida, 0)
              const est = ESTADO_PEDIDO[p.estado] ?? { label: p.estado, cls: 'bg-gray-100 text-gray-600' }
              return (
                <tr key={p.id}>
                  <td className="p-2 font-mono">#{p.folio}</td>
                  <td className="p-2">{p.proveedor.nombre}</td>
                  <td className="p-2 text-gray-500">{fechaCorta(p.creado_en)}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${est.cls}`}>{est.label}</span></td>
                  <td className="p-2 text-gray-600">{recibidoTot} / {pedidoTot}</td>
                  <td className="p-2"><Button size="sm" variant="outline" onClick={() => setVerId(p.id)}>Ver / recibir</Button></td>
                </tr>
              )
            })}
            {pedidos.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400">Sin pedidos</td></tr>}
          </tbody>
        </table>
      </div>
      {nuevo && <NuevoPedidoDialog onClose={() => setNuevo(false)} onGuardado={() => { setNuevo(false); cargar() }} />}
      {verId && <PedidoDetalleDialog id={verId} onClose={() => setVerId(null)} onCambio={cargar} />}
    </div>
  )
}

function NuevoPedidoDialog({ onClose, onGuardado }: { onClose: () => void; onGuardado: () => void }) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedorId, setProveedorId] = useState('')
  const [notas, setNotas] = useState('')
  const [renglones, setRenglones] = useState<{ producto_id: string; cantidad: string; costo: string }[]>([
    { producto_id: '', cantidad: '', costo: '' },
  ])
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    axios.get<Proveedor[]>(`${API}/inventario/proveedores`, { withCredentials: true }).then((r) => setProveedores(r.data)).catch(() => {})
    axios.get<Producto[]>(`${API}/inventario/productos`, { withCredentials: true }).then((r) => setProductos(r.data)).catch(() => {})
  }, [])

  const setR = (i: number, patch: Partial<{ producto_id: string; cantidad: string; costo: string }>) =>
    setRenglones((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const guardar = async () => {
    setGuardando(true); setError(null)
    const rs = renglones
      .filter((r) => r.producto_id && Number(r.cantidad) > 0)
      .map((r) => ({ producto_id: r.producto_id, cantidad_pedida: Number(r.cantidad), costo_unitario: r.costo ? Number(r.costo) : null }))
    if (!proveedorId || rs.length === 0) { setError('Elige proveedor y al menos un renglón válido'); setGuardando(false); return }
    try {
      await axios.post(`${API}/inventario/pedidos`, { proveedor_id: proveedorId, notas: notas.trim() || undefined, renglones: rs }, { withCredentials: true })
      onGuardado()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo crear el pedido')
    } finally { setGuardando(false) }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo pedido a proveedor</DialogTitle>
          <DialogDescription>Se crea en borrador. El stock entra al recibir la mercancía.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[65vh] overflow-auto">
          <Campo label="Proveedor">
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} className="border rounded px-2 py-2 text-sm w-full">
              <option value="">Selecciona…</option>
              {proveedores.filter((p) => p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Campo>
          <div>
            <p className="text-sm font-medium mb-1">Renglones</p>
            {renglones.map((r, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select value={r.producto_id} onChange={(e) => setR(i, { producto_id: e.target.value })}
                  className="border rounded px-2 py-1 text-sm flex-1">
                  <option value="">Producto…</option>
                  {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <Input type="number" placeholder="Cant." value={r.cantidad} onChange={(e) => setR(i, { cantidad: e.target.value })} className="w-24" />
                <Input type="number" placeholder="Costo u." value={r.costo} onChange={(e) => setR(i, { costo: e.target.value })} className="w-28" />
                <Button variant="outline" size="sm" onClick={() => setRenglones((rs) => rs.filter((_, j) => j !== i))} disabled={renglones.length === 1}>×</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setRenglones((rs) => [...rs, { producto_id: '', cantidad: '', costo: '' }])}>
              + Agregar renglón
            </Button>
          </div>
          <Campo label="Notas"><Input value={notas} onChange={(e) => setNotas(e.target.value)} /></Campo>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Crear pedido'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PedidoDetalleDialog({ id, onClose, onCambio }: { id: string; onClose: () => void; onCambio: () => void }) {
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [recibir, setRecibir] = useState<Record<string, { cantidad: string; lote: string; caducidad: string }>>({})
  const [error, setError] = useState<string | null>(null)
  const [proc, setProc] = useState(false)

  const cargar = useCallback(() => {
    axios.get(`${API}/inventario/pedidos/${id}`, { withCredentials: true }).then((r) => setPedido(r.data)).catch(() => setPedido(null))
  }, [id])
  useEffect(() => { cargar() }, [cargar])

  const cerrado = pedido?.estado === 'recibido' || pedido?.estado === 'cancelado'

  const enviarRecepcion = async () => {
    if (!pedido) return
    setProc(true); setError(null)
    const rs = Object.entries(recibir)
      .filter(([, v]) => Number(v.cantidad) > 0)
      .map(([renglon_id, v]) => ({ renglon_id, cantidad: Number(v.cantidad), codigo_lote: v.lote.trim() || undefined, caducidad: v.caducidad || undefined }))
    if (rs.length === 0) { setError('Indica cantidades a recibir'); setProc(false); return }
    try {
      await axios.post(`${API}/inventario/pedidos/${id}/recibir`, { renglones: rs }, { withCredentials: true })
      setRecibir({})
      cargar(); onCambio()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo recibir')
    } finally { setProc(false) }
  }

  const cambiarEstado = async (estado: string) => {
    setProc(true); setError(null)
    try {
      await axios.patch(`${API}/inventario/pedidos/${id}`, { estado }, { withCredentials: true })
      cargar(); onCambio()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo actualizar')
    } finally { setProc(false) }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pedido #{pedido?.folio} — {pedido?.proveedor.nombre}</DialogTitle>
          <DialogDescription>
            {pedido && <>Estado: {ESTADO_PEDIDO[pedido.estado]?.label ?? pedido.estado}</>}
          </DialogDescription>
        </DialogHeader>
        {!pedido ? <p className="text-sm text-gray-400 p-4">Cargando…</p> : (
          <div className="space-y-3 py-2 max-h-[65vh] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left">
                <th className="p-2">Producto</th><th className="p-2 text-right">Pedido</th><th className="p-2 text-right">Recibido</th>
                {!cerrado && <th className="p-2">Recibir ahora</th>}
              </tr></thead>
              <tbody className="divide-y">
                {pedido.renglones.map((r) => {
                  const pendiente = r.cantidad_pedida - r.cantidad_recibida
                  const v = recibir[r.id] ?? { cantidad: '', lote: '', caducidad: '' }
                  return (
                    <tr key={r.id}>
                      <td className="p-2">{r.producto?.nombre ?? '—'}</td>
                      <td className="p-2 text-right">{r.cantidad_pedida}</td>
                      <td className="p-2 text-right">{r.cantidad_recibida}</td>
                      {!cerrado && (
                        <td className="p-2">
                          {pendiente > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              <Input type="number" placeholder={`≤ ${pendiente}`} value={v.cantidad} className="w-20"
                                onChange={(e) => setRecibir({ ...recibir, [r.id]: { ...v, cantidad: e.target.value } })} />
                              <Input placeholder="Lote" value={v.lote} className="w-24"
                                onChange={(e) => setRecibir({ ...recibir, [r.id]: { ...v, lote: e.target.value } })} />
                              <Input type="date" value={v.caducidad} className="w-36"
                                onChange={(e) => setRecibir({ ...recibir, [r.id]: { ...v, caducidad: e.target.value } })} />
                            </div>
                          ) : <span className="text-xs text-green-600">Completo</span>}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {pedido.notas && <p className="text-sm text-gray-500">Notas: {pedido.notas}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
        <DialogFooter className="flex-wrap gap-2">
          {pedido && !cerrado && pedido.estado === 'borrador' && (
            <Button variant="outline" onClick={() => cambiarEstado('enviado')} disabled={proc}>Marcar enviado</Button>
          )}
          {pedido && !cerrado && (
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => cambiarEstado('cancelado')} disabled={proc}>
              Cancelar pedido
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          {pedido && !cerrado && (
            <Button onClick={enviarRecepcion} disabled={proc}>{proc ? 'Procesando…' : 'Recibir mercancía'}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── util ─────────────────────────────────────────────────────────────────────

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
