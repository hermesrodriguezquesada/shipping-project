## Why

La UI del wizard necesita leer el estado actual de una remesa después de cada paso para mostrar progreso, valores persistidos y resultado del submit.
Hoy el contrato GraphQL solo expone mutations de escritura para remittances, sin queries de lectura.

## Scope

Cambio mínimo y contract-safe para exponer lectura de remesas propias:

- agregar read model GraphQL `RemittanceType`.
- agregar `TransferType` para estado de transferencia asociada.
- agregar queries:
  - `myRemittance(id: ID!): RemittanceType`
  - `myRemittances(limit: Int, offset: Int): [RemittanceType!]!`
- mantener intactas las firmas de mutations existentes.

## Rules

- Queries protegidas con `GqlAuthGuard`.
- Ownership obligatorio por `senderUserId`.
- Sin refactors ni cambios de arquitectura.

## Out of Scope

- No nuevas mutations.
- No cambios de nullability/defaults en Prisma.
- No filtros avanzados, ordenamiento complejo ni paginación cursor.
- No cambios de firma en mutations RF-012..RF-017.