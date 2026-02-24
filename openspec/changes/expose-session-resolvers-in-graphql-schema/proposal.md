---

## Why

Se detectó que existen resolvers de sesiones implementados (mySessions, revokeMySession, revokeOtherMySessions) que no están expuestos en el contrato GraphQL vigente.

Esto genera drift entre capacidades implementadas y API publicada, dificultando el uso y validación consistente del sistema.

---

## What Changes

Este change expone en el esquema GraphQL únicamente las operaciones de sesiones ya implementadas en el código actual:

- mySessions
- revokeMySession
- revokeOtherMySessions

No se modifica lógica de negocio ni comportamiento funcional; se realiza únicamente el wiring necesario para que el schema code-first las incluya.

---

## Capabilities

### New Capabilities

Ninguna (las capacidades ya existen en código; solo se exponen en el contrato).

---

### Modified Capabilities

- Sessions GraphQL Contract Exposure: Exposición del contrato GraphQL para operaciones ya implementadas sin alterar comportamiento.

---

## Impact

Impacto de contrato API (exposición):

- No se introduce nueva lógica funcional
- No se modifican reglas de negocio
- Se actualiza el schema GraphQL para reflejar el estado real implementado

---

NO agregar capacidades nuevas.
NO proponer mejoras adicionales.
NO introducir cambios funcionales.