## Tasks

### 1) Prisma minimal extension for wizard

- Agregar enums en Prisma:
  - `ReceptionMethod`
  - `OriginAccountHolderType`
- Agregar campos opcionales en `Remittance`:
  - `receptionMethod`
  - `destinationCupCardNumber`
  - `originAccountHolderType`
  - `originAccountHolderFirstName`
  - `originAccountHolderLastName`
  - `originAccountHolderCompanyName`
- Generar migración Prisma correspondiente.

Definition of Done:

- `prisma migrate`/migración creada sin alterar nullability de `amount`/`beneficiaryId`.
- No se modifica default Prisma de `Remittance.status`.

---

### 2) GraphQL contract for wizard mutations

- Registrar enums GraphQL code-first:
  - `ReceptionMethod`
  - `OriginAccountHolderType`
- Crear inputs:
  - `SetRemittanceReceptionMethodInput`
  - `SetRemittanceDestinationCupCardInput`
  - `SetRemittanceOriginAccountHolderInput`
- Exponer mutations:
  - `createRemittanceDraft(beneficiaryId: ID!): ID!`
  - `setRemittanceReceptionMethod(input: ...): Boolean!`
  - `setRemittanceDestinationCupCard(input: ...): Boolean!`
  - `setRemittanceOriginAccountHolder(input: ...): Boolean!`
  - `submitRemittance(remittanceId: ID!): Boolean!`
- Proteger todo con `GqlAuthGuard`.

Definition of Done:

- build exitoso.
- contrato visible en `src/schema.gql`.

---

### 3) Application use-cases (RF-014..RF-017)

- `createRemittanceDraft`:
  - valida ownership del beneficiario.
  - crea remesa con `status=DRAFT` explícito.
  - setea `amount` inicial en mínimo permitido del sistema.
- `setRemittanceReceptionMethod` (RF-014).
- `setRemittanceDestinationCupCard` (RF-015).
- `setRemittanceOriginAccountHolder` (RF-016).
- `submitRemittance` (RF-017) con validación integral y transición a `SUBMITTED`.

Definition of Done:

- cada mutation retorna `Boolean!` o `ID!` según contrato.
- ownership y estado `DRAFT` validados consistentemente.
- errores de dominio coherentes con patrón actual.

---

### 4) Persistence adapters and ports

- Extender `RemittanceQueryPort` para obtener datos de validación de submit.
- Extender `RemittanceCommandPort` para:
  - crear draft,
  - setear método/tarjeta/titular,
  - submit + creación de transfer pendiente (idempotente).
- Implementar cambios mínimos en adapters Prisma.

Definition of Done:

- escritura acotada a campos del wizard.
- `Transfer` se crea en `PENDING` solo si no existe.

---

### 5) Final validation checklist

- `npx prisma migrate dev`
- `npm run build`
- `PORT=3001 npm run start:dev`
- verificar `src/schema.gql` contiene:
  - enums `ReceptionMethod` y `OriginAccountHolderType`
  - inputs nuevos del wizard
  - mutations nuevas del wizard
- smoke GraphQL (manual):
  1. `createRemittanceDraft`
  2. `setRemittanceAmount` (existente RF-013)
  3. `setRemittanceOriginAccount` (existente RF-012)
  4. `setRemittanceReceptionMethod`
  5. `setRemittanceOriginAccountHolder`
  6. `setRemittanceDestinationCupCard` (si aplica)
  7. `submitRemittance`

Definition of Done:

- wizard completo funcional sin refactors y sin romper contratos existentes.