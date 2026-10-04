# citas-web

Cliente React + TypeScript del portal de citas, importado del prototipo aprobado y conectado directamente a `citas-api`.

## Desarrollo local

1. Copia `.env.example` a `.env.local` si la API no está en `http://localhost:8080`.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev` y abre `http://localhost:5173`.

El access JWT vive solo en memoria. El refresh JWT se recibe como cookie `HttpOnly` y se rota al restaurar la sesión. Las peticiones de login, refresh y logout incluyen credenciales y `X-Requested-With: XMLHttpRequest` conforme al contrato de seguridad.

## Funcionalidades Implementadas

- **Autenticación y Registro:** Registro público de pacientes (`/register`), inicio de sesión con JWT y selector de roles dinámico según permisos (`USER`, `PROFESSIONAL`, `ADMIN`).
- **Recuperación de Contraseña y Perfil:** Solicitud y validación de código de restablecimiento (`RF-03`) y edición de datos de contacto (`RF-04`).
- **Portal Paciente:** Agendamiento asistido por especialidad/sede/médico con bloqueo de slots, visualización y filtrado de citas activas e históricas, reprogramación inmediata y cancelación voluntaria.
- **Portal Médico:** Agenda del día y por fecha/sede, egreso clínico (cumplida con notas o inasistencia justificada), y gestión de bloques de disponibilidad horaria (`RF-08`).
- **Portal Administrador:** Bandeja de autorizaciones/rechazos de citas especializadas (`RF-12`) y gestión de profesionales de la salud.
- **Generación de Comprobantes PDF:** Emisión y descarga directa en el navegador de Comprobantes de Cita y Constancias de Asistencia Médica mediante `pdf-lib` con logotipo institucional integrado, sin popups ni pestañas intermedias.

## Integración con n8n

El frontend no almacena ni requiere credenciales de n8n ni de Google. Todas las notificaciones por correo (confirmación, rechazo, reprogramación, cancelación) y recordatorios automáticos se desencadenan a través de eventos en el backend (`citas-api`) de forma desacoplada y transparente para el usuario web.

## Verificación

```bash
npm run lint
npm test -- --run
npm run build
```

