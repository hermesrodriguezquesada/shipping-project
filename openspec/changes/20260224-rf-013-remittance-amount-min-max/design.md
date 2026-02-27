## Overview

El contrato actual no expone operaciones de monto para remittance/transfer.
El cambio mínimo para RF-013 es introducir una única mutación de actualización de monto sobre remesa existente, reutilizando el módulo/patrón implementado en RF-012.

## Repository Findings

- `src/schema.gql`:
  - no existe mutation/query para monto de remittance o transfer;
  - existe `setRemittanceOriginAccount` como patrón reciente en remittances.
- `prisma/schema.prisma`:
  - `Remittance.amount` existe y es `Decimal`;
  - `Transfer` no tiene `amount`.
- RF-012 ya define módulo `RemittancesModule`, resolver protegido con `GqlAuthGuard`, use-case, ports y adapters con validación de ownership (`senderUserId`).
- No existe scalar `Decimal` en GraphQL generado actual.

## Design Decision

### Target entity

Aplicar RF-013 en `Remittance` porque:

- allí vive el monto (`amount Decimal`);
- ya hay patrón de ownership y wiring mínimo disponible;
- evita introducir cambios innecesarios en `Transfer`.

### GraphQL contract

Agregar:

- `input SetRemittanceAmountInput { remittanceId: ID!, amount: String! }`
- `mutation setRemittanceAmount(input: SetRemittanceAmountInput!): Boolean!`

`amount` se modela como `String!` por ausencia de scalar Decimal en contrato actual.

### Validation strategy

En use-case (validación explícita):

1. verificar ownership por `senderUserId`;
2. parsear `amount` a Decimal;
3. validar:
   - `amount > 0`
   - `amount >= min`
   - `amount <= max`
4. lanzar excepción de dominio consistente (`ValidationDomainException` / `NotFoundDomainException`).

### Min/Max configuration

Agregar env vars opcionales en validación de entorno:

- `REMITTANCE_AMOUNT_MIN`
- `REMITTANCE_AMOUNT_MAX`

Defaults explícitos en `AppConfigService` para evitar comportamiento implícito sin límites.

## Persistence semantics

- Actualizar únicamente `amount` en remittance objetivo.
- Mantener patrón de patch explícito (sin persistir `undefined`).
- No modificar otros campos de remesa.

## Example GraphQL

### válido (en el mínimo)

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
