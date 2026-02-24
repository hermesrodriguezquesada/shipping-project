---

## Specifications Context

Este change no introduce funcionalidades nuevas.

Las especificaciones aquí descritas corresponden exclusivamente a la exposición en el contrato GraphQL de operaciones de sesiones ya implementadas.

---

## Modified Specifications

### Sessions GraphQL Contract Exposure

**Descripción**

El contrato GraphQL debe reflejar fielmente las operaciones de gestión de sesiones ya existentes en el sistema.

---

**Requisitos**

El schema GraphQL debe incluir:

- mySessions
- revokeMySession
- revokeOtherMySessions

Las firmas, tipos, inputs y outputs deben corresponder exactamente a la implementación ya existente.

No se modifica lógica funcional.

---

**Comportamiento**

El comportamiento funcional existente permanece sin modificaciones.

Este change corrige exclusivamente la exposición del contrato API.

---

## Impact on Existing Behavior

No se modifica comportamiento funcional del sistema.

Se actualiza únicamente el contrato GraphQL expuesto.

---

NO agregar especificaciones nuevas.
NO redefinir reglas de negocio.
NO introducir cambios funcionales.