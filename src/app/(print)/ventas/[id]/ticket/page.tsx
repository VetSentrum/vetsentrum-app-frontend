'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { guardarPdf } from '@/lib/pdf'
import { DocumentoTicket, VentaTicket } from '@/components/print/DocumentoTicket'
import { EmpresaDocumento } from '@/components/print/DocumentoConsulta'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

export default function TicketVentaPage() {
  const { id } = useParams<{ id: string }>()
  const [venta, setVenta] = useState<VentaTicket | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaDocumento | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const printAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'print-hide'
    style.textContent = '@media print { aside, header { display:none!important } }'
    document.head.appendChild(style)
    return () => { document.getElementById('print-hide')?.remove() }
  }, [])

  useEffect(() => {
    fetch(`${API}/ventas/${id}`, { credentials: 'include' })
      .then((r) => { if (!r.ok) throw new Error('No se pudo cargar la venta'); return r.json() })
      .then(setVenta)
      .catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    fetch(`${API}/empresa`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setEmpresa(d) })
      .catch(() => {})
  }, [])

  const handleGuardarPdf = async () => {
    if (!printAreaRef.current || !venta) return
    setGenerando(true)
    try {
      await guardarPdf(printAreaRef.current, `ticket-${venta.folio}.pdf`)
    } finally {
      setGenerando(false)
    }
  }

  if (error) return <p className="p-6 text-red-500">{error}</p>
  if (!venta) return <p className="p-6 text-gray-400">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:p-0">
      <div className="max-w-sm mx-auto flex justify-end gap-3 mb-4 print:hidden px-4">
        <Button variant="outline" onClick={handleGuardarPdf} disabled={generando}>
          {generando ? 'Generando...' : 'Guardar PDF'}
        </Button>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>
      <div className="bg-white shadow-sm print:shadow-none mx-auto" style={{ maxWidth: 360 }}>
        <DocumentoTicket ref={printAreaRef} venta={venta} empresa={empresa} />
      </div>
    </div>
  )
}
