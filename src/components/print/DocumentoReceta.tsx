import { forwardRef } from 'react'
import { RenglonReceta } from '@/components/EditarRecetaForm'
import { EmpresaDocumento } from './DocumentoConsulta'

export interface RecetaConRelaciones {
  id: string
  folio?: number
  indicaciones: RenglonReceta[]
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
    evaluacion_clinica?: {
      datos_generales?: { edad?: string; peso?: string; [key: string]: unknown }
      [key: string]: unknown
    }
  }
}

/**
 * Documento imprimible de una receta. Layout compartido por la página de
 * impresión (`/recetas/[id]`) y por la exportación de expediente en ZIP.
 */
export const DocumentoReceta = forwardRef<HTMLDivElement, {
  receta: RecetaConRelaciones
  empresa: EmpresaDocumento | null
}>(function DocumentoReceta({ receta, empresa }, ref) {
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
    <div
      ref={ref}
      className="documento-imprimible max-w-3xl mx-auto bg-white shadow-sm print:shadow-none p-8 print:p-6"
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
  )
})
