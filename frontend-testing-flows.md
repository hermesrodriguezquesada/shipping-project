# Frontend Testing Flows (GraphQL)

## 1. Objetivo
Este documento define una linea de pruebas para frontend sobre:
- Origin account canonico (paymentMethodCode + data)
- Validacion de destinationAccountNumber por metodo TRANSFER
- Control de guardado de beneficiario manual con saveManualBeneficiary
- Mutacion unificada para payment methods (descripcion + additionalData)
- Usuarios VIP y totalGeneratedAmount
- Extensibilidad por configuracion (ejemplo USDT)

## 2. Precondiciones
- API corriendo en http://localhost:3000/graphql
- Usuario admin disponible
- Usar GraphQL Playground/Apollo Sandbox

## 3. Autenticacion
### 3.1 Login
```graphql
mutation Login {
  login(
    input: {
      email: "hermesrodriguezquesada@gmail.com"
      password: "Hrq170319*."
    }
  ) {
    accessToken
    refreshToken
    sessionId
    user {
      id
      email
      role
      isActive
      isDeleted
    }
  }
}
```

### 3.2 Header
```json
{
  "Authorization": "Bearer TU_ACCESS_TOKEN"
}
```

### 3.3 Validar sesion
```graphql
query Me {
  me {
    id
    email
    role
    isActive
    isDeleted
  }
}
```

## 4. Catalogos base
### 4.1 Payment Methods
```graphql
query PaymentMethods {
  paymentMethods(enabledOnly: true) {
    code
    name
    enabled
    additionalData
  }
}
```
Esperado:
- Ver metodos como IBAN, ZELLE, STRIPE (y los nuevos que se creen)
- additionalData contiene metadata JSON serializada para validaciones dinamicas

### 4.2 Reception Methods
```graphql
query ReceptionMethods {
  receptionMethods(enabledOnly: true) {
    code
    name
    method
    currency {
      code
    }
  }
}
```
Esperado:
- method puede ser CASH o TRANSFER
- destinationAccountNumber sera obligatorio cuando method sea TRANSFER

## 5. Flujo remesa canonica (ZELLE)
### 5.1 Pricing preview
```graphql
query PricingPreviewUSD {
  pricingPreview(
    input: {
      amount: "100"
      country: "CU"
      city: "La Habana"
      region: "Plaza"
      holderType: PERSON
      paymentCurrencyCode: "USD"
      receivingCurrencyCode: "CUP"
    }
  ) {
    commissionAmount
    deliveryFeeAmount
    netReceivingAmount
    exchangeRateRate
    commissionCurrencyCode
    deliveryFeeCurrencyCode
    netReceivingCurrencyCode
  }
}
```

### 5.2 Submit (CASH, sin destinationAccountNumber)
```graphql
mutation SubmitRemittanceZelle {
  submitRemittanceV2(
    input: {
      paymentAmount: "100"
      paymentCurrencyCode: "USD"
      receivingCurrencyCode: "CUP"
      receptionMethod: CUP_CASH
      deliveryLocation: {
        country: "CU"
        city: "La Habana"
        region: "Plaza"
      }
      originAccountHolder: {
        holderType: PERSON
        firstName: "Hermes"
        lastName: "Rodriguez"
      }
      originAccount: {
        paymentMethodCode: "ZELLE"
        data: { zelleEmail: "sender@example.com" }
      }
      manualBeneficiary: {
        fullName: "Beneficiario Zelle"
        country: "CU"
        addressLine1: "Calle 10"
        phone: "+5355512345"
        documentNumber: "12345678901"
      }
      saveManualBeneficiary: false
    }
  ) {
    id
    status
    paymentAmount
    originAccount {
      paymentMethodCode
      data
    }
    paymentMethod {
      code
    }
    createdAt
  }
}
```
Esperado:
- status en PENDING_PAYMENT
- originAccount.paymentMethodCode = ZELLE
- originAccount.data contiene zelleEmail

### 5.3 Validar listado
```graphql
query MyRemittances {
  myRemittances(limit: 10, offset: 0) {
    id
    status
    paymentAmount
    destinationAccountNumber
    originAccount {
      paymentMethodCode
      data
    }
    paymentMethod {
      code
    }
    createdAt
  }
}
```

## 6. Regla TRANSFER: destinationAccountNumber requerido
### 6.1 Caso negativo (debe fallar)
```graphql
mutation SubmitTransferMissingAccount {
  submitRemittanceV2(
    input: {
      paymentAmount: "120"
      paymentCurrencyCode: "USD"
      receivingCurrencyCode: "CUP"
      receptionMethod: CUP_TRANSFER
      deliveryLocation: {
        country: "CU"
        city: "Holguin"
        region: "Velazco"
      }
      originAccountHolder: {
        holderType: PERSON
        firstName: "Maria"
        lastName: "Infante"
      }
      originAccount: {
        paymentMethodCode: "IBAN"
        data: { iban: "ES9121000418450200051332" }
      }
      manualBeneficiary: {
        fullName: "Beneficiario IBAN"
        country: "CU"
        addressLine1: "Ave 2 #45"
        phone: "+5355599999"
        documentNumber: "98765432109"
      }
      saveManualBeneficiary: false
    }
  ) {
    id
  }
}
```
Esperado:
- Error: destinationAccountNumber is required for TRANSFER reception methods

### 6.2 Caso positivo (debe pasar)
```graphql
mutation SubmitTransferWithAccount {
  submitRemittanceV2(
    input: {
      paymentAmount: "120"
      paymentCurrencyCode: "USD"
      receivingCurrencyCode: "CUP"
      receptionMethod: CUP_TRANSFER
      destinationAccountNumber: "9220000000001234"
      deliveryLocation: {
        country: "CU"
        city: "Holguin"
        region: "Velazco"
      }
      originAccountHolder: {
        holderType: PERSON
        firstName: "Maria"
        lastName: "Infante"
      }
      originAccount: {
        paymentMethodCode: "IBAN"
        data: { iban: "ES9121000418450200051332" }
      }
      manualBeneficiary: {
        fullName: "Beneficiario IBAN"
        country: "CU"
        addressLine1: "Ave 2 #45"
        phone: "+5355599999"
        documentNumber: "98765432109"
      }
      saveManualBeneficiary: false
    }
  ) {
    id
    status
    destinationAccountNumber
    originAccount {
      paymentMethodCode
      data
    }
  }
}
```

## 7. saveManualBeneficiary (true/false)
### 7.1 Crear con false
Usar cualquier submit con `saveManualBeneficiary: false`.

### 7.2 Crear con true
Repetir submit cambiando a `saveManualBeneficiary: true`.

### 7.3 Comparar visibilidad
```graphql
query MyBeneficiaries {
  myBeneficiaries(input: { limit: 50, offset: 0 }) {
    id
    fullName
    isFavorite
    timesUsed
  }
}
```
Esperado:
- Con true, beneficiario aparece para el usuario
- Con false, no debe quedar visible para reutilizacion en lista del usuario

## 8. Mutacion unificada de payment method (descripcion + additionalData)
```graphql
mutation AdminUpdatePaymentMethodUnified {
  adminUpdatePaymentMethod(
    input: {
      code: "USDT_TRC20"
      description: "USDT wallet on TRC20/ERC20"
      additionalData: "{\"schemaVersion\":1,\"allowedFields\":[\"walletAddress\",\"network\"],\"requiredFields\":[\"walletAddress\",\"network\"],\"fieldDefinitions\":{\"walletAddress\":{\"type\":\"string\",\"required\":true,\"minLength\":20,\"maxLength\":128},\"network\":{\"type\":\"string\",\"required\":true,\"enum\":[\"TRC20\",\"ERC20\"]}}}"
    }
  ) {
    code
    description
    additionalData
    updatedAt
  }
}
```

## 9. VIP y totalGeneratedAmount
### 9.1 Crear usuario con isVip
```graphql
mutation AdminCreateUserVip {
  adminCreateUser(
    input: {
      email: "client.vip@example.com"
      password: "Secret123*"
      role: CLIENT
      firstName: "Client"
      lastName: "VIP"
      isVip: true
    }
  ) {
    id
    email
    isVip
    totalGeneratedAmount
  }
}
```

### 9.2 Actualizar perfil admin con isVip
```graphql
mutation AdminUpdateUserProfileVip {
  adminUpdateUserProfile(
    input: {
      userId: "PEGA_USER_ID"
      isVip: false
    }
  ) {
    id
    isVip
  }
}
```

### 9.3 Toggle dedicado
```graphql
mutation AdminSetUserVip {
  adminSetUserVip(input: { userId: "PEGA_USER_ID", isVip: true }) {
    id
    isVip
  }
}
```

### 9.4 Ver totalGeneratedAmount antes/despues de confirmar pago
```graphql
query UserBefore {
  user(id: "PEGA_USER_ID") {
    id
    email
    isVip
    totalGeneratedAmount
  }
}
```

```graphql
mutation MarkRemittancePaid {
  markRemittancePaid(
    remittanceId: "PEGA_REMITTANCE_ID"
    paymentDetails: "Pago recibido en plataforma"
  )
}
```

```graphql
mutation AdminConfirmRemittancePayment {
  adminConfirmRemittancePayment(remittanceId: "PEGA_REMITTANCE_ID")
}
```

```graphql
query UserAfter {
  user(id: "PEGA_USER_ID") {
    id
    totalGeneratedAmount
  }
}
```
Esperado:
- totalGeneratedAmount incrementa al confirmar pago
- Aplica para usuarios VIP y no VIP

## 10. Flujo de extensibilidad: USDT + USDT_TRC20
### 10.1 Crear moneda
```graphql
mutation AdminCreateCurrencyUSDT {
  adminCreateCurrency(
    input: {
      code: "USDT"
      name: "USDT"
      description: "Stablecoin"
      enabled: true
    }
  ) {
    id
    code
    name
    enabled
  }
}
```

### 10.2 Crear rate
```graphql
mutation AdminCreateRateUSDTtoCUP {
  adminCreateExchangeRate(
    input: {
      from: "USDT"
      to: "CUP"
      rate: "365"
      enabled: true
    }
  ) {
    id
    rate
    fromCurrency { code }
    toCurrency { code }
  }
}
```

### 10.3 Crear regla comision
```graphql
mutation AdminCreateCommissionUSDT {
  adminCreateCommissionRule(
    input: {
      currencyCode: "USDT"
      holderType: PERSON
      thresholdAmount: "0"
      percentRate: "5"
      flatFee: "0"
      enabled: true
    }
  ) {
    id
    currency { code }
    holderType
    percentRate
    flatFee
    thresholdAmount
    enabled
  }
}
```

### 10.4 Crear payment method
```graphql
mutation AdminCreatePaymentMethodUSDT {
  adminCreatePaymentMethod(
    input: {
      code: "USDT_TRC20"
      name: "USDT TRC20"
      description: "USDT wallet over TRC20 network"
      enabled: true
      additionalData: "{\"schemaVersion\":1,\"allowedFields\":[\"walletAddress\",\"network\"],\"requiredFields\":[\"walletAddress\",\"network\"],\"fieldDefinitions\":{\"walletAddress\":{\"type\":\"string\",\"required\":true,\"minLength\":20,\"maxLength\":128},\"network\":{\"type\":\"string\",\"required\":true,\"enum\":[\"TRC20\",\"ERC20\"]}}}"
    }
  ) {
    id
    code
    enabled
    additionalData
  }
}
```

### 10.5 Pricing preview USDT
```graphql
query PricingPreviewUSDT {
  pricingPreview(
    input: {
      amount: "100"
      country: "CU"
      city: "La Habana"
      region: "Plaza"
      holderType: PERSON
      paymentCurrencyCode: "USDT"
      receivingCurrencyCode: "CUP"
    }
  ) {
    commissionAmount
    deliveryFeeAmount
    netReceivingAmount
    exchangeRateRate
    commissionCurrencyCode
    deliveryFeeCurrencyCode
    netReceivingCurrencyCode
  }
}
```
Esperado:
- commissionAmount = 5
- netReceivingAmount = 34675

### 10.6 Submit remesa USDT_TRC20
```graphql
mutation SubmitRemittanceUSDT {
  submitRemittanceV2(
    input: {
      paymentAmount: "100"
      paymentCurrencyCode: "USDT"
      receivingCurrencyCode: "CUP"
      receptionMethod: CUP_CASH
      deliveryLocation: {
        country: "CU"
        city: "La Habana"
        region: "Plaza"
      }
      originAccountHolder: {
        holderType: PERSON
        firstName: "Hermes"
        lastName: "Rodriguez"
      }
      originAccount: {
        paymentMethodCode: "USDT_TRC20"
        data: {
          walletAddress: "TRON_TEST_WALLET_12345678901234567890"
          network: "TRC20"
        }
      }
      manualBeneficiary: {
        fullName: "Beneficiario USDT"
        country: "CU"
        addressLine1: "Calle 10"
        phone: "+5355512345"
        documentNumber: "12345678901"
      }
      saveManualBeneficiary: false
    }
  ) {
    id
    status
    paymentAmount
    originAccount {
      paymentMethodCode
      data
    }
    paymentMethod {
      code
    }
    createdAt
  }
}
```

## 11. Criterio de cierre para frontend
Checklist de aceptacion:
- [ ] submitRemittanceV2 acepta originAccount canonico con paymentMethodCode dinamico
- [ ] destinationAccountNumber solo es requerido si receptionMethod.method == TRANSFER
- [ ] saveManualBeneficiary controla registro visible del manual beneficiary
- [ ] adminUpdatePaymentMethod modifica descripcion y additionalData en una sola mutacion
- [ ] isVip se puede setear en alta/edicion/toggle
- [ ] totalGeneratedAmount incrementa al confirmar pago
- [ ] USDT + USDT_TRC20 se configuran sin tocar codigo de negocio por metodo especifico
