# Design: vip-payment-proof-confirmation-flow

## Overview

Este change introduce un nuevo agregado funcional: `VipPaymentProof`.

Objetivo:

- permitir que un cliente VIP reporte un comprobante de pago sin crear todavía una remesa
- permitir que operaciones revise ese comprobante con un lifecycle propio
- mantener completamente separado el lifecycle actual de `Remittance`

La solución sigue el patrón arquitectónico vigente del proyecto:

- NestJS
- GraphQL code-first
- Prisma + PostgreSQL
- arquitectura hexagonal con módulos, use-cases, ports, adapters, resolvers y DI por tokens

## Domain Design

### Aggregate

Nuevo agregado: `VipPaymentProof`

Responsabilidades del agregado:

- representar una notificación de pago VIP previa a cualquier remesa
- conservar datos de captura y revisión
- controlar un lifecycle de revisión simple
- desacoplar este flujo de `Remittance`

### Core Fields

- `id`
- `userId`
- `accountHolderName`
- `amount`
- `currencyId`
- `paymentProofKey`
- `status`
- `cancelReason`
- `reviewedById`
- `reviewedAt`
- `createdAt`
- `updatedAt`

### Status Lifecycle

Enum nuevo:

```ts
VipPaymentProofStatus
```

Valores:

```txt
PENDING_CONFIRMATION
CONFIRMED
CANCELED
```

Transiciones permitidas:

- `PENDING_CONFIRMATION -> CONFIRMED`
- `PENDING_CONFIRMATION -> CANCELED`

Transiciones no permitidas:

- `CONFIRMED -> CANCELED`
- `CANCELED -> CONFIRMED`
- cualquier transición desde un estado ya revisado hacia otro estado

Reglas de negocio:

- todo comprobante nuevo inicia en `PENDING_CONFIRMATION`
- solo admin o employee pueden revisar un comprobante
- toda revisión debe registrar `reviewedById` y `reviewedAt`
- la cancelación debe persistir `cancelReason`

## Prisma Model

Modelo propuesto:

```prisma
model VipPaymentProof {
  id                String                @id @default(uuid())
  userId            String
  accountHolderName String
  amount            Decimal
  currencyId        String
  paymentProofKey   String
  status            VipPaymentProofStatus @default(PENDING_CONFIRMATION)
  cancelReason      String?
  reviewedById      String?
  reviewedAt        DateTime?
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  user       User            @relation("VipPaymentProofOwner", fields: [userId], references: [id])
  currency   CurrencyCatalog @relation(fields: [currencyId], references: [id])
  reviewedBy User?           @relation("VipPaymentProofReviewer", fields: [reviewedById], references: [id])

  @@index([userId])
  @@index([status])
  @@index([currencyId])
  @@index([createdAt])
  @@index([reviewedById])
}

enum VipPaymentProofStatus {
  PENDING_CONFIRMATION
  CONFIRMED
  CANCELED
}
```

Y en `User` deben agregarse explícitamente las relaciones inversas para que Prisma pueda resolver sin ambiguedad las dos relaciones hacia el mismo modelo:

```prisma
vipPaymentProofs         VipPaymentProof[] @relation("VipPaymentProofOwner")
reviewedVipPaymentProofs VipPaymentProof[] @relation("VipPaymentProofReviewer")
```

### Relation Naming Decision

Como `VipPaymentProof` apunta dos veces a `User`, se deben nombrar las relaciones explícitamente para evitar ambiguedad en Prisma:

- `VipPaymentProofOwner`
- `VipPaymentProofReviewer`

En este caso no es opcional: las relaciones inversas en `User` deben declararse también para que el schema Prisma compile correctamente y la intención del modelo quede explícita.

## GraphQL Contract

### Mutations

```graphql
createVipPaymentProof(input: CreateVipPaymentProofInput!): VipPaymentProof!
adminConfirmVipPaymentProof(id: ID!): VipPaymentProof!
adminCancelVipPaymentProof(id: ID!, reason: String!): VipPaymentProof!
```

### Queries

```graphql
myVipPaymentProofs(input: VipPaymentProofListInput): [VipPaymentProof!]!
adminVipPaymentProofs(input: AdminVipPaymentProofListInput): [VipPaymentProof!]!
vipPaymentProofViewUrl(id: ID!): VipPaymentProofViewPayload!
```

Se elige lista simple con `offset` y `limit` en los inputs porque ese es el patrón dominante actual del repo para consultas GraphQL administrativas y de usuario. No se introduce `Connection` en esta fase.

### CreateVipPaymentProofInput

```graphql
input CreateVipPaymentProofInput {
  accountHolderName: String!
  amount: String!
  currencyId: ID!
  paymentProofImg: String!
}
```

Notas de contrato:

- `amount` debe seguir el patrón actual del proyecto para montos decimales en GraphQL, normalmente serializado como `String`
- `paymentProofImg` debe aceptar base64 o data URL, igual que el flujo actual de comprobante de remesa

### VipPaymentProof Type

Campos mínimos a exponer:

```graphql
type VipPaymentProof {
  id: ID!
  userId: ID!
  user: UserType!
  accountHolderName: String!
  amount: String!
  currencyId: ID!
  currency: CurrencyType!
  status: VipPaymentProofStatus!
  cancelReason: String
  reviewedById: ID
  reviewedBy: UserType
  reviewedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

Para mantener consistencia con el estilo code-first del repositorio, la clase TypeScript puede llamarse `VipPaymentProofType` y exponerse como tipo GraphQL `VipPaymentProof` mediante `@ObjectType('VipPaymentProof')`.

Regla explícita:

- `paymentProofKey` no se expone en GraphQL

### View URL Payload

```graphql
type VipPaymentProofViewPayload {
  viewUrl: String!
  expiresAt: DateTime!
}
```

Se alinea con el payload ya existente de comprobantes de remesa, que devuelve `viewUrl` y `expiresAt`. La URL debe ser firmada y temporal. Nunca debe devolverse la key interna del bucket.

## Application Layer

### Ports

Se propone crear:

```txt
domain/
  ports/
    vip-payment-proof-command.port.ts
    vip-payment-proof-query.port.ts
    vip-payment-proof-storage.port.ts
```

#### VipPaymentProofCommandPort

Responsabilidades:

- crear comprobantes
- confirmar comprobantes pendientes
- cancelar comprobantes pendientes

#### VipPaymentProofQueryPort

Responsabilidades:

- listar comprobantes por owner
- listar comprobantes para admin con filtros
- obtener comprobante por id para autorización y lectura

#### VipPaymentProofStoragePort

Responsabilidades:

- subir imagen de comprobante
- generar URL firmada de lectura

### Use Cases

```txt
application/
  use-cases/
    create-vip-payment-proof.usecase.ts
    list-my-vip-payment-proofs.usecase.ts
    admin-list-vip-payment-proofs.usecase.ts
    admin-confirm-vip-payment-proof.usecase.ts
    admin-cancel-vip-payment-proof.usecase.ts
    get-vip-payment-proof-view-url.usecase.ts
```

#### create-vip-payment-proof.usecase.ts

Validaciones:

- usuario autenticado
- `user.isVip === true`
- `accountHolderName` requerido
- `amount > 0`
- `currencyId` existe y está habilitada
- `paymentProofImg` válido como imagen base64/data URL
- tamaño máximo permitido según criterio ya existente del proyecto

Flujo:

1. validar usuario VIP
2. validar moneda
3. parsear y validar imagen
4. subir imagen a storage
5. persistir `VipPaymentProof` en `PENDING_CONFIRMATION`
6. retornar agregado mapeado a GraphQL

#### list-my-vip-payment-proofs.usecase.ts

Regla:

- solo devuelve registros del usuario autenticado

#### admin-list-vip-payment-proofs.usecase.ts

Regla:

- solo `ADMIN` o `EMPLOYEE`
- permite filtros por estado, usuario, moneda y rango de fechas

#### admin-confirm-vip-payment-proof.usecase.ts

Regla:

- solo `PENDING_CONFIRMATION`
- setea `status = CONFIRMED`
- setea `reviewedById` y `reviewedAt`

#### admin-cancel-vip-payment-proof.usecase.ts

Regla:

- solo `PENDING_CONFIRMATION`
- `reason` obligatorio y no vacío
- setea `status = CANCELED`
- setea `cancelReason`, `reviewedById` y `reviewedAt`

#### get-vip-payment-proof-view-url.usecase.ts

Regla de autorización:

- cliente VIP solo puede ver su propio comprobante
- `ADMIN` o `EMPLOYEE` puede ver cualquiera

Respuesta:

- signed URL temporal

## Infrastructure

### Prisma Adapters

```txt
infrastructure/
  adapters/
    prisma-vip-payment-proof-command.adapter.ts
    prisma-vip-payment-proof-query.adapter.ts
    s3-vip-payment-proof-storage.adapter.ts
```

#### prisma-vip-payment-proof-command.adapter.ts

Operaciones:

- `create`
- `confirmPending`
- `cancelPending`

La confirmación y cancelación deben usar condiciones por estado para asegurar la invariante de revisión única. Si el proyecto ya maneja errores de transición inválida en capa aplicación con lectura previa y update, puede mantenerse ese patrón, pero la persistencia debe seguir siendo consistente frente a dobles revisiones.

#### prisma-vip-payment-proof-query.adapter.ts

Operaciones:

- `findById`
- `findMine`
- `findForAdmin`

Debe incluir joins o includes mínimos para `user`, `currency` y `reviewedBy` según el mapper GraphQL existente en el proyecto.

### Storage Adapter

`s3-vip-payment-proof-storage.adapter.ts` reutiliza la infraestructura S3 actual, pero con namespace o key prefix dedicado, por ejemplo:

```txt
vip-payment-proofs/{userId}/{uuid}.jpg
```

Reglas:

- reutilizar parseo base64/data URL existente
- validar MIME permitido
- validar tamaño máximo permitido
- generar key interna no predecible
- exponer solo signed URLs para lectura

## Presentation Layer

Estructura propuesta:

```txt
presentation/
  graphql/
    resolvers/
      vip-payment-proofs.resolver.ts
    inputs/
    types/
    mappers/
```

Resolver único inicial:

- concentra queries y mutations del módulo
- protegido con los guards ya vigentes del proyecto
- delega toda decisión de negocio a use-cases

## Security And Permissions

### Cliente autenticado

- puede crear comprobantes solo si `isVip = true`
- puede listar solo sus comprobantes
- puede solicitar URL de visualización solo de sus comprobantes

### Admin y Employee

- pueden listar todos los comprobantes VIP
- pueden confirmar comprobantes pendientes
- pueden cancelar comprobantes pendientes con motivo
- pueden ver la URL de cualquier comprobante

### Datos sensibles

- no exponer `paymentProofKey`
- no permitir acceso por URL pública persistente
- revisar que `vipPaymentProofViewUrl` aplique autorización antes de pedir signed URL a storage

## Storage

El asset binario del comprobante no debe guardarse inline en PostgreSQL.

Decisión:

- guardar el archivo en S3
- persistir solo `paymentProofKey` en base de datos
- entregar visualización mediante URL firmada temporal

Beneficios:

- consistente con el patrón actual del backend
- menor peso en base de datos
- mejor trazabilidad y control de acceso temporal

## Architectural Decisions

### Decision 1: Separate entity instead of extending Remittance

Se crea una entidad nueva `VipPaymentProof`.

Razones:

- el requerimiento no representa una remesa
- no existe destinatario ni lifecycle completo de remesa en este punto
- reutilizar `Remittance` introduciría estados artificiales o campos incompletos
- preserva compatibilidad total del flujo actual

### Decision 2: Reuse infrastructure, not remittance use-cases

Se permite reutilizar solo componentes horizontales:

- parseo de imagen
- validación MIME/tamaño
- S3
- signed URLs
- guards y roles

No se deben reutilizar:

- `RemittanceLifecycleUseCase`
- `submitRemittanceV2`
- `markRemittancePaid`
- `ExternalPayment`
- estados de `Remittance`

### Decision 3: Notifications are optional in phase 1

Las notificaciones se documentan pero no bloquean la entrega inicial.

Posibles eventos futuros:

- `NEW_VIP_PAYMENT_PROOF`
- `VIP_PAYMENT_PROOF_CONFIRMED`
- `VIP_PAYMENT_PROOF_CANCELED`

Si agregar enums o contratos de notificación amplía el alcance, debe abrirse una fase posterior.

### Decision 4: No reporting integration in this change

`VipPaymentProof` no participa todavía en reporting, dashboards ni exportaciones administrativas existentes.

Esto evita acoplar el cambio con workstreams ya abiertos de reporting/export.

## Alternatives Considered

### Alternative A: Extend Remittance

Idea:

- crear una remesa temprana con estado especial para representar el comprobante VIP

Problemas:

- semántica incorrecta: el usuario todavía no está creando una remesa completa
- requiere nuevos estados de remesa o sobrecargar estados existentes
- aumenta el riesgo de regresiones en submit, pago, entrega y cancelación
- contamina reporting y queries actuales de remittances

Decisión:

- descartada

### Alternative B: Reuse markRemittancePaid

Idea:

- usar el contrato actual de `markRemittancePaid` y volver opcional la remesa asociada

Problemas:

- rompe la semántica actual del contrato
- obliga a aceptar casos inválidos para el flujo histórico
- incrementa complejidad condicional en use-cases y adapters existentes
- hace más frágil la evolución del lifecycle de remesas

Decisión:

- descartada

### Alternative C: Create separate entity and module

Idea:

- introducir `VipPaymentProof` con puertos y casos de uso propios

Ventajas:

- semántica correcta
- menor riesgo de regresión
- módulo aislado y testeable
- extensible a notificaciones, linkage futuro y reporting posterior

Decisión:

- elegida

## Why A Separate Entity Is The Correct Choice

`VipPaymentProof` representa una intención y una evidencia de pago previa a la remesa, no una remesa en sí misma.

Por eso la elección de entidad separada no es una preferencia de modelado sino una protección explícita de invariantes:

- evita redefinir qué significa `Remittance`
- evita cambiar qué significa `markRemittancePaid`
- evita que reporting o queries de remittances empiecen a mezclar objetos heterogéneos
- permite evolucionar este flujo sin riesgo sobre el core actual

La decisión correcta para este change es una entidad y módulo independientes con reutilización solo de infraestructura transversal.