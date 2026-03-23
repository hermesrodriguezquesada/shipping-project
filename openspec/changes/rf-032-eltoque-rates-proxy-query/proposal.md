## Why

El backend necesita exponer una consulta de tasas externas para consumo interno de personal autorizado sin reutilizar el modulo persistido de exchange-rates. Este cambio se necesita ahora para habilitar la integracion con elTOQUE como proxy read-only con contrato GraphQL claro y seguro.

## What Changes

- Agregar un nuevo modulo independiente `src/modules/eltoque-rates/` con arquitectura hexagonal minima.
- Exponer un nuevo query GraphQL `elToqueRates(dateFrom: String, dateTo: String): String!`.
- Restringir acceso del query a roles `ADMIN` y `EMPLOYEE` usando `GqlAuthGuard` y `RolesGuard`.
- Consumir `GET /v1/trmi` de `https://tasas.eltoque.com` con auth `Authorization: Bearer <token>`.
- Mapear argumentos GraphQL a query params upstream:
  - `dateFrom -> date_from`
  - `dateTo -> date_to`
- Retornar la respuesta exitosa como string raw (JSON crudo serializado) sin transformacion.
- Manejar errores upstream relevantes (`401`, `422`, `429`, timeout) sin introducir persistencia.
- Agregar configuracion por variables de entorno para URL base, token y timeout.

## Capabilities

### New Capabilities

- `eltoque-rates-proxy-query`: Query GraphQL protegido que actua como proxy read-only hacia elTOQUE y retorna payload raw como `String!`.

### Modified Capabilities

- Ninguna.

## Impact

- Codigo afectado (nuevo): modulo `eltoque-rates` en capa resolver/use case/port/adapter.
- Configuracion: nuevas variables `ELTOQUE_API_BASE_URL`, `ELTOQUE_API_TOKEN`, `ELTOQUE_TIMEOUT_MS`.
- Contrato GraphQL: adicion de query `elToqueRates` en `schema.gql` generado por code-first.
- Seguridad: reuso de guards y roles existentes, sin cambios en JWT ni en implementacion de guards.
- Persistencia: sin cambios en Prisma, sin migraciones, sin escrituras de base de datos.
- Modulos existentes: sin cambios funcionales en `exchange-rates` ni mezcla de responsabilidades.