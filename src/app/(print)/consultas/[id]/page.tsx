'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { guardarPdf } from '@/lib/pdf'
import {
  DocumentoConsulta,
  ConsultaConRelaciones,
  EmpresaDocumento,
} from '@/components/print/DocumentoConsulta'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

export default function ConsultaImprimirPage() {
  const { id } = useParams<{ id: string }>()
  const [consulta, setConsulta] = useState<ConsultaConRelaciones | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaDocumento | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const printAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Inyectar estilos de impresión para ocultar sidebar/header
    const style = document.createElement('style')
    style.id = 'print-hide'
    style.textContent = '@media print { aside, header { display:none!important } }'
    document.head.appendChild(style)
    return () => { document.getElementById('print-hide')?.remove() }
  }, [])

  useEffect(() => {
    fetch(`${API}/consultas/${id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar la consulta')
        return r.json()
      })
      .then(data => {
        setConsulta(data)
      })
      .catch(e => setError(e.message))
  }, [id])

  useEffect(() => {
    fetch(`${API}/empresa`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setEmpresa(data) })
      .catch(() => {})
  }, [])

  const handleGuardarPdf = async () => {
    if (!printAreaRef.current || !consulta) return
    setGenerando(true)
    try {
      const folio = `C-${consulta.mascota?.expediente ?? 0}-${consulta.folio ?? 0}`
      await guardarPdf(printAreaRef.current, `${folio}.pdf`)
    } finally {
      setGenerando(false)
    }
  }

  if (error) return <p className="p-6 text-red-500">{error}</p>
  if (!consulta) return <p className="p-6 text-gray-400">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:p-0">
      {/* Barra de acciones — solo en pantalla */}
      <div className="max-w-3xl mx-auto flex justify-end gap-3 mb-4 print:hidden px-4">
        <Button variant="outline" onClick={handleGuardarPdf} disabled={generando}>
          {generando ? 'Generando...' : 'Guardar PDF'}
        </Button>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>

      {/* Documento imprimible */}
      <DocumentoConsulta ref={printAreaRef} consulta={consulta} empresa={empresa} />
    </div>
  )
}
