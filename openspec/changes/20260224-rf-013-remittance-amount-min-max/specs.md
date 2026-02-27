## Specifications Context

- `Remittance.amount` ya existe en Prisma y su tipo es `Decimal`.
- `Transfer` no tiene campo `amount`.
- `schema.gql` actual no expone mutation/query para setear monto en remittance/transfer.

## New Specifications

### Set remittance amount with min/max validation

**Descripción**

El sistema debe permitir setear/actualizar el monto de una remesa existente, validando límites mínimo/máximo configurables.

---

**GraphQL Contract**

- Input nuevo:
  - `SetRemittanceAmountInput`
    - `remittanceId: ID!`
    - `amount: String!`
- Mutation nueva:
  - `setRemittanceAmount(input: SetRemittanceAmountInput!): Boolean!`

La mutación debe estar protegida por `GqlAuthGuard` y operar solo sobre remesas del usuario autenticado (`senderUserId`).

---

**Configuration Contract**

Variables de entorno opcionales:

- `REMITTANCE_AMOUNT_MIN`
- `REMITTANCE_AMOUNT_MAX`

Con defaults explícitos si no están definidas.

---

**Business Validations**

- remesa debe existir y pertenecer al usuario autenticado.
- `amount` debe ser numérico válido y mayor que cero.
- `amount >= MIN`.
- `amount <= MAX`.
- errores de validación deben seguir patrón de excepciones de dominio vigente.
- si remesa no existe/no pertenece, retornar `NotFound` según patrón vigente.

---

**Persistence Rule**

- Solo se actualiza `Remittance.amount`.
- No se alteran otros campos de remesa.

## Examples

### válido (en min)

```graphql
mutation {
  setRemittanceAmount(
    input: {
      remittanceId: "f6a0f4e0-2f9e-4a37-a4f8-c7efab6f0e21"
      amount: "10.00"
    }
  )
}
```

```graphql
{
  "data": {
    "setRemittanceAmount": true
  }
}
```

### inválido (< min)

```graphql
mutation {
  setRemittanceAmount(
    input: {
      remittanceId: "f6a0f4e0-2f9e-4a37-a4f8-c7efab6f0e21"
      amount: "0.50"
    }
  )
}
```

Resultado esperado: error de validación por monto menor al mínimo.

### inválido (> max)

```graphql
mutation {
  setRemittanceAmount(
    input: {
      remittanceId: "f6a0f4e0-2f9e-4a37-a4f8-c7efab6f0e21"
      amount: "1000000.00"
    }
  )
}
```

Resultado esperado: error de validación por monto mayor al máximo.

## Impact on Existing Behavior

- No modifica operaciones existentes de auth/users/identity/beneficiaries.
- No altera contrato de RF-012.
- Cambio acotado y contract-safe sobre remittance amount.
