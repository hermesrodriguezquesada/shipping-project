---

## Overview

Este change introduce una corrección estructural en el esquema de validación de variables de entorno.

El objetivo es garantizar coherencia entre las variables efectivamente utilizadas en runtime y aquellas definidas en el mecanismo formal de validación.

---

## Problem Statement

Actualmente, el sistema consume variables de entorno en runtime que no se encuentran explícitamente incluidas en el esquema de validación.

Esto puede provocar:

- Errores en runtime por variables faltantes
- Configuraciones inconsistentes entre entornos
- Comportamientos inesperados por defaults implícitos

---

## Architectural Context

El sistema mantiene su arquitectura vigente basada en NestJS, Prisma y GraphQL.

Este change no introduce componentes nuevos ni altera patrones arquitectónicos; se limita a la corrección del esquema de validación de entorno.

---

## Design Decisions

Se aplicará una corrección estrictamente estructural:

- Identificar variables efectivamente consumidas en runtime
- Alinear dichas variables con el esquema de validación existente
- No modificar lógica de negocio
- No alterar comportamiento funcional

---

## Technical Scope

Este change impacta únicamente:

- Esquema de validación de variables de entorno
- Definiciones relacionadas con configuración

No se alteran resolvers, casos de uso ni lógica de dominio.

---

NO agregar mejoras adicionales.
NO describir refactors.
NO redefinir reglas de negocio.