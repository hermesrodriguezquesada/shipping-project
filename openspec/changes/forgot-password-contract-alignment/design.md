---

## Overview

Este change ajusta exclusivamente el formato del enlace enviado por correo en el flujo de recuperación de contraseña.

El objetivo es alinear el path y el nombre del query param con lo requerido por el frontend, manteniendo intacta la lógica de expiración/uso único y validación existente.

---

## Problem Statement

El sistema actualmente genera enlaces de recuperación con el formato:

/reset-password?token=<token>

El frontend requiere el formato:

/reset_password?hash=<token>

Esta diferencia impide que el cliente integre el flujo sin transformaciones adicionales.

---

## Architectural Context

El sistema utiliza un flujo de password reset basado en:

- Generación de token público enviado por correo
- Persistencia del hash del token
- Validación por expiración (expiresAt) y uso único (usedAt)

Este change no modifica ese mecanismo; solo el enlace emitido.

---

## Design Decisions

- Cambiar únicamente el formato del enlace generado en requestPasswordReset:
  - Path: /reset_password
  - Query param: hash=<token>
- Mantener el mismo valor público del token (no cambiar algoritmo ni persistencia)
- No modificar resetPassword ni su validación

---

## Technical Scope

- Modificar únicamente la construcción de URL del email en el caso de uso requestPasswordReset.
- No modificar modelos, persistencia, TTL, ni lógica de validación.

---

NO agregar mejoras adicionales.
NO describir refactors.
NO redefinir reglas de negocio.