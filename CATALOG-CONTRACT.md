# Contrato de catálogos fijos (HU-003 / HU-004)

El frontend consume estos recursos directamente desde `citas-api`. La URL base se configura mediante `VITE_API_BASE_URL`; no se agrega un BFF ni un servicio intermedio.

Todos los recursos requieren un access JWT válido y devuelven JSON (HTTP 200):

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/api/v1/catalogs/roles` | `{ id, code, name, description }[]` |
| GET | `/api/v1/catalogs/appointment-statuses` | `{ id, code, name, terminal }[]` |
| GET | `/api/v1/catalogs/reschedule-statuses` | `{ id, code, name, terminal }[]` |
| GET | `/api/v1/catalogs/insurance-regimes` | `{ id, code, name }[]` |
| GET | `/api/v1/catalogs/locations` | `{ id, code, name, address, city, department, active }[]` |

No hay operaciones de escritura para estos catálogos. Un intento de `POST`, `PUT`, `PATCH` o `DELETE` no forma parte del contrato y debe tratarse como operación no soportada.

La integración visual queda pendiente de las HU de agenda que consuman cada catálogo; mientras tanto las pantallas del prototipo mantienen sus datos sintéticos aprobados.
