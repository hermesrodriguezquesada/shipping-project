---

## Why

El frontend requiere soporte administrativo para:

- Crear usuarios incluyendo opcionalmente datos de perfil (firstName, phone, country, etc.).
- Editar datos de perfil de un usuario por parte de un administrador.

Actualmente adminCreateUser solo admite email/password/roles y no existe una mutación admin para editar perfil de terceros.

---

## What Changes

- Se amplía adminCreateUser para aceptar opcionalmente datos de perfil del usuario.
- Se incorpora una nueva mutación administrativa para editar datos de perfil de un usuario existente.

Se mantiene el control de acceso por Role.ADMIN.

---

## Capabilities

### New Capabilities

- Admin Update User Profile: edición administrativa de datos de perfil.

---

### Modified Capabilities

- Admin Create User With Optional Profile: creación de usuario con perfil opcional.

---

## Impact

Impacto funcional controlado:

- Se amplía el contrato GraphQL administrativo.
- No se alteran reglas de autenticación/roles existentes.
- No se introducen cambios en flujos de Auth no relacionados.

---

NO agregar mejoras adicionales.
NO redefinir reglas de negocio fuera del alcance indicado.
NO introducir refactors.