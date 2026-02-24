---

## Overview

Este change amplía capacidades administrativas en GraphQL para gestión de datos de perfil de usuarios:

- Permitir que adminCreateUser acepte opcionalmente datos de perfil.
- Incorporar una mutación administrativa para editar datos de perfil de un usuario existente.

El control de acceso se mantiene por Role.ADMIN.

---

## Problem Statement

Actualmente:

- adminCreateUser solo admite email/password/roles.
- No existe una operación administrativa para editar datos de perfil de un usuario.

El frontend requiere ambas capacidades para gestión completa de usuarios desde el panel administrativo.

---

## Architectural Context

El sistema utiliza NestJS + GraphQL code-first + Prisma.

Las operaciones administrativas existentes están protegidas por guards/roles.

Este change debe integrarse siguiendo el patrón vigente de resolvers/use-cases/adapters, sin refactors.

---

## Design Decisions

- Extender AdminCreateUserInput para incluir opcionalmente campos de perfil ya existentes en el dominio actual.
- Mantener la creación de usuario (email/password/roles) sin cambios, agregando perfil solo si se provee.
- Introducir una nueva mutación admin para actualización parcial de perfil:
  - Requiere userId
  - Permite campos opcionales (undefined = no cambia)
- No incluir edición de roles/estado en esta mutación (ya existen operaciones específicas para eso).

---

## Technical Scope

- GraphQL:
  - Extensión de AdminCreateUserInput con perfil opcional
  - Nuevo input para actualización admin de perfil
  - Nueva mutación admin (Role.ADMIN)
- Aplicación:
  - Propagación resolver → use-case → persistencia para crear/actualizar perfil
- Sin cambios en Auth flows no relacionados.

---

NO agregar mejoras adicionales.
NO describir refactors.
NO redefinir reglas de negocio fuera del alcance indicado.