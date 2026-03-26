# Proposal: remittance-destination-field-rename

## Status: ✅ IMPLEMENTED & CLOSED

**Completion timestamp**: 25/03/2026  
**Status**: Change implemented, tested, validated and ready for merge.

---

## Problem statement

Existe una inconsistencia de naming en remesas:

- Persistencia, input GraphQL y capas internas usan `destinationCupCardNumber`.
- El output GraphQL ya expone `destinationAccountNumber` en `RemittanceType`.

Esta divergencia genera fricción de contrato con frontend, confusión en backend y riesgo de errores de mapeo.

## Goal

Unificar el naming del campo de destino de cuenta de remesas con un nombre canónico único:

- `destinationAccountNumber`

## Explicit decisions

1. Naming final
- El nombre canónico final es `destinationAccountNumber`.
- `destinationCupCardNumber` deja de ser nombre activo del dominio.

2. Persistencia
- Se realizará migración real de columna a `destinationAccountNumber`.
- Estado final esperado:
  - Prisma model usa `destinationAccountNumber`.
  - La tabla en BD usa `destinationAccountNumber`.
  - No queda naming legacy en columna final.

3. GraphQL input contract
- Se adopta Opción A (breaking clean rename).
- `SubmitRemittanceV2Input` reemplaza `destinationCupCardNumber` por `destinationAccountNumber`.
- No se incorpora compatibilidad temporal dual en este change.

4. GraphQL output contract
- `RemittanceType.destinationAccountNumber` se mantiene estable.
- No se reintroduce naming legacy en output.

## Breaking contract note

Este change rompe compatibilidad para clientes que aún envían `destinationCupCardNumber` en `SubmitRemittanceV2Input`.

Después del change:
- `destinationAccountNumber` será el único nombre válido en input.
- `destinationCupCardNumber` dejará de existir en el contrato GraphQL.
- Los clientes deberán actualizar sus mutaciones de submit antes de consumir la nueva versión.

## Expected outcome

- Input, dominio, puertos, adapters, read models, mapeos y persistencia convergen al mismo nombre.
- Las validaciones vigentes para métodos `TRANSFER` continúan funcionando sin cambio de comportamiento.
- Build, code-first GraphQL y runtime quedan consistentes con el rename.

## Outcome achieved ✅

- ✅ Toda la cadena (input → dominio → persistencia) usa `destinationAccountNumber`.
- ✅ El nombre legacy `destinationCupCardNumber` fue eliminado por completo (no persiste en código activo ni en persistencia).
- ✅ La migración real de columna fue aplicada a PostgreSQL; datos históricos preservados mediante `ALTER TABLE RENAME COLUMN`.
- ✅ Las validaciones de `TRANSFER` se mantienen operativas con el nuevo nombre de campo.
- ✅ Build `npm run build` pasó sin errores.
- ✅ Tests unitarios pasaron (9/9).
- ✅ GraphQL schema regenerado; `SubmitRemittanceV2Input.destinationAccountNumber` confirmado; campo legacy ausente del contrato.
- ✅ Remesa creada y consultada exitosamente usando el nombre canónico.
- ✅ Rechazo de input legacy confirmado (error de campo no definido).

## In scope

- Prisma schema
- Migración de columna en base de datos
- `SubmitRemittanceV2Input`
- Use case de submit remittance
- Puertos, adapters, read models y mapeos relacionados
- Revisión de `schema.gql`
- Smoke tests de submit y lectura

## Out of scope

- Cambios de lógica de negocio no vinculados al rename
- Nuevas validaciones fuera del rename de campo
- `originAccountType`
- pricing/comisión
- manual beneficiary visibility
- auth/JWT/guards
- Refactors generales no necesarios para la unificación