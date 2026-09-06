import * as XLSX from 'xlsx'

export interface HojaExportable {
  nombre: string
  filas: Record<string, unknown>[]
  /** Encabezados esperados; se usan para generar una plantilla (solo encabezados) cuando `filas` viene vacío. */
  columnas?: string[]
}

function sanitizarNombreHoja(nombre: string): string {
  const limpio = nombre.replace(/[\\/?*[\]:]/g, '').trim()
  return (limpio || 'Hoja1').slice(0, 31)
}

/** Si no hay filas, genera una única fila en blanco con los encabezados dados (plantilla exportable). */
function filasOPlantilla(filas: Record<string, unknown>[], columnas?: string[]): Record<string, unknown>[] {
  if (filas.length > 0) return filas
  if (!columnas || columnas.length === 0) return filas
  return [Object.fromEntries(columnas.map((c) => [c, '']))]
}

// Caracteres que Excel interpreta como inicio de fórmula/DDE al abrir un CSV.
// Deliberadamente NO incluye '+' ni '-': son frecuentes en texto libre real (notas
// clínicas con viñetas, teléfonos, rangos) y neutralizarlos con un apóstrofo
// ensucia los valores para herramientas de BI que leen el CSV crudo. '=' y '@'
// cubren los vectores más peligrosos (=HYPERLINK(...), =cmd|..., @SUM(...)) y
// casi nunca aparecen como primer carácter en texto legítimo de la clínica.
const DISPARADORES_FORMULA_CSV = ['=', '@']

function neutralizarFormulaCsv(valor: unknown): unknown {
  if (typeof valor !== 'string') return valor
  if (DISPARADORES_FORMULA_CSV.some((c) => valor.startsWith(c))) return `'${valor}`
  return valor
}

/** Genera y descarga un archivo .xlsx con una hoja por cada entrada de `hojas`. */
export function exportarXlsx(nombreArchivo: string, hojas: HojaExportable[]) {
  const libro = XLSX.utils.book_new()
  hojas.forEach((hoja) => {
    // Xlsx no es vulnerable a inyección de fórmulas por CSV: SheetJS tipa cada
    // celda de string como texto (t: 's') en el binario, así que aquí no se
    // neutraliza nada — los valores se exportan tal cual.
    const ws = XLSX.utils.json_to_sheet(filasOPlantilla(hoja.filas, hoja.columnas))
    XLSX.utils.book_append_sheet(libro, ws, sanitizarNombreHoja(hoja.nombre))
  })
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
}

/** Genera y descarga un archivo .csv a partir de un único conjunto de filas. */
export function exportarCsv(nombreArchivo: string, filas: Record<string, unknown>[], columnas?: string[]) {
  const filasSeguras = filasOPlantilla(filas, columnas).map((fila) => {
    const nueva: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fila)) nueva[k] = neutralizarFormulaCsv(v)
    return nueva
  })
  const ws = XLSX.utils.json_to_sheet(filasSeguras)
  const csv = XLSX.utils.sheet_to_csv(ws)
  // BOM para que Excel detecte UTF-8 correctamente (acentos, ñ)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${nombreArchivo}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
