# Proposal: user-vip-and-total-amount

> **Estado: IMPLEMENTADO ✔** — Change cerrado el 24 de marzo de 2026. Implementación completa, build exitoso, schema GraphQL validado y smoke tests ejecutados con evidencia real.

---

## Problem statement

El modelo de usuario no incluye:

- Un marcador de clasificación VIP (`isVip`) que permita al panel administrativo identificar y gestionar usuarios de forma diferenciada.
- Un acumulado del monto total generado en remesas confirmadas (`totalGeneratedAmount`) que permita conocer el historial de actividad económica de cada cliente.

Actualmente:

- `User` no tiene `isVip`.
- `User` no tiene `totalGeneratedAmount`.
- `adminCreateUser` y `adminUpdateUserProfile` no pueden establecer ni actualizar estos campos.
- `adminConfirmRemittancePayment` no actualiza el perfil del usuario en ninguna dirección.
- No existe una mutación dedicada para activar o desactivar el estado VIP de un usuario.

## Proposed change

Agregar soporte de persistencia y negocio para:

1. `User.isVip` — bandera booleana de clasificación VIP, con acceso admin de lectura/escritura.
2. `User.totalGeneratedAmount` — acumulado monetario de remesas confirmadas, con incremento automático y atómico al confirmar el pago.

## Expected outcome

- Los administradores pueden crear usuarios con la bandera `isVip` ya establecida.
- Los administradores pueden actualizar `isVip` a través de `adminUpdateUserProfile`.
- Existe una mutación dedicada `adminSetUserVip` para activar o desactivar el estado VIP sobre un usuario existente.
- Al confirmar el pago de una remesa (`adminConfirmRemittancePayment`), el sistema acumula el `Remittance.amount` en el usuario propietario, de forma atómica e idempotente, sin riesgo de doble conteo.
- El contrato GraphQL expone ambos campos de forma consistente.

---

## Nota sobre exposición GraphQL

**Decisión explícita**: ambos campos (`isVip` y `totalGeneratedAmount`) se agregan al `UserType` compartido existente.

`UserType` se reutiliza hoy en las siguientes superficies:

- `AuthPayload` — login, refresh, register
- query `me`
- query `myProfile`
- query `user(id)` — **pública, sin guard**
- campo `owner` dentro de `RemittanceType`

**Consecuencia aceptada**: cualquier cliente —incluyendo la query pública `user(id)`— recibirá `isVip` y `totalGeneratedAmount` en la respuesta.

Esta exposición se acepta en este change por simplicidad y por mantener la arquitectura de un único tipo de usuario. Si en el futuro se requiere restringir estos campos solo a superficies administrativas, se deberá introducir un `AdminUserType` separado en un change posterior.

---

## Nota sobre backfill

**Decisión explícita**: este change **NO incluye backfill histórico**.

- `isVip` arranca en `false` para todos los usuarios existentes tras la migración. El valor correcto para usuarios previos es desconocido y debe establecerse explícitamente por administradores.
- `totalGeneratedAmount` arranca en `0` para todos los usuarios existentes tras la migración, independientemente de sus remesas históricas. El acumulado crecerá únicamente a partir de las confirmaciones realizadas después del despliegue.

Si se requiere calcular el total histórico, eso debe gestionarse como una tarea de migración de datos separada, fuera del alcance de este change.

---

## Out of scope

- Cambios en pricing o cálculo de comisiones.
- Cambios en el flujo de submit de remesas.
- Cambios en `originAccountType`, `manualBeneficiary` o renombrado de campos destino.
- Filtro `isVip` en `adminUsers`.
- Refactors generales del dominio de usuarios.
- Cambios en guards, JWT o autorización fuera de la nueva mutación.
- Creación de un `AdminUserType` separado.
- Backfill de datos históricos.

---

## Cierre

### Problema resuelto

Todos los puntos del problem statement han sido implementados y validados:

- `User.isVip` persiste en base de datos y se expone en el contrato GraphQL.
- `User.totalGeneratedAmount` persiste en base de datos, se acumula atómicamente al confirmar pagos y se expone en el contrato GraphQL.
- `adminCreateUser` y `adminUpdateUserProfile` permiten establecer y actualizar `isVip`.
- `adminConfirmRemittancePayment` actualiza `totalGeneratedAmount` de forma atómica e idempotente.
- La mutación dedicada `adminSetUserVip` existe y está operativa.

### Decisión de exposición GraphQL — confirmada

Ambos campos se expusieron en el `UserType` compartido existente, tal como se decidió. Todos los clientes que acceden a `AuthPayload`, `me`, `myProfile`, `user(id)` y el campo `owner` de `RemittanceType` reciben `isVip` y `totalGeneratedAmount` en la respuesta.

### Decisión de backfill — confirmada

La migración es additive. No contiene sentencias `UPDATE` de datos históricos. Usuarios existentes arrancan con `isVip = false` y `totalGeneratedAmount = 0`. El acumulado crece solo desde confirmaciones posteriores al despliegue de esta migración.
