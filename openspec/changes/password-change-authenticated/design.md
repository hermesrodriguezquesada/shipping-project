---

## Overview

Este change incorpora una mutación GraphQL protegida por autenticación para que el usuario logueado pueda cambiar su contraseña validando su contraseña actual.

El cambio no afecta el flujo de recuperación de contraseña (forgot password) existente.

---

## Problem Statement

Actualmente el sistema permite restablecer contraseña mediante token (resetPassword), pero no ofrece una operación para cambio de contraseña autenticado (oldPassword + newPassword) desde el perfil del usuario.

---

## Architectural Context

El sistema utiliza:

- Autenticación JWT con GqlAuthGuard
- Password hashing/verificación existente en flujos de login y resetPassword
- Persistencia de usuario mediante Prisma

Este change debe reutilizar los mecanismos existentes de hashing/verificación de contraseña, sin introducir refactors.

---

## Design Decisions

- Exponer una mutación GraphQL protegida por GqlAuthGuard para el usuario autenticado.
- Validar oldPassword contra el passwordHash actual del usuario.
- Si oldPassword es válido, actualizar el passwordHash con newPassword hasheada.
- Mantener consistencia con reglas existentes (ej: mínima longitud ya aplicada en resetPassword).
- No invalidar sesiones ni alterar tokens en este change (solo cambio de contraseña).

---

## Technical Scope

- Nuevo InputType para changePassword (oldPassword, newPassword).
- Nueva mutación en AuthResolver (o módulo correspondiente) protegida por GqlAuthGuard.
- Nuevo use-case o reutilización estructurada del servicio existente para hashing/verificación (sin refactors).
- Actualización del usuario en persistencia para guardar el nuevo passwordHash.

---

NO agregar mejoras adicionales.
NO describir refactors.
NO redefinir reglas de negocio fuera del cambio de contraseña autenticado.