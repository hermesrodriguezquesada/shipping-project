## Context

El sistema actual tiene un modulo `exchange-rates` acoplado a lectura/escritura persistida con Prisma, por lo que no debe reutilizarse para esta integracion. El nuevo requerimiento es una consulta GraphQL read-only que actue como proxy a un proveedor externo (`elTOQUE`) y devuelva el payload exitoso exactamente como llega.

Restricciones clave del cambio:

- No persistir datos.
- No transformar payload exitoso.
- No modelar payload externo.
- No mezclar con `exchange-rates` existente.
- No introducir cache.
- No refactorizar modulos fuera de alcance.

Proveedor externo:

- Base URL: `https://tasas.eltoque.com`
- Endpoint: `GET /v1/trmi`
- Params opcionales: `date_from`, `date_to`
- Auth: `Authorization: Bearer <token>`

---

## Goals / Non-Goals

**Goals:**

- Crear un modulo independiente `src/modules/eltoque-rates/` con capas: resolver -> use case -> port -> http adapter.
- Exponer query GraphQL:
  - `elToqueRates(dateFrom: String, dateTo: String): String!`
- Aplicar seguridad con `GqlAuthGuard` y `RolesGuard` permitiendo solo `ADMIN` y `EMPLOYEE`.
- Retornar respuesta exitosa raw como `String!` (JSON serializado sin modificacion semantica).
- Mapear argumentos GraphQL a params upstream:
  - `dateFrom -> date_from`
  - `dateTo -> date_to`
- Soportar manejo de errores upstream relevantes: `401`, `422`, `429`, timeout.
- Configurar integracion por variables de entorno, sin hardcodeo de secretos.

**Non-Goals:**

- No usar `exchange-rates` module ni sus puertos/adapters.
- No usar Prisma ni cualquier forma de persistencia.
- No modelar el payload externo en tipos GraphQL.
- No agregar JSON scalar.
- No agregar cache, cron, sync, retries avanzados ni circuit breaker.
- No modificar JWT, `GqlAuthGuard`, `RolesGuard` ni reglas globales de auth.

---

## Decisions

### Decision 1: Modulo separado `eltoque-rates`

- Decision: Implementar un modulo independiente en `src/modules/eltoque-rates/`.
- Rationale: Evita mezclar integracion externa con tasa persistida interna y mantiene responsabilidades separadas.
- Alternatives considered:
  - Reusar `exchange-rates`: rechazado por acoplamiento actual a persistencia y riesgo de mezcla de dominio.
  - Integrar en un modulo compartido generico: rechazado por agregar complejidad innecesaria para alcance minimo.

---

### Decision 2: Flujo hexagonal minimo

- Decision: Resolver GraphQL llama a use case, use case depende de un port, port se implementa con adapter HTTP.
- Rationale: Mantiene arquitectura hexagonal del proyecto con bajo costo de cambio.
- Alternatives considered:
  - Resolver llamando HTTP directo: rechazado por romper separacion de capas.
  - Use case sin port: rechazado por acoplar aplicacion a transporte HTTP.

---

### Decision 3: Contrato GraphQL con retorno `String!`

- Decision: `elToqueRates(...): String!` devolviendo JSON raw serializado.
- Rationale: El requerimiento exige devolver respuesta tal cual llega y no modelar payload externo. `String!` minimiza acoplamiento y evita drift de contrato con el proveedor.
- Alternatives considered:
  - JSON scalar: rechazado por decision explicita del cambio y mayor superficie tecnica.
  - Tipo GraphQL modelado: rechazado por requerimiento de no modelar y alta fragilidad ante cambios upstream.

---

### Decision 4: Seguridad por guards existentes y roles explicitos

- Decision: Aplicar `@UseGuards(GqlAuthGuard, RolesGuard)` y `@Roles(Role.ADMIN, Role.EMPLOYEE)` al query.
- Rationale: Reusa mecanismo existente y bloquea `CLIENT` automaticamente por no intersecar roles permitidos.
- Alternatives considered:
  - Guard custom nuevo: rechazado por no ser necesario.
  - Authorization manual dentro del resolver: rechazado por duplicar logica de seguridad.

---

### Decision 5: Configuracion por env

- Decision: usar `ELTOQUE_API_BASE_URL`, `ELTOQUE_API_TOKEN`, `ELTOQUE_TIMEOUT_MS` desde config central.
- Rationale: evita hardcodeo de secretos y alinea la integracion con el patron de configuracion del proyecto.
- Alternatives considered:
  - Valores fijos en codigo: rechazado por seguridad y mantenibilidad.
  - Usar solo `process.env` directo en adapter: rechazado para mantener consistencia con servicio de config.

---

### Decision 6: Manejo de errores upstream sin transformar payload exitoso

- Decision: contemplar explicitamente `401`, `422`, `429`, timeout y propagar error de forma consistente para GraphQL.
- Rationale: cobertura minima de fallos esperados del proveedor sin agregar complejidad fuera de alcance.
- Alternatives considered:
  - Reintentos/circuit breaker: rechazado por expansion de alcance.
  - Ocultar codigos upstream con un unico error generico: rechazado por menor observabilidad operativa.

---

## Error propagation strategy

Upstream errors (`401`, `422`, `429`, timeout) serán propagados utilizando el patrón actual de excepciones de dominio sin introducir nuevos tipos de error.

El sistema deberá:

- lanzar una excepción de dominio con un mensaje descriptivo
- no transformar payloads exitosos
- no ocultar errores del proveedor
- mantener el comportamiento del filtro global de excepciones sin modificaciones

---

## Risks / Trade-offs

- [Dependencia de servicio externo] -> Mitigacion: timeout configurable y manejo explicito de errores upstream.
- [Rate limit del proveedor] -> Mitigacion: no agregar polling ni llamadas extra; dejar uso controlado por consumidor.
- [Contrato externo sin tipado fuerte en backend] -> Mitigacion: retorno raw en `String!` para evitar incompatibilidades por modelado.
- [Riesgo de exponer secretos] -> Mitigacion: token solo por env/config, no loggear token ni hardcodearlo.
- [Acoplamiento accidental con exchange-rates persistido] -> Mitigacion: modulo y port dedicados, sin usar puertos de exchange-rates.

---

## Migration Plan

1. Agregar modulo `eltoque-rates` y registrarlo en `AppModule`.
2. Agregar variables de entorno y validacion de config.
3. Exponer query en resolver con seguridad por guards y roles.
4. Ejecutar validacion GraphQL obligatoria:
   - `npm run build`
   - `PORT=3001 npm run start:dev`
   - verificar `src/schema.gql`

Rollback:

- Revertir commit del cambio elimina el query y configuracion asociada sin impacto de datos (no hay persistencia).

---

## Open Questions

- Ninguna para este alcance.

---

## Explicit Non-Impact Confirmation

- Sin impacto en Prisma: no modelos, no migraciones, no escrituras.
- Sin impacto en `exchange-rates`: no reutilizacion ni cambios.
- Sin impacto en JWT: sin cambios de payload o estrategia.
- Sin impacto en guards existentes: solo reutilizacion.