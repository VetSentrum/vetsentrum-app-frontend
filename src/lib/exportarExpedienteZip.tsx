import { createRoot } from 'react-dom/client'
import JSZip from 'jszip'
import { construirXlsxArrayBuffer } from '@/lib/exportar'
import { generarPdfBlob } from '@/lib/pdf'
import { DocumentoConsulta, ConsultaConRelaciones, EmpresaDocumento } from '@/components/print/DocumentoConsulta'
import { DocumentoReceta, RecetaConRelaciones } from '@/components/print/DocumentoReceta'
import {
  ExpedienteExportable,
  ConsultaExpediente,
  SeleccionExpediente,
  hojasDelExpediente,
} from '@/lib/expedienteExport'

export type { EmpresaDocumento }

// ── Render de PDF fuera de pantalla ───────────────────────────────────────────

async function esperarRecursos(root: HTMLElement) {
  try { await document.fonts.ready } catch { /* noop */ }
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(imgs.map(img =>
    img.complete
      ? Promise.resolve()
      : new Promise<void>(res => { img.addEventListener('load', () => res()); img.addEventListener('error', () => res()) }),
  ))
}

function siguienteFrame(): Promise<void> {
  return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res())))
}

async function generarPdf(nodo: React.ReactElement, filename: string): Promise<Blob> {
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:820px;background:#ffffff;z-index:-1;pointer-events:none'
  document.body.appendChild(host)
  const root = createRoot(host)
  try {
    root.render(nodo)
    await siguienteFrame()
    await esperarRecursos(host)
    const el = host.querySelector('.documento-imprimible') as HTMLElement | null
    if (!el) throw new Error('No se pudo renderizar el documento para el PDF')
    return await generarPdfBlob(el, { filename })
  } finally {
    root.unmount()
    host.remove()
  }
}

// ── Mapeo payload → props de los documentos imprimibles ───────────────────────

function mascotaParaDocumento(exp: ExpedienteExportable) {
  return {
    nombre: exp.nombre,
    expediente: exp.expediente,
    raza: exp.raza,
    sexo: exp.sexo,
    edad_aproximada: exp.edad_aproximada,
    especie: exp.especie,
    cliente: { nombre_completo: exp.cliente.nombre_completo },
  }
}

function consultaParaDocumento(exp: ExpedienteExportable, c: ConsultaExpediente): ConsultaConRelaciones {
  return {
    id: c.id,
    cliente_id: '',
    mascota_id: '',
    veterinario_id: c.veterinario.id,
    folio: c.folio,
    fecha: c.fecha,
    motivo: c.motivo,
    evaluacion_clinica: c.evaluacion_clinica,
    mascota: mascotaParaDocumento(exp),
    veterinario: { nombre: c.veterinario.nombre },
  } as unknown as ConsultaConRelaciones
}

function recetaParaDocumento(exp: ExpedienteExportable, c: ConsultaExpediente): RecetaConRelaciones {
  return {
    id: c.receta!.id,
    folio: c.receta!.folio,
    indicaciones: (c.receta!.indicaciones ?? []) as RecetaConRelaciones['indicaciones'],
    consulta: {
      id: c.id,
      folio: c.folio,
      fecha: c.fecha,
      motivo: c.motivo,
      mascota: mascotaParaDocumento(exp),
      veterinario: { nombre: c.veterinario.nombre },
      evaluacion_clinica: c.evaluacion_clinica as RecetaConRelaciones['consulta']['evaluacion_clinica'],
    },
  }
}

const folioConsulta = (exp: ExpedienteExportable, c: ConsultaExpediente) => `C-${exp.expediente}-${c.folio ?? 0}`
const folioReceta = (exp: ExpedienteExportable, c: ConsultaExpediente) => `R-${exp.expediente}-${c.receta?.folio ?? 0}`

// ── Descarga del blob (mismo patrón que lib/exportar.ts) ──────────────────────

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombre
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Punto de entrada ─────────────────────────────────────────────────────────

/**
 * Arma y descarga `expediente_<n>.zip`:
 *  - `expediente_<n>.xlsx` en la raíz con una hoja por categoría seleccionada.
 *  - `Consultas/` con un PDF por consulta; si la consulta tiene receta, van en
 *    una subcarpeta `C-<exp>-<folio>/` junto al PDF de la receta.
 *  - `Recetas/` con los PDF de las recetas "sueltas" (sólo si NO se seleccionó
 *    Consultas; si se seleccionó, la receta ya viaja con su consulta).
 *  - Citas: sólo hoja de Excel, sin PDF.
 *
 * `onProgreso` recibe (hechos, total) para poder mostrar avance.
 */
export async function exportarExpedienteZip(
  exp: ExpedienteExportable,
  empresa: EmpresaDocumento | null,
  seleccion: SeleccionExpediente,
  onProgreso?: (hechos: number, total: number) => void,
): Promise<void> {
  const zip = new JSZip()

  // 1. Excel (siempre)
  zip.file(`expediente_${exp.expediente}.xlsx`, construirXlsxArrayBuffer(hojasDelExpediente(exp, seleccion)))

  // 2. PDFs
  const consultasConReceta = exp.consultas.filter(c => c.receta)
  const totalPdf =
    (seleccion.consultas ? exp.consultas.length + consultasConReceta.length : 0) +
    (seleccion.recetas && !seleccion.consultas ? consultasConReceta.length : 0)
  let hechos = 0
  const avanzar = () => { hechos += 1; onProgreso?.(hechos, totalPdf) }

  if (seleccion.consultas) {
    const carpeta = zip.folder('Consultas')!
    for (const c of exp.consultas) {
      const nombreConsulta = `${folioConsulta(exp, c)}.pdf`
      const pdfConsulta = await generarPdf(
        <DocumentoConsulta consulta={consultaParaDocumento(exp, c)} empresa={empresa} />,
        nombreConsulta,
      )
      if (c.receta) {
        const sub = carpeta.folder(folioConsulta(exp, c))!
        sub.file(nombreConsulta, pdfConsulta)
        avanzar()
        const nombreReceta = `${folioReceta(exp, c)}.pdf`
        const pdfReceta = await generarPdf(
          <DocumentoReceta receta={recetaParaDocumento(exp, c)} empresa={empresa} />,
          nombreReceta,
        )
        sub.file(nombreReceta, pdfReceta)
        avanzar()
      } else {
        carpeta.file(nombreConsulta, pdfConsulta)
        avanzar()
      }
    }
  } else if (seleccion.recetas) {
    const carpeta = zip.folder('Recetas')!
    for (const c of consultasConReceta) {
      const nombreReceta = `${folioReceta(exp, c)}.pdf`
      const pdfReceta = await generarPdf(
        <DocumentoReceta receta={recetaParaDocumento(exp, c)} empresa={empresa} />,
        nombreReceta,
      )
      carpeta.file(nombreReceta, pdfReceta)
      avanzar()
    }
  }

  // 3. Empaquetar y descargar
  const blob = await zip.generateAsync({ type: 'blob' })
  descargar(blob, `expediente_${exp.expediente}.zip`)
}
