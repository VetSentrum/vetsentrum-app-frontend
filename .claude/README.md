# VetSentrum — Guía Técnica del Proyecto

> Actualizar este archivo al finalizar cada sesión de trabajo.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, React Hook Form, Shadcn/ui, Tailwind CSS, Axios |
| Backend | NestJS, Prisma ORM, PostgreSQL |
| Integraciones | Google Calendar (ServiceAccount), Google Drive (ServiceAccount) |
| Auth | JWT (cookies httpOnly) |

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
      empresa/        # Admin de datos de la clínica
      mascotas/
      usuarios/
    (print)/          # Rutas de impresión/PDF (layout mínimo, sin sidebar)
      consultas/[id]/
      recetas/[id]/
  components/
    EditarConsultaForm.tsx   # Formulario principal de consultas (tabs)
    EditarRecetaForm.tsx     # Editor de recetas con drag-drop (@dnd-kit)
    EditarMascotaForm.tsx
    EditarClienteForm.tsx
    EditarCitaForm.tsx
    EditarUsuarioForm.tsx
    ui/               # Componentes Shadcn/ui
```

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

### Uso en PDFs
Los componentes de impresión (`/consultas/[id]` y `/recetas/[id]`) hacen `GET /empresa` al cargar y muestran el encabezado con logo, nombre, cédula, etc.

---

## Integración Google

### Credenciales (backend)
- Service Account: `calendar-service@vetsentrum-sandbox.iam.gserviceaccount.com`
- Variables en `.env`: `GOOGLE_CREDENTIALS`, `GOOGLE_CALENDAR_ID`, `GOOGLE_DRIVE_FOLDER_ID`
- `src/common/google-calendar.service.ts` — Calendar
- `src/common/google-drive.service.ts` — Drive

### Pasos manuales necesarios para Drive (pendiente usuario)
1. En Google Cloud Console → proyecto `vetsentrum-sandbox` → habilitar **Google Drive API**
2. Crear carpeta en Drive → compartir con `calendar-service@vetsentrum-sandbox.iam.gserviceaccount.com` (Editor)
3. Agregar `GOOGLE_DRIVE_FOLDER_ID=<id>` al `.env` del backend

### Generación de PDF (frontend)
- Librería: `html2pdf.js` (instalada)
- Flujo: botón "Guardar PDF en Drive" → html2pdf genera blob → POST `/consultas/:id/upload-pdf` o `/recetas/:id/upload-pdf` → backend sube a Drive → devuelve `drive_file_id`

---

## Acción requerida tras esta sesión

```bash
# Con el backend DETENIDO:
cd vetsentrum-app-backend
npx prisma generate
# Luego reiniciar el backend
```

---

## Correcciones aplicadas (historial)

### Marzo 2026
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
