---

## Overview

Este change expone en el schema GraphQL operaciones de sesiones ya implementadas en el código actual.

El cambio es estrictamente de contrato (schema exposure) y no modifica lógica de negocio ni comportamiento.

---

## Problem Statement

Existen resolvers implementados para gestión de sesiones (mySessions, revokeMySession, revokeOtherMySessions) que no aparecen en el contrato GraphQL generado/publicado, generando drift entre implementación y API.

---

## Architectural Context

El sistema utiliza GraphQL code-first con autoSchemaFile. Para que una operación esté en el schema debe estar correctamente decorada y el resolver debe estar registrado por su módulo correspondiente.

---

## Design Decisions

- Exponer únicamente las operaciones ya implementadas: mySessions, revokeMySession, revokeOtherMySessions.
- No alterar la lógica existente de sesiones.
- No agregar nuevas operaciones, campos o reglas.
- Mantener guards/roles según la implementación ya existente.

---

## Technical Scope

- Wiring mínimo necesario para que las 3 operaciones queden incluidas en el schema generado.
- Ajustes en decoradores GraphQL y/o registro del resolver en el módulo, solo si fuese necesario.
- No cambios en persistencia, casos de uso o lógica de dominio.

---

NO agregar mejoras adicionales.
NO describir refactors.
NO redefinir reglas de negocio.