## Overview

El repositorio actual contiene modelos `Remittance` y `Transfer` en Prisma, pero no expone mutaciones GraphQL para crear/actualizar estas entidades.
Para cumplir RF-012 con impacto mínimo, se agrega una única mutación orientada a remittance para seleccionar tipo de cuenta origen y sus datos asociados.

## Repository Findings (base real)

- `src/schema.gql` actual: no existen operaciones `createRemittance`, `updateRemittance`, `createTransfer` ni `payment*`.
- `src/prisma/schema.prisma`: sí existen modelos `Remittance` y `Transfer`.
- No se encontró un modelo de `PaymentMethod` reutilizable en módulos activos.
- Patrón de validación vigente:
  - validaciones de dominio en use-cases;
  - excepción de validación (`ValidationDomainException`) para input inválido;
  - no persistir `undefined` en adapters Prisma.

## Decision

### Estrategias evaluadas

- **A) Extender modelo existente (`Remittance`)** con enum + campos específicos → **Elegida**.
- **B) Nuevo modelo `OriginAccount` 1:1** → descartada por mayor complejidad y más cambios de wiring.
- **C) Reusar payment method existente** → no aplicable (no existe modelo/capa activa identificada).

### Justificación

A requiere menos cambios y mantiene contract-safety:

- reutiliza entidad persistente ya existente;
- evita crear agregados o módulos nuevos innecesarios;
- acota impacto a una mutación mínima y validaciones por tipo.

## Data Model Changes (Prisma)

Agregar enum nuevo:

- `OriginAccountType` con valores: `ZELLE`, `IBAN`, `STRIPE`.

Extender `Remittance` con campos opcionales:

- `originAccountType OriginAccountType?`
- `originZelleEmail String?`
- `originIban String?`
- `originStripePaymentMethodId String?`

Nota: opcionales para compatibilidad con registros existentes.

## GraphQL Contract Changes (Code-First)

Como no existe una operación principal de remesa expuesta, se crea **una sola mutación mínima**:

- `setRemittanceOriginAccount(input: SetRemittanceOriginAccountInput!): Boolean!`

Input nuevo:

- `remittanceId: ID!`
- `originAccountType: OriginAccountType!`
- `zelleEmail: String`
- `iban: String`
- `stripePaymentMethodId: String`

Enum GraphQL nuevo:

- `OriginAccountType { ZELLE IBAN STRIPE }`

## Validation Rules (mínimas)

- Si `originAccountType = ZELLE`:
  - requerido: `zelleEmail`.
  - prohibido: `iban`, `stripePaymentMethodId`.
- Si `originAccountType = IBAN`:
  - requerido: `iban`.
  - prohibido: `zelleEmail`, `stripePaymentMethodId`.
- Si `originAccountType = STRIPE`:
  - requerido: `stripePaymentMethodId`.
  - prohibido: `zelleEmail`, `iban`.

Política para mezcla de campos: **error de validación** (no ignorar silenciosamente), por consistencia con patrones actuales de validación explícita.

## Persistence Semantics

- `undefined` no debe persistirse (patrón vigente en adapters Prisma).
- Al setear un tipo válido, se persiste campo requerido y se limpian campos de otros tipos (null) para sostener invariantes de una sola fuente activa.

## Example GraphQL (propuesto)

### Request

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

### Response

```graphql
{
  "data": {
    "setRemittanceOriginAccount": true
  }
}
```

## Compatibility and Risk Control

- No altera operaciones GraphQL existentes.
- No cambia autenticación/autorización fuera del alcance del módulo que exponga la mutación.
- Mantiene estrategia de cambios mínimos y sin refactor.
