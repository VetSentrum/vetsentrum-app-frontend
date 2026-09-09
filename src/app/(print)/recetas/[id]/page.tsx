'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { guardarPdf } from '@/lib/pdf'
import { DocumentoReceta, RecetaConRelaciones } from '@/components/print/DocumentoReceta'
import { EmpresaDocumento } from '@/components/print/DocumentoConsulta'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

export default function RecetaImprimirPage() {
  const { id } = useParams<{ id: string }>()
  const [receta, setReceta] = useState<RecetaConRelaciones | null>(null)
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
    fetch(`${API}/recetas/${id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar la receta')
        return r.json()
      })
      .then(data => {
        setReceta(data)
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
    if (!printAreaRef.current || !receta) return
    setGenerando(true)
    try {
      const folio = `R-${receta.consulta.mascota.expediente ?? 0}-${receta.folio ?? 0}`
      await guardarPdf(printAreaRef.current, `${folio}.pdf`)
    } finally {
      setGenerando(false)
    }
  }

  if (error) return <p className="p-6 text-red-500">{error}</p>
  if (!receta) return <p className="p-6 text-gray-400">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:p-0">
      {/* Acciones — solo pantalla */}
      <div className="max-w-3xl mx-auto flex justify-end gap-3 mb-4 print:hidden px-4">
        <Button variant="outline" onClick={handleGuardarPdf} disabled={generando}>
          {generando ? 'Generando...' : 'Guardar PDF'}
        </Button>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>

      {/* Documento */}
      <DocumentoReceta ref={printAreaRef} receta={receta} empresa={empresa} />
    </div>
  )
}
