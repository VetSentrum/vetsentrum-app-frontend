'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RenglonReceta } from '@/components/EditarRecetaForm'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

interface Empresa {
  nombre: string
  subtitulo?: string
  universidad?: string
  direccion?: string
  ciudad?: string
  cp?: string
  telefono?: string
  whatsapp?: string
  cedula_profesional?: string
  logo_url?: string
}

interface RecetaConRelaciones {
  id: string
  folio?: number
  indicaciones: RenglonReceta[]
  mega_file_id?: string | null
  consulta: {
    id: string
    folio?: number
    fecha: string
    motivo?: string
    mascota: {
      nombre: string
      expediente?: number
      raza?: string
      sexo?: string
      especie?: { nombre: string }
      cliente?: { nombre_completo: string }
    }
    veterinario: { nombre: string }
    evaluacion_clinica?: any
  }
}

export default function RecetaImprimirPage() {
  const { id } = useParams<{ id: string }>()
  const [receta, setReceta] = useState<RecetaConRelaciones | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
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

  const guardarPdf = async () => {
    if (!printAreaRef.current || !receta) return
    setGenerando(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const folio = `R-${receta.consulta.mascota.expediente ?? 0}-${receta.folio ?? 0}`
      const root = printAreaRef.current

      // Convierte oklch → rgb en texto CSS usando canvas
      const cvs = document.createElement('canvas')
      cvs.width = cvs.height = 1
      const ctx = cvs.getContext('2d', { willReadFrequently: true })!
      const fixOklch = (s: string) => s.replace(/oklch\([^)]*\)/g, m => {
        try {
          ctx.clearRect(0, 0, 1, 1)
          ctx.fillStyle = 'rgba(0,0,0,0)'
          ctx.fillStyle = m
          ctx.fillRect(0, 0, 1, 1)
          const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
          return a === 0 ? 'transparent' : `rgb(${r},${g},${b})`
        } catch { return m }
      })

      // Extrae todo el CSS del CSSOM actual y reemplaza oklch — antes de que html2canvas lo procese
      const cssFixed = Array.from(document.styleSheets).flatMap(sheet => {
        try { return Array.from(sheet.cssRules || []).map(r => fixOklch(r.cssText)) }
        catch { return [] }
      }).join('\n')

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${folio}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc: Document) => {
              // Reemplaza todos los stylesheets del clon con la versión sin oklch
              clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(e => e.remove())
              const s = clonedDoc.createElement('style')
              s.textContent = cssFixed
              clonedDoc.head.appendChild(s)
            },
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(root)
        .save()
    } finally {
      setGenerando(false)
    }
  }

  if (error) return <p className="p-6 text-red-500">{error}</p>
  if (!receta) return <p className="p-6 text-gray-400">Cargando...</p>

  const consulta = receta.consulta
  const mascota = consulta.mascota
  const dg = consulta.evaluacion_clinica?.datos_generales
  const edad = dg?.edad
  const peso = dg?.peso
  const folio = receta.folio
    ? `R-${mascota.expediente ?? ''}-${receta.folio}`
    : '—'
  const fechaConsulta = consulta.fecha
    ? new Date(consulta.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'

  // Agrupar renglones: items con sus subitems
  const items = receta.indicaciones.filter(r => r.tipo === 'item')
  const subitems = receta.indicaciones.filter(r => r.tipo === 'subitem')

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:p-0">
      {/* Acciones — solo pantalla */}
      <div className="max-w-3xl mx-auto flex justify-end gap-3 mb-4 print:hidden px-4">
        <Button variant="outline" onClick={guardarPdf} disabled={generando}>
          {generando ? 'Generando...' : 'Guardar PDF'}
        </Button>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>

      {/* Documento */}
      <div
        ref={printAreaRef}
        className="max-w-3xl mx-auto bg-white shadow-sm print:shadow-none p-8 print:p-6"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Encabezado empresa */}
        <div className="flex items-start gap-4 mb-4">
          {empresa?.logo_url && (
            <img src={empresa.logo_url} alt="Logo" className="h-16 w-16 object-contain flex-shrink-0" crossOrigin="anonymous" />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{empresa?.nombre ?? 'Clínica Veterinaria'}</h1>
            {empresa?.subtitulo && <p className="text-sm text-gray-600 italic">{empresa.subtitulo}</p>}
            {empresa?.universidad && <p className="text-xs text-gray-500">{empresa.universidad}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              {empresa?.direccion && (
                <span className="text-xs text-gray-500">📍 {empresa.direccion}{empresa.ciudad ? `, ${empresa.ciudad}` : ''}{empresa.cp ? ` C.P. ${empresa.cp}` : ''}</span>
              )}
              {empresa?.cedula_profesional && (
                <span className="text-xs text-gray-500">Cédula: {empresa.cedula_profesional}</span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Receta</span>
            <p className="text-base font-bold text-gray-900">{folio}</p>
            <p className="text-xs text-gray-500">{fechaConsulta}</p>
          </div>
        </div>

        <div className="border-t-2 border-gray-800 mb-5" />

        {/* Datos del paciente */}
        <div className="grid grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded p-3 mb-5 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Paciente</p>
            <p className="font-medium">{mascota.nombre}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">#EXP</p>
            <p className="font-medium">{mascota.expediente != null ? `#EXP-${mascota.expediente}` : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Especie / Raza</p>
            <p className="font-medium">{[mascota.especie?.nombre, mascota.raza].filter(Boolean).join(' — ')}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Propietario</p>
            <p className="font-medium">{mascota.cliente?.nombre_completo ?? '—'}</p>
          </div>
          {edad && <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Edad</p>
            <p className="font-medium">{edad}</p>
          </div>}
          {peso && <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Peso</p>
            <p className="font-medium">{peso} kg</p>
          </div>}
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Veterinario</p>
            <p className="font-medium">{consulta.veterinario.nombre}</p>
          </div>
        </div>

        {/* Indicaciones */}
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600 border-b border-gray-300 pb-1 mb-3">
            Indicaciones / Tratamiento
          </h2>
          <div className="space-y-3">
            {items.map(item => {
              const subs = subitems.filter(s => s.parent_id === item.id)
              return (
                <div key={item.id}>
                  <div className="flex gap-3">
                    <span className="font-bold text-sm w-6 flex-shrink-0">{item.numero}.</span>
                    <div>
                      <p className="font-semibold text-sm">{item.medicamento}</p>
                      <p className="text-sm text-gray-700">{item.indicacion}</p>
                    </div>
                  </div>
                  {subs.map(sub => (
                    <div key={sub.id} className="flex gap-3 pl-6 mt-1">
                      <span className="font-medium text-sm w-8 flex-shrink-0 text-gray-500">{sub.numero}.</span>
                      <div>
                        <p className="font-medium text-sm">{sub.medicamento}</p>
                        <p className="text-sm text-gray-600">{sub.indicacion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer firma */}
        <div className="mt-16 flex flex-col items-center">
          <div className="border-t border-gray-400 w-56 mb-1" />
          <p className="text-sm font-semibold text-gray-700">{consulta.veterinario.nombre}</p>
          <p className="text-xs text-gray-500">Médico Veterinario Zootecnista</p>
          {empresa?.cedula_profesional && (
            <p className="text-xs text-gray-500">Cédula Profesional: {empresa.cedula_profesional}</p>
          )}
        </div>
      </div>
    </div>
  )
}
