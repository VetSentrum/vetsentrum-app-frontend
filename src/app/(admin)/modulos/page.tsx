'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

interface ModuloInfo {
  key: string
  nombre: string
  descripcion: string
}

interface ModulosResponse {
  disponibles: ModuloInfo[]
  config: Record<string, boolean>
}

export default function ModulosPage() {
  const [modulos, setModulos] = useState<ModuloInfo[]>([])
  const [config, setConfig] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get<ModulosResponse>(`${API}/empresa/modulos`, { withCredentials: true })
      .then((res) => {
        setModulos(res.data.disponibles)
        setConfig(res.data.config)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleModulo = async (key: string) => {
    const nuevoEstado = !config[key]
    setUpdating(key)
    try {
      const res = await axios.patch<Record<string, boolean>>(
        `${API}/empresa/modulos`,
        { key, activo: nuevoEstado },
        { withCredentials: true },
      )
      setConfig(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Módulos</h1>
      <p className="text-sm text-gray-500 mb-6">
        Activa o desactiva funcionalidades del sistema. Los datos no se eliminan al desactivar un módulo.
      </p>

      <div className="space-y-4">
        {modulos.map((m) => {
          const activo = config[m.key] ?? false
          const isUpdating = updating === m.key

          return (
            <div
              key={m.key}
              className={`bg-white border rounded-xl shadow-sm p-5 flex items-center justify-between transition-colors ${
                activo ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-gray-900">{m.nombre}</h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{m.descripcion}</p>
              </div>

              <Button
                variant={activo ? 'outline' : 'default'}
                size="sm"
                disabled={isUpdating}
                onClick={() => toggleModulo(m.key)}
                className={
                  activo
                    ? 'border-red-300 text-red-700 hover:bg-red-50'
                    : ''
                }
              >
                {isUpdating ? '...' : activo ? 'Desactivar' : 'Activar'}
              </Button>
            </div>
          )
        })}
      </div>

      {modulos.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">
          No hay módulos configurables disponibles.
        </div>
      )}
    </div>
  )
}
