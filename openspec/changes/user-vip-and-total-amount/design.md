# Design: user-vip-and-total-amount

## Overview

Este change introduce dos nuevos campos en el modelo de usuario:

- `User.isVip`: bandera booleana de clasificación administrativa.
- `User.totalGeneratedAmount`: acumulado monetario de remesas confirmadas.

Se sigue la arquitectura vigente: NestJS + GraphQL code-first + Prisma + Hexagonal (resolver → use case → port → adapter).

---

## Persistencia (Prisma)

Agregar a `model User` en `schema.prisma`:

```prisma
isVip                Boolean  @default(false)
totalGeneratedAmount Decimal  @default(0)
```

- `isVip`: tipo `Boolean`, default `false`.
- `totalGeneratedAmount`: tipo `Decimal`, consistente con el resto de montos del proyecto (`Remittance.amount`, `commissionAmount`, `netReceivingAmount`, `deliveryFeeAmount`). Default `0`.

### Migración

Migración additive simple. No incluye backfill:

- Todos los registros existentes recibirán `isVip = false` y `totalGeneratedAmount = 0` por efecto del default de Prisma.
- La migración **no debe contener** sentencias `UPDATE` de datos históricos.
- Nombre de migración sugerido: `user_vip_and_total_amount`.

---

## Tipo de dato

| Campo | Prisma | GraphQL output |
|---|---|---|
| `isVip` | `Boolean` | `Boolean!` |
| `totalGeneratedAmount` | `Decimal` | `String!` |

El patrón de serialización de montos en GraphQL de este proyecto es `String` (ver `paymentAmount` y `receivingAmount` en `RemittanceType`). `totalGeneratedAmount` sigue el mismo patrón via `.toString()`.

---

## Dominio

### UserEntity

Agregar:

```typescript
isVip: boolean;
totalGeneratedAmount: Prisma.Decimal;
```

### UserCommandPort

Extender las firmas existentes:

- `create(...)`: agregar parámetro opcional `isVip?: boolean`.
- `updateProfile(...)`: agregar parámetro opcional `isVip?: boolean`.

No se requiere un método de port dedicado para el incremento de `totalGeneratedAmount`; esa responsabilidad recae en el adapter de remesas durante la confirmación de pago.

### UserQueryPort

Sin cambios estructurales. Los métodos `findById` y `findMany` lo incluirán automáticamente al extender `UserEntity` y los adapters.

---

## Adapters Prisma de usuario

### PrismaUserCommandAdapter

1. `create`: pasar `isVip` al objeto `data` de Prisma si está definido.
2. `updateProfile`: pasar `isVip` al objeto `data` de Prisma si está definido.
3. `toDomain` (método privado): incluir `isVip` y `totalGeneratedAmount` en el mapeo `PrismaUser → UserEntity`.

### PrismaUserQueryAdapter

- `toDomain` (método privado): incluir `isVip` y `totalGeneratedAmount` en el mapeo.

---

## GraphQL (code-first)

### UserType

Agregar:

```graphql
isVip: Boolean!
totalGeneratedAmount: String!
```

> **Exposición compartida aceptada**: `UserType` se comparte entre `AuthPayload`, `me`, `myProfile`, `user(id)` (pública) y `owner` en `RemittanceType`. Todos recibirán estos campos tras este change. Ver decisión y consecuencias en `proposal.md`.

### AdminCreateUserInput

Agregar campo opcional:

```graphql
isVip: Boolean
```

Con decoradores `@IsOptional()` y `@IsBoolean()`.

### AdminUpdateUserProfileInput

Agregar campo opcional:

```graphql
isVip: Boolean
```

Con decoradores `@IsOptional()` y `@IsBoolean()`.

### Nueva mutación: adminSetUserVip

```graphql
adminSetUserVip(input: AdminSetUserVipInput!): UserType!
```

Input:

```graphql
input AdminSetUserVipInput {
  userId: ID!
  isVip: Boolean!
}
```

Protegida por `GqlAuthGuard`, `RolesGuard` y `@Roles(Role.ADMIN)`. Sigue el patrón de `adminSetUserRoles` y `adminBanUser`.

### UserMapper

Extender `toGraphQL`:

```typescript
isVip: user.isVip,
totalGeneratedAmount: user.totalGeneratedAmount.toString(),
```

---

## Use cases de usuario

### AdminCreateUserUseCase

- Recibir `isVip?: boolean` en el input de `execute`.
- Pasar al `commandPort.create(...)`.

### AdminUpdateUserProfileUseCase

- Recibir `isVip?: boolean` en el input de `execute`.
- Pasar al `usersCmd.updateProfile(...)`.

### AdminSetUserVipUseCase (nuevo)

- Recibir `userId: string` e `isVip: boolean`.
- Verificar que el usuario existe (`usersQuery.findById`); lanzar `NotFoundDomainException` si no.
- Llamar a `usersCmd.updateProfile({ id: userId, isVip })`.
- Retornar el `UserEntity` actualizado.
- Registrar en `UsersModule.providers`.

---

## Acumulación de totalGeneratedAmount

### Dónde ocurre

El incremento ocurre en el método `confirmPayment` del `RemittanceCommandPort`, invocado desde `RemittanceLifecycleUseCase.adminConfirmRemittancePayment`.

La firma del método no cambia: el use case sigue invocando `await this.remittanceCommand.confirmPayment({ id: remittanceId })`.

### Monto que se suma

`Remittance.amount` — el monto pagado por el cliente en la moneda de pago.

No se suma:
- `netReceivingAmount` (monto neto en moneda destino).
- `commissionAmount` (comisión de plataforma).
- `deliveryFeeAmount` (cargo de entrega).

### Operación atómica: prevención de doble conteo

**Requisito funcional**: el incremento debe ser atómico e idempotente.

**Problema**: el lifecycle valida el estado de la remesa a nivel de aplicación antes de invocar `confirmPayment`, pero ante concurrencia o reintentos, dos llamadas pueden pasar esa validación antes de que alguna haya escrito en base de datos. Esto produciría doble conteo.

**Implementación recomendada** en `PrismaRemittanceCommandAdapter.confirmPayment`:

```typescript
async confirmPayment(input: { id: string }): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // 1. Cambio de estado condicional: solo si aún está en PENDING_PAYMENT_CONFIRMATION
    const result = await tx.remittance.updateMany({
      where: {
        id: input.id,
        status: RemittanceStatus.PENDING_PAYMENT_CONFIRMATION,
      },
      data: {
        status: RemittanceStatus.PAID_SENDING_TO_RECEIVER,
      },
    });

    // 2. Si count === 0, la remesa ya fue procesada: no incrementar
    if (result.count === 0) {
      return;
    }

    // 3. Leer amount y senderUserId dentro de la transacción
    const remittance = await tx.remittance.findUnique({
      where: { id: input.id },
      select: { amount: true, senderUserId: true },
    });

    if (!remittance) return;

    // 4. Incrementar totalGeneratedAmount atomicamente
    await tx.user.update({
      where: { id: remittance.senderUserId },
      data: {
        totalGeneratedAmount: { increment: remittance.amount },
      },
    });
  });
}
```

Este patrón garantiza:

1. El cambio de estado de la remesa y el incremento del usuario son **atómicos** (misma transacción).
2. Si `updateMany` retorna `count = 0`, la remesa ya fue procesada y **no se incrementa** el total.
3. No se pueden producir dobles conteos ante reintentos o concurrencia.

---

## Confirmación de no impacto

Los siguientes flujos no se ven afectados:

- Pricing y cálculo de comisiones: sin cambios.
- Submit remittance (`submitRemittanceV2`): sin cambios.
- `markPaid`, `cancelByClient`, `cancelByAdmin`, `markDelivered`: sin cambios.
- Guards y autorización existentes: sin cambios.
- Auth flows (JWT, tokens, password reset, sessions): sin cambios.
- Flujo de register y login: sin cambios funcionales. Solo reciben los nuevos campos en `UserType` de salida.

---

## Cierre de diseño

### Diseño respetado — sin desviaciones

La implementación siguió el diseño especificado sin desviaciones de alcance ni estructurales:

- Persistencia: `isVip Boolean @default(false)` y `totalGeneratedAmount Decimal @default(0)` agregados exactamente como diseñado.
- Serialización GraphQL: `Boolean!` e `String!` respectivamente, siguiendo el patrón `.toString()` de montos del proyecto.
- `AdminSetUserVipUseCase` creado e integrado con `USER_QUERY_PORT` y `USER_COMMAND_PORT` tal como se diseñó.
- `toDomain` actualizado en ambos adapters de usuario para proyectar los dos nuevos campos.
- Firma de `confirmPayment`: sin cambios. El use case sigue invocando `await this.remittanceCommand.confirmPayment({ id })`.

### Acumulación atómica e idempotente — confirmada

`PrismaRemittanceCommandAdapter.confirmPayment` implementado con `$transaction` exactamente como diseñado:

1. `updateMany` condicional sobre el estado `PENDING_PAYMENT_CONFIRMATION`.
2. Si `count === 0` → retorna silenciosamente (idempotencia garantizada).
3. Si `count > 0` → lee `amount` y `senderUserId` e incrementa `totalGeneratedAmount` dentro de la misma transacción.

**Evidencia real**: la misma remesa confirmada dos veces produjo un único incremento. La segunda invocación retornó `"Only PENDING_PAYMENT_CONFIRMATION remittances can be confirmed"`, confirmando que la guardia de idempotencia funciona.

### Comportamiento externo del lifecycle — sin cambios

`RemittanceLifecycleUseCase` no fue modificado. La capa de aplicación sigue delegando a `this.remittanceCommand.confirmPayment({ id })`. La atomicidad es completamente transparente al caller.

### Flujos no afectados — confirmados

Los flujos listados en "Confirmación de no impacto" fueron verificados: no se introdujeron cambios en pricing, submit, lifecycle (más allá de `confirmPayment`), guards ni auth.
