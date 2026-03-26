# Proposal: canonical-origin-account-model

## Problem statement

El sistema actual de origin account tiene un discriminante flexible pero un payload rígido:

- `originAccountType` ya es `String!`
- la validación de submit sigue hardcodeada por método (`ZELLE`, `IBAN`, `STRIPE`)
- el input GraphQL sigue atado a campos específicos (`zelleEmail`, `iban`, `stripePaymentMethodId`)
- la persistencia de remittance sigue atada a columnas específicas (`originZelleEmail`, `originIban`, `originStripePaymentMethodId`)
- el output GraphQL de remittance sigue exponiendo esos campos legacy

Resultado: cada nuevo método de origin account obliga a cambios estructurales en input, validación, persistencia y lectura.

## Decision and scope

Este change define el rediseño definitivo del modelo de origin account con un contrato canónico, genérico y extensible, y se ejecuta como **un único gran change** con migración completa, backfill histórico y eliminación del legacy en el mismo paso.

### Objetivo funcional

Permitir agregar nuevos métodos de originación sin rediseñar el shape del submit ni agregar columnas por método.

### Decisiones obligatorias de este change

1. Nuevo input canónico en submit:

```graphql
input SubmitRemittanceV2OriginAccountInput {
  paymentMethodCode: String!
  data: JSON!
}