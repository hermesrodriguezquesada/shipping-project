---

## Specifications Context

Este change no introduce funcionalidades nuevas.

Las especificaciones aquí descritas corresponden exclusivamente a un ajuste de contrato del enlace enviado por email en el flujo de recuperación de contraseña.

---

## Modified Specifications

### Forgot Password Link Contract

**Descripción**

El enlace enviado al usuario para recuperación de contraseña debe seguir el formato requerido por el frontend, sin modificar la lógica existente de generación/validación del token.

---

**Requisitos**

- El enlace debe utilizar el path: /reset_password
- El enlace debe utilizar el query param: hash=<token>
- El valor <token> corresponde al mismo token público ya generado actualmente (no se modifica algoritmo ni persistencia)
- No se modifica la mutación resetPassword ni su validación (expiresAt/usedAt)

---

**Comportamiento**

El comportamiento funcional del flujo permanece sin cambios.
Solo se modifica el formato del enlace enviado por correo.

---

## Impact on Existing Behavior

No se modifica la lógica de recuperación de contraseña; cambia únicamente el formato del enlace emitido.

---

NO agregar especificaciones nuevas.
NO redefinir reglas de negocio.
NO introducir cambios funcionales.