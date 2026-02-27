## Tasks

### 1) Add GraphQL read types

- Crear `RemittanceType` en `modules/remittances/presentation/graphql/types`.
- Crear `TransferType` en `modules/remittances/presentation/graphql/types`.
- Tipar `amount` como `String` en GraphQL (mapeo desde Decimal).
- Referenciar `BeneficiaryType` existente.

Definition of Done:

- `schema.gql` contiene `type RemittanceType` y `type TransferType` con campos del contrato.

---

### 2) Add read queries in resolver

- Agregar queries:
  - `myRemittance(id: ID!): RemittanceType`
  - `myRemittances(limit: Int, offset: Int): [RemittanceType!]!`
- Mantener `@UseGuards(GqlAuthGuard)` y usar `CurrentUser` para ownership.

Definition of Done:

- Queries visibles en `schema.gql`.
- Sin cambios de firma en mutations existentes.

---

### 3) Implement use-cases (read)

- Crear use-case para detalle propio.
- Crear use-case para listado propio con `limit/offset`.
- Retornar `null` en detalle cuando no existe/no pertenece al usuario.

Definition of Done:

- Ownership aplicado por `senderUserId`.
- Sin refactors ni cambios fuera de scope.

---

### 4) Extend ports/adapters (read path)

- Extender `RemittanceQueryPort` con métodos de detalle/listado.
- Implementar consultas Prisma en adapter con include/select de `beneficiary` y `transfer`.
- Mantener el adapter de escritura sin alteraciones innecesarias.

Definition of Done:

- Datos suficientes para poblar `RemittanceType` y `TransferType`.

---

### 5) Validation checklist

- `npm run build`
- `PORT=3001 npm run start:dev`
- verificar en `src/schema.gql`:
  - `RemittanceType`
  - `TransferType`
  - `myRemittance(id: ID!): RemittanceType`
  - `myRemittances(limit: Int, offset: Int): [RemittanceType!]!`
- smoke queries manuales con auth:
  - detalle propio
  - listado propio
  - detalle de id inexistente/no propio -> `null`

Definition of Done:

- Lectura de remesas disponible para UI con scope mínimo y contract-safe.