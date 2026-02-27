## Specifications Context

- `Remittance.amount` y `Remittance.beneficiaryId` son obligatorios (`NOT NULL`) en el modelo actual.
- `Remittance.status` tiene default Prisma `SUBMITTED` y no se modifica.
- El contrato GraphQL actual solo expone:
  - `setRemittanceAmount(input): Boolean!`
  - `setRemittanceOriginAccount(input): Boolean!`
- No existen queries/tipos GraphQL para remittances.

## New Specifications

### RF-014 — Reception method selection (catálogo estático)

El sistema debe permitir setear método de recepción de una remesa `DRAFT` del usuario autenticado.

#### Contract

- Enum `ReceptionMethod`:
  - `USD_CASH`
  - `CUP_CASH`
  - `CUP_TRANSFER`
  - `MLC`
  - `USD_CLASSIC`
- Mutation:
  - `setRemittanceReceptionMethod(input: SetRemittanceReceptionMethodInput!): Boolean!`

#### Rules

- Requiere ownership (`senderUserId`).
- Requiere `status = DRAFT`.
- Si el método no es `CUP_TRANSFER`, `destinationCupCardNumber` debe quedar limpio (`null`).

---

### RF-015 — Card required for CUP transferencia

El sistema debe gestionar tarjeta destino de CUP de forma condicional.

#### Contract

- Mutation:
  - `setRemittanceDestinationCupCard(input: SetRemittanceDestinationCupCardInput!): Boolean!`

#### Rules

- Requiere ownership y `status = DRAFT`.
- Solo permitido cuando `receptionMethod = CUP_TRANSFER`.
- `destinationCupCardNumber` es obligatorio en ese caso.

---

### RF-016 — Origin account holder

El sistema debe permitir setear titular de cuenta origen en remesa `DRAFT`.

#### Contract

- Enum `OriginAccountHolderType`:
  - `PERSON`
  - `COMPANY`
- Mutation:
  - `setRemittanceOriginAccountHolder(input: SetRemittanceOriginAccountHolderInput!): Boolean!`

#### Rules

- Requiere ownership y `status = DRAFT`.
- `PERSON`:
  - `firstName` requerido.
  - `lastName` requerido.
  - `companyName` no permitido.
- `COMPANY`:
  - `companyName` requerido.
  - `firstName`/`lastName` no permitidos.

---

### RF-017 — Submit wizard validation

El sistema debe permitir enviar una remesa draft solo si el wizard está completo y consistente.

#### Contract

- Mutation:
  - `submitRemittance(remittanceId: ID!): Boolean!`

#### Submit validations (must pass all)

- ownership por `senderUserId`.
- `status = DRAFT`.
- monto dentro de min/max (RF-013).
- cuenta origen seteada/consistente (RF-012).
- `receptionMethod` seteado.
- titular seteado y válido (RF-016).
- si `receptionMethod = CUP_TRANSFER`, tarjeta CUP seteada (RF-015).

#### Effects

- `Remittance.status = SUBMITTED`.
- crear `Transfer(status=PENDING)` si no existe.
- retornar `true`.

---

### Wizard initialization (integridad DB)

#### Contract

- Mutation:
  - `createRemittanceDraft(beneficiaryId: ID!): ID!`

#### Rules

- valida ownership de beneficiario.
- crea remesa con:
  - `status = DRAFT` explícito.
  - `amount` inicial válido (mínimo configurado del sistema).
- no modifica nullability ni defaults de Prisma.

## GraphQL Examples

### Válido — iniciar draft

```graphql
mutation {
  createRemittanceDraft(beneficiaryId: "b8d9d8e1-2a0d-4f8f-b2c3-17a6f3a4e101")
}
```

### Válido — setear método CUP_TRANSFER y tarjeta

```graphql
mutation {
  setRemittanceReceptionMethod(
    input: {
      remittanceId: "4d4f8f50-34bf-45a1-9a63-1bd7f9f5ad01"
      receptionMethod: CUP_TRANSFER
    }
  )
}
```

```graphql
mutation {
  setRemittanceDestinationCupCard(
    input: {
      remittanceId: "4d4f8f50-34bf-45a1-9a63-1bd7f9f5ad01"
      destinationCupCardNumber: "9200123412341234"
    }
  )
}
```

### Inválido — tarjeta CUP sin método CUP_TRANSFER

```graphql
mutation {
  setRemittanceDestinationCupCard(
    input: {
      remittanceId: "4d4f8f50-34bf-45a1-9a63-1bd7f9f5ad01"
      destinationCupCardNumber: "9200123412341234"
    }
  )
}
```

Resultado esperado: error de validación (`receptionMethod must be CUP_TRANSFER`).

### Válido — titular PERSON

```graphql
mutation {
  setRemittanceOriginAccountHolder(
    input: {
      remittanceId: "4d4f8f50-34bf-45a1-9a63-1bd7f9f5ad01"
      holderType: PERSON
      firstName: "Juan"
      lastName: "Pérez"
    }
  )
}
```

### Inválido — titular COMPANY sin companyName

```graphql
mutation {
  setRemittanceOriginAccountHolder(
    input: {
      remittanceId: "4d4f8f50-34bf-45a1-9a63-1bd7f9f5ad01"
      holderType: COMPANY
    }
  )
}
```

Resultado esperado: error de validación (`companyName is required for COMPANY`).

### Válido — submit completo

```graphql
mutation {
  submitRemittance(remittanceId: "4d4f8f50-34bf-45a1-9a63-1bd7f9f5ad01")
}
```

```graphql
{
  "data": {
    "submitRemittance": true
  }
}
```

### Inválido — submit incompleto (sin holder)

```graphql
mutation {
  submitRemittance(remittanceId: "4d4f8f50-34bf-45a1-9a63-1bd7f9f5ad01")
}
```

Resultado esperado: error de validación por wizard incompleto.