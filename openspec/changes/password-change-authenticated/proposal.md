---

## Why

El frontend requiere una operación explícita para permitir al usuario autenticado cambiar su contraseña desde su perfil.

Actualmente el sistema solo soporta recuperación/restablecimiento de contraseña mediante token (forgot password), pero no contempla el cambio autenticado validando la contraseña actual.

---

## What Changes

Este change introduce una mutación GraphQL protegida por token que permite:

- Validar la contraseña actual del usuario autenticado (oldPassword)
- Establecer una nueva contraseña (newPassword)

No se modifica el flujo de recuperación de contraseña existente.

---

## Capabilities

### New Capabilities

- Authenticated Change Password: Permitir al usuario autenticado cambiar su contraseña validando la contraseña actual.

---

### Modified Capabilities

Ninguna.

---

## Impact

Impacto funcional controlado:

- Se añade una mutación adicional al contrato GraphQL.
- No se alteran reglas de autenticación existentes.
- No se modifica el flujo de forgot password.

---

NO agregar mejoras adicionales.
NO redefinir reglas de negocio.
NO introducir cambios funcionales fuera de la mutación indicada.