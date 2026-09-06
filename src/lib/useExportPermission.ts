import { useEffect, useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

// Caché en memoria (por pestaña) de los roles con permiso de exportación.
// Evita repetir el GET en cada una de las páginas al navegar entre módulos,
// pero expira pronto para que un cambio del admin en Empresa se refleje sin
// requerir recargar la app entera. No se persiste en localStorage: es un dato
// de permisos, y preferimos que se refresque solo (TTL corto) a que quede
// obsoleto entre sesiones.
const TTL_MS = 2 * 60 * 1000 // 2 minutos
let cache: { roles: string[]; expiraEn: number } | null = null
let solicitudEnCurso: Promise<string[]> | null = null

async function obtenerRolesExportacion(): Promise<string[]> {
  if (cache && cache.expiraEn > Date.now()) return cache.roles
  if (!solicitudEnCurso) {
    solicitudEnCurso = axios
      .get<{ roles: string[] }>(`${API}/empresa/exportacion`, { withCredentials: true })
      .then(({ data }) => {
        const roles = data.roles ?? []
        cache = { roles, expiraEn: Date.now() + TTL_MS }
        return roles
      })
      .catch(() => [])
      .finally(() => { solicitudEnCurso = null })
  }
  return solicitudEnCurso
}

/**
 * Indica si el rol dado tiene permiso para exportar listados (Xlsx/Csv).
 * Los roles permitidos los define la clínica desde Empresa → Permisos de exportación.
 */
export function useExportPermission(rol?: string | null): boolean {
  const [puedeExportar, setPuedeExportar] = useState(false)

  useEffect(() => {
    if (!rol) {
      setPuedeExportar(false)
      return
    }
    let cancelado = false
    obtenerRolesExportacion().then((roles) => {
      if (!cancelado) setPuedeExportar(roles.includes(rol))
    })
    return () => { cancelado = true }
  }, [rol])

  return puedeExportar
}
