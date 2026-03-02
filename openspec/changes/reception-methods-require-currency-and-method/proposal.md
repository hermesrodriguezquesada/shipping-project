# Proposal: reception-methods-require-currency-and-method

## Problem statement and UX goal

Actualmente `ReceptionMethodCatalog` no modela explícitamente dos datos que el frontend necesita para operar sin ambigüedad:

- moneda de recepción (`currency`)
- tipo de payout (`method`: `CASH` o `TRANSFER`)

Como resultado, al seleccionar un método de recepción, el cliente aún debe inferir o pedir manualmente la moneda de recepción, lo que introduce complejidad y riesgo de combinaciones inválidas.

El objetivo UX es que la selección de un reception method determine implícitamente la moneda de recepción, eliminando decisiones redundantes en el formulario.

## Why fields must be mandatory

Ambos campos deben ser obligatorios porque son parte del contrato semántico del método de recepción:

- un reception method sin moneda no define destino de fondos,
- un reception method sin tipo (`CASH`/`TRANSFER`) no define comportamiento de entrega.

Permitir nulls degradaría consistencia de datos y obligaría a lógica condicional adicional en backend/frontend.

## Breaking change and migration risk

### Database

Cambio breaking en persistencia al introducir columnas `NOT NULL` en una tabla con datos existentes:

- `currencyId` (FK a `CurrencyCatalog.id`)
- `method` (`ReceptionPayoutMethod`)

Sin backfill determinístico, la migración puede fallar o dejar datos inconsistentes.

### API

Cambio breaking en contrato GraphQL de salida (`ReceptionMethodCatalogType`) al agregar campos no nulos:

- `currency: CurrencyCatalogType!`
- `method: ReceptionPayoutMethod!`

Además, `submitRemittanceV2` ajusta comportamiento sobre moneda de recepción:

- infiere automáticamente moneda desde `receptionMethod` cuando el cliente la omite,
- rechaza mismatch explícito.

## Mitigation plan (backfill)

La migración incluirá backfill explícito por código legacy de método de recepción (`code`), usando una tabla de mapeo determinística `code -> {currencyCode, method}`.

Principios:

- no inferencia implícita silenciosa,
- si aparece un código no mapeado, la migración falla con error explícito para corregir catálogo/seed,
- sólo usar default si está contractualmente validado (no asumido).

Resultado: deploy seguro, datos consistentes, y contrato API alineado con UX objetivo.
