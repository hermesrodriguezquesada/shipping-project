---

## Specifications Context

Este change no introduce especificaciones funcionales nuevas.

Las especificaciones aquí descritas corresponden exclusivamente a la corrección estructural del contrato GraphQL.

---

## Modified Specifications

### Pagination Parameter Type Alignment

**Descripción**

Los parámetros de paginación offset y limit deben representar valores enteros consistentes con su uso semántico dentro del sistema.

---

**Requisitos**

- offset debe ser Int  
- limit debe ser Int  
- No se modifica la lógica de paginación  
- No se introducen validaciones funcionales nuevas  

---

**Comportamiento**

El comportamiento funcional existente permanece sin modificaciones.

Este change corrige exclusivamente la representación estructural de tipos.

---

## Impact on Existing Behavior

No se modifica comportamiento observable del sistema.

---

NO agregar especificaciones nuevas.
NO redefinir reglas de negocio.
NO introducir cambios funcionales.