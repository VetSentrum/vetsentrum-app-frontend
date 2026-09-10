import { forwardRef } from 'react'
import { EmpresaDocumento } from './DocumentoConsulta'

export interface VentaTicket {
  folio: number
  fecha: string
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia'
  total: number
  observaciones?: string | null
  vendedor_nombre?: string | null
  cliente?: { nombre_completo: string } | null
  detalles: {
    descripcion: string
    es_servicio: boolean
    cantidad: number
    precio_unitario: number
    subtotal: number
  }[]
}

const money = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const METODO: Record<string, string> = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }

/** Ticket de venta imprimible. Reutiliza el helper de PDF de lib/pdf.ts. */
export const DocumentoTicket = forwardRef<HTMLDivElement, {
  venta: VentaTicket
  empresa: EmpresaDocumento | null
}>(function DocumentoTicket({ venta, empresa }, ref) {
  const fecha = venta.fecha
    ? new Date(venta.fecha).toLocaleString('es-MX', {
        timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '—'

  return (
    <div
      ref={ref}
      className="documento-imprimible mx-auto bg-white p-6"
      style={{ fontFamily: 'Arial, sans-serif', maxWidth: 360 }}
    >
      <div className="text-center mb-3">
        {empresa?.logo_url && (
          <img src={empresa.logo_url} alt="Logo" className="h-14 mx-auto object-contain mb-1" crossOrigin="anonymous" />
        )}
        <p className="font-bold text-gray-900">{empresa?.nombre ?? 'Clínica Veterinaria'}</p>
        {empresa?.direccion && (
          <p className="text-[11px] text-gray-500">
            {empresa.direccion}{empresa.ciudad ? `, ${empresa.ciudad}` : ''}
          </p>
        )}
        {empresa?.telefono && <p className="text-[11px] text-gray-500">Tel. {empresa.telefono}</p>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      <div className="text-xs text-gray-700 space-y-0.5">
        <div className="flex justify-between"><span>Ticket</span><span className="font-mono font-semibold">#{venta.folio}</span></div>
        <div className="flex justify-between"><span>Fecha</span><span>{fecha}</span></div>
        <div className="flex justify-between"><span>Cliente</span><span>{venta.cliente?.nombre_completo ?? 'Público en general'}</span></div>
        {venta.vendedor_nombre && <div className="flex justify-between"><span>Atendió</span><span>{venta.vendedor_nombre}</span></div>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-1">Concepto</th>
            <th className="py-1 text-center">Cant.</th>
            <th className="py-1 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {venta.detalles.map((d, i) => (
            <tr key={i} className="align-top">
              <td className="py-0.5">
                {d.descripcion}
                <span className="block text-[10px] text-gray-400">{money(d.precio_unitario)} c/u</span>
              </td>
              <td className="py-0.5 text-center">{d.cantidad}</td>
              <td className="py-0.5 text-right">{money(d.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 my-2" />

      <div className="flex justify-between font-bold text-sm">
        <span>Total</span><span>{money(venta.total)}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-0.5">
        <span>Forma de pago</span><span>{METODO[venta.metodo_pago] ?? venta.metodo_pago}</span>
      </div>

      {venta.observaciones && (
        <p className="text-[11px] text-gray-500 mt-2">{venta.observaciones}</p>
      )}

      <p className="text-center text-[11px] text-gray-400 mt-4">¡Gracias por su compra!</p>
    </div>
  )
})
