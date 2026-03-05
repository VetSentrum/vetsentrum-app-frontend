'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConsultaFormData } from '@/components/EditarConsultaForm'

type ConsultaConRelaciones = ConsultaFormData & {
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
    value != null && value !== '' ? String(value) : '—'
  return (
    <div className="flex gap-2 text-sm">
      <span className="font-semibold min-w-[160px]">{label}:</span>
      <span>{texto}</span>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="font-bold text-base border-b mb-2">{titulo}</h3>
      <div className="space-y-1 pl-2">{children}</div>
    </div>
  )
}

export default function ConsultaImprimirPage() {
  const { id } = useParams<{ id: string }>()
  const [consulta, setConsulta] = useState<ConsultaConRelaciones | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/consultas/${id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar la consulta')
        return r.json()
      })
      .then(setConsulta)
      .catch(e => setError(e.message))
  }, [id])

  if (error) return <p className="p-6 text-red-500">{error}</p>
  if (!consulta) return <p className="p-6 text-gray-400">Cargando...</p>

  const ec = consulta.evaluacion_clinica
  const dg = ec?.datos_generales
  const eg = ec?.estado_general
  const sis = ec?.sistemas
  const dx = ec?.diagnostico
  const ind = ec?.indicaciones

  // Fallback a los datos de la relación mascota para campos que vienen de la BD
  const especie = dg?.especie || consulta.mascota?.especie?.nombre
  const raza = dg?.raza || consulta.mascota?.raza
  const sexo = dg?.sexo || consulta.mascota?.sexo
  const edad = dg?.edad || consulta.mascota?.edad_aproximada?.toString()

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Consulta Clínica</h1>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>
      <h1 className="text-2xl font-bold mb-4 hidden print:block">Consulta Clínica</h1>

      <Seccion titulo="Datos de la Consulta">
        <Campo label="Fecha" value={consulta.fecha ? new Date(consulta.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : ''} />
        <Campo label="Mascota" value={`${consulta.mascota?.nombre ?? ''} (#EXP-${consulta.mascota?.expediente ?? ''})`} />
        <Campo label="Cliente" value={consulta.mascota?.cliente?.nombre_completo} />
        <Campo label="Veterinario" value={consulta.veterinario?.nombre} />
        <Campo label="Motivo" value={consulta.motivo} />
      </Seccion>

      {dg && (
        <Seccion titulo="Datos Generales">
          <Campo label="Especie" value={especie} />
          <Campo label="Raza" value={raza} />
          <Campo label="Sexo" value={sexo} />
          <Campo label="Edad" value={edad} />
          <Campo label="Peso" value={dg.peso} />
          <Campo label="Hábitat" value={dg.habitat} />
          <Campo label="Otras mascotas" value={dg.otras_mascotas_check ? dg.otras_mascotas : 'No'} />
          <Campo label="Desde cuándo" value={dg.desde_cuando_mascota} />
          <Campo label="Dieta" value={dg.dieta} />
          <Campo label="Historial enfermedades" value={dg.historial_enfermedades} />
        </Seccion>
      )}

      {eg && (
        <Seccion titulo="Estado General">
          <Campo label="Vacunas" value={eg.vacunas} />
          <Campo label="Desparasitación" value={eg.desparasitacion} />
          {eg.tipo_desparasitacion?.length > 0 && (
            <Campo label="Tipo desparasitación" value={eg.tipo_desparasitacion.join(', ')} />
          )}
          <Campo label="Actitud" value={eg.actitud} />
          <Campo label="Temperatura" value={eg.temperatura} />
          <Campo label="FC" value={eg.fc} />
          <Campo label="FR" value={eg.fr} />
          <Campo label="Sonido cardíaco" value={eg.sonido_cardiaco} />
          <Campo label="Mucosas" value={eg.mucosas} />
          <Campo label="Reflejo pupilar" value={eg.reflejo_pupilar} />
          <Campo label="Anisocoria" value={eg.anisocoria} />
          <Campo label="Nistagmo" value={eg.nistagmo} />
          <Campo label="RF" value={eg.rf} />
          <Campo label="PE" value={eg.pe} />
          <Campo label="POP" value={eg.pop} />
          <Campo label="TLLC" value={eg.tllc} />
          <Campo label="Deshidratación" value={eg.deshidratacion} />
          <Campo label="Condición corporal" value={eg.condicion_corporal} />
          <Campo label="Palpación abdominal" value={eg.palpacion_abdominal} />
          <Campo label="Historia clínica" value={eg.historia_clinica} />
        </Seccion>
      )}

      {sis && (
        <>
          {!sis.sistema_digestivo?.na && (
            <Seccion titulo="Sistema Digestivo">
              <Campo label="Apetito" value={sis.sistema_digestivo.apetito} />
              <Campo label="Estreñimiento" value={sis.sistema_digestivo.estrenimiento} />
              <Campo label="Flatulencia" value={sis.sistema_digestivo.flatulencia} />
              <Campo label="Ingesta de agua" value={sis.sistema_digestivo.ingesta_agua} />
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
            </Seccion>
          )}
          {!sis.cavidad_oral?.na && (
            <Seccion titulo="Cavidad Oral">
              <Campo label="Sarro" value={sis.cavidad_oral.sarro} />
              <Campo label="Gingivitis" value={sis.cavidad_oral.gingivitis} />
              <Campo label="Sangrado" value={sis.cavidad_oral.sangrado} />
              <Campo label="Halitosis" value={sis.cavidad_oral.halitosis} />
              <Campo label="Hipersalivación" value={sis.cavidad_oral.hipersalivacion} />
            </Seccion>
          )}
          {!sis.nariz_faringe?.na && (
            <Seccion titulo="Nariz / Faringe">
              <Campo label="Descarga nasal" value={sis.nariz_faringe.descarga_nasal} />
              {sis.nariz_faringe.descarga_nasal && <Campo label="Aspecto descarga" value={sis.nariz_faringe.aspecto_descarga} />}
              <Campo label="Epistaxis" value={sis.nariz_faringe.epistaxis} />
              <Campo label="Resequedad" value={sis.nariz_faringe.resequedad} />
            </Seccion>
          )}
          {!sis.sistema_respiratorio?.na && (
            <Seccion titulo="Sistema Respiratorio">
              <Campo label="Tos" value={sis.sistema_respiratorio.tos} />
              {sis.sistema_respiratorio.tos && <Campo label="Frecuencia tos" value={sis.sistema_respiratorio.frecuencia_tos} />}
              <Campo label="Disnea" value={sis.sistema_respiratorio.disnea} />
              {sis.sistema_respiratorio.disnea && <Campo label="Frecuencia disnea" value={sis.sistema_respiratorio.frecuencia_disnea} />}
              <Campo label="Estornudos" value={sis.sistema_respiratorio.estornudos} />
              {sis.sistema_respiratorio.estornudos && <Campo label="Frecuencia estornudos" value={sis.sistema_respiratorio.frecuencia_estornudos} />}
            </Seccion>
          )}
          {!sis.sistema_urogenital?.na && (
            <Seccion titulo="Sistema Urogenital">
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
            </Seccion>
          )}
          {!sis.sistema_tegumentario?.na && (
            <Seccion titulo="Sistema Tegumentario">
              <Campo label="Alopecia" value={sis.sistema_tegumentario.alopecia} />
              <Campo label="Parásitos" value={sis.sistema_tegumentario.parasitos} />
              {sis.sistema_tegumentario.parasitos && <Campo label="Tipo parásitos" value={sis.sistema_tegumentario.tipo_parasitos} />}
              <Campo label="Lesiones" value={sis.sistema_tegumentario.lesiones} />
              {sis.sistema_tegumentario.lesiones && <>
                <Campo label="Tipo lesión" value={sis.sistema_tegumentario.tipo_lesion} />
                <Campo label="Aspecto lesión" value={sis.sistema_tegumentario.aspecto_lesion} />
              </>}
            </Seccion>
          )}
          {!sis.sistema_muscoesqueletico?.na && (
            <Seccion titulo="Sistema Muscoesquelético">
              <Campo label="Movimiento" value={sis.sistema_muscoesqueletico.movimiento} />
              <Campo label="Desde cuándo" value={sis.sistema_muscoesqueletico.desde_cuando} />
              <Campo label="Miembro afectado" value={sis.sistema_muscoesqueletico.miembro_afectado} />
            </Seccion>
          )}
          {!sis.sistema_nervioso?.na && (
            <Seccion titulo="Sistema Nervioso">
              <Campo label="Incoordinación" value={sis.sistema_nervioso.incordinacion} />
              <Campo label="Golpes de cabeza" value={sis.sistema_nervioso.golpes_cabeza} />
              <Campo label="Dismetría" value={sis.sistema_nervioso.dismetria} />
              <Campo label="Propiocepción" value={sis.sistema_nervioso.propiocepcion} />
            </Seccion>
          )}
          {!sis.sistema_cardiaco?.na && (
            <Seccion titulo="Sistema Cardíaco">
              <Campo label="Disnea" value={sis.sistema_cardiaco.disnea} />
              <Campo label="Cianosis" value={sis.sistema_cardiaco.cianosis} />
              <Campo label="Fatiga" value={sis.sistema_cardiaco.fatiga} />
              {sis.sistema_cardiaco.fatiga && <Campo label="Frecuencia fatiga" value={sis.sistema_cardiaco.frecuencia_fatiga} />}
              <Campo label="Tos nocturna" value={sis.sistema_cardiaco.tos_nocturna} />
              {sis.sistema_cardiaco.tos_nocturna && <Campo label="Frecuencia tos nocturna" value={sis.sistema_cardiaco.frecuencia_tos_nocturna} />}
            </Seccion>
          )}
          {!sis.oidos?.na && (
            <Seccion titulo="Oídos">
              <Campo label="Izq / Der" value={sis.oidos.izq_der} />
              <Campo label="Descarga" value={sis.oidos.descarga} />
              <Campo label="Parásitos" value={sis.oidos.parasitos} />
              {sis.oidos.parasitos && <Campo label="Cuál" value={sis.oidos.tipo_parasitos} />}
              <Campo label="Mal olor" value={sis.oidos.mal_olor} />
              <Campo label="Se rasca" value={sis.oidos.se_rasca} />
              <Campo label="Escucha" value={sis.oidos.escucha} />
            </Seccion>
          )}
          {!sis.ojos?.na && (
            <Seccion titulo="Ojos">
              <Campo label="Izq / Der" value={sis.ojos.izq_der} />
              <Campo label="Descarga" value={sis.ojos.descarga} />
              <Campo label="Schirmer" value={sis.ojos.schirmer} />
              <Campo label="Fluorescencia" value={sis.ojos.fluorescencia} />
              <Campo label="Observaciones" value={sis.ojos.observaciones} />
            </Seccion>
          )}
        </>
      )}

      {dx && (
        <Seccion titulo="Diagnóstico">
          <Campo label="Dx Presuntivo" value={dx.dx_presuntivo} />
          <Campo label="Dx Diferencial" value={dx.dx_diferencial} />
          <div className="mt-1">
            <span className="font-semibold text-sm">Exámenes de laboratorio:</span>
            <div className="pl-4 space-y-1 mt-1">
              {dx.examenes_laboratorio?.hemograma && <Campo label="Hemograma" value="Sí" />}
              {dx.examenes_laboratorio?.quimica_sanguinea && <Campo label="Química sanguínea" value="Sí" />}
              {dx.examenes_laboratorio?.urianalisis && <Campo label="Urianálisis" value="Sí" />}
              {dx.examenes_laboratorio?.coprologico && <Campo label="Coprológico" value="Sí" />}
              {dx.examenes_laboratorio?.raspado_piel && <Campo label="Raspado de piel" value="Sí" />}
              {dx.examenes_laboratorio?.citologia && <Campo label="Citología" value="Sí" />}
              {dx.examenes_laboratorio?.otro && <Campo label="Otro" value={dx.examenes_laboratorio.especifique_otro} />}
            </div>
          </div>
          <div className="mt-1">
            <span className="font-semibold text-sm">Manejo:</span>
            <div className="pl-4 space-y-1 mt-1">
              {dx.manejo?.hospitalizacion && <Campo label="Hospitalización" value="Sí" />}
              {dx.manejo?.medicamentos && <Campo label="Medicamentos" value={dx.manejo.especifique_medicamentos} />}
              {dx.manejo?.cirugia && <Campo label="Cirugía" value="Sí" />}
              {dx.manejo?.control && <Campo label="Control" value="Sí" />}
              {dx.manejo?.otro && <Campo label="Otro" value={dx.manejo.especifique_otro} />}
            </div>
          </div>
        </Seccion>
      )}

      {ind && (
        <Seccion titulo="Indicaciones">
          <Campo label="Indicaciones" value={ind.indicaciones} />
          <Campo label="Próxima cita" value={ind.proxima_cita} />
          <Campo label="Notas" value={ind.notas} />
        </Seccion>
      )}
    </div>
  )
}
