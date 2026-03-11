import axios from 'axios'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

// ── Tipos (alineados con backend src/whatsapp/whatsapp.templates.ts) ────────

export type WhatsAppTrigger =
  | 'cita_recordatorio'
  | 'cita_confirmada'
  | 'cita_cancelada'
  | 'cita_reprogramada'
  | 'consulta_finalizada'
  | 'receta_lista'
  | 'seguimiento'
  | 'manual'

export interface WhatsAppMessage {
  telefono: string
  trigger: WhatsAppTrigger
  datos: Record<string, string>
}

export interface WhatsAppLog {
  id: string
  telefono: string
  trigger: string
  mensaje: string
  direction: 'inbound' | 'outbound'
  estado: 'enviado' | 'fallido' | 'recibido' | 'pendiente'
  error?: string | null
  created_at: string
}

// ── API helpers ──────────────────────────────────────────────────────────────

export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{ ok: boolean }> {
  const { data } = await axios.post<{ ok: boolean }>(`${API}/whatsapp/send`, message, {
    withCredentials: true,
  })
  return data
}

export async function getWhatsAppLogs(params?: {
  trigger?: WhatsAppTrigger
  limit?: number
}): Promise<WhatsAppLog[]> {
  const { data } = await axios.get<WhatsAppLog[]>(`${API}/whatsapp/logs`, {
    withCredentials: true,
    params,
  })
  return data
}

export async function releaseWhatsAppSession(telefono: string): Promise<{ ok: boolean }> {
  const { data } = await axios.post<{ ok: boolean }>(
    `${API}/whatsapp/release-session`,
    { telefono },
    { withCredentials: true },
  )
  return data
}
