---

## Overview

Este change introduce una corrección estructural en el contrato GraphQL relacionada con los parámetros de paginación.

El objetivo es alinear los tipos semánticos de offset y limit con su uso real en el sistema.

---

## Problem Statement

Actualmente, la operación GraphQL `adminPendingVerifications` define los parámetros offset y limit como Float.

Semánticamente, estos parámetros representan valores enteros utilizados para paginación, generando una inconsistencia contractual.

---

## Architectural Context

El sistema mantiene la arquitectura vigente:

- GraphQL como contrato API  
- Prisma como capa de persistencia  
- NestJS como framework de aplicación  

Este change no introduce alteraciones arquitectónicas.

---

## Design Decisions

Se aplicará una corrección estrictamente estructural:

- offset: Float → Int  
- limit: Float → Int  

No se modifica lógica de negocio ni comportamiento funcional.

---

## Technical Scope

Este change impacta únicamente:

- Definición GraphQL de adminPendingVerifications  

No se alteran resolvers ni queries Prisma.

---

NO agregar mejoras adicionales.
NO describir refactors.
NO redefinir reglas.