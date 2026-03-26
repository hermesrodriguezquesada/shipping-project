
---

## design.md

```md
# Design: canonical-origin-account-model

## Design goal

Definir un modelo canónico de origin account que desacople el sistema de campos fijos por método y habilite extensibilidad real.

Este change se implementa como **un único gran rediseño**:
- introduce contrato canónico de input y output
- introduce persistencia canónica
- migra datos históricos
- elimina el legacy en el mismo paso

## Architecture overview

El contrato de origin account se compone de dos piezas:

1. Identidad del método: `paymentMethodCode`
2. Payload específico del método: `data`

La validación se resuelve por metadata del catálogo `PaymentMethod` y no por branches hardcodeados en el submit.

## Canonical contract

### Input

Se introduce un scalar `JSON` en GraphQL como parte de este change.

Contrato objetivo:

```graphql
input SubmitRemittanceV2OriginAccountInput {
  paymentMethodCode: String!
  data: JSON!
}