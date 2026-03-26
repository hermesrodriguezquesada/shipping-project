
---

## specs.md

```md
# Specs: canonical-origin-account-model

## Acceptance criteria

### AC-1: canonical origin account input

`SubmitRemittanceV2OriginAccountInput` MUST use canonical fields:

- `paymentMethodCode: String!`
- `data: JSON!`

El input final MUST NOT exponer campos fijos por método:
- `zelleEmail`
- `iban`
- `stripePaymentMethodId`

### AC-2: JSON scalar introduced

El sistema MUST introducir soporte de scalar `JSON` en GraphQL para soportar el payload canónico de origin account en input y output.

### AC-3: generic method support contract

El contrato canónico MUST soportar ZELLE, IBAN y STRIPE mediante el mismo shape (`paymentMethodCode` + `data`) sin ramas de input específicas por método.

### AC-4: metadata-driven validation

La validación de `originAccount.data` MUST depender de metadata del catálogo del `PaymentMethod` asociado y MUST NOT estar hardcodeada por método en el submit.

### AC-5: validation metadata minimum

La metadata de validación por método MUST definir como mínimo:

- `schemaVersion`
- `allowedFields`
- `requiredFields`
- `fieldDefinitions`

### AC-6: strict metadata errors

Si la metadata:
- no existe,
- no parsea,
- no contiene el contrato mínimo,
- o contiene definiciones inválidas,

el submit MUST fallar con error explícito de configuración inválida.

### AC-7: strict payload validation

Si `originAccount.data`:
- contiene campos fuera de `allowedFields`,
- omite campos de `requiredFields`,
- o incumple `fieldDefinitions`,

el submit MUST fallar con error explícito de validación.

### AC-8: new methods without structural submit changes

Un método nuevo correctamente configurado en catálogo MUST poder validarse y usarse sin modificar el shape del submit ni agregar branching por método en el use case.

### AC-9: canonical persistence

La persistencia de origin account en `Remittance` MUST usar una representación canónica genérica en `originAccountData`.

### AC-10: legacy persistence removal

El modelo final de persistencia MUST eliminar:
- `originZelleEmail`
- `originIban`
- `originStripePaymentMethodId`

### AC-11: historical backfill

El change MUST migrar datos históricos existentes desde columnas legacy al nuevo campo canónico `originAccountData`.

### AC-12: canonical read model

La lectura/output de remittance MUST exponer origin account en forma canónica:

- `paymentMethodCode`
- `data`

### AC-13: legacy output removal

El contrato final de salida MUST NOT depender de:
- `originZelleEmail`
- `originIban`
- `originStripePaymentMethodId`

### AC-14: ZELLE canonical support

ZELLE MUST seguir funcionando dentro del modelo canónico nuevo.

### AC-15: IBAN canonical support

IBAN MUST seguir funcionando dentro del modelo canónico nuevo.

### AC-16: STRIPE canonical support

STRIPE MUST seguir funcionando dentro del modelo canónico nuevo.

### AC-17: strict scope isolation

El change MUST mantenerse aislado al dominio origin account y MUST NOT incluir cambios de pricing/comisión, manual beneficiary, destination rename, auth o temas no relacionados.

### AC-18: build correct

`npm run build` MUST finalizar correctamente.

### AC-19: start:dev correct

`PORT=3001 npm run start:dev` MUST iniciar correctamente.

### AC-20: schema.gql reflects canonical contract

`schema.gql` MUST reflejar:
- el nuevo input canónico
- el nuevo output canónico
- el scalar JSON requerido para ese contrato

## Validation scenarios

### Scenario 1: canonical ZELLE input

- Given un submit con `originAccount.paymentMethodCode = "ZELLE"`
- And `originAccount.data = { "zelleEmail": "sender@example.com" }`
- When se ejecuta submit
- Then la operación es válida sin campos legacy dedicados

### Scenario 2: canonical IBAN input

- Given un submit con `originAccount.paymentMethodCode = "IBAN"`
- And `originAccount.data = { "iban": "ES9121000418450200051332" }`
- When se ejecuta submit
- Then la operación es válida sin campos legacy dedicados

### Scenario 3: canonical STRIPE input

- Given un submit con `originAccount.paymentMethodCode = "STRIPE"`
- And `originAccount.data = { "stripePaymentMethodId": "pm_xxx" }`
- When se ejecuta submit
- Then la operación es válida sin campos legacy dedicados

### Scenario 4: unknown field rejected

- Given un método con `allowedFields` definidos
- When `data` incluye una llave no permitida
- Then la validación rechaza el submit

### Scenario 5: required field missing

- Given un método con `requiredFields`
- When `data` omite un requerido
- Then la validación rechaza el submit

### Scenario 6: invalid metadata rejected

- Given un método con metadata inválida o incompleta
- When se ejecuta submit
- Then falla con error explícito de configuración inválida

### Scenario 7: new configured method works

- Given un método nuevo correctamente configurado en catálogo
- When se ejecuta submit con `paymentMethodCode` y `data` válidos
- Then la operación se valida sin tocar branching por método

### Scenario 8: historical remittance backfilled

- Given remittances históricas con datos en columnas legacy
- When se aplica la migración del change
- Then `originAccountData` queda poblado correctamente a partir de esos valores

### Scenario 9: canonical output returned

- Given una remittance existente
- When se consulta por GraphQL
- Then origin account se devuelve en shape canónico
- And no se depende de `originZelleEmail`, `originIban`, `originStripePaymentMethodId`