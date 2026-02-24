---

## Overview

Este change introduce una corrección estructural en la configuración de inyección de dependencias (DI) relacionada con RequestPasswordResetUseCase.

El objetivo es eliminar duplicación o conflicto en tokens DI manteniendo intacto el comportamiento funcional.

---

## Problem Statement

Se detectó duplicación o definición conflictiva de tokens DI usados para resolver dependencias en RequestPasswordResetUseCase.

Esto puede provocar:

- Resolución incorrecta de dependencias
- Errores en runtime por providers ambiguos
- Acoplamiento innecesario entre módulos

---

## Architectural Context

El sistema mantiene su arquitectura vigente.

Este change no introduce componentes nuevos ni modifica patrones arquitectónicos; se limita a una corrección del wiring de DI existente.

---

## Design Decisions

Se aplicará una corrección estrictamente estructural:

- Centralizar/normalizar el token DI a una única definición
- Actualizar imports/uso para consumir el token único
- Mantener las mismas dependencias lógicas y el mismo comportamiento

No se modifica lógica de negocio.

---

## Technical Scope

Este change impacta únicamente:

- Tokens/constantes de DI relacionados con password reset
- Wiring de providers para RequestPasswordResetUseCase

No se altera la implementación funcional del caso de uso.

---

NO agregar mejoras adicionales.
NO describir refactors.
NO redefinir reglas de negocio.