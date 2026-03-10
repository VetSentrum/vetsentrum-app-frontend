'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConsultaFormData } from '@/components/EditarConsultaForm'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

interface Empresa {
  nombre: string
  subtitulo?: string
  universidad?: string
  direccion?: string
  ciudad?: string
  cp?: string
  telefono?: string
  whatsapp?: string
  email?: string
  cedula_profesional?: string
  logo_url?: string
}

type ConsultaConRelaciones = ConsultaFormData & {
  folio?: number
  mega_file_id?: string | null
  mascota?: {
    nombre: string
    raza?: string
    sexo?: string
    edad_aproximada?: number
    especie?: { nombre: string }
    cliente?: { nombre_completo: string }
    expediente?: number
  }
  veterinario?: { nombre: string }
}

function Campo({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const texto =
    value === true ? 'Sí' :
    value === false ? 'No' :
    value != null && value !== '' ? String(value) : null
  return (
    <div className="flex gap-2 text-sm leading-snug">
      <span className="font-semibold min-w-[160px] text-gray-700">{label}:</span>
      {texto !== null ? (
        <span className="text-gray-900">{texto}</span>
      ) : (
        <span className="text-[10px] italic text-gray-300 border border-dashed border-gray-200 px-1.5 rounded self-center leading-4">
          sin datos
        </span>
      )}
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 break-inside-avoid">
      <h3 className="font-bold text-sm uppercase tracking-wide text-gray-600 border-b border-gray-300 pb-1 mb-2">{titulo}</h3>
      <div className="space-y-1 pl-2">{children}</div>
    </div>
  )
}

function DatoBloque({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {value != null && value !== '' ? (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      ) : (
        <span className="text-[10px] italic text-gray-300 border border-dashed border-gray-200 px-1.5 rounded leading-4 self-start mt-0.5">
          sin datos
        </span>
      )}
    </div>
  )
}

export default function ConsultaImprimirPage() {
  const { id } = useParams<{ id: string }>()
  const [consulta, setConsulta] = useState<ConsultaConRelaciones | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const printAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Inyectar estilos de impresión para ocultar sidebar/header
    const style = document.createElement('style')
    style.id = 'print-hide'
    style.textContent = '@media print { aside, header { display:none!important } }'
    document.head.appendChild(style)
    return () => { document.getElementById('print-hide')?.remove() }
  }, [])

  useEffect(() => {
    fetch(`${API}/consultas/${id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar la consulta')
        return r.json()
      })
      .then(data => {
        setConsulta(data)
      })
      .catch(e => setError(e.message))
  }, [id])

  useEffect(() => {
    fetch(`${API}/empresa`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setEmpresa(data) })
      .catch(() => {})
  }, [])

  const guardarPdf = async () => {
    if (!printAreaRef.current || !consulta) return
    setGenerando(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const folio = `C-${consulta.mascota?.expediente ?? 0}-${consulta.folio ?? 0}`
      const root = printAreaRef.current

      // Convierte oklch → rgb en texto CSS usando canvas
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

      // Extrae todo el CSS del CSSOM actual y reemplaza oklch — antes de que html2canvas lo procese
      const cssFixed = Array.from(document.styleSheets).flatMap(sheet => {
        try { return Array.from(sheet.cssRules || []).map(r => fixOklch(r.cssText)) }
        catch { return [] }
      }).join('\n')

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${folio}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc: Document) => {
              // Reemplaza todos los stylesheets del clon con la versión sin oklch
              clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(e => e.remove())
              const s = clonedDoc.createElement('style')
              s.textContent = cssFixed
              clonedDoc.head.appendChild(s)
            },
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(root)
        .save()
    } finally {
      setGenerando(false)
    }
  }

  if (error) return <p className="p-6 text-red-500">{error}</p>
  if (!consulta) return <p className="p-6 text-gray-400">Cargando...</p>

  const ec = consulta.evaluacion_clinica
  const dg = ec?.datos_generales
  const eg = ec?.estado_general
  const sis = ec?.sistemas
  const dx = ec?.diagnostico
  const ind = ec?.indicaciones

  const especie = dg?.especie || consulta.mascota?.especie?.nombre
  const raza = dg?.raza || consulta.mascota?.raza
  const sexo = dg?.sexo || consulta.mascota?.sexo
  const edad = dg?.edad || consulta.mascota?.edad_aproximada?.toString()
  const folio = consulta.folio
    ? `C-${consulta.mascota?.expediente ?? ''}-${consulta.folio}`
    : '—'
  const fechaConsulta = consulta.fecha
    ? new Date(consulta.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:p-0">
      {/* Barra de acciones — solo en pantalla */}
      <div className="max-w-3xl mx-auto flex justify-end gap-3 mb-4 print:hidden px-4">
        <Button variant="outline" onClick={guardarPdf} disabled={generando}>
          {generando ? 'Generando...' : 'Guardar PDF'}
        </Button>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>

      {/* Documento imprimible */}
      <div
        ref={printAreaRef}
        className="max-w-3xl mx-auto bg-white shadow-sm print:shadow-none p-8 print:p-6"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Encabezado de empresa */}
        <div className="flex items-start gap-4 mb-4">
          {empresa?.logo_url && (
            <img
              src={empresa.logo_url}
              alt="Logo"
              className="h-16 w-16 object-contain flex-shrink-0"
              crossOrigin="anonymous"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {empresa?.nombre ?? 'Clínica Veterinaria'}
            </h1>
            {empresa?.subtitulo && (
              <p className="text-sm text-gray-600 italic">{empresa.subtitulo}</p>
            )}
            {empresa?.universidad && (
              <p className="text-xs text-gray-500">{empresa.universidad}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              {empresa?.direccion && (
                <span className="text-xs text-gray-500">📍 {empresa.direccion}{empresa.ciudad ? `, ${empresa.ciudad}` : ''}{empresa.cp ? ` C.P. ${empresa.cp}` : ''}</span>
              )}
              {empresa?.telefono && (
                <span className="text-xs text-gray-500">☎ {empresa.telefono}</span>
              )}
              {empresa?.whatsapp && (
                <span className="text-xs text-gray-500">📱 {empresa.whatsapp}</span>
              )}
              {empresa?.cedula_profesional && (
                <span className="text-xs text-gray-500">Cédula: {empresa.cedula_profesional}</span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Consulta</span>
            <p className="text-lg font-bold text-gray-900">{folio}</p>
            <p className="text-xs text-gray-500">{fechaConsulta}</p>
          </div>
        </div>

        <div className="border-t-2 border-gray-800 mb-5" />

        {/* Bloque de datos del paciente */}
        <div className="grid grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded p-3 mb-5">
          <DatoBloque label="Paciente" value={consulta.mascota?.nombre} />
          <DatoBloque label="#EXP" value={consulta.mascota?.expediente != null ? `#EXP-${consulta.mascota.expediente}` : undefined} />
          <DatoBloque label="Especie / Raza" value={[especie, raza].filter(Boolean).join(' — ')} />
          <DatoBloque label="Sexo" value={sexo} />
          <DatoBloque label="Edad" value={edad} />
          <DatoBloque label="Peso" value={dg?.peso ? `${dg.peso} kg` : undefined} />
          <DatoBloque label="Propietario" value={consulta.mascota?.cliente?.nombre_completo} />
          <DatoBloque label="Veterinario" value={consulta.veterinario?.nombre} />
        </div>

        {/* Motivo */}
        {consulta.motivo && (
          <div className="mb-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Motivo de consulta:</span>
            <p className="text-sm text-gray-900 mt-0.5">{consulta.motivo}</p>
          </div>
        )}

        {/* Datos Generales */}
        {dg && (
          <Seccion titulo="Datos Generales">
            <Campo label="Hábitat" value={dg.habitat} />
            <Campo label="Otras mascotas" value={dg.otras_mascotas_check ? dg.otras_mascotas : 'No'} />
            <Campo label="Desde cuándo" value={dg.desde_cuando_mascota} />
            <Campo label="Dieta" value={dg.dieta} />
            <Campo label="Historial enfermedades" value={dg.historial_enfermedades} />
          </Seccion>
        )}

        {/* Estado General */}
        {eg && (
          <Seccion titulo="Estado General">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Campo label="Vacunas" value={eg.vacunas} />
              <Campo label="Desparasitación" value={eg.desparasitacion} />
              {eg.tipo_desparasitacion?.length > 0 && (
                <Campo label="Tipo desparasitación" value={eg.tipo_desparasitacion.join(', ')} />
              )}
              <Campo label="Actitud" value={eg.actitud} />
              <Campo label="Temperatura" value={eg.temperatura} />
              <Campo label="FC" value={eg.fc} />
              <Campo label="FR" value={eg.fr} />
              <Campo label="TLLC" value={eg.tllc} />
              <Campo label="Deshidratación" value={eg.deshidratacion} />
              <Campo label="Condición corporal" value={eg.condicion_corporal} />
              <Campo label="Mucosas" value={eg.mucosas} />
              <Campo label="Sonido cardíaco" value={eg.sonido_cardiaco} />
              <Campo label="Reflejo pupilar" value={eg.reflejo_pupilar} />
              <Campo label="Anisocoria" value={eg.anisocoria} />
              <Campo label="Nistagmo" value={eg.nistagmo} />
              <Campo label="RF" value={eg.rf} />
              <Campo label="PE" value={eg.pe} />
              <Campo label="POP" value={eg.pop} />
              <Campo label="Palpación abdominal" value={eg.palpacion_abdominal} />
            </div>
            {eg.historia_clinica && <Campo label="Historia clínica" value={eg.historia_clinica} />}
          </Seccion>
        )}

        {/* Sistemas */}
        {sis && (
          <>
            {!sis.sistema_digestivo?.na && (
              <Seccion titulo="Sistema Digestivo">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Apetito" value={sis.sistema_digestivo.apetito} />
                  <Campo label="Ingesta de agua" value={sis.sistema_digestivo.ingesta_agua} />
                  <Campo label="Estreñimiento" value={sis.sistema_digestivo.estrenimiento} />
                  <Campo label="Flatulencia" value={sis.sistema_digestivo.flatulencia} />
                  <Campo label="Vómito" value={sis.sistema_digestivo.vomito} />
                  {sis.sistema_digestivo.vomito && <>
                    <Campo label="Veces vómito/día" value={sis.sistema_digestivo.veces_vomito} />
                    <Campo label="Aspecto vómito" value={sis.sistema_digestivo.aspecto_vomito} />
                  </>}
                  <Campo label="Defeca" value={sis.sistema_digestivo.defeca} />
                  {sis.sistema_digestivo.defeca && <>
                    <Campo label="Veces defeca/día" value={sis.sistema_digestivo.veces_defeca} />
                    <Campo label="Aspecto defeca" value={sis.sistema_digestivo.aspecto_defeca} />
                  </>}
                </div>
              </Seccion>
            )}
            {!sis.cavidad_oral?.na && (
              <Seccion titulo="Cavidad Oral">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Sarro" value={sis.cavidad_oral.sarro} />
                  <Campo label="Gingivitis" value={sis.cavidad_oral.gingivitis} />
                  <Campo label="Sangrado" value={sis.cavidad_oral.sangrado} />
                  <Campo label="Halitosis" value={sis.cavidad_oral.halitosis} />
                  <Campo label="Hipersalivación" value={sis.cavidad_oral.hipersalivacion} />
                </div>
              </Seccion>
            )}
            {!sis.nariz_faringe?.na && (
              <Seccion titulo="Nariz / Faringe">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Descarga nasal" value={sis.nariz_faringe.descarga_nasal} />
                  {sis.nariz_faringe.descarga_nasal && <Campo label="Aspecto descarga" value={sis.nariz_faringe.aspecto_descarga} />}
                  <Campo label="Epistaxis" value={sis.nariz_faringe.epistaxis} />
                  <Campo label="Resequedad" value={sis.nariz_faringe.resequedad} />
                </div>
              </Seccion>
            )}
            {!sis.sistema_respiratorio?.na && (
              <Seccion titulo="Sistema Respiratorio">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Tos" value={sis.sistema_respiratorio.tos} />
                  {sis.sistema_respiratorio.tos && <Campo label="Frecuencia tos" value={sis.sistema_respiratorio.frecuencia_tos} />}
                  <Campo label="Disnea" value={sis.sistema_respiratorio.disnea} />
                  {sis.sistema_respiratorio.disnea && <Campo label="Frecuencia disnea" value={sis.sistema_respiratorio.frecuencia_disnea} />}
                  <Campo label="Estornudos" value={sis.sistema_respiratorio.estornudos} />
                  {sis.sistema_respiratorio.estornudos && <Campo label="Frecuencia estornudos" value={sis.sistema_respiratorio.frecuencia_estornudos} />}
                </div>
              </Seccion>
            )}
            {!sis.sistema_urogenital?.na && (
              <Seccion titulo="Sistema Urogenital">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Orina" value={sis.sistema_urogenital.orina} />
                  {sis.sistema_urogenital.orina && <>
                    <Campo label="Frecuencia orina" value={sis.sistema_urogenital.frecuencia_orina} />
                    <Campo label="Aspecto orina" value={sis.sistema_urogenital.aspecto_orina} />
                  </>}
                  <Campo label="Castrado" value={sis.sistema_urogenital.castrado} />
                  <Campo label="Se ha cruzado" value={sis.sistema_urogenital.se_ha_cruzado} />
                  <Campo label="Ha gestado" value={sis.sistema_urogenital.ha_gestado} />
                  {sis.sistema_urogenital.ha_gestado && <Campo label="Último parto" value={sis.sistema_urogenital.ultimo_parto} />}
                  <Campo label="Descarga vulva/prepucio" value={sis.sistema_urogenital.descarga_vulva_prepucio} />
                </div>
              </Seccion>
            )}
            {!sis.sistema_tegumentario?.na && (
              <Seccion titulo="Sistema Tegumentario">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Alopecia" value={sis.sistema_tegumentario.alopecia} />
                  <Campo label="Parásitos" value={sis.sistema_tegumentario.parasitos} />
                  {sis.sistema_tegumentario.parasitos && <>
                    <Campo label="Tipo parásitos" value={sis.sistema_tegumentario.tipo_parasitos} />
                    {sis.sistema_tegumentario.tipo_parasitos === 'otro' && (
                      <Campo label="¿Cuál?" value={sis.sistema_tegumentario.cual_parasito} />
                    )}
                  </>}
                  <Campo label="Lesiones" value={sis.sistema_tegumentario.lesiones} />
                  {sis.sistema_tegumentario.lesiones && <>
                    <Campo label="Tipo lesión" value={sis.sistema_tegumentario.tipo_lesion} />
                    <Campo label="Aspecto lesión" value={sis.sistema_tegumentario.aspecto_lesion} />
                  </>}
                </div>
              </Seccion>
            )}
            {!sis.sistema_muscoesqueletico?.na && (
              <Seccion titulo="Sistema Musculoesquelético">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Movimiento" value={sis.sistema_muscoesqueletico.movimiento} />
                  <Campo label="Desde cuándo" value={sis.sistema_muscoesqueletico.desde_cuando} />
                  <Campo label="Miembro afectado" value={sis.sistema_muscoesqueletico.miembro_afectado} />
                </div>
              </Seccion>
            )}
            {!sis.sistema_nervioso?.na && (
              <Seccion titulo="Sistema Nervioso">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Incoordinación" value={sis.sistema_nervioso.incordinacion} />
                  <Campo label="Golpes de cabeza" value={sis.sistema_nervioso.golpes_cabeza} />
                  <Campo label="Dismetría" value={sis.sistema_nervioso.dismetria} />
                  <Campo label="Propiocepción" value={sis.sistema_nervioso.propiocepcion} />
                </div>
              </Seccion>
            )}
            {!sis.sistema_cardiaco?.na && (
              <Seccion titulo="Sistema Cardíaco">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Disnea" value={sis.sistema_cardiaco.disnea} />
                  <Campo label="Cianosis" value={sis.sistema_cardiaco.cianosis} />
                  <Campo label="Fatiga" value={sis.sistema_cardiaco.fatiga} />
                  {sis.sistema_cardiaco.fatiga && <Campo label="Frecuencia fatiga" value={sis.sistema_cardiaco.frecuencia_fatiga} />}
                  <Campo label="Tos nocturna" value={sis.sistema_cardiaco.tos_nocturna} />
                  {sis.sistema_cardiaco.tos_nocturna && <Campo label="Frecuencia tos nocturna" value={sis.sistema_cardiaco.frecuencia_tos_nocturna} />}
                </div>
              </Seccion>
            )}
            {!sis.oidos?.na && (
              <Seccion titulo="Oídos">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Izq / Der" value={sis.oidos.izq_der} />
                  <Campo label="Descarga" value={sis.oidos.descarga} />
                  <Campo label="Parásitos" value={sis.oidos.parasitos} />
                  {sis.oidos.parasitos && <Campo label="Cuál" value={sis.oidos.tipo_parasitos} />}
                  <Campo label="Mal olor" value={sis.oidos.mal_olor} />
                  <Campo label="Se rasca" value={sis.oidos.se_rasca} />
                  <Campo label="Escucha" value={sis.oidos.escucha} />
                </div>
              </Seccion>
            )}
            {!sis.ojos?.na && (
              <Seccion titulo="Ojos">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <Campo label="Izq / Der" value={sis.ojos.izq_der} />
                  <Campo label="Descarga" value={sis.ojos.descarga} />
                  <Campo label="Schirmer" value={sis.ojos.schirmer} />
                  <Campo label="Fluorescencia" value={sis.ojos.fluorescencia} />
                  <Campo label="Observaciones" value={sis.ojos.observaciones} />
                </div>
              </Seccion>
            )}
          </>
        )}

        {/* Diagnóstico */}
        {dx && (
          <Seccion titulo="Diagnóstico">
            <Campo label="Dx Presuntivo" value={dx.dx_presuntivo} />
            <Campo label="Dx Diferencial" value={dx.dx_diferencial} />
            {dx.examenes_laboratorio && (
              <div className="mt-2">
                <span className="font-semibold text-sm text-gray-700">Exámenes de laboratorio:</span>
                <div className="pl-4 space-y-0.5 mt-1 grid grid-cols-2 gap-x-4">
                  {dx.examenes_laboratorio.hemograma && <Campo label="Hemograma" value="Sí" />}
                  {dx.examenes_laboratorio.quimica_sanguinea && <Campo label="Química sanguínea" value="Sí" />}
                  {dx.examenes_laboratorio.urianalisis && <Campo label="Urianálisis" value="Sí" />}
                  {dx.examenes_laboratorio.coprologico && <Campo label="Coprológico" value="Sí" />}
                  {dx.examenes_laboratorio.raspado_piel && <Campo label="Raspado de piel" value="Sí" />}
                  {dx.examenes_laboratorio.citologia && <Campo label="Citología" value="Sí" />}
                  {dx.examenes_laboratorio.otro && <Campo label="Otro" value={dx.examenes_laboratorio.especifique_otro} />}
                </div>
              </div>
            )}
            {dx.manejo && (
              <div className="mt-2">
                <span className="font-semibold text-sm text-gray-700">Manejo:</span>
                <div className="pl-4 space-y-0.5 mt-1 grid grid-cols-2 gap-x-4">
                  {dx.manejo.hospitalizacion && <Campo label="Hospitalización" value="Sí" />}
                  {dx.manejo.medicamentos && <Campo label="Medicamentos" value={dx.manejo.especifique_medicamentos} />}
                  {dx.manejo.cirugia && <Campo label="Cirugía" value="Sí" />}
                  {dx.manejo.control && <Campo label="Control" value="Sí" />}
                  {dx.manejo.otro && <Campo label="Otro" value={dx.manejo.especifique_otro} />}
                </div>
              </div>
            )}
          </Seccion>
        )}

        {/* Indicaciones */}
        {ind && (
          <Seccion titulo="Indicaciones">
            {ind.indicaciones && <p className="text-sm text-gray-900 whitespace-pre-wrap">{ind.indicaciones}</p>}
            <Campo label="Próxima cita" value={ind.proxima_cita} />
            {ind.notas && <Campo label="Notas" value={ind.notas} />}
          </Seccion>
        )}

        {/* Footer con firma */}
        <div className="mt-12 flex flex-col items-center">
          <div className="border-t border-gray-400 w-56 mb-1" />
          <p className="text-sm font-semibold text-gray-700">{consulta.veterinario?.nombre ?? 'Médico Veterinario Zootecnista'}</p>
          <p className="text-xs text-gray-500">Médico Veterinario Zootecnista</p>
          {empresa?.cedula_profesional && (
            <p className="text-xs text-gray-500">Cédula Profesional: {empresa.cedula_profesional}</p>
          )}
        </div>
      </div>
    </div>
  )
}
