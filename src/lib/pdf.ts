/**
 * Generación de PDF a partir de un elemento del DOM, compartida por las páginas
 * de impresión (`/consultas/[id]`, `/recetas/[id]`) y por la exportación de
 * expediente en ZIP.
 *
 * `html2canvas` (que usa `html2pdf.js`) no entiende el color space `oklch` que
 * emite Tailwind v4, así que antes de capturar se reemplaza cada `oklch(...)`
 * del CSSOM por su equivalente `rgb(...)` resuelto vía canvas.
 */

interface Html2PdfOpciones {
  filename?: string
}

function construirCssSinOklch(): string {
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

  return Array.from(document.styleSheets).flatMap(sheet => {
    try { return Array.from(sheet.cssRules || []).map(r => fixOklch(r.cssText)) }
    catch { return [] }
  }).join('\n')
}

function configHtml2Pdf(cssFixed: string, filename: string) {
  return {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: Document) => {
        clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(e => e.remove())
        const s = clonedDoc.createElement('style')
        s.textContent = cssFixed
        clonedDoc.head.appendChild(s)
      },
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  }
}

/** Genera el PDF del elemento y lo devuelve como Blob (sin descargarlo). */
export async function generarPdfBlob(element: HTMLElement, { filename = 'documento.pdf' }: Html2PdfOpciones = {}): Promise<Blob> {
  const html2pdf = (await import('html2pdf.js')).default
  const cssFixed = construirCssSinOklch()
  return html2pdf()
    .set(configHtml2Pdf(cssFixed, filename))
    .from(element)
    .output('blob') as Promise<Blob>
}

/** Genera el PDF del elemento y dispara su descarga. */
export async function guardarPdf(element: HTMLElement, filename: string): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default
  const cssFixed = construirCssSinOklch()
  await html2pdf()
    .set(configHtml2Pdf(cssFixed, filename))
    .from(element)
    .save()
}
