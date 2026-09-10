'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { fechaClinica as fecha, fechaHoraClinica as fechaHora, hoyISOClinica as hoyISO } from '@/lib/fechas'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

type Metodo = 'efectivo' | 'tarjeta' | 'transferencia'
const METODOS: Metodo[] = ['efectivo', 'tarjeta', 'transferencia']
const METODO_LABEL: Record<Metodo, string> = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }

interface ClienteLite { id: string; nombre_completo: string }
interface ProductoVenta {
  id: string; nombre: string; tipo: string; unidad: string; precio_actual: number | null; stock: number
}
interface Detalle {
  id?: string; descripcion: string; es_servicio: boolean; cantidad: number; precio_unitario: number; subtotal: number
}
interface Venta {
  id: string; folio: number; fecha: string; metodo_pago: Metodo; total: number; estado: string
  observaciones: string | null; motivo_cancelacion: string | null; vendedor_nombre: string | null
  cliente: { nombre_completo: string } | null; detalles: Detalle[]
}
interface Cotizacion {
  id: string; folio: number; fecha: string; estado: string; total: number; venta_id: string | null
  observaciones: string | null; cliente: { nombre_completo: string } | null; detalles: Detalle[]
}
interface Corte {
  fecha: string; efectivo: number; tarjeta: number; transferencia: number; total: number; cantidad: number
  ventas: (Venta & { cliente: { nombre_completo: string } | null })[]
  canceladas: (Venta & { cliente: { nombre_completo: string } | null })[]
}

const money = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function VentasPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [rol, setRol] = useState('')

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/auth/me`, { withCredentials: true }),
      axios.get<{ config: Record<string, boolean> }>(`${API}/empresa/modulos`),
    ])
      .then(([me, mod]) => {
        setRol(me.data.rol)
        const rolOk = me.data.rol === 'admin' || me.data.rol === 'recepcion'
        setAutorizado(rolOk && (mod.data.config?.ventas ?? false))
      })
      .catch(() => setAutorizado(false))
  }, [])

  if (autorizado === null) return <p className="text-sm text-gray-400">Cargando…</p>
  if (!autorizado) return (
    <div className="max-w-3xl mx-auto">
      <p className="text-gray-500">El módulo de Ventas no está disponible para tu usuario.</p>
      <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>Volver al dashboard</Button>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ventas</h1>
      <Tabs defaultValue="pos">
        <TabsList>
          <TabsTrigger value="pos">Punto de venta</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="cotizaciones">Cotizaciones</TabsTrigger>
          <TabsTrigger value="corte">Corte de caja</TabsTrigger>
        </TabsList>
        <TabsContent value="pos"><PuntoDeVentaTab /></TabsContent>
        <TabsContent value="ventas"><VentasTab esAdmin={rol === 'admin'} /></TabsContent>
        <TabsContent value="cotizaciones"><CotizacionesTab /></TabsContent>
        <TabsContent value="corte"><CorteTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ── Editor de líneas y cliente (compartido) ──────────────────────────────────

interface LineaForm { producto_id: string; cantidad: string; precio: string }
const lineaVacia = (): LineaForm => ({ producto_id: '', cantidad: '1', precio: '' })

function useProductos() {
  const [productos, setProductos] = useState<ProductoVenta[]>([])
  useEffect(() => {
    axios.get<ProductoVenta[]>(`${API}/inventario/productos`, { withCredentials: true })
      .then((r) => setProductos(r.data)).catch(() => setProductos([]))
  }, [])
  return productos
}

function ClientePicker({ value, onChange }: { value: ClienteLite | null; onChange: (c: ClienteLite | null) => void }) {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<ClienteLite[]>([])
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (!q.trim() || value) { setResultados([]); return }
    const t = setTimeout(() => {
      axios.get<ClienteLite[]>(`${API}/clientes?search=${encodeURIComponent(q)}&limit=8`, { withCredentials: true })
        .then((r) => { setResultados(r.data); setAbierto(true) }).catch(() => setResultados([]))
    }, 250)
    return () => clearTimeout(t)
  }, [q, value])

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value.nombre_completo}</span>
        <Button size="sm" variant="outline" onClick={() => { onChange(null); setQ('') }}>Cambiar</Button>
      </div>
    )
  }
  return (
    <div className="relative">
      <Input placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
      {abierto && resultados.length > 0 && (
        <div className="absolute z-10 bg-white border rounded shadow mt-1 w-full max-h-52 overflow-auto">
          {resultados.map((c) => (
            <button key={c.id} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
              onClick={() => { onChange(c); setAbierto(false) }}>
              {c.nombre_completo}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EditorLineas({ productos, lineas, setLineas }: {
  productos: ProductoVenta[]; lineas: LineaForm[]; setLineas: (l: LineaForm[]) => void
}) {
  const setL = (i: number, patch: Partial<LineaForm>) => setLineas(lineas.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const pById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos])

  return (
    <div>
      <div className="grid grid-cols-[1fr_5rem_6rem_6rem_2rem] gap-2 text-xs font-medium text-gray-500 mb-1">
        <span>Producto / servicio</span><span>Cant.</span><span>Precio u.</span><span className="text-right">Subtotal</span><span />
      </div>
      {lineas.map((l, i) => {
        const p = pById.get(l.producto_id)
        const precio = l.precio !== '' ? Number(l.precio) : (p?.precio_actual ?? 0)
        const sub = precio * (Number(l.cantidad) || 0)
        return (
          <div key={i} className="grid grid-cols-[1fr_5rem_6rem_6rem_2rem] gap-2 mb-2 items-center">
            <select value={l.producto_id} className="border rounded px-2 py-1 text-sm"
              onChange={(e) => setL(i, { producto_id: e.target.value, precio: '' })}>
              <option value="">Selecciona…</option>
              {productos.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nombre}{op.tipo !== 'servicio' ? ` (${op.stock} ${op.unidad})` : ' · servicio'}
                </option>
              ))}
            </select>
            <Input type="number" value={l.cantidad} onChange={(e) => setL(i, { cantidad: e.target.value })} />
            <Input type="number" placeholder={p?.precio_actual != null ? String(p.precio_actual) : ''}
              value={l.precio} onChange={(e) => setL(i, { precio: e.target.value })} />
            <span className="text-right text-sm">{money(sub)}</span>
            <Button size="sm" variant="outline" disabled={lineas.length === 1}
              onClick={() => setLineas(lineas.filter((_, j) => j !== i))}>×</Button>
          </div>
        )
      })}
      <Button size="sm" variant="outline" onClick={() => setLineas([...lineas, lineaVacia()])}>+ Línea</Button>
    </div>
  )
}

function payloadLineas(lineas: LineaForm[], productos: ProductoVenta[]) {
  const pById = new Map(productos.map((p) => [p.id, p]))
  return lineas
    .filter((l) => l.producto_id && Number(l.cantidad) > 0)
    .map((l) => {
      const p = pById.get(l.producto_id)
      return {
        producto_id: l.producto_id,
        cantidad: Number(l.cantidad),
        precio_unitario: l.precio !== '' ? Number(l.precio) : (p?.precio_actual ?? 0),
      }
    })
}
const totalLineas = (lineas: LineaForm[], productos: ProductoVenta[]) =>
  payloadLineas(lineas, productos).reduce((s, l) => s + l.precio_unitario * l.cantidad, 0)

// ── Punto de venta ──────────────────────────────────────────────────────────

function PuntoDeVentaTab() {
  const productos = useProductos()
  const params = useSearchParams()
  const consultaId = params.get('consulta')

  const [cliente, setCliente] = useState<ClienteLite | null>(null)
  const [publico, setPublico] = useState(false)
  const [lineas, setLineas] = useState<LineaForm[]>([lineaVacia()])
  const [metodo, setMetodo] = useState<Metodo>('efectivo')
  const [obs, setObs] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!consultaId) return
    axios.get(`${API}/consultas/${consultaId}`, { withCredentials: true })
      .then((r) => {
        const c = r.data?.mascota?.cliente
        const cid = r.data?.cliente_id ?? r.data?.mascota?.cliente_id
        if (c?.nombre_completo && cid) setCliente({ id: cid, nombre_completo: c.nombre_completo })
      })
      .catch(() => {})
  }, [consultaId])

  const total = totalLineas(lineas, productos)

  const guardar = async () => {
    setGuardando(true); setError(null); setOk(null)
    const ls = payloadLineas(lineas, productos)
    if (ls.length === 0) { setError('Agrega al menos una línea'); setGuardando(false); return }
    if (!publico && !cliente) { setError('Elige un cliente o marca "Público en general"'); setGuardando(false); return }
    try {
      const { data } = await axios.post<Venta>(`${API}/ventas`, {
        cliente_id: publico ? null : cliente?.id,
        consulta_id: consultaId || undefined,
        metodo_pago: metodo,
        observaciones: obs.trim() || undefined,
        lineas: ls,
      }, { withCredentials: true })
      setOk(data.folio)
      setCliente(null); setPublico(false); setLineas([lineaVacia()]); setObs('')
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo registrar la venta')
    } finally { setGuardando(false) }
  }

  return (
    <div className="max-w-3xl">
      {ok != null && (
        <div className="my-3 p-2 bg-green-100 text-green-700 rounded text-sm">
          Venta #{ok} registrada. Puedes ver el ticket en la pestaña Ventas.
        </div>
      )}
      <div className="space-y-4 my-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Cliente</p>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={publico} onChange={(e) => { setPublico(e.target.checked); if (e.target.checked) setCliente(null) }} />
            Público en general
          </label>
          {!publico && <ClientePicker value={cliente} onChange={setCliente} />}
        </div>

        <EditorLineas productos={productos} lineas={lineas} setLineas={setLineas} />

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Método de pago</p>
            <select value={metodo} onChange={(e) => setMetodo(e.target.value as Metodo)} className="border rounded px-2 py-2 text-sm">
              {METODOS.map((m) => <option key={m} value={m}>{METODO_LABEL[m]}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-medium text-gray-500 mb-1">Observaciones</p>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold">{money(total)}</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={guardar} disabled={guardando}>{guardando ? 'Cobrando…' : 'Cobrar'}</Button>
      </div>
    </div>
  )
}

// ── Ventas (historial) ──────────────────────────────────────────────────────

function VentasTab({ esAdmin }: { esAdmin: boolean }) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [desde, setDesde] = useState(hoyISO())
  const [hasta, setHasta] = useState(hoyISO())
  const [detalle, setDetalle] = useState<Venta | null>(null)

  const cargar = useCallback(() => {
    axios.get<Venta[]>(`${API}/ventas?desde=${desde}&hasta=${hasta}`, { withCredentials: true })
      .then((r) => setVentas(r.data)).catch(() => setVentas([]))
  }, [desde, hasta])
  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 my-4 text-sm">
        <span>Del</span>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="border rounded px-2 py-1" />
        <span>al</span>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="border rounded px-2 py-1" />
      </div>
      <div className="border rounded shadow overflow-auto max-h-[60vh]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0"><tr className="text-left">
            <th className="p-2">Folio</th><th className="p-2">Fecha</th><th className="p-2">Cliente</th>
            <th className="p-2">Método</th><th className="p-2 text-right">Total</th><th className="p-2">Vendedor</th>
            <th className="p-2">Estado</th><th className="p-2"></th>
          </tr></thead>
          <tbody className="divide-y">
            {ventas.map((v) => (
              <tr key={v.id} className={v.estado === 'cancelada' ? 'opacity-50' : ''}>
                <td className="p-2 font-mono">#{v.folio}</td>
                <td className="p-2 text-gray-500">{fechaHora(v.fecha)}</td>
                <td className="p-2">{v.cliente?.nombre_completo ?? 'Público en general'}</td>
                <td className="p-2">{METODO_LABEL[v.metodo_pago]}</td>
                <td className="p-2 text-right font-medium">{money(v.total)}</td>
                <td className="p-2 text-gray-500">{v.vendedor_nombre ?? '—'}</td>
                <td className="p-2">{v.estado === 'cancelada'
                  ? <span className="text-xs text-red-600">Cancelada</span>
                  : <span className="text-xs text-green-700">Activa</span>}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setDetalle(v)}>Ver</Button>
                    <a href={`/ventas/${v.id}/ticket`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">Ticket</Button>
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {ventas.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-gray-400">Sin ventas en el rango</td></tr>}
          </tbody>
        </table>
      </div>
      {detalle && (
        <VentaDetalleDialog venta={detalle} esAdmin={esAdmin} onClose={() => setDetalle(null)} onCambio={() => { setDetalle(null); cargar() }} />
      )}
    </div>
  )
}

function VentaDetalleDialog({ venta, esAdmin, onClose, onCambio }: {
  venta: Venta; esAdmin: boolean; onClose: () => void; onCambio: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [proc, setProc] = useState(false)

  const cancelar = async () => {
    if (!motivo.trim()) { setError('Escribe el motivo'); return }
    setProc(true); setError(null)
    try {
      await axios.patch(`${API}/ventas/${venta.id}/cancelar`, { motivo: motivo.trim() }, { withCredentials: true })
      onCambio()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo cancelar'); setProc(false)
    }
  }
  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar la venta #${venta.folio}? Se revierte el stock y no queda rastro.`)) return
    setProc(true); setError(null)
    try {
      await axios.delete(`${API}/ventas/${venta.id}`, { withCredentials: true })
      onCambio()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo eliminar'); setProc(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Venta #{venta.folio}</DialogTitle>
          <DialogDescription>
            {fechaHora(venta.fecha)} · {venta.cliente?.nombre_completo ?? 'Público en general'} · {METODO_LABEL[venta.metodo_pago]}
            {venta.estado === 'cancelada' && <span className="text-red-600"> · CANCELADA: {venta.motivo_cancelacion}</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left">
              <th className="p-2">Concepto</th><th className="p-2 text-right">Cant.</th>
              <th className="p-2 text-right">Precio</th><th className="p-2 text-right">Subtotal</th>
            </tr></thead>
            <tbody className="divide-y">
              {venta.detalles.map((d, i) => (
                <tr key={d.id ?? i}>
                  <td className="p-2">{d.descripcion}{d.es_servicio && <span className="text-gray-400 text-xs"> · servicio</span>}</td>
                  <td className="p-2 text-right">{d.cantidad}</td>
                  <td className="p-2 text-right">{money(d.precio_unitario)}</td>
                  <td className="p-2 text-right">{money(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="font-bold border-t"><td className="p-2" colSpan={3}>Total</td><td className="p-2 text-right">{money(venta.total)}</td></tr></tfoot>
          </table>
          {venta.observaciones && <p className="text-sm text-gray-500 mt-2">Obs.: {venta.observaciones}</p>}
        </div>
        {esAdmin && venta.estado === 'activa' && (
          <div className="border-t pt-3 space-y-2">
            <Input placeholder="Motivo de cancelación" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={cancelar} disabled={proc}>
                Cancelar venta
              </Button>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={eliminar} disabled={proc}>
                Eliminar
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Cotizaciones ────────────────────────────────────────────────────────────

function CotizacionesTab() {
  const productos = useProductos()
  const [cots, setCots] = useState<Cotizacion[]>([])
  const [nueva, setNueva] = useState(false)
  const [convertir, setConvertir] = useState<Cotizacion | null>(null)

  const cargar = useCallback(() => {
    axios.get<Cotizacion[]>(`${API}/ventas/cotizaciones`, { withCredentials: true })
      .then((r) => setCots(r.data)).catch(() => setCots([]))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const cancelar = async (id: string) => {
    await axios.patch(`${API}/ventas/cotizaciones/${id}/cancelar`, {}, { withCredentials: true }).catch(() => {})
    cargar()
  }

  return (
    <div>
      <div className="flex my-4"><Button className="ml-auto" onClick={() => setNueva(true)}>Nueva cotización</Button></div>
      <div className="border rounded shadow overflow-auto max-h-[60vh]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0"><tr className="text-left">
            <th className="p-2">Folio</th><th className="p-2">Fecha</th><th className="p-2">Cliente</th>
            <th className="p-2 text-right">Total</th><th className="p-2">Estado</th><th className="p-2"></th>
          </tr></thead>
          <tbody className="divide-y">
            {cots.map((c) => (
              <tr key={c.id}>
                <td className="p-2 font-mono">#{c.folio}</td>
                <td className="p-2 text-gray-500">{fecha(c.fecha)}</td>
                <td className="p-2">{c.cliente?.nombre_completo ?? 'Público en general'}</td>
                <td className="p-2 text-right font-medium">{money(c.total)}</td>
                <td className="p-2 text-xs capitalize">{c.estado}</td>
                <td className="p-2">
                  {c.estado === 'vigente' && (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => setConvertir(c)}>Convertir a venta</Button>
                      <Button size="sm" variant="outline" onClick={() => cancelar(c.id)}>Cancelar</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {cots.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400">Sin cotizaciones</td></tr>}
          </tbody>
        </table>
      </div>
      {nueva && <NuevaCotizacionDialog productos={productos} onClose={() => setNueva(false)} onCreada={() => { setNueva(false); cargar() }} />}
      {convertir && <ConvertirDialog cotizacion={convertir} onClose={() => setConvertir(null)} onHecho={() => { setConvertir(null); cargar() }} />}
    </div>
  )
}

function NuevaCotizacionDialog({ productos, onClose, onCreada }: {
  productos: ProductoVenta[]; onClose: () => void; onCreada: () => void
}) {
  const [cliente, setCliente] = useState<ClienteLite | null>(null)
  const [lineas, setLineas] = useState<LineaForm[]>([lineaVacia()])
  const [obs, setObs] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [proc, setProc] = useState(false)

  const crear = async () => {
    const ls = payloadLineas(lineas, productos)
    if (ls.length === 0) { setError('Agrega al menos una línea'); return }
    setProc(true); setError(null)
    try {
      await axios.post(`${API}/ventas/cotizaciones`, {
        cliente_id: cliente?.id, observaciones: obs.trim() || undefined, lineas: ls,
      }, { withCredentials: true })
      onCreada()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo crear'); setProc(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva cotización</DialogTitle>
          <DialogDescription>No mueve stock ni pago. Se cobra al convertirla en venta.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[65vh] overflow-auto">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Cliente (opcional)</p>
            <ClientePicker value={cliente} onChange={setCliente} />
          </div>
          <EditorLineas productos={productos} lineas={lineas} setLineas={setLineas} />
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Observaciones</p>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
          <p className="text-right font-bold">Total: {money(totalLineas(lineas, productos))}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={crear} disabled={proc}>{proc ? 'Creando…' : 'Crear cotización'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConvertirDialog({ cotizacion, onClose, onHecho }: {
  cotizacion: Cotizacion; onClose: () => void; onHecho: () => void
}) {
  const [metodo, setMetodo] = useState<Metodo>('efectivo')
  const [error, setError] = useState<string | null>(null)
  const [proc, setProc] = useState(false)

  const convertir = async () => {
    setProc(true); setError(null)
    try {
      await axios.post(`${API}/ventas/cotizaciones/${cotizacion.id}/convertir`, { metodo_pago: metodo }, { withCredentials: true })
      onHecho()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'No se pudo convertir'); setProc(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir cotización #{cotizacion.folio} en venta</DialogTitle>
          <DialogDescription>Se descuenta el stock y la venta ya no será editable. Total {money(cotizacion.total)}.</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-xs font-medium text-gray-500 mb-1">Método de pago</p>
          <select value={metodo} onChange={(e) => setMetodo(e.target.value as Metodo)} className="border rounded px-2 py-2 text-sm">
            {METODOS.map((m) => <option key={m} value={m}>{METODO_LABEL[m]}</option>)}
          </select>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={convertir} disabled={proc}>{proc ? 'Convirtiendo…' : 'Convertir a venta'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Corte de caja ───────────────────────────────────────────────────────────

function CorteTab() {
  const [f, setF] = useState(hoyISO())
  const [corte, setCorte] = useState<Corte | null>(null)

  useEffect(() => {
    axios.get<Corte>(`${API}/ventas/corte?fecha=${f}`, { withCredentials: true })
      .then((r) => setCorte(r.data)).catch(() => setCorte(null))
  }, [f])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 my-4 text-sm">
        <span>Fecha</span>
        <input type="date" value={f} onChange={(e) => setF(e.target.value)} className="border rounded px-2 py-1" />
      </div>
      {!corte ? <p className="text-sm text-gray-400">Sin datos</p> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {(['efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
              <div key={m} className="bg-white border rounded-xl p-4">
                <p className="text-[11px] uppercase tracking-wider text-gray-400">{METODO_LABEL[m]}</p>
                <p className="text-xl font-bold">{money(corte[m])}</p>
              </div>
            ))}
            <div className="bg-gray-900 text-white rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-300">Total ({corte.cantidad})</p>
              <p className="text-xl font-bold">{money(corte.total)}</p>
            </div>
          </div>
          <div className="border rounded shadow overflow-auto max-h-[45vh]">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0"><tr className="text-left">
                <th className="p-2">Folio</th><th className="p-2">Hora</th><th className="p-2">Cliente</th>
                <th className="p-2">Método</th><th className="p-2 text-right">Total</th>
              </tr></thead>
              <tbody className="divide-y">
                {corte.ventas.map((v) => (
                  <tr key={v.id}>
                    <td className="p-2 font-mono">#{v.folio}</td>
                    <td className="p-2 text-gray-500">{fechaHora(v.fecha)}</td>
                    <td className="p-2">{v.cliente?.nombre_completo ?? 'Público en general'}</td>
                    <td className="p-2">{METODO_LABEL[v.metodo_pago]}</td>
                    <td className="p-2 text-right">{money(v.total)}</td>
                  </tr>
                ))}
                {corte.ventas.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Sin ventas ese día</td></tr>}
              </tbody>
            </table>
          </div>

          {corte.canceladas.length > 0 && (
            <div className="mt-4 border border-red-200 rounded-xl bg-red-50/50 p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">
                Ventas canceladas del día ({corte.canceladas.length}) — no cuentan en el corte
              </p>
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-red-100">
                  {corte.canceladas.map((v) => (
                    <tr key={v.id}>
                      <td className="py-1 pr-2 font-mono">#{v.folio}</td>
                      <td className="py-1 pr-2 text-gray-500">{fechaHora(v.fecha)}</td>
                      <td className="py-1 pr-2">{v.cliente?.nombre_completo ?? 'Público en general'}</td>
                      <td className="py-1 pr-2 text-gray-600">{METODO_LABEL[v.metodo_pago]}</td>
                      <td className="py-1 pr-2 text-right line-through text-gray-500">{money(v.total)}</td>
                      <td className="py-1 text-xs text-red-600">{v.motivo_cancelacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
