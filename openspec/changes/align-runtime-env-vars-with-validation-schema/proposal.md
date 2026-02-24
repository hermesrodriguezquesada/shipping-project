---

## Why

Se detectó una desalineación entre las variables de entorno utilizadas en runtime y el esquema formal de validación de entorno.

La ausencia de validación explícita para variables efectivamente consumidas por el sistema incrementa el riesgo de errores en runtime y configuraciones inconsistentes entre entornos.

---

## What Changes

Este change introduce exclusivamente una corrección estructural en la validación de variables de entorno:

- Alinear variables utilizadas en runtime con el esquema de validación
- No modificar comportamiento funcional
- No introducir nuevas reglas de negocio

---

## Capabilities

### New Capabilities

Ninguna.

---

### Modified Capabilities

- Environment Validation Consistency: Corrección estructural del esquema de validación de entorno sin alterar comportamiento funcional.

---

## Impact

Impacto técnico correctivo.

Este change:

- No introduce funcionalidades nuevas
- No altera reglas de negocio
- Reduce riesgo de errores por configuración inválida

---

NO agregar capacidades nuevas.
NO proponer mejoras adicionales.
NO introducir cambios funcionales.