import {
  ColumnaExportable,
  HojaExportable,
  filasDesdeColumnas,
  encabezadosDeColumnas,
} from '@/lib/exportar'

// ── Tipos de entrada (subconjunto del payload GET /mascotas/expediente/:numero) ──

export interface RenglonRecetaExpediente {
  id?: string
  numero: string
  tipo: 'item' | 'subitem'
  parent_id?: string
  medicamento: string
  indicacion: string
}

export interface ConsultaExpediente {
  id: string
  folio?: number
  fecha: string
  motivo: string
  veterinario: { id: string; nombre: string }
  receta?: { id: string; folio?: number; indicaciones?: RenglonRecetaExpediente[] } | null
  evaluacion_clinica?: Record<string, unknown>
}

export interface PesoExpediente {
  id: string
  peso: number
  fecha: string
}

export interface CitaExpediente {
  id: string
  fecha_hora: string
  motivo: string
  estado: string
}

export interface ExpedienteExportable {
  expediente: number
  nombre: string
  raza: string
  sexo: string
  edad_aproximada?: number
  especie?: { nombre: string }
  cliente: { nombre_completo: string }
  pesos: PesoExpediente[]
  consultas: ConsultaExpediente[]
  citas: CitaExpediente[]
}

export type SeleccionExpediente = {
  consultas: boolean
  pesos: boolean
  recetas: boolean
  citas: boolean
}

// ── Columnas de las hojas de Excel (fuente única, encabezado + valor juntos) ────

const fechaCorta = (f: string) => new Date(f).toLocaleDateString('es-MX', {
  timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric',
})

const fechaHoraCorta = (f: string) => new Date(f).toLocaleString('es-MX', {
  timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
})

const ec = (c: ConsultaExpediente) => (c.evaluacion_clinica ?? {}) as {
  datos_generales?: Record<string, string | undefined>
  estado_general?: Record<string, string | undefined>
  diagnostico?: Record<string, string | undefined>
}

// El folio depende del # de expediente, así que las columnas se arman con una fábrica.
export const columnasHistorialConsultas = (numExpediente: number): ColumnaExportable<ConsultaExpediente>[] => [
  { encabezado: 'Folio', valor: c => c.folio ? `C-${numExpediente}-${c.folio}` : '' },
  { encabezado: 'Fecha', valor: c => fechaCorta(c.fecha) },
  { encabezado: 'Veterinario', valor: c => c.veterinario.nombre },
  { encabezado: 'Motivo', valor: c => c.motivo },
  { encabezado: 'Edad', valor: c => ec(c).datos_generales?.edad ?? '' },
  { encabezado: 'Peso (kg)', valor: c => ec(c).datos_generales?.peso ?? '' },
  { encabezado: 'Temperatura (°C)', valor: c => ec(c).estado_general?.temperatura ?? '' },
  { encabezado: 'FC (lpm)', valor: c => ec(c).estado_general?.fc ?? '' },
  { encabezado: 'FR (rpm)', valor: c => ec(c).estado_general?.fr ?? '' },
  { encabezado: 'Actitud', valor: c => ec(c).estado_general?.actitud ?? '' },
  { encabezado: 'Diagnóstico', valor: c => ec(c).diagnostico?.diagnostico ?? '' },
  { encabezado: 'Pronóstico', valor: c => ec(c).diagnostico?.pronostico ?? '' },
]

export const COLUMNAS_HISTORIAL_PESOS_EXPEDIENTE: ColumnaExportable<PesoExpediente>[] = [
  { encabezado: 'Fecha', valor: p => fechaCorta(p.fecha) },
  { encabezado: 'Peso (kg)', valor: p => p.peso },
]

interface RenglonRecetaConContexto {
  consulta: ConsultaExpediente
  renglon: RenglonRecetaExpediente
}

export const columnasHistorialRecetas = (numExpediente: number): ColumnaExportable<RenglonRecetaConContexto>[] => [
  { encabezado: 'Folio', valor: ({ consulta: c }) => c.receta?.folio ? `R-${numExpediente}-${c.receta.folio}` : '' },
  { encabezado: 'Fecha consulta', valor: ({ consulta: c }) => fechaCorta(c.fecha) },
  { encabezado: 'Veterinario', valor: ({ consulta: c }) => c.veterinario.nombre },
  { encabezado: '#', valor: ({ renglon: r }) => r.numero },
  { encabezado: 'Medicamento', valor: ({ renglon: r }) => r.medicamento },
  { encabezado: 'Indicación', valor: ({ renglon: r }) => r.indicacion },
]

export const COLUMNAS_HISTORIAL_CITAS_EXPEDIENTE: ColumnaExportable<CitaExpediente>[] = [
  { encabezado: 'Fecha', valor: c => c.fecha_hora ? fechaHoraCorta(c.fecha_hora) : '' },
  { encabezado: 'Motivo', valor: c => c.motivo },
  { encabezado: 'Estado', valor: c => c.estado },
]

// ── Hojas de Excel según la selección ─────────────────────────────────────────

export function hojasDelExpediente(exp: ExpedienteExportable, seleccion: SeleccionExpediente): HojaExportable[] {
  const hojas: HojaExportable[] = []

  if (seleccion.consultas) {
    const columnas = columnasHistorialConsultas(exp.expediente)
    hojas.push({
      nombre: 'Historial de Consultas',
      columnas: encabezadosDeColumnas(columnas),
      filas: filasDesdeColumnas(exp.consultas, columnas),
    })
  }

  if (seleccion.pesos) {
    hojas.push({
      nombre: 'Historial de Pesos',
      columnas: encabezadosDeColumnas(COLUMNAS_HISTORIAL_PESOS_EXPEDIENTE),
      filas: filasDesdeColumnas(exp.pesos, COLUMNAS_HISTORIAL_PESOS_EXPEDIENTE),
    })
  }

  if (seleccion.recetas) {
    const renglones: RenglonRecetaConContexto[] = []
    exp.consultas.filter(c => c.receta).forEach(consulta => {
      (consulta.receta?.indicaciones ?? []).forEach(renglon => renglones.push({ consulta, renglon }))
    })
    const columnas = columnasHistorialRecetas(exp.expediente)
    hojas.push({
      nombre: 'Historial de Recetas',
      columnas: encabezadosDeColumnas(columnas),
      filas: filasDesdeColumnas(renglones, columnas),
    })
  }

  if (seleccion.citas) {
    hojas.push({
      nombre: 'Historial de Citas',
      columnas: encabezadosDeColumnas(COLUMNAS_HISTORIAL_CITAS_EXPEDIENTE),
      filas: filasDesdeColumnas(exp.citas, COLUMNAS_HISTORIAL_CITAS_EXPEDIENTE),
    })
  }

  return hojas
}
