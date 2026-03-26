
---

## tasks.md

```md
# Tasks: user-vip-and-total-amount

## Implementation checklist

- [x] **1. Migración Prisma**
  - Agregar `isVip Boolean @default(false)` al modelo `User`.
  - Agregar `totalGeneratedAmount Decimal @default(0)` al modelo `User`.
  - Generar migración: `npx prisma migrate dev --name user_vip_and_total_amount`.
  - Verificar que la migración es additive y **no contiene** sentencias `UPDATE` de datos históricos (no backfill).

  Definition of Done:
  ✔ Migración generada y aplicable
  ✔ Sin sentencias UPDATE en la migración

---

- [x] **2. Extender UserEntity**
  - Agregar `isVip: boolean` a `UserEntity` en `src/modules/users/domain/entities/user.entity.ts`.
  - Agregar `totalGeneratedAmount: Prisma.Decimal` a `UserEntity`.

  Definition of Done:
  ✔ Entidad compilable sin errores

---

- [x] **3. Extender puertos de usuario**
  - `UserCommandPort.create(...)`: agregar parámetro opcional `isVip?: boolean`.
  - `UserCommandPort.updateProfile(...)`: agregar parámetro opcional `isVip?: boolean`.

  Definition of Done:
  ✔ Puertos actualizados
  ✔ `npm run build` sin errores

---

- [x] **4. Extender PrismaUserCommandAdapter**
  - `create`: incluir `isVip` en el `data` si está definido (patrón spread condicional existente).
  - `updateProfile`: incluir `isVip` en el `data` si está definido.
  - `toDomain` (privado): incluir `isVip: row.isVip` y `totalGeneratedAmount: row.totalGeneratedAmount` en el mapeo `PrismaUser → UserEntity`.

  Definition of Done:
  ✔ Adapter compilable
  ✔ `toDomain` proyecta ambos campos

---

- [x] **5. Extender PrismaUserQueryAdapter**
  - `toDomain` (privado): incluir `isVip: row.isVip` y `totalGeneratedAmount: row.totalGeneratedAmount` en el mapeo.

  Definition of Done:
  ✔ Adapter compilable
  ✔ `toDomain` proyecta ambos campos

---

- [x] **6. Extender UserMapper.toGraphQL**
  - Agregar `isVip: user.isVip`.
  - Agregar `totalGeneratedAmount: user.totalGeneratedAmount.toString()`.

  Definition of Done:
  ✔ Mapper compilable
  ✔ Serialización de Decimal a String consistente con el patrón del proyecto

---

- [x] **7. Extender UserType (output GraphQL)**
  - Agregar `@Field() isVip: boolean`.
  - Agregar `@Field(() => String) totalGeneratedAmount: string`.

  Definition of Done:
  ✔ `npm run build` sin errores
  ✔ `src/schema.gql` incluye ambos campos en `UserType`

---

- [x] **8. Actualizar AdminCreateUserInput**
  - Agregar campo opcional con decoradores:
    ```typescript
    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    isVip?: boolean;
    ```

  Definition of Done:
  ✔ Input compilable
  ✔ `src/schema.gql` incluye `isVip: Boolean` en `AdminCreateUserInput`

---

- [x] **9. Actualizar AdminCreateUserUseCase**
  - Agregar `isVip?: boolean` al input del método `execute`.
  - Pasar `isVip` a `commandPort.create(...)`.

  Definition of Done:
  ✔ Use case compilable

---

- [x] **10. Actualizar resolver adminCreateUser**
  - Pasar `isVip: input.isVip` al use case en `AdminUsersResolver.adminCreateUserMutation`.

  Definition of Done:
  ✔ Resolver compilable

---

- [x] **11. Actualizar AdminUpdateUserProfileInput**
  - Agregar campo opcional con decoradores:
    ```typescript
    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    isVip?: boolean;
    ```

  Definition of Done:
  ✔ Input compilable
  ✔ `src/schema.gql` incluye `isVip: Boolean` en `AdminUpdateUserProfileInput`

---

- [x] **12. Actualizar AdminUpdateUserProfileUseCase**
  - Agregar `isVip?: boolean` al input del método `execute`.
  - Pasar `isVip` a `usersCmd.updateProfile(...)`.

  Definition of Done:
  ✔ Use case compilable

---

- [x] **13. Actualizar resolver adminUpdateUserProfile**
  - Pasar `isVip: input.isVip` al use case en `AdminUsersResolver.adminUpdateUserProfile`.

  Definition of Done:
  ✔ Resolver compilable

---

- [x] **14. Crear AdminSetUserVipInput**
  - Nuevo `@InputType()` con:
    - `userId: string` — `@Field(() => ID)`, `@IsUUID()`.
    - `isVip: boolean` — `@Field()`, `@IsBoolean()`.

  Definition of Done:
  ✔ Input compilable

---

- [x] **15. Crear AdminSetUserVipUseCase**
  - Inyectar `USER_QUERY_PORT` y `USER_COMMAND_PORT`.
  - `execute({ userId, isVip })`:
    - Verificar existencia del usuario con `usersQuery.findById(userId)`.
    - Lanzar `NotFoundDomainException` si no existe.
    - Llamar a `usersCmd.updateProfile({ id: userId, isVip })`.
    - Retornar el `UserEntity` actualizado.

  Definition of Done:
  ✔ Use case compilable
  ✔ Lanza error si usuario no existe
  ✔ Actualiza y retorna usuario correctamente

---

- [x] **16. Registrar AdminSetUserVipUseCase en UsersModule**
  - Agregar `AdminSetUserVipUseCase` a `UsersModule.providers`.

  Definition of Done:
  ✔ Módulo compilable sin errores de inyección de dependencias

---

- [x] **17. Crear mutación adminSetUserVip en AdminUsersResolver**
  - Importar e inyectar `AdminSetUserVipUseCase` en el constructor.
  - Agregar mutación:
    ```typescript
    @Mutation(() => UserType, { name: 'adminSetUserVip' })
    async adminSetUserVip(
      @Args('input') input: AdminSetUserVipInput,
    ): Promise<UserType> {
      const updated = await this.setUserVip.execute({
        userId: input.userId,
        isVip: input.isVip,
      });
      return UserMapper.toGraphQL(updated);
    }
    ```
  - Protegida por `@UseGuards(GqlAuthGuard, RolesGuard)` y `@Roles(Role.ADMIN)` (heredados del resolver o aplicados explícitamente).

  Definition of Done:
  ✔ Resolver compilable
  ✔ `src/schema.gql` incluye `adminSetUserVip(input: AdminSetUserVipInput!): UserType!`

---

- [x] **18. Modificar PrismaRemittanceCommandAdapter.confirmPayment (operación atómica)**
  - Reemplazar la implementación actual por una transacción Prisma que:
    1. Ejecuta `updateMany` con condición `{ id, status: PENDING_PAYMENT_CONFIRMATION }` → estado nuevo `PAID_SENDING_TO_RECEIVER`.
    2. Si `result.count === 0` → la remesa ya fue procesada; **no incrementar**, retornar silenciosamente.
    3. Si `result.count > 0` → leer `amount` y `senderUserId` de la remesa dentro de la misma transacción.
    4. Incrementar `User.totalGeneratedAmount` con `{ increment: remittance.amount }` dentro de la misma transacción.
  - La firma del método **no cambia**: `confirmPayment(input: { id: string }): Promise<void>`.
  - El use case no requiere modificaciones; sigue invocando `this.remittanceCommand.confirmPayment({ id })`.

  Definition of Done:
  ✔ Adapter compilable
  ✔ La operación es atómica (única transacción Prisma)
  ✔ Idempotente: segunda invocación sobre misma remesa no incrementa

---

- [x] **19. Validación build**
  - Ejecutar `npm run build`.
  - Debe finalizar sin errores de TypeScript ni de generación de schema.

  Definition of Done:
  ✔ Exit code 0

---

- [x] **20. Validación code-first GraphQL**
  - Ejecutar `PORT=3001 npm run start:dev` y esperar bootstrap completo.
  - Revisar `src/schema.gql` y verificar que incluye:
    - `isVip: Boolean!` y `totalGeneratedAmount: String!` en `type UserType`.
    - `isVip: Boolean` en `input AdminCreateUserInput`.
    - `isVip: Boolean` en `input AdminUpdateUserProfileInput`.
    - `input AdminSetUserVipInput { userId: ID!, isVip: Boolean! }`.
    - `adminSetUserVip(input: AdminSetUserVipInput!): UserType!` en `type Mutation`.

  Definition of Done:
  ✔ Servidor arranca sin errores
  ✔ Todos los campos anteriores presentes en schema.gql

---

- [x] **21. Smoke test: isVip en adminCreateUser**
  - Crear usuario con `isVip: true` → retorno incluye `isVip: true`.
  - Crear usuario sin `isVip` → retorno incluye `isVip: false`.

  Definition of Done:
  ✔ Ambas variantes verificadas

---

- [x] **22. Smoke test: adminSetUserVip**
  - Activar VIP sobre usuario existente → retorno incluye `isVip: true`.
  - Desactivar VIP → retorno incluye `isVip: false`.
  - Invocar con `userId` inexistente → error NotFound.

  Definition of Done:
  ✔ Activación, desactivación y error verificados

---

- [x] **23. Smoke test: totalGeneratedAmount**
  - Confirmar una remesa (`adminConfirmRemittancePayment`) → el usuario propietario tiene `totalGeneratedAmount` incrementado en el valor de `Remittance.amount`.
  - Intentar confirmar la misma remesa una segunda vez → `totalGeneratedAmount` **no cambia** (idempotencia verificada).

  Definition of Done:
  ✔ Incremento correcto verificado
  ✔ Idempotencia verificada

---

- [x] **23.1. Smoke test: exposición GraphQL compartida**
  - Verificar que `isVip` y `totalGeneratedAmount` aparecen correctamente en superficies que reutilizan `UserType`:
    - `adminCreateUser`
    - `adminUpdateUserProfile`
    - `adminSetUserVip`
    - `me` o `myProfile`
    - `owner` dentro de `RemittanceType` (si aplica en pruebas disponibles)

  Definition of Done:
  ✔ Campos visibles y serializados correctamente donde `UserType` es reutilizado

---

- [x] **24. Confirmación de backfill**
  - Verificar que la migración generada no contiene sentencias `UPDATE` de datos históricos.
  - Documentar explícitamente: usuarios existentes arrancan con `isVip = false` y `totalGeneratedAmount = 0`.
  - Backfill histórico de `totalGeneratedAmount` queda fuera de este change.

  Definition of Done:
  ✔ Migración inspeccionada y confirmada sin UPDATE histórico
  ✔ Decisión documentada

---

## Constraints

- No modificar pricing ni el flujo de submit de remesas.
- No modificar auth, JWT ni guards fuera de la nueva mutación `adminSetUserVip`.
- No agregar filtro `isVip` a `adminUsers` en este change.
- No introducir `AdminUserType` separado en este change.
- No incluir backfill histórico.
- No refactors fuera del alcance indicado.
- La firma de `confirmPayment` no cambia; el cambio es interno al adapter.
```

---

## Cierre

### Todas las tareas completadas — 24 de marzo de 2026

Las 25 tareas del checklist (incluyendo smoke tests y confirmación de backfill) fueron completadas según lo especificado.

### Sin desviaciones de alcance

- No se modificaron componentes fuera del alcance indicado: pricing, submit, `originAccountType`, `manualBeneficiary`, auth, guards, filtro de `adminUsers`, `AdminUserType`.
- La firma de `confirmPayment` no fue alterada. El cambio fue interno al adapter.

### Backfill — confirmado ausente

La migración `20260324173130_user_vip_and_total_amount` es additive. No contiene sentencias `UPDATE` de datos históricos. Usuarios existentes arrancan con `isVip = false` y `totalGeneratedAmount = 0`.