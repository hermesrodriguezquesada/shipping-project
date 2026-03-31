# Proposal: external-payments-generic-provider-stripe-first

## Change status

PROPOSED

## Problem statement

El backend actual de remesas solo soporta flujo de pago manual:

- submitRemittanceV2 crea remesa en PENDING_PAYMENT
- markRemittancePaid representa pago reportado por cliente
- adminConfirmRemittancePayment representa pago aceptado por la empresa y preserva side effects criticos

No existe flujo real de cobro externo con provider (Stripe u otros), ni una relacion persistida entre remesa y pago externo.

## Objective

Introducir soporte de pagos externos genericos con Stripe como primer provider, preservando semantica de negocio actual y minimizando impacto.

## Scope

Este change incluye solo:

1. Puerto generico para providers externos de pago.
2. Persistencia minima para vincular remittance con pago externo.
3. Mutation GraphQL generica para crear payment session para una remesa existente.
4. Endpoint HTTP webhook para confirmacion asincrona del provider.
5. Ruta interna especifica para pago externo exitoso que desemboca en la misma confirmacion de pago aceptado por empresa y preserva side effects actuales de adminConfirmRemittancePayment.
6. Modelo de persistencia de pagos externos con historico de intentos por remesa.

## Out of scope

- Refactors amplios de remittances.
- Cambios de UX/front.
- Automatizaciones adicionales fuera de pagos externos.
- Limpieza de estados legacy.
- Rediseño de originAccount canónico.
- Reemplazar markRemittancePaid como flujo manual.

## Mandatory constraints

- Alcance minimo.
- No romper submitRemittanceV2.
- No romper originAccount canónico y generico.
- No introducir campos GraphQL especificos de Stripe si pueden abstraerse.
- No usar markRemittancePaid como equivalente de pago externo exitoso.
- Preservar side effects actuales de adminConfirmRemittancePayment.
- No refactors no pedidos.

## Expected outcome

El backend queda listo para:

- Crear sesiones de pago externas de manera generica.
- Confirmar pago por webhook idempotente.
- Ejecutar una ruta interna dedicada para pago externo exitoso, sin usar markRemittancePaid, que termina en la confirmacion consolidada de pago aceptado por empresa.
- Escalar a nuevos providers sin romper contrato funcional existente.
