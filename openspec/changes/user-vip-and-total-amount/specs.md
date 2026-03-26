# Specs: user-vip-and-total-amount

> **Estado: TODOS LOS ACs CUMPLIDOS ✔** — Validación completada el 24 de marzo de 2026 con evidencia real de ejecución.

---

## isVip

### AC-1: adminCreateUser puede establecer isVip

Cuando se invoca `adminCreateUser` con `isVip: true`, el usuario se crea con `isVip = true` en base de datos y el campo aparece en el retorno con valor `true`.

---

### AC-2: adminCreateUser omite isVip → default false

Cuando se invoca `adminCreateUser` sin proveer `isVip`, el usuario se crea con `isVip = false`. El retorno refleja `isVip: false`.

---

### AC-3: adminUpdateUserProfile puede actualizar isVip

Cuando se invoca `adminUpdateUserProfile` con `isVip: false` sobre un usuario que tiene `isVip = true`, el campo se actualiza en base de datos y el retorno refleja el nuevo valor `false`.

El comportamiento es equivalente a la actualización de cualquier otro campo de perfil: `undefined` no altera el campo, un valor explícito lo actualiza.

---

### AC-4: existe mutación dedicada adminSetUserVip

La mutación `adminSetUserVip(input: AdminSetUserVipInput!): UserType!` existe en el schema GraphQL, está protegida por `Role.ADMIN` y actualiza únicamente la bandera `isVip` del usuario indicado.

---

### AC-5: adminSetUserVip retorna el usuario actualizado

El retorno de `adminSetUserVip` es `UserType!` y refleja el estado actual del usuario tras la actualización, incluyendo el nuevo valor de `isVip`.

---

### AC-6: adminSetUserVip sobre usuario inexistente retorna error

Si `userId` no corresponde a ningún usuario existente, la operación lanza `NotFoundDomainException` (se traduce a un error GraphQL apropiado). No se modifica ningún dato.

---

## totalGeneratedAmount

### AC-7: default 0 para todos los usuarios

Todos los usuarios —tanto los creados antes como los creados después de la migración— tienen `totalGeneratedAmount = 0` como valor inicial.

---

### AC-8: incrementa al confirmar pago

Cuando se ejecuta `adminConfirmRemittancePayment` para una remesa en estado `PENDING_PAYMENT_CONFIRMATION`, `totalGeneratedAmount` del usuario propietario (`senderUserId`) se incrementa en el valor exacto de `Remittance.amount`.

---

### AC-9: no incrementa dos veces ante reintentos o concurrencia

Si `adminConfirmRemittancePayment` se invoca más de una vez para la misma remesa (reintento o llamada concurrente), solo se realiza **un** incremento. La segunda invocación no produce ningún cambio en `totalGeneratedAmount`. La operación es idempotente.

---

### AC-10: suma Remittance.amount, no netReceivingAmount

El valor que se acumula es `Remittance.amount` (monto pagado por el cliente en moneda de pago).

No se suma:
- `netReceivingAmount`
- `commissionAmount`
- `deliveryFeeAmount`

---

### AC-11: aplica a todos los usuarios, VIP o no

`totalGeneratedAmount` se incrementa independientemente del valor de `isVip` del usuario propietario. La acumulación no tiene condición sobre el estado VIP.

---

## Persistencia y contrato GraphQL

### AC-12: migración Prisma generada y correcta

Existe una migración que agrega:

```prisma
isVip                Boolean  @default(false)
totalGeneratedAmount Decimal  @default(0)
```

al modelo `User`. La migración no contiene sentencias `UPDATE` de datos históricos.

---

### AC-13: schema GraphQL actualizado

`src/schema.gql` (generado code-first) refleja:

```graphql
type UserType {
  ...
  isVip: Boolean!
  totalGeneratedAmount: String!
}

input AdminCreateUserInput {
  ...
  isVip: Boolean
}

input AdminUpdateUserProfileInput {
  ...
  isVip: Boolean
}

input AdminSetUserVipInput {
  userId: ID!
  isVip: Boolean!
}

type Mutation {
  ...
  adminSetUserVip(input: AdminSetUserVipInput!): UserType!
}
```

---

### AC-14: build correcto

`npm run build` finaliza sin errores de TypeScript ni de generación de schema.

---

### AC-15: validación code-first

`PORT=3001 npm run start:dev` arranca correctamente. El archivo `src/schema.gql` refleja todos los cambios de contrato descritos en AC-13.

---

## Evidencia de validación

### AC-8 — Incremento correcto de totalGeneratedAmount ✔

Remesa consultada: `f0c73e2d-ddd8-4ffe-9d86-b6f56ec42931`

Resultado observado tras `adminConfirmRemittancePayment`:

```
status: "PAID_SENDING_TO_RECEIVER"
paymentAmount: "100"
owner.totalGeneratedAmount: "100"
```

Confirma que `totalGeneratedAmount` aumentó exactamente en `Remittance.amount` (`100`), sin incluir comisión ni delivery fee.

### AC-9 — Idempotencia confirmada ✔

Segunda llamada a `adminConfirmRemittancePayment` sobre la misma remesa retornó:

```
"Only PENDING_PAYMENT_CONFIRMATION remittances can be confirmed"
```

`totalGeneratedAmount` permaneció en `"100"`. No hubo doble conteo.

### AC-13 / AC-14 / AC-15 — GraphQL y build validados ✔

`src/schema.gql` generado con `PORT=3001 npm run start:dev` contiene todos los contratos definidos en AC-13. `npm run build` finalizó con exit code 0.

---

## Backfill

**Decisión explícita**: este change **NO incluye backfill**.

- Usuarios existentes tendrán `isVip = false` tras la migración.
- Usuarios existentes tendrán `totalGeneratedAmount = 0` tras la migración, independientemente de sus remesas históricas confirmadas.
- El acumulado crecerá únicamente a partir de confirmaciones realizadas después del despliegue de esta migración.
- Un backfill histórico de `totalGeneratedAmount` queda fuera del alcance de este change y debe gestionarse como tarea de datos independiente si se requiere en el futuro.
