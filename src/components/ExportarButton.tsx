'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useExportPermission } from '@/lib/useExportPermission'
import { exportarXlsx, exportarCsv } from '@/lib/exportar'

interface Props {
  /** Rol del usuario actual; el botón no se muestra si su rol no tiene permiso de exportación. */
  rol?: string | null
  /** Filas ya filtradas (y ordenadas) tal como se ven en la tabla, listas para exportar. */
  filas: Record<string, unknown>[]
  /** Encabezados de columna, usados para generar solo la plantilla si `filas` viene vacío. */
  columnas: string[]
  /** Nombre base del archivo a generar, sin extensión. */
  nombreArchivo: string
}

/** Botón "Exportar" con menú Xlsx/Csv. Respeta los filtros aplicados: recibe las filas ya filtradas. */
export function ExportarButton({ rol, filas, columnas, nombreArchivo }: Props) {
  const puedeExportar = useExportPermission(rol)
  const [abierto, setAbierto] = useState(false)

  if (!puedeExportar) return null

  const confirmarSiVacio = () => {
    if (filas.length > 0) return true
    return window.confirm(
      'No hay resultados con los filtros aplicados.\n\n¿Exportar solo la plantilla (encabezados, sin datos)?'
    )
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button variant="outline">Exportar</Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end">
        <button
          type="button"
          className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100"
          onClick={() => {
            setAbierto(false)
            if (!confirmarSiVacio()) return
            exportarXlsx(nombreArchivo, [{ nombre: 'Datos', filas, columnas }])
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
            exportarCsv(nombreArchivo, filas, columnas)
          }}
        >
          Exportar a CSV (.csv)
        </button>
      </PopoverContent>
    </Popover>
  )
}
