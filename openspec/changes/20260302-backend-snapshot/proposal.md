# Proposal: backend snapshot

## Objetivo

Crear un snapshot técnico verificable del estado actual del backend (contrato GraphQL, flujos activos, modelo de datos y wiring hexagonal) como baseline previo a nuevas features.

Este snapshot debe servir como **única fuente de verdad documental** para:
- guiar a Copilot sin que “se riegue”,
- alinear backend/frontend/QA sobre el contrato vigente,
- exponer gaps/riesgos con evidencia.

## Alcance

Incluye (evidencia + documentación):

1) **Contrato GraphQL** (desde `src/schema.gql`):
   - `type Query`
   - `type Mutation`
   - `enum RemittanceStatus`
   - `type RemittanceType`
   - operaciones públicas vs protegidas

2) **Flujos activos**:
   - Auth: register/login/refresh/logout/sesiones
   - Remittances: creación wizardless + lifecycle
   - Pricing: preview read-only
   - Exchange rates: público + admin
   - Commission rules: admin
   - Delivery fees: admin
   - Catalogs: lecturas + admin toggles

3) **Modelo Prisma** (desde `src/prisma/schema.prisma`):
   - modelos activos y relaciones clave
   - campos clave de Remittance (montos/fees/snapshots)

4) **Mapa hexagonal** (resolver → use-case → port → adapter → Prisma)

5) **QA Smoke GraphQL**: operaciones copy/paste con placeholders.

## No alcance (explícito)

- No modifica código de runtime.
- No refactoriza ni elimina módulos.
- No cambia comportamiento ni contrato.
- No “arregla” gaps: solo los documenta.

## Resultado esperado

Un baseline técnico auditable y trazable a código fuente actual, almacenado en OpenSpec,
con QA Smoke utilizable por frontend/QA, y sin suposiciones no verificadas.