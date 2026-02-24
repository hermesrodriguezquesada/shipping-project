---

## Specifications Context

Este change introduce una mutación adicional para cambio de contraseña del usuario autenticado.

No modifica el flujo existente de recuperación/restablecimiento de contraseña por token.

---

## New Specifications

### Authenticated Change Password Mutation

**Descripción**

Debe existir una mutación GraphQL protegida por autenticación que permita al usuario autenticado cambiar su contraseña validando su contraseña actual.

---

**Requisitos**

- Operación protegida por GqlAuthGuard (requiere token).
- Input obligatorio:
  - oldPassword (String)
  - newPassword (String)
- Validar oldPassword contra la contraseña actual del usuario autenticado.
- Si oldPassword es inválido, retornar error (excepción).
- Si oldPassword es válido, actualizar passwordHash del usuario con newPassword hasheada.
- Mantener consistencia con validación mínima de contraseña existente (mínimo 6).

---

**Retorno**

- Retorno Boolean! indicando éxito, o equivalente consistente con patrones actuales del módulo, sin alterar operaciones existentes.

---

## Impact on Existing Behavior

No se modifica comportamiento de login, refresh, requestPasswordReset ni resetPassword.

---

NO agregar especificaciones no relacionadas.
NO redefinir reglas de negocio adicionales.
NO introducir refactors.