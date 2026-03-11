import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ESPECIES_ICONOS: Record<string, string> = {
  Canino: '🐕',
  Felino: '🐈',
  Ave: '🦜',
  Conejo: '🐇',
}

/**
 * Calcula la edad actual a partir de la edad en meses al momento del registro
 * y la fecha de registro de la mascota.
 * @param short — formato abreviado "3a 5m" (para tablas) vs "3 años 5 meses"
 */
export function calcularEdad(meses: number, fechaCreacion: string, short = false): string {
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

  if (short) {
    if (años === 0) return m <= 1 ? `${m} mes` : `${m} meses`
    if (m === 0) return años === 1 ? '1 año' : `${años} años`
    return `${años}a ${m}m`
  }

  if (años === 0) return m <= 1 ? `${m} mes` : `${m} meses`
  if (m === 0) return años === 1 ? '1 año' : `${años} años`
  return `${años} año${años !== 1 ? 's' : ''} ${m} mes${m !== 1 ? 'es' : ''}`
}
