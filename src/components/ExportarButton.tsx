'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useExportPermission } from '@/lib/useExportPermission'
import { exportarXlsx, exportarCsv } from '@/lib/exportar'

export interface HojaOpcionalExport {
  /** Identificador único de la opción (para el estado de selección). */
  key: string
  /** Texto del checkbox que activa esta opción. */
  etiqueta: string
  /** Encabezados que se agregan a la hoja principal cuando la opción está activa. */
  columnasExtra: string[]
  /** Campos adicionales por fila (mismo índice/orden que `filas` de la hoja principal) — solo los campos nuevos, no la fila completa. */
  filasExtra: Record<string, unknown>[]
  /** Hoja aparte, solo para el Excel (un .csv no admite varias hojas). Opcional: una opción puede ser solo columna. */
  hoja?: { nombre: string; columnas: string[]; filas: Record<string, unknown>[] }
}

interface Props {
  /** Rol del usuario actual; el botón no se muestra si su rol no tiene permiso de exportación. */
  rol?: string | null
  /** Filas ya filtradas (y ordenadas) tal como se ven en la tabla, listas para exportar. */
  filas: Record<string, unknown>[]
  /** Encabezados de columna, usados para generar solo la plantilla si `filas` viene vacío. */
  columnas: string[]
  /** Nombre base del archivo a generar, sin extensión. */
  nombreArchivo: string
  /** Datos opcionales que el usuario puede sumar al export (ej. historial de pesos en Consultas). */
  hojasOpcionales?: HojaOpcionalExport[]
}

/** Botón "Exportar" con menú Xlsx/Csv. Respeta los filtros aplicados: recibe las filas ya filtradas. */
export function ExportarButton({ rol, filas, columnas, nombreArchivo, hojasOpcionales = [] }: Props) {
  const puedeExportar = useExportPermission(rol)
  const [abierto, setAbierto] = useState(false)
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())

  if (!puedeExportar) return null

  const opcionesActivas = hojasOpcionales.filter((h) => seleccionadas.has(h.key))
  const hayHojaAdicional = opcionesActivas.some((h) => h.hoja)

  const toggleOpcion = (key: string) => {
    setSeleccionadas((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(key)) nuevo.delete(key)
      else nuevo.add(key)
      return nuevo
    })
  }

  const columnasPrincipales = [...columnas, ...opcionesActivas.flatMap((h) => h.columnasExtra)]
  const filasPrincipales = filas.map((fila, i) => {
    let combinada = fila
    for (const opcion of opcionesActivas) combinada = { ...combinada, ...opcion.filasExtra[i] }
    return combinada
  })

  const confirmarSiVacio = () => {
    if (filasPrincipales.length > 0) return true
    return window.confirm(
      'No hay resultados con los filtros aplicados.\n\n¿Exportar solo la plantilla (encabezados, sin datos)?'
    )
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button variant="outline">Exportar</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="end">
        {hojasOpcionales.length > 0 && (
          <div className="mb-1 border-b pb-1">
            {hojasOpcionales.map((opcion) => (
              <label key={opcion.key} className="flex items-start gap-2 text-xs px-3 py-1.5 cursor-pointer">
                <Checkbox
                  className="mt-0.5"
                  checked={seleccionadas.has(opcion.key)}
                  onCheckedChange={() => toggleOpcion(opcion.key)}
                />
                <span>{opcion.etiqueta}</span>
              </label>
            ))}
            {hayHojaAdicional && (
              <p className="px-3 pt-0.5 text-[11px] text-gray-400">
                El CSV no admite varias hojas: esa opción solo se incluye en el Excel.
              </p>
            )}
          </div>
        )}
        <button
          type="button"
          className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100"
          onClick={() => {
            setAbierto(false)
            if (!confirmarSiVacio()) return
            const hojas = [{ nombre: 'Datos', filas: filasPrincipales, columnas: columnasPrincipales }]
            opcionesActivas.forEach((o) => { if (o.hoja) hojas.push(o.hoja) })
            exportarXlsx(nombreArchivo, hojas)
          }}
        >
          Exportar a Excel (.xlsx)
        </button>
        <button
          type="button"
          className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100"
          onClick={() => {
            setAbierto(false)
            if (!confirmarSiVacio()) return
            exportarCsv(nombreArchivo, filasPrincipales, columnasPrincipales)
          }}
        >
          Exportar a CSV (.csv)
        </button>
      </PopoverContent>
    </Popover>
  )
}
