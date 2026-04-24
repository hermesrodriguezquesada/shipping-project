# Design: user-action-logs-audit-trail

## Design status

PROPOSED

## Domain design

Se introduce el concepto funcional `UserActionLog` como registro inmutable de una acción relevante ejecutada por un actor autenticado o parcialmente identificado.

Campos funcionales requeridos:

- `actorUserId`
- `actorEmail`
- `actorRole`
- `action`
- `resourceType`
- `resourceId`
- `description`
- `metadataJson`
- `ipAddress`
- `userAgent`
- `createdAt`

Reglas funcionales:

- el log es append-only,
- un fallo al registrar no invalida la acción principal,
- `myUserActionLogs` solo expone logs del actor autenticado,
- `adminUserActionLogs` solo expone logs a `ADMIN` o `EMPLOYEE`,
- `metadataJson` debe guardar contexto útil, nunca secretos ni payloads completos.

## Prisma model

Se propone agregar el siguiente modelo y enum:

```prisma
model UserActionLog {
  id           String   @id @default(uuid())
  actorUserId  String?
  actorEmail   String?
  actorRole    String?
  action       UserActionLogAction
  resourceType String?
  resourceId   String?
  description  String?
  metadataJson String?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())

  actor User? @relation("UserActionLogActor", fields: [actorUserId], references: [id], onDelete: SetNull)

  @@index([actorUserId])
  @@index([action])
  @@index([resourceType, resourceId])
  @@index([createdAt])
}

model User {
  // ...campos existentes...
  actionLogs UserActionLog[] @relation("UserActionLogActor")
}

enum UserActionLogAction {
  REGISTER
  LOGIN
  LOGOUT
  UPDATE_PROFILE
  ADMIN_UPDATE_USER
  ADMIN_SET_USER_VIP

  CREATE_REMITTANCE
  MARK_REMITTANCE_PAID
  ADMIN_CONFIRM_REMITTANCE_PAYMENT
  ADMIN_MARK_REMITTANCE_DELIVERED
  CANCEL_REMITTANCE

  CREATE_VIP_PAYMENT_PROOF
  ADMIN_CONFIRM_VIP_PAYMENT_PROOF
  ADMIN_CANCEL_VIP_PAYMENT_PROOF

  CREATE_SUPPORT_MESSAGE
  ANSWER_SUPPORT_MESSAGE
}
```

La relación con `User` debe declararse explícitamente como `UserActionLogActor` y con back-reference dedicado para evitar ambigüedad con las múltiples relaciones existentes hacia `User` en el schema actual.

## GraphQL contract

Se agregará un contrato GraphQL aditivo con:

### Type

`UserActionLog`

Campos esperados:

- `id`
- `actorUserId`
- `actorEmail`
- `actorRole`
- `action`
- `resourceType`
- `resourceId`
- `description`
- `metadataJson`
- `ipAddress`
- `userAgent`
- `createdAt`
- `actor`

### Queries

```graphql
myUserActionLogs(input: UserActionLogListInput): [UserActionLog!]!
adminUserActionLogs(input: AdminUserActionLogListInput): [UserActionLog!]!
```

### Inputs

`UserActionLogListInput`

- `action`
- `dateFrom`
- `dateTo`
- `limit`
- `offset`

`AdminUserActionLogListInput`

- `actorUserId`
- `action`
- `resourceType`
- `resourceId`
- `dateFrom`
- `dateTo`
- `limit`
- `offset`

## Hexagonal architecture

El módulo nuevo se ubicará en `src/modules/user-action-logs/` con esta estructura:

```txt
domain/
  ports/
    user-action-log-command.port.ts
    user-action-log-query.port.ts

application/
  use-cases/
    record-user-action-log.usecase.ts
    my-user-action-logs.usecase.ts
    admin-user-action-logs.usecase.ts

infrastructure/
  adapters/
    prisma-user-action-log-command.adapter.ts
    prisma-user-action-log-query.adapter.ts

presentation/
  graphql/
    resolvers/
      user-action-logs.resolver.ts
    inputs/
    types/
    mappers/
```

La dependencia debe fluir desde application hacia ports, y desde infrastructure hacia Prisma. Los consumers de otros módulos solo conocerán el use case `record-user-action-log` o el token correspondiente, nunca el adapter concreto.

## Non-blocking strategy

Cada punto de integración debe seguir el patrón:

```ts
try {
  await recordUserActionLog.execute(...)
} catch (error) {
  logger.warn(...)
}
```

Reglas de diseño:

- el log se ejecuta solo después de completar la acción principal o en el punto funcional correcto para reflejar éxito real,
- el error de auditoría se degrada a warning,
- no se hace rollback ni se altera el resultado funcional por fallo del log,
- no se introduce dependencia transaccional entre negocio y auditoría en esta fase.

## Metadata sanitization

`metadataJson` debe ser un resumen mínimo, útil y seguro.

Debe excluir siempre:

- passwords,
- access tokens,
- refresh tokens,
- payment proof base64,
- payment proof S3 key,
- cualquier imagen en base64,
- imágenes o documentos,
- datos bancarios completos.

Estrategia propuesta:

- construir metadata explícita por caso de uso en lugar de serializar DTOs completos,
- incluir solo identificadores, estados, flags y campos de contexto acotados,
- almacenar string JSON sanitizado o `null` cuando no haga falta contexto adicional,
- centralizar helpers de sanitización para reglas repetibles.

## Integration points for phase 1

El registro explícito se integrará en:

- `register`
- `login`
- `logout`
- `updateMyProfile`
- `adminUpdateUserProfile`
- `adminSetUserVip`
- `submitRemittanceV2`
- `markRemittancePaid`
- `adminConfirmRemittancePayment`
- `adminMarkRemittanceDelivered`
- `cancelMyRemittance`
- `adminCancelRemittance`
- `createVipPaymentProof`
- `adminConfirmVipPaymentProof`
- `adminCancelVipPaymentProof`
- `createSupportMessage`
- `answerSupportMessage`

En todos los casos se debe mantener el principio de cambios mínimos, sin refactorizar masivamente módulos existentes.

Mapeo funcional esperado en fase 1:

- `register` registra `REGISTER`.
- `login` registra `LOGIN`.
- `logout` registra `LOGOUT`.
- `updateMyProfile` registra `UPDATE_PROFILE`.
- `adminUpdateUserProfile` registra `ADMIN_UPDATE_USER`.
- `adminSetUserVip` registra `ADMIN_SET_USER_VIP`.
- `submitRemittanceV2` registra `CREATE_REMITTANCE`.
- `markRemittancePaid` registra `MARK_REMITTANCE_PAID`.
- `adminConfirmRemittancePayment` registra `ADMIN_CONFIRM_REMITTANCE_PAYMENT`.
- `adminMarkRemittanceDelivered` registra `ADMIN_MARK_REMITTANCE_DELIVERED`.
- `cancelMyRemittance` y `adminCancelRemittance` registran `CANCEL_REMITTANCE` con metadata que distinga origen user o admin.
- `createVipPaymentProof` registra `CREATE_VIP_PAYMENT_PROOF`.
- `adminConfirmVipPaymentProof` registra `ADMIN_CONFIRM_VIP_PAYMENT_PROOF`.
- `adminCancelVipPaymentProof` registra `ADMIN_CANCEL_VIP_PAYMENT_PROOF`.
- `createSupportMessage` registra `CREATE_SUPPORT_MESSAGE`.
- `answerSupportMessage` registra `ANSWER_SUPPORT_MESSAGE`.

## Alternatives considered

### 1. Usar logs técnicos existentes

Descartado porque los logs técnicos no ofrecen contrato de consulta, estructura funcional uniforme ni garantías de filtrado por actor o recurso para casos de auditoría funcional.

### 2. Usar interceptor global

Descartado en fase 1 porque introduce mayor riesgo de capturar payloads sensibles, complica distinguir éxito funcional real frente a intentos fallidos y reduce control sobre la metadata mínima por caso.

### 3. Registrar manualmente en use cases

Elegido para fase 1 porque:

- minimiza el riesgo de side effects inesperados,
- permite decidir con precisión cuándo una acción fue realmente exitosa,
- facilita sanitizar metadata por contexto de negocio,
- preserva cambios mínimos y trazabilidad explícita,
- encaja mejor con la arquitectura hexagonal actual y DI por tokens.

## Design justification

La fase 1 usa registro manual explícito en use cases o puntos de aplicación equivalentes porque es la opción con menor riesgo de introducir regresiones y con mayor control sobre seguridad de datos. El costo de wiring adicional es aceptable frente al beneficio de asegurar:

- no breaking changes,
- non-blocking real,
- metadata segura,
- integración incremental por flujo,
- validación operativa clara antes de considerar automatizaciones más globales.