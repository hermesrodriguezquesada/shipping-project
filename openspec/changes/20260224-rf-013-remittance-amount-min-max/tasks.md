## Tasks

### 1) Add env vars for min/max amount

- Extender `env.validation.ts` con:
  - `REMITTANCE_AMOUNT_MIN` (opcional numérica)
  - `REMITTANCE_AMOUNT_MAX` (opcional numérica)
- Exponer getters en `AppConfigService` con defaults explícitos.

Definition of Done:

- validación de entorno compila.
- defaults documentados en código.

---

### 2) Extend remittances GraphQL contract

- Crear `SetRemittanceAmountInput`:
  - `remittanceId: ID!`
  - `amount: String!`
- Exponer mutación:
  - `setRemittanceAmount(input: SetRemittanceAmountInput!): Boolean!`
- Proteger con `GqlAuthGuard`.

Definition of Done:

- `npm run build` exitoso.
- `PORT=3001 npm run start:dev` exitoso.
- `src/schema.gql` contiene input y mutation nuevos.

---

### 3) Implement use-case validation

- Reusar patrón RF-012 (ownership por `senderUserId`).
- Validar parseo y reglas de monto:
  - `> 0`
  - `>= MIN`
  - `<= MAX`
- Lanzar excepciones de dominio consistentes.

Definition of Done:

- errores correctos para:
  - remittance inexistente/no propia
  - monto inválido
  - fuera de rango

---

### 4) Persist amount update

- Extender command port + Prisma adapter de remittances para actualizar solo `amount`.
- Mantener actualización parcial explícita sin efectos colaterales.

Definition of Done:

- persistencia de `amount` funcional.
- sin cambios en otros campos.

---

### 5) Final verification checklist

- `npm run build`
- `PORT=3001 npm run start:dev`
- verificar en `src/schema.gql`:
  - `input SetRemittanceAmountInput`
  - `setRemittanceAmount(input: SetRemittanceAmountInput!): Boolean!`

Definition of Done:

- checklist completo.
- cambio mínimo y contract-safe.
