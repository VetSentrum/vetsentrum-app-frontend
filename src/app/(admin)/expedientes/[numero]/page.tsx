'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

const ESPECIES_ICONOS: Record<string, string> = {
  Canino: '🐕',
  Felino: '🐈',
  Ave: '🦜',
  Conejo: '🐇',
}

// Calcula la edad actual dado la edad en meses al momento del registro y la fecha de registro
function calcularEdad(meses: number, fechaCreacion: string): string {
  const edadMs = meses * 30.44 * 24 * 60 * 60 * 1000
  const nacimiento = new Date(new Date(fechaCreacion).getTime() - edadMs)
  const hoy = new Date()
  let totalMeses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 +
    (hoy.getMonth() - nacimiento.getMonth())
  if (hoy.getDate() < nacimiento.getDate()) totalMeses -= 1
  if (totalMeses < 0) totalMeses = 0
  const años = Math.floor(totalMeses / 12)
  const m = totalMeses % 12
  if (años === 0) return m <= 1 ? `${m} mes` : `${m} meses`
  if (m === 0) return años === 1 ? '1 año' : `${años} años`
  return `${años} año${años !== 1 ? 's' : ''} ${m} mes${m !== 1 ? 'es' : ''}`
}

interface PesoEntry {
  id: string
  peso: number
  fecha: string
  consulta_id?: string
}

interface ConsultaEntry {
  id: string
  folio?: number
  fecha: string
  motivo: string
  veterinario: { id: string; nombre: string }
  receta?: { id: string; folio?: number } | null
  evaluacion_clinica?: {
    datos_generales?: { edad?: string; peso?: string; [key: string]: string | undefined }
    estado_general?: { temperatura?: string; fc?: string; fr?: string; actitud?: string; [key: string]: string | undefined }
    diagnostico?: { diagnostico?: string; pronostico?: string; [key: string]: string | undefined }
    [key: string]: unknown
  }
}

interface OtraMascota {
  id: string
  nombre: string
  expediente: number
  activo: boolean
}

interface Expediente {
  id: string
  expediente: number
  nombre: string
  raza: string
  sexo: string
  edad_aproximada?: number
  peso?: number
  color?: string
  esterilizado: boolean
  fecha_creacion: string
  activo: boolean
  especie?: { nombre: string }
  cliente: {
    id: string
    nombre_completo: string
    telefono: string
    email?: string
    direccion?: string
    mascotas: OtraMascota[]
  }
  pesos: PesoEntry[]
  consultas: ConsultaEntry[]
}

// ── Sparkline SVG ────────────────────────────────────────────────────────────

function SparklineChart({ pesos }: { pesos: PesoEntry[] }) {
  if (pesos.length < 2) return null

  const W = 340
  const H = 56
  const PAD = 6

  const vals = pesos.map(p => p.peso)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1

  const points = pesos.map((p, i) => ({
    x: PAD + (i / (pesos.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (p.peso - min) / range) * (H - PAD * 2),
    peso: p.peso,
    fecha: p.fecha,
  }))

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div>
      <svg width={W} height={H} className="overflow-visible">
        <polygon
          points={`${PAD},${H - PAD} ${polyline} ${W - PAD},${H - PAD}`}
          fill="rgba(99,102,241,0.08)"
        />
        <polyline
          points={polyline}
          fill="none"
          stroke="rgb(99,102,241)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="rgb(99,102,241)" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5" style={{ width: W }}>
        <span>{new Date(pesos[0].fecha).toLocaleDateString('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' })}</span>
        <span className="text-indigo-500 font-medium">{pesos[pesos.length - 1].peso} kg</span>
        <span>{new Date(pesos[pesos.length - 1].fecha).toLocaleDateString('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' })}</span>
      </div>
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

// ── ConsultaRow ───────────────────────────────────────────────────────────────

function ConsultaRow({ c, expediente }: { c: ConsultaEntry; expediente: number }) {
  const [expanded, setExpanded] = useState(false)

  const fecha = new Date(c.fecha).toLocaleDateString('es-MX', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const folio = c.folio ? `C-${expediente}-${c.folio}` : '—'

  const ec = c.evaluacion_clinica
  const dg = ec?.datos_generales
  const eg = ec?.estado_general
  const dx = ec?.diagnostico

  const hasData = dg?.edad || dg?.peso || eg?.temperatura || eg?.fc || eg?.fr || dx?.diagnostico

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(x => !x)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-1">
            <span className="font-mono text-xs font-semibold text-indigo-600">{folio}</span>
            <span className="text-xs text-gray-400">{fecha}</span>
            <span className="text-xs text-gray-500">{c.veterinario.nombre}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">{c.motivo}</p>
          {dg?.peso && (
            <p className="text-xs text-gray-400 mt-0.5">Peso registrado: {dg.peso} kg</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`/consultas/${c.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-xs px-2.5 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Ver consulta
          </a>
          {c.receta && (
            <a
              href={`/recetas/${c.receta.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs px-2.5 py-1 rounded-md border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              Ver receta
            </a>
          )}
          <span className="text-gray-300 text-sm select-none">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {!hasData ? (
            <p className="text-xs text-gray-400 italic">Sin datos clínicos registrados en esta consulta.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {dg?.edad && (
                <div><span className="text-gray-500">Edad:</span> <span className="text-gray-800">{dg.edad}</span></div>
              )}
              {dg?.peso && (
                <div><span className="text-gray-500">Peso:</span> <span className="text-gray-800">{dg.peso} kg</span></div>
              )}
              {eg?.temperatura && (
                <div><span className="text-gray-500">Temperatura:</span> <span className="text-gray-800">{eg.temperatura} °C</span></div>
              )}
              {eg?.fc && (
                <div><span className="text-gray-500">FC:</span> <span className="text-gray-800">{eg.fc} lpm</span></div>
              )}
              {eg?.fr && (
                <div><span className="text-gray-500">FR:</span> <span className="text-gray-800">{eg.fr} rpm</span></div>
              )}
              {eg?.actitud && (
                <div><span className="text-gray-500">Actitud:</span> <span className="text-gray-800">{eg.actitud}</span></div>
              )}
              {dx?.diagnostico && (
                <div className="col-span-2 mt-1">
                  <span className="text-gray-500">Diagnóstico:</span>
                  <p className="text-gray-800 mt-0.5">{dx.diagnostico}</p>
                </div>
              )}
              {dx?.pronostico && (
                <div className="col-span-2">
                  <span className="text-gray-500">Pronóstico:</span>
                  <p className="text-gray-800 mt-0.5">{dx.pronostico}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ExpedienteDetallePage() {
  const { numero } = useParams<{ numero: string }>()
  const [data, setData] = useState<Expediente | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get<Expediente>(`${API}/mascotas/expediente/${numero}`, { withCredentials: true })
      .then(res => setData(res.data))
      .catch(e => setError(e.response?.data?.message ?? 'No se pudo cargar el expediente'))
  }, [numero])

  if (error) return (
    <div className="max-w-3xl mx-auto">
      <Link href="/expedientes" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
        ← Volver
      </Link>
      <p className="text-red-500 mt-4">{error}</p>
    </div>
  )

  if (!data) return (
    <div className="max-w-3xl mx-auto space-y-4 mt-4">
      <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />)}
      </div>
    </div>
  )

  // ── Cálculo de stats ──────────────────────────────────────────────────────
  const consultas = data.consultas
  const pesos = data.pesos

  const totalConsultas = consultas.length
  const primeraVisita = consultas.length
    ? new Date(consultas[consultas.length - 1].fecha).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'
  const ultimaVisita = consultas.length
    ? new Date(consultas[0].fecha).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'

  // Peso: priorizar última medición de PesoMascota, fallback al campo de la mascota
  const pesoActual = pesos.length ? pesos[pesos.length - 1].peso : (data.peso ?? null)
  const pesoAnterior = pesos.length > 1 ? pesos[pesos.length - 2].peso : null
  const delta = pesoActual != null && pesoAnterior != null ? pesoActual - pesoAnterior : null

  const pesoLabel = pesoActual != null ? `${pesoActual} kg` : '—'
  const pesoSub = delta != null
    ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg vs anterior`
    : undefined

  const fechaRegistro = new Date(data.fecha_creacion).toLocaleDateString('es-MX', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const edadTexto = data.edad_aproximada != null
    ? calcularEdad(data.edad_aproximada, data.fecha_creacion)
    : null

  const icono = ESPECIES_ICONOS[data.especie?.nombre ?? ''] ?? '🐾'
  const otrosPacientes = data.cliente.mascotas.filter(m => m.expediente !== data.expediente)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link href="/expedientes" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
          ← Volver a expedientes
        </Link>
        <span className="text-xs font-mono text-gray-400">EXPEDIENTE #{data.expediente}</span>
      </div>

      {/* Tarjeta paciente */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="text-5xl leading-none select-none">{icono}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{data.nombre}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                data.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {data.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              {[data.especie?.nombre, data.raza, data.sexo].filter(Boolean).join(' · ')}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
              {edadTexto && (
                <span>Edad: <span className="text-gray-800 font-medium">{edadTexto}</span></span>
              )}
              {pesoActual != null && (
                <span>Peso: <span className="text-gray-800 font-medium">{pesoActual} kg</span></span>
              )}
              {data.color && (
                <span>Color: <span className="text-gray-800 font-medium">{data.color}</span></span>
              )}
              <span>Esterilizado: <span className="text-gray-800 font-medium">{data.esterilizado ? 'Sí' : 'No'}</span></span>
              <span>Registro: <span className="text-gray-800 font-medium">{fechaRegistro}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta propietario */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Propietario</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700 mb-3">
          <span className="font-semibold text-gray-900">{data.cliente.nombre_completo}</span>
          <span>{data.cliente.telefono}</span>
          {data.cliente.email && <span>{data.cliente.email}</span>}
          {data.cliente.direccion && <span className="text-gray-500">{data.cliente.direccion}</span>}
        </div>
        {otrosPacientes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs text-gray-400 self-center">Otras mascotas:</span>
            {otrosPacientes.map(m => (
              <Link
                key={m.id}
                href={`/expedientes/${m.expediente}`}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-gray-200 hover:border-indigo-300 hover:text-indigo-700 transition-colors text-gray-600"
              >
                {m.nombre} <span className="text-gray-400">#{m.expediente}</span>
                {!m.activo && <span className="text-gray-300 ml-1">(inactivo)</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Consultas" value={String(totalConsultas)} sub="total de visitas" />
        <StatCard label="Primera visita" value={primeraVisita} />
        <StatCard label="Última visita" value={ultimaVisita} />
        <StatCard label="Peso" value={pesoLabel} sub={pesoSub} />
      </div>

      {/* Historial de peso */}
      {pesos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Historial de peso ({pesos.length} medición{pesos.length !== 1 ? 'es' : ''})
          </h2>
          <SparklineChart pesos={pesos} />
          {pesos.length >= 2 && (
            <div className="mt-3 flex gap-6 text-xs text-gray-500">
              <span>Mín: <strong className="text-gray-800">{Math.min(...pesos.map(p => p.peso))} kg</strong></span>
              <span>Máx: <strong className="text-gray-800">{Math.max(...pesos.map(p => p.peso))} kg</strong></span>
              <span>Promedio: <strong className="text-gray-800">
                {(pesos.reduce((s, p) => s + p.peso, 0) / pesos.length).toFixed(1)} kg
              </strong></span>
            </div>
          )}
        </div>
      )}

      {/* Historial de consultas */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Historial de consultas
        </h2>
        {consultas.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
            Sin consultas registradas.
          </div>
        ) : (
          <div className="space-y-2">
            {consultas.map(c => (
              <ConsultaRow key={c.id} c={c} expediente={data.expediente} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
