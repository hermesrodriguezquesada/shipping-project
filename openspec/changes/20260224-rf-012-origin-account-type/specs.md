## Specifications Context

- Fuente de verdad actual: `src/schema.gql` (no hay mutaciones de remittance/transfer/payment).
- Estado de datos actual: `prisma/schema.prisma` sí contiene `Remittance` y `Transfer`.
- RF-012 requiere seleccionar tipo de cuenta origen con soporte: `ZELLE`, `IBAN`, `STRIPE`.

## New Specifications

### Origin Account Type Selection for Remittance

**Descripción**

El sistema debe permitir registrar/actualizar el tipo de cuenta origen asociado a una remesa existente, incluyendo datos mínimos por tipo.

---

**Prisma Contract (nuevo/extendido)**

- Nuevo enum: `OriginAccountType`
  - `ZELLE`
  - `IBAN`
  - `STRIPE`
- Extensión de `Remittance`:
  - `originAccountType OriginAccountType?`
  - `originZelleEmail String?`
  - `originIban String?`
  - `originStripePaymentMethodId String?`

---

**GraphQL Contract (nuevo)**

- Enum GraphQL:
  - `OriginAccountType { ZELLE IBAN STRIPE }`
- Input GraphQL:
  - `SetRemittanceOriginAccountInput`
    - `remittanceId: ID!`
    - `originAccountType: OriginAccountType!`
    - `zelleEmail: String`
    - `iban: String`
    - `stripePaymentMethodId: String`
- Mutation GraphQL:
  - `setRemittanceOriginAccount(input: SetRemittanceOriginAccountInput!): Boolean!`

---

**Validaciones de negocio mínimas**

- `originAccountType = ZELLE`
  - requiere `zelleEmail`.
  - rechaza `iban` y `stripePaymentMethodId`.
- `originAccountType = IBAN`
  - requiere `iban`.
  - rechaza `zelleEmail` y `stripePaymentMethodId`.
- `originAccountType = STRIPE`
  - requiere `stripePaymentMethodId`.
  - rechaza `zelleEmail` y `iban`.
- Si llegan campos de otros tipos, el sistema debe retornar error de validación (no ignorar silenciosamente).

---

**Semántica de persistencia**

- `undefined` no se persiste.
- Al actualizar tipo de origen, campos ajenos al tipo seleccionado se limpian (`null`) para conservar invariante de un único tipo activo.

## Examples

### Ejemplo válido (IBAN)

```graphql
mutation {
  setRemittanceOriginAccount(
    input: {
      remittanceId: "f6a0f4e0-2f9e-4a37-a4f8-c7efab6f0e21"
      originAccountType: IBAN
      iban: "DE89370400440532013000"
    }
  )
}
```

```graphql
{
  "data": {
    "setRemittanceOriginAccount": true
  }
}
```

### Ejemplo inválido (mezcla de tipos)

```graphql
mutation {
  setRemittanceOriginAccount(
    input: {
      remittanceId: "f6a0f4e0-2f9e-4a37-a4f8-c7efab6f0e21"
      originAccountType: STRIPE
      stripePaymentMethodId: "pm_123"
      iban: "DE89370400440532013000"
    }
  )
}
```

Resultado esperado: error de validación por mezcla de campos incompatibles con `STRIPE`.

## Impact on Existing Behavior

- No modifica operaciones GraphQL existentes.
- No altera auth/roles/sesiones.
- No introduce refactors.
- Cambios acotados al contrato y persistencia para RF-012.
