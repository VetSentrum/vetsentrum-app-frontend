/**
 * Zona horaria de la clínica. Nuevo León no aplica horario de verano, así que es
 * UTC-6 fijo. Los timestamps que se guardan con `now()` en la BD son UTC reales
 * y deben mostrarse convertidos a esta zona (no con `timeZone: 'UTC'`).
 *
 * Nota: las CITAS se guardan con otra convención (hora de pared guardada como si
 * fuera UTC), por eso ésas se muestran con `timeZone: 'UTC'`.
 */
export const TZ_CLINICA = 'America/Monterrey'

/** Timestamp real (UTC en BD) → "dd/mm/aa, hh:mm a. m." en hora de la clínica. */
export const fechaHoraClinica = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: TZ_CLINICA,
  })

/** Timestamp real (UTC en BD) → "dd/mm/aaaa" en hora de la clínica. */
export const fechaClinica = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: TZ_CLINICA,
  })

/** "YYYY-MM-DD" del día de hoy en hora de la clínica (para filtros/date inputs). */
export const hoyISOClinica = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: TZ_CLINICA })
