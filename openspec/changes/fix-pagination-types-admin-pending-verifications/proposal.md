---

## Why

Se detectó una inconsistencia contractual en la operación GraphQL `adminPendingVerifications`.

Los parámetros `offset` y `limit` se encuentran definidos como `Float`, cuando semánticamente corresponden a valores enteros utilizados en paginación.

Esta desalineación puede generar interpretaciones ambiguas del contrato API.

---

## What Changes

Este change introduce exclusivamente una corrección estructural en el contrato GraphQL:

- offset: Float → Int  
- limit: Float → Int  

No se modifica lógica de negocio ni comportamiento funcional.

---

## Capabilities

### New Capabilities

Ninguna.

---

### Modified Capabilities

- Pagination Contract Alignment: Corrección de tipos de parámetros de paginación sin alterar comportamiento funcional.

---

## Impact

Impacto técnico correctivo.

Este change:

- No introduce funcionalidades nuevas  
- No altera reglas de negocio  
- Mejora coherencia del contrato GraphQL  

---

NO agregar capacidades nuevas.
NO proponer mejoras adicionales.
NO introducir cambios funcionales.