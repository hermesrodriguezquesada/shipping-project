# Proposal: replace-user-roles-array-with-single-role-field

## Problem statement

El contrato GraphQL actual expone el rol de usuario como lista (`roles`) en tipos de salida de usuario. En la práctica, el sistema garantiza exactamente un rol por usuario, por lo que el frontend consume `roles[0]` de forma sistemática.

Este shape induce ambigüedad semántica (aparenta soporte multi-rol en respuesta) y añade complejidad innecesaria en clientes.

## Proposed change

Reemplazar el campo de salida:

- `roles: [String!]!` (o equivalente actual tipado como enum/lista)

por:

- `role: String!`

El valor retornado será siempre el primer y único rol existente (`roles[0]`).

## Breaking change acknowledgment

Este cambio es **breaking** para consumidores GraphQL existentes:

- Se elimina el campo `roles` de respuestas.
- Se introduce el campo `role` como reemplazo directo.

Clientes que consulten `roles` fallarán hasta actualizar sus queries/fragments.

## Justification

- Refleja fielmente la regla de dominio vigente: un solo rol por usuario.
- Reduce fricción en frontend (sin acceso posicional a array).
- Simplifica contrato sin alterar reglas de negocio ni autorización.

## Risk assessment

### Riesgos principales

- Ruptura de compatibilidad en clientes no migrados.
- Posibles accesos residuales a `roles` en resolvers/mappers/tests.

### Mitigaciones

- Cambiar todas las salidas GraphQL de usuario de forma consistente en una sola entrega.
- Regenerar schema y validar contract diff en `src/schema.gql`.
- Ejecutar smoke tests de `login`, `me`, `adminUsers`.

## Out of scope

- Cambios en modelo Prisma.
- Cambios en guards/autorización.
- Refactors no relacionados.
- Estrategia de deprecación o versionado de schema.
