# VetSentrum — Guía Técnica del Proyecto

> Actualizar este archivo al finalizar cada sesión de trabajo.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15.5.7 (App Router), React 19, TypeScript, React Hook Form, Zod, Shadcn/ui, Tailwind CSS 4, Axios |
| Backend | NestJS, Prisma ORM, PostgreSQL |
| Integraciones | Google Calendar (ServiceAccount) |
| Auth | JWT (cookies httpOnly), middleware Next.js |

---

## Estructura de carpetas clave (frontend)

```
src/
  app/
    (admin)/          # Rutas del panel de administración (con sidebar/header)
      citas/
      clientes/
      consultas/
      dashboard/
      empresa/        # Admin de datos de la clínica (solo admin)
      expedientes/    # Vista de expedientes clínicos
        [numero]/     # Detalle de expediente por número
      mascotas/
      usuarios/       # Solo admin
      layout.tsx      # Sidebar + header + roles
    (auth)/           # Rutas de autenticación (layout mínimo)
      login/
      definir-contrasena/
    (public)/         # Rutas públicas (sin auth, sin sidebar)
      checkin/        # Check-in de clientes desde celular (QR)
    (print)/          # Rutas de impresión/PDF (layout mínimo, sin sidebar)
      consultas/[id]/
      recetas/[id]/
  components/
    EditarConsultaForm.tsx   # Formulario principal de consultas (tabs) — ~4100 líneas
    EditarRecetaForm.tsx     # Editor de recetas con drag-drop (@dnd-kit)
    EditarMascotaForm.tsx
    EditarClienteForm.tsx
    EditarCitaForm.tsx
    EditarUsuarioForm.tsx
    LogoutButton.tsx
    ui/               # Componentes Shadcn/ui (12: button, checkbox, command, dialog, form, input, label, popover, radio-group, select, tabs, textarea)
  lib/
    utils.ts          # cn(), calcularEdad(), ESPECIES_ICONOS
    whatsapp.ts       # Tipos y API helpers para WhatsApp Business
    validations/
      cliente.ts      # Zod schemas (CreateClienteSchema, UpdateClienteSchema)
  middleware.ts       # Protección de rutas con JWT cookie
```

---

## Roles y visibilidad del sidebar

| Ruta | admin | recepcion | veterinario |
|------|:-----:|:---------:|:-----------:|
| `/dashboard` | ✓ | ✓ | ✓ |
| `/usuarios` | ✓ | | |
| `/empresa` | ✓ | | |
| `/expedientes` | ✓ | ✓ | ✓ |
| `/clientes` | ✓ | ✓ | ✓ |
| `/mascotas` | ✓ | ✓ | ✓ |
| `/citas` | ✓ | ✓ | ✓ |
| `/consultas` | ✓ | | ✓ |

**Nota:** El middleware protege todas las rutas del panel: `/dashboard`, `/usuarios`, `/clientes`, `/mascotas`, `/citas`, `/consultas`, `/expedientes`, `/empresa`.

---

## Convenciones del proyecto

### Selects booleanos (Sí/No)
```tsx
<Select
  onValueChange={(value) => field.onChange(value === 'si')}
  value={field.value === true ? 'si' : field.value === false ? 'no' : ''}
>
  <SelectItem value="si">Sí</SelectItem>
  <SelectItem value="no">No</SelectItem>
</Select>
```
- Usar `value` (controlado), **NUNCA** `defaultValue`
- El mapeo usa `'si'` sin tilde

### Validaciones de campos booleanos
```tsx
// CORRECTO — false es respuesta válida
if (!na && value == null) return "Campo obligatorio"
// INCORRECTO — !false === true dispara error cuando el usuario selecciona "No"
if (!na && !value) return "Campo obligatorio"
```

### Campos dependientes que se deshabilitan (NO ocultan)
```tsx
// Se muestra siempre, solo se deshabilita
disabled={form.watch('campo_padre') !== true || !tabsEnabled}
```
No usar renderizado condicional para campos dependientes excepto para los bloques N/A.

### form.reset() vs defaultValues
- `defaultValues` solo aplica al montar el componente
- Para cargar datos existentes: `form.reset({...datos})` en `useEffect`

### UUID
- Usar `crypto.randomUUID()` nativo — sin paquete externo

### Tipos
- Evitar `any` — usar tipos explícitos o interfaces locales
- Interfaces de datos se definen inline en cada página/componente

---

## Módulo Check-in & Lista de Espera

### Concepto
Dos flujos de ingreso al consultorio:
1. **Con cita** — cliente escanea QR → se identifica → check-in automático → prioridad
2. **Sin cita (walk-in)** — cliente escanea QR → se registra si es nuevo → selecciona mascota → lista de espera

### Página pública `/checkin` (sin auth, mobile-first)
Flujo step-by-step:
1. Ingresa teléfono (10 dígitos)
2. Si registrado: muestra nombre + mascotas + cita del día (si hay)
3. Si no registrado: formulario de registro rápido (nombre + teléfono)
4. Seleccionar mascota existente o registrar nueva (nombre, especie, raza, sexo)
5. Motivo (opcional para walk-in, auto-completado para citas)
6. Confirmación con posición en cola (polling cada 15s)

### Dashboard actualizado (`/dashboard`)
- **Tabla "Citas agendadas hoy"**: hora, paciente, propietario, motivo, estado
- **Tabla "Lista de espera — Con cita"**: pacientes que hicieron check-in de cita
- **Tabla "Lista de espera — Sin cita"**: walk-ins por orden de llegada
- Badges: `NUEVO CLIENTE` / `NUEVA MASCOTA` para entradas que necesitan validación
- Acciones: Validar → Confirmar → Atender → Completar / Eliminar
- Auto-refresh cada 10 segundos

### Backend (`src/lista-espera/`)
**Endpoints públicos:**
- `POST /checkin/buscar` — buscar cliente por teléfono (+ cita del día)
- `POST /checkin/registrar-cliente` — crear cliente nuevo
- `POST /checkin/registrar-mascota` — crear mascota para cliente existente
- `POST /checkin/ingresar` — entrar a lista de espera
- `GET /checkin/posicion/:id` — posición actual en cola
- `GET /checkin/especies` — catálogo de especies

**Endpoints protegidos (JWT):**
- `GET /lista-espera` — entradas activas del día
- `GET /lista-espera/citas-hoy` — citas de hoy
- `PATCH /lista-espera/:id/confirmar` — veterinario confirma datos walk-in
- `PATCH /lista-espera/:id/estado` — cambiar estado

### Prisma model `ListaEspera`
- `tipo`: `cita` | `walk_in`
- `estado`: `esperando` → `en_consulta` → `completado` / `expirado`
- `es_nuevo_cliente` / `es_nueva_mascota`: flags para validación del vet
- `confirmado`: vet validó los datos del walk-in

### Reglas de negocio
- Citas y walk-ins son **dos listas separadas** en el dashboard
- Citas tienen prioridad (se muestran primero)
- Datos de nuevos clientes/mascotas son editables por el veterinario antes de confirmar
- No se elimina nada — se marca como `expirado`
- Cron a medianoche: todo lo no completado → `expirado`
- Check-in de cita → marca la cita como `en_curso` automáticamente

---

## Módulo Expedientes

### Listado (`/expedientes`)
- Tabla con columnas: #EXP, Paciente (icono especie), Especie/Raza, Edad, Propietario, Estado
- Búsqueda con debounce (300ms) por #EXP, nombre, raza o propietario
- Paginación client-side (20/50/100 por página)
- Endpoint: `GET /mascotas` (reutiliza el existente)

### Detalle (`/expedientes/[numero]`)
- Endpoint: `GET /mascotas/expediente/:numero`
- Secciones:
  - **Tarjeta paciente**: nombre, especie, raza, sexo, edad calculada, peso, color, esterilizado, estado activo/inactivo
  - **Tarjeta propietario**: datos del cliente + links a otras mascotas del mismo dueño
  - **Stats**: total consultas, primera visita, última visita, peso actual (con delta)
  - **Historial de peso**: sparkline SVG con mín/máx/promedio
  - **Historial de consultas**: lista expandible con folio, fecha, veterinario, motivo y datos clínicos resumidos (edad, peso, temp, FC, FR, diagnóstico)
  - Links a "Ver consulta" y "Ver receta" (abren en nueva pestaña)

---

## Módulo Consultas — detalles importantes

### Tabs del formulario
`datos-generales` → `estado-general` → `sistemas` → `diagnostico` → `indicaciones`

- Navegación por "Siguiente" por pestaña (validación progresiva)
- `tabActivo` + `tabsDesbloqueadas` controlan la navegación
- Al editar consulta existente o cargar desde cita: todas las pestañas se desbloquean
- Solo la pestaña "Indicaciones" tiene botón "Guardar"

### Sistemas con N/A
Cada sistema tiene `na: boolean`. Si `na = true`, los demás campos no se validan.

### Cálculo de edad
- `edad_aproximada` en Mascota = meses de edad al momento del **registro** de la mascota
- Al crear una consulta: se calcula `edad_aproximada + meses_transcurridos(fecha_creacion, hoy)`
- Al editar: se usa la edad guardada en el JSON (correcta para el momento de la consulta)
- Helper: `calcularEdadActual(edadMeses, fechaCreacion)` → `formatEdad(total)`

### Folio de consulta
- Campo `folio: Int` autoincremental en BD (SERIAL)
- Formato display: `C-{mascota.expediente}-{consulta.folio}`
- Solo se guarda el número en BD; el prefijo se calcula en frontend

---

## Módulo Recetas

### Relación
- Una Consulta puede tener UNA Receta (`@unique consulta_id`)
- Las recetas se crean/editan desde la lista de Consultas (modal)
- Impresión en `/recetas/[id]`

### JSON `indicaciones`
```json
[
  { "id": "uuid", "numero": "1", "tipo": "item", "medicamento": "...", "indicacion": "..." },
  { "id": "uuid", "numero": "1.1", "tipo": "subitem", "parent_id": "uuid", "medicamento": "...", "indicacion": "..." }
]
```
- Máximo 1 nivel de sub-puntos
- Numeración automática con `recalcularNumeros()`
- Drag & Drop con `@dnd-kit/core` + `@dnd-kit/sortable`

### Backend endpoints
- `GET /recetas/consulta/:consultaId`
- `GET /recetas/:id`
- `POST /recetas` — `{ consulta_id, indicaciones }`
- `PATCH /recetas/:id` — `{ indicaciones }`
- `POST /recetas/:id/upload-pdf` — multipart/form-data

---

## Módulo Empresa

### Modelo
- Tabla `Empresa` — un solo registro activo (`activo: true`)
- Admin en `/empresa` (solo visible para admin)
- Endpoint: `GET /empresa` (sin autenticación para PDFs) + `PATCH /empresa` (con JWT)
- Campo `nombre_app` controla el nombre mostrado en el sidebar

### Uso en PDFs
Los componentes de impresión (`/consultas/[id]` y `/recetas/[id]`) hacen `GET /empresa` al cargar y muestran el encabezado con logo, nombre, cédula, etc.

---

## Integración Google Calendar

### Credenciales (backend)
- Service Account: `calendar-service@vetsentrum-sandbox.iam.gserviceaccount.com`
- Variables en `.env`: `GOOGLE_CREDENTIALS`, `GOOGLE_CALENDAR_ID`
- `src/common/google-calendar.service.ts` — Calendar

### Generación de PDF (frontend)
- Librería: `html2pdf.js` (instalada)
- Las páginas de impresión (`/consultas/[id]` y `/recetas/[id]`) renderizan HTML para imprimir/exportar a PDF desde el navegador

---

## Integración WhatsApp Business (WhatsApp Cloud API)

### Arquitectura backend (`src/whatsapp/`)
```
whatsapp.module.ts          # Módulo NestJS (importa ScheduleModule + GoogleCalendar)
whatsapp.controller.ts      # Webhook Meta + endpoints internos (JWT)
whatsapp.service.ts         # Envío de mensajes vía WhatsApp Cloud API + logs
whatsapp.flow.service.ts    # Máquina de estados conversacional + gestión de citas
whatsapp.cron.ts            # Cron cada hora: recordatorios de citas de mañana
whatsapp.templates.ts       # Templates de mensajes por trigger
```

### Webhook Meta
- `GET /whatsapp/webhook` — verificación challenge de Meta
- `POST /whatsapp/webhook` — recibe mensajes entrantes, rutea a flujos

### Endpoints internos (requieren JWT)
- `POST /whatsapp/send` — enviar mensaje `{ telefono, trigger, datos }`
- `GET /whatsapp/logs` — historial de mensajes (filtrable por trigger)
- `POST /whatsapp/release-session` — liberar sesión de handoff humano

### Triggers
| Trigger | Template Meta | Descripción |
|---------|:------------:|-------------|
| `cita_recordatorio` | Sí | Recordatorio 24h antes con opciones (confirmar/reprogramar/cancelar) |
| `cita_confirmada` | No | Confirmación de cita |
| `cita_cancelada` | No | Notificación de cancelación |
| `cita_reprogramada` | No | Confirmación de reprogramación |
| `consulta_finalizada` | No | Resumen post-consulta con diagnóstico |
| `receta_lista` | No | Receta disponible |
| `seguimiento` | No | Seguimiento personalizado |
| `manual` | No | Mensaje libre desde el panel |

### Flujo conversacional (estados de sesión)
```
idle → confirmando_cita → (1: confirmar, 2: reprogramar, 3: cancelar, 4: humano)
                         → reprogramando_cita → (seleccionar slot → re-validar disponibilidad)
                         → esperando_humano (pausa bot, espera release-session)
```

### Cron automático
- **Cada hora**: busca citas pendientes de mañana → envía recordatorio si no se envió en 24h
- **Cada 6 horas**: resetea sesiones inactivas (>24h sin interacción)

### Variables de entorno (backend `.env`)
```
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_VERIFY_TOKEN=""
```

### Prisma models
- `WhatsappSession` — estado conversacional por teléfono (estado, contexto JSON)
- `WhatsappLog` — historial completo inbound/outbound

### Frontend (`src/lib/whatsapp.ts`)
Tipos y helpers: `sendWhatsAppMessage()`, `getWhatsAppLogs()`, `releaseWhatsAppSession()`

### Pasos para activar
1. Crear app en Meta Business → configurar WhatsApp Business API
2. Obtener `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_ACCESS_TOKEN` permanente
3. Registrar template `cita_recordatorio` en Meta (necesario para mensajes fuera de ventana 24h)
4. Configurar webhook URL: `https://<backend>/whatsapp/webhook`
5. Llenar variables en `.env` del backend
6. Ejecutar `npx prisma migrate dev --name whatsapp`

---

## Pendientes conocidos

- **WhatsApp Business**: registrar template `cita_recordatorio` en Meta, configurar webhook URL pública, obtener token permanente
- **Limpiar `mega_file_id`**: campo residual en Consulta y Receta (schema Prisma) — eliminar con próxima migración
- **No hay carpeta `src/types/`**: las interfaces se definen inline en cada componente/página
- **UI WhatsApp admin**: crear pantalla para ver logs y liberar sesiones de handoff

---

## Correcciones aplicadas (historial)

### Marzo 2026
- **Módulo Check-in & Lista de Espera**: página pública `/checkin` (mobile-first, step-by-step), dashboard con tablas de citas y lista de espera, backend con endpoints públicos y protegidos, modelo `ListaEspera` con estados y cron de limpieza a medianoche
- **Módulo WhatsApp Business (backend)**: implementado completo — servicio de envío vía Cloud API, webhook Meta, flujos conversacionales (confirmación/reprogramación/cancelación de citas con re-validación de slots), handoff humano, cron recordatorios, templates, logs inbound/outbound
- **Módulo WhatsApp Business (frontend)**: tipos y helpers API en `lib/whatsapp.ts`
- **Prisma**: modelos `WhatsappSession` y `WhatsappLog` agregados al schema
- **Limpieza MEGA**: eliminados `mega.service.ts`, `mega.module.ts`, desinstalado `megajs`; limpiado `mega_file_id` de interfaces frontend
- **Limpieza Google Drive**: eliminadas variables y referencias a Drive del `.env` y README
- **Middleware fix**: agregados `/expedientes` y `/empresa` a rutas protegidas
- **Extracción `calcularEdad` + `ESPECIES_ICONOS`**: movidos a `lib/utils.ts`, eliminada duplicación en expedientes
- **Módulo Expedientes**: creado — lista con búsqueda/paginación + detalle con stats, sparkline de peso e historial de consultas
- **Sidebar dinámico**: nombre de la app se obtiene de `GET /empresa` (`nombre_app`)
- **Reemplazo de `any`**: tipos explícitos en `evaluacion_clinica` (frontend y backend)
- **Fix PDF oklch**: corrección de colores en generación de PDF
- **Selects booleanos**: 30 `defaultValue` → `value` controlado + mapeo `'Sí'`→`'si'`
- **Validaciones booleanas**: 45 `!value` → `value == null` para boolean
- **`tipo_parasitos`**: faltaba prop `value` en Select → añadido
- **Edad en Consultas**: calcula `edad_aproximada + meses desde fecha_creacion`
- **`cual_parasito`**: campo agregado al sistema tegumentario (activo cuando `tipo_parasitos === 'otro'`)
- **TLLC**: Input → Select ("1 seg", "2 seg", "3 seg", "más de 3 seg")
- **Deshidratación**: Input → Select (0%, 5%, 10%, 15%, Más de 20%)
- **Condición Corporal**: Input → Select (1. Caquexia ... 5. Obeso)
- **Sarro/Gingivitis**: Input → Select (1/4, 2/4, 3/4, 4/4)
- **`aspecto_descarga` (nariz)**: ya no se oculta, solo se deshabilita
- **Tabs con "Siguiente"**: navegación progresiva, cada tab valida antes de avanzar
- **#EXP**: mostrado como etiqueta en formulario de consulta y en página de impresión
- **Fecha en lista de consultas**: eliminada la hora (solo fecha)
- **Módulo Recetas**: creado (backend + frontend + drag-drop)
- **Módulo Empresa**: creado (backend + admin UI)
- **Rediseño impresión consultas**: nuevo formato con encabezado de empresa + PDF → Drive
- **Página impresión recetas**: creada con mismo encabezado de empresa
- **Migración DB**: `folio` (SERIAL) + `drive_file_id` en `Consulta`; tablas `Empresa` y `Receta`
