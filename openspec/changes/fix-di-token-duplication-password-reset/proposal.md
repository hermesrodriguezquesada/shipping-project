---

## Why

Se detectó una inconsistencia estructural en la definición de tokens de inyección de dependencias (DI) utilizados en RequestPasswordResetUseCase.

La duplicación o definición conflictiva de tokens DI incrementa el riesgo de fallos de resolución de dependencias y comportamientos inesperados en runtime.

---

## What Changes

Este change introduce exclusivamente una corrección estructural del wiring de DI:

- Eliminación de duplicación/conflicto de tokens DI
- Mantenimiento intacto del comportamiento funcional

No se modifica lógica de negocio.

---

## Capabilities

### New Capabilities

Ninguna.

---

### Modified Capabilities

- DI Wiring Consistency: Corrección estructural de tokens DI sin alterar comportamiento funcional.

---

## Impact

Impacto técnico correctivo.

Este change:

- No introduce funcionalidades nuevas
- No altera reglas de negocio
- Reduce riesgo de errores de inyección

---

NO agregar capacidades nuevas.
NO proponer mejoras adicionales.
NO introducir cambios funcionales.