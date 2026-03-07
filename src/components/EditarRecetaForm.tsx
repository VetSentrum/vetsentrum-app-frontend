'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

export interface RenglonReceta {
  id: string
  numero: string
  tipo: 'item' | 'subitem'
  parent_id?: string
  medicamento: string
  indicacion: string
}

interface Props {
  consultaId: string
  recetaId?: string
  initialIndicaciones?: RenglonReceta[]
  onGuardado?: (recetaId: string) => void
  onCancelar?: () => void
}

function recalcularNumeros(renglones: RenglonReceta[]): RenglonReceta[] {
  let itemCount = 0
  const subCounts: Record<string, number> = {}
  const itemNumeros: Record<string, string> = {}

  return renglones.map(r => {
    if (r.tipo === 'item') {
      itemCount++
      const numero = String(itemCount)
      itemNumeros[r.id] = numero
      subCounts[r.id] = 0
      return { ...r, numero }
    } else {
      const parentNumero = itemNumeros[r.parent_id!] ?? String(itemCount)
      subCounts[r.parent_id!] = (subCounts[r.parent_id!] ?? 0) + 1
      return { ...r, numero: `${parentNumero}.${subCounts[r.parent_id!]}` }
    }
  })
}

function SortableRow({
  renglon,
  onChange,
  onEliminar,
}: {
  renglon: RenglonReceta
  onChange: (id: string, field: 'medicamento' | 'indicacion', value: string) => void
  onEliminar: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: renglon.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-1 ${renglon.tipo === 'subitem' ? 'pl-8' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 flex-shrink-0 px-1"
        type="button"
        title="Arrastrar"
      >
        ⠿
      </button>

      <span className="text-sm font-semibold text-gray-500 w-8 flex-shrink-0 text-right">
        {renglon.numero}.
      </span>

      <Input
        value={renglon.medicamento}
        onChange={e => onChange(renglon.id, 'medicamento', e.target.value)}
        placeholder="Medicamento"
        className="w-40 text-sm h-8"
      />

      <Input
        value={renglon.indicacion}
        onChange={e => onChange(renglon.id, 'indicacion', e.target.value)}
        placeholder="Indicación / dosis"
        className="flex-1 text-sm h-8"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
        onClick={() => onEliminar(renglon.id)}
        title="Eliminar"
      >
        ×
      </Button>
    </div>
  )
}

export function EditarRecetaForm({
  consultaId,
  recetaId: initialRecetaId,
  initialIndicaciones = [],
  onGuardado,
  onCancelar,
}: Props) {
  const [renglones, setRenglones] = useState<RenglonReceta[]>(() => {
    if (initialIndicaciones.length > 0) return recalcularNumeros(initialIndicaciones)
    return recalcularNumeros([
      { id: crypto.randomUUID(), numero: '1', tipo: 'item', medicamento: '', indicacion: '' },
    ])
  })
  const [recetaId, setRecetaId] = useState<string | undefined>(initialRecetaId)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleChange = useCallback((id: string, field: 'medicamento' | 'indicacion', value: string) => {
    setRenglones(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }, [])

  const handleAgregarItem = () => {
    const nuevo: RenglonReceta = { id: crypto.randomUUID(), numero: '', tipo: 'item', medicamento: '', indicacion: '' }
    setRenglones(prev => recalcularNumeros([...prev, nuevo]))
  }

  const handleEliminar = (id: string) => {
    setRenglones(prev => {
      const filtered = prev.filter(r => r.id !== id && r.parent_id !== id)
      if (filtered.length === 0) {
        return recalcularNumeros([{ id: crypto.randomUUID(), numero: '1', tipo: 'item', medicamento: '', indicacion: '' }])
      }
      return recalcularNumeros(filtered)
    })
  }

  // Regla: el tipo del renglón movido se infiere de su nuevo vecino anterior.
  // - Sin vecino anterior → renglón principal (item)
  // - Vecino anterior es item → sub-punto de ese item
  // - Vecino anterior es subitem → sub-punto del mismo padre
  // Para sacar un sub-punto al nivel principal: arrastrarlo al inicio de la lista.
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    setRenglones(prev => {
      const oldIndex = prev.findIndex(r => r.id === active.id)
      const newIndex = prev.findIndex(r => r.id === over.id)
      if (oldIndex === newIndex) return prev

      const reordered = arrayMove(prev, oldIndex, newIndex)

      return recalcularNumeros(reordered.map((r, i) => {
        if (r.id !== active.id) return r
        const anterior = i > 0 ? reordered[i - 1] : null
        if (!anterior) {
          return { ...r, tipo: 'item', parent_id: undefined }
        } else if (anterior.tipo === 'item') {
          return { ...r, tipo: 'subitem', parent_id: anterior.id }
        } else {
          return { ...r, tipo: 'subitem', parent_id: anterior.parent_id }
        }
      }))
    })
  }

  const handleGuardar = async () => {
    const vacios = renglones.some(r => !r.medicamento.trim() || !r.indicacion.trim())
    if (vacios) {
      setError('Todos los renglones deben tener medicamento e indicación.')
      return
    }
    setError(null)
    setGuardando(true)

    try {
      if (recetaId) {
        await axios.patch(`${API}/recetas/${recetaId}`, { indicaciones: renglones }, { withCredentials: true })
        onGuardado?.(recetaId)
      } else {
        const { data } = await axios.post(`${API}/recetas`, { consulta_id: consultaId, indicaciones: renglones }, { withCredentials: true })
        setRecetaId(data.id)
        onGuardado?.(data.id)
      }
    } catch (err) {
      console.error(err)
      setError('Error al guardar la receta.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-400 italic">
        Arrastra un renglón debajo de otro para convertirlo en sub-punto. Arrástralo al inicio para convertirlo en renglón principal.
      </p>
      <div className="max-h-[420px] overflow-y-auto border rounded p-2 bg-gray-50">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={renglones.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {renglones.map(r => (
              <SortableRow
                key={r.id}
                renglon={r}
                onChange={handleChange}
                onEliminar={handleEliminar}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleAgregarItem}>
          + Agregar renglón
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando...' : recetaId ? 'Actualizar Receta' : 'Crear Receta'}
        </Button>
        {onCancelar && (
          <Button type="button" variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
