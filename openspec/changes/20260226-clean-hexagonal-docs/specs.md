## QA/Frontend API Guide (Standard)

### Header (todos los casos autenticados)

```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>"
}
```

---

## Queries

### paymentMethods
- Precondición: token válido.
- Descripción: lista métodos de pago.
- Ejemplo válido:
```graphql
query {
  paymentMethods(enabledOnly: true) { id code name enabled imgUrl description }
}
```
- Errores esperados: sin token => `Unauthorized`.

### receptionMethods
- Precondición: token válido.
- Descripción: lista métodos de recepción.
- Ejemplo válido:
```graphql
query {
  receptionMethods(enabledOnly: true) { id code name enabled imgUrl description }
}
```
- Errores esperados: sin token => `Unauthorized`.

### currencies
- Precondición: token válido.
- Descripción: lista monedas disponibles.
- Ejemplo válido:
```graphql
query {
  currencies(enabledOnly: true) { id code name enabled description }
}
```
- Errores esperados: sin token => `Unauthorized`.

### exchangeRate
- Precondición: token válido.
- Descripción: obtiene tasa vigente entre dos monedas.
- Ejemplo válido:
```graphql
query {
  exchangeRate(from: "USD", to: "CUP") { id rate enabled fromCurrency { code } toCurrency { code } }
}
```
- Errores esperados: sin token => `Unauthorized`.

### adminExchangeRates
- Precondición: token ADMIN.
- Descripción: lista tasas con filtros y paginación.
- Ejemplo válido:
```graphql
query {
  adminExchangeRates(from: "USD", to: "CUP", limit: 20, offset: 0) { id rate enabled }
}
```
- Errores esperados: sin token => `Unauthorized`; sin rol admin => `Forbidden`.

### myRemittance
- Precondición: token CLIENT y ownership.
- Descripción: devuelve una remesa del usuario actual.
- Ejemplo válido:
```graphql
query {
  myRemittance(id: "<REM_ID>") { id status amount currency { code } receivingCurrency { code } }
}
```
- Errores esperados: id de otro usuario => `null` o `NotFound` según implementación.

### myRemittances
- Precondición: token CLIENT.
- Descripción: lista remesas del usuario actual.
- Ejemplo válido:
```graphql
query {
  myRemittances(limit: 20, offset: 0) { id status amount }
}
```
- Errores esperados: sin token => `Unauthorized`.

### adminRemittances
- Precondición: token ADMIN.
- Descripción: lista global de remesas.
- Ejemplo válido:
```graphql
query {
  adminRemittances(limit: 20, offset: 0) { id status amount paymentDetails statusDescription }
}
```
- Errores esperados: sin token => `Unauthorized`; sin rol admin => `Forbidden`.

### adminRemittancesByUser
- Precondición: token ADMIN.
- Descripción: lista remesas por usuario.
- Ejemplo válido:
```graphql
query {
  adminRemittancesByUser(userId: "<USER_ID>", limit: 20, offset: 0) { id status amount }
}
```
- Errores esperados: sin token => `Unauthorized`; sin rol admin => `Forbidden`.

### adminRemittance
- Precondición: token ADMIN.
- Descripción: detalle de remesa por id.
- Ejemplo válido:
```graphql
query {
  adminRemittance(id: "<REM_ID>") { id status amount paymentDetails statusDescription }
}
```
- Errores esperados: sin token => `Unauthorized`; sin rol admin => `Forbidden`.

---

## Mutations

### createRemittanceDraft
- Precondición: token CLIENT y beneficiary propio.
- Descripción: crea draft y retorna `ID`.
- Ejemplo válido:
```graphql
mutation {
  createRemittanceDraft(beneficiaryId: "<BEN_ID>")
}
```
- Errores esperados: beneficiary de otro usuario => `NotFound`/`Forbidden`.

### createRemittanceDraftV2
- Precondición: token CLIENT y beneficiary propio.
- Descripción: crea draft y retorna `RemittanceType`.
- Ejemplo válido:
```graphql
mutation {
  createRemittanceDraftV2(input: { beneficiaryId: "<BEN_ID>" }) {
    id status amount createdAt
    currency { code name enabled }
    receivingCurrency { code name enabled }
    paymentMethod { code name enabled imgUrl description }
    receptionMethod { code name enabled imgUrl description }
    beneficiary { id fullName }
  }
}
```
- Errores esperados: beneficiary de otro usuario => `NotFound`/`Forbidden`.

### setRemittanceAmount
- Precondición: token CLIENT + draft propio.
- Descripción: actualiza monto.
- Ejemplo válido:
```graphql
mutation {
  setRemittanceAmount(input: { remittanceId: "<REM_ID>", amount: "100.00" })
}
```
- Errores esperados: fuera de min/max, estado no DRAFT, ownership inválido.

### setRemittanceOriginAccount
- Precondición: token CLIENT + draft propio.
- Descripción: establece cuenta origen por tipo.
- Ejemplo válido:
```graphql
mutation {
  setRemittanceOriginAccount(input: {
    remittanceId: "<REM_ID>",
    originAccountType: ZELLE,
    zelleEmail: "client@mail.com"
  })
}
```
- Errores esperados: combinación inválida de campos por tipo, método deshabilitado.

### setRemittanceReceptionMethod
- Precondición: token CLIENT + draft propio.
- Descripción: establece método de recepción.
- Ejemplo válido:
```graphql
mutation {
  setRemittanceReceptionMethod(input: { remittanceId: "<REM_ID>", receptionMethod: CUP_TRANSFER })
}
```
- Errores esperados: método deshabilitado, estado no DRAFT.

### setRemittanceReceivingCurrency
- Precondición: token CLIENT + draft propio.
- Descripción: establece moneda de recepción.
- Ejemplo válido:
```graphql
mutation {
  setRemittanceReceivingCurrency(input: { remittanceId: "<REM_ID>", currencyCode: "CUP" })
}
```
- Errores esperados: moneda deshabilitada/no existente, estado no DRAFT.

### setRemittanceDestinationCupCard
- Precondición: token CLIENT + draft propio.
- Descripción: define tarjeta destino CUP.
- Ejemplo válido:
```graphql
mutation {
  setRemittanceDestinationCupCard(input: {
    remittanceId: "<REM_ID>",
    destinationCupCardNumber: "9200123412341234"
  })
}
```
- Errores esperados: estado no DRAFT, formato inválido.

### setRemittanceOriginAccountHolder
- Precondición: token CLIENT + draft propio.
- Descripción: define titular de cuenta origen.
- Ejemplo válido:
```graphql
mutation {
  setRemittanceOriginAccountHolder(input: {
    remittanceId: "<REM_ID>",
    holderType: PERSON,
    firstName: "Ana",
    lastName: "Perez"
  })
}
```
- Errores esperados: datos inconsistentes con holderType.

### submitRemittance
- Precondición: token CLIENT + draft completo y válido.
- Descripción: envía remesa y congela snapshot FX.
- Ejemplo válido:
```graphql
mutation {
  submitRemittance(remittanceId: "<REM_ID>")
}
```
- Errores esperados: campos faltantes, tasa no disponible, estado no DRAFT.

### markRemittancePaid
- Precondición: token CLIENT + ownership + estado permitido.
- Descripción: marca pago del cliente.
- Ejemplo válido:
```graphql
mutation {
  markRemittancePaid(remittanceId: "<REM_ID>", paymentDetails: "Zelle ref #123")
}
```
- Errores esperados: estado inválido, ownership inválido.

### cancelMyRemittance
- Precondición: token CLIENT + ownership + estado cancelable.
- Descripción: cancela remesa por cliente.
- Ejemplo válido:
```graphql
mutation {
  cancelMyRemittance(remittanceId: "<REM_ID>")
}
```
- Errores esperados: estado no cancelable, ownership inválido.

### adminConfirmRemittancePayment
- Precondición: token ADMIN + estado permitido.
- Descripción: confirma pago.
- Ejemplo válido:
```graphql
mutation {
  adminConfirmRemittancePayment(remittanceId: "<REM_ID>")
}
```
- Errores esperados: sin rol admin, estado inválido.

### adminCancelRemittance
- Precondición: token ADMIN.
- Descripción: cancela remesa con razón.
- Ejemplo válido:
```graphql
mutation {
  adminCancelRemittance(remittanceId: "<REM_ID>", statusDescription: "Pago rechazado")
}
```
- Errores esperados: sin rol admin, estado terminal.

### adminMarkRemittanceDelivered
- Precondición: token ADMIN + estado permitido.
- Descripción: marca entrega final.
- Ejemplo válido:
```graphql
mutation {
  adminMarkRemittanceDelivered(remittanceId: "<REM_ID>")
}
```
- Errores esperados: sin rol admin, estado inválido.

### adminUpdatePaymentMethodDescription
- Precondición: token ADMIN.
- Descripción: actualiza descripción del método de pago.
- Ejemplo válido:
```graphql
mutation {
  adminUpdatePaymentMethodDescription(code: "ZELLE", description: "Pago Zelle") { code description }
}
```
- Errores esperados: sin rol admin, code inexistente.

### adminSetPaymentMethodEnabled
- Precondición: token ADMIN.
- Descripción: habilita/deshabilita método de pago.
- Ejemplo válido:
```graphql
mutation {
  adminSetPaymentMethodEnabled(code: "ZELLE", enabled: true) { code enabled }
}
```
- Errores esperados: sin rol admin, code inexistente.

### adminUpdateReceptionMethodDescription
- Precondición: token ADMIN.
- Descripción: actualiza descripción de método de recepción.
- Ejemplo válido:
```graphql
mutation {
  adminUpdateReceptionMethodDescription(code: "CUP_TRANSFER", description: "Transferencia CUP") { code description }
}
```
- Errores esperados: sin rol admin, code inexistente.

### adminSetReceptionMethodEnabled
- Precondición: token ADMIN.
- Descripción: habilita/deshabilita método de recepción.
- Ejemplo válido:
```graphql
mutation {
  adminSetReceptionMethodEnabled(code: "CUP_TRANSFER", enabled: true) { code enabled }
}
```
- Errores esperados: sin rol admin, code inexistente.

### adminCreateCurrency
- Precondición: token ADMIN.
- Descripción: crea moneda.
- Ejemplo válido:
```graphql
mutation {
  adminCreateCurrency(input: { code: "EUR", name: "Euro", description: "Moneda EUR" }) { code name enabled }
}
```
- Errores esperados: sin rol admin, code duplicado.

### adminUpdateCurrency
- Precondición: token ADMIN.
- Descripción: actualiza moneda.
- Ejemplo válido:
```graphql
mutation {
  adminUpdateCurrency(input: { code: "EUR", name: "Euro", description: "Euro actualizado" }) { code name description }
}
```
- Errores esperados: sin rol admin, code inexistente.

### adminSetCurrencyEnabled
- Precondición: token ADMIN.
- Descripción: habilita/deshabilita moneda.
- Ejemplo válido:
```graphql
mutation {
  adminSetCurrencyEnabled(code: "EUR", enabled: true) { code enabled }
}
```
- Errores esperados: sin rol admin, code inexistente.

### adminCreateExchangeRate
- Precondición: token ADMIN + monedas existentes.
- Descripción: crea tasa.
- Ejemplo válido:
```graphql
mutation {
  adminCreateExchangeRate(input: { from: "USD", to: "CUP", rate: "330.25", enabled: true }) {
    id rate enabled fromCurrency { code } toCurrency { code }
  }
}
```
- Errores esperados: sin rol admin, monedas inexistentes, rate inválido.

### adminUpdateExchangeRate
- Precondición: token ADMIN + id existente.
- Descripción: actualiza tasa.
- Ejemplo válido:
```graphql
mutation {
  adminUpdateExchangeRate(input: { id: "<RATE_ID>", rate: "331.10", enabled: true }) {
    id rate enabled
  }
}
```
- Errores esperados: sin rol admin, id inexistente.

### adminDeleteExchangeRate
- Precondición: token ADMIN + id existente.
- Descripción: elimina/desactiva tasa.
- Ejemplo válido:
```graphql
mutation {
  adminDeleteExchangeRate(id: "<RATE_ID>")
}
```
- Errores esperados: sin rol admin, id inexistente.

---

## Bloques por etapa (copy/paste)

### Etapa 0 — Crear draft (legacy + V2)
```graphql
# Header: Authorization Bearer <ACCESS_TOKEN>
mutation {
  createRemittanceDraft(beneficiaryId: "<BEN_ID>")
}
```

```graphql
# Header: Authorization Bearer <ACCESS_TOKEN>
mutation {
  createRemittanceDraftV2(input: { beneficiaryId: "<BEN_ID>" }) {
    id status amount
    beneficiary { id fullName }
    currency { code name enabled }
    receivingCurrency { code name enabled }
  }
}
```

### Etapa 1 — Wizard (común)
```graphql
# set amount
mutation {
  setRemittanceAmount(input: { remittanceId: "<RID>", amount: "100.00" })
}
```
```graphql
# set origin account (ejemplo ZELLE)
mutation {
  setRemittanceOriginAccount(input: {
    remittanceId: "<RID>",
    originAccountType: ZELLE,
    zelleEmail: "client@mail.com"
  })
}
```
```graphql
# set holder
mutation {
  setRemittanceOriginAccountHolder(input: {
    remittanceId: "<RID>",
    holderType: PERSON,
    firstName: "Ana",
    lastName: "Perez"
  })
}
```
```graphql
# set receiving currency
mutation {
  setRemittanceReceivingCurrency(input: { remittanceId: "<RID>", currencyCode: "CUP" })
}
```

### Etapa 2A — Variante CUP_TRANSFER (requiere tarjeta)
```graphql
mutation {
  setRemittanceReceptionMethod(input: { remittanceId: "<RID>", receptionMethod: CUP_TRANSFER })
}
```
```graphql
mutation {
  setRemittanceDestinationCupCard(input: {
    remittanceId: "<RID>",
    destinationCupCardNumber: "9200123412341234"
  })
}
```

### Etapa 2B — Variante NO CUP_TRANSFER (sin tarjeta)
```graphql
mutation {
  setRemittanceReceptionMethod(input: { remittanceId: "<RID>", receptionMethod: USD_CASH })
}
```

### Etapa 3 — Submit
```graphql
mutation {
  submitRemittance(remittanceId: "<RID>")
}
```

### Etapa 4 — Paid (cliente)
```graphql
mutation {
  markRemittancePaid(remittanceId: "<RID>", paymentDetails: "Zelle ref #123")
}
```

### Etapa 5 — Confirm (admin)
```graphql
mutation {
  adminConfirmRemittancePayment(remittanceId: "<RID>")
}
```

### Etapa 6 — Delivered (admin)
```graphql
mutation {
  adminMarkRemittanceDelivered(remittanceId: "<RID>")
}
```

### Casos de error rápidos (expected)
```graphql
# Sin token: Unauthorized
query { myRemittances { id } }
```
```graphql
# Ownership inválido: NotFound/Forbidden
mutation { cancelMyRemittance(remittanceId: "<REM_DE_OTRO_USUARIO>") }
```
```graphql
# Transición inválida: ValidationDomainException
mutation { adminMarkRemittanceDelivered(remittanceId: "<REM_EN_DRAFT>") }
```
```graphql
# Método deshabilitado: ValidationDomainException
mutation {
  setRemittanceOriginAccount(input: {
    remittanceId: "<RID>",
    originAccountType: ZELLE,
    zelleEmail: "client@mail.com"
  })
}
```
