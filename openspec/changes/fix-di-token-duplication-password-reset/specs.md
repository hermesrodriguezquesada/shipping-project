---

## Specifications Context

Este change no introduce especificaciones funcionales nuevas.

Las especificaciones aquí descritas corresponden exclusivamente a una corrección estructural de inyección de dependencias (DI) para mantener consistencia interna.

---

## Modified Specifications

### Password Reset DI Token Consistency

**Descripción**

Los tokens DI utilizados para resolver dependencias de RequestPasswordResetUseCase deben tener una única definición coherente y ser consumidos de forma consistente en todo el módulo.

---

**Requisitos**

- Debe existir una única fuente de verdad para el token DI involucrado
- No deben existir definiciones duplicadas o conflictivas
- No se modifica la lógica del caso de uso
- No se agregan dependencias funcionales nuevas

---

**Comportamiento**

El comportamiento funcional existente permanece sin modificaciones.

Este change corrige exclusivamente el wiring de DI.

---

## Impact on Existing Behavior

No se modifica comportamiento observable del sistema.

---

NO agregar especificaciones nuevas.
NO redefinir reglas de negocio.
NO introducir cambios funcionales.