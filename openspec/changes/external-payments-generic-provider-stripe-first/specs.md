# Specs: external-payments-generic-provider-stripe-first

## Acceptance criteria

### AC-1: PaymentMethod.type has real effect in external payment flow

El sistema MUST poder distinguir metodos MANUAL vs PLATFORM para el flujo de creacion de sesion externa, sin romper submitRemittanceV2.

### AC-2: Generic provider port

El dominio MUST introducir un puerto ExternalPaymentProviderPort desacoplado de Stripe-specific contracts.

### AC-3: Minimal persistence for external payment linkage

El sistema MUST persistir un registro de pago externo vinculado a remittance con identificadores del provider, estado, monto, moneda e idempotency key.

La relacion entre remittance y external payments MUST ser 1:N para conservar historico de intentos.

El sistema MUST aplicar la regla de una sola sesion activa por remesa al momento de crear nuevas sesiones.

### AC-4: Generic GraphQL contract for payment session

El backend MUST exponer una mutation generica para crear payment session de una remesa existente.

El input MUST ser minimo y contener solo remittanceId cuando provider, monto, moneda y metodo se pueden deducir de la remesa/configuracion.

La respuesta GraphQL MUST retornar datos genericos de sesion y MUST NOT exponer campos especificos de Stripe cuando pueden abstraerse.

### AC-5: Webhook HTTP endpoint

El backend MUST exponer endpoint HTTP de webhook por provider para confirmacion asincrona.

### AC-6: External success mapping

Un pago externo exitoso MUST mapear al significado de pago aceptado por la empresa y MUST preservar los side effects actuales de confirmacion de pago.

La implementacion MUST usar una ruta interna dedicada de aceptacion de pago externo y MUST NOT dejar alternativas ambiguas.

La ruta interna dedicada MUST NOT invocar markRemittancePaid.

La ruta interna dedicada MUST ejecutar el mismo comando consolidado de confirmacion de pago empresarial que hoy aplica status PAID_SENDING_TO_RECEIVER e incremento de totalGeneratedAmount.

### AC-7: markRemittancePaid isolation

El flujo externo exitoso MUST NOT usar markRemittancePaid como equivalente funcional.

### AC-8: totalGeneratedAmount compatibility

El incremento de totalGeneratedAmount MUST mantenerse alineado con la ruta de confirmacion de pago aceptado por la empresa, sin doble incremento.

### AC-9: Idempotent webhook handling

El procesamiento de webhook MUST ser idempotente ante reintentos, duplicados y eventos repetidos.

La idempotencia de webhook MUST definirse separada de la idempotencia de creacion de sesion.

La creacion de sesion MUST ser idempotente por remesa y provider cuando existe una sesion activa reutilizable.

### AC-10: Contract-safe remittance submit

submitRemittanceV2 MUST permanecer funcional con su contrato actual y su persistencia de snapshots/originAccount.

### AC-11: No Stripe-specific GraphQL leak

El contrato GraphQL de sesion de pago MUST ser reusable para futuros providers.

El contrato MUST fijar enums explicitos:

- ExternalPaymentProvider:
	- STRIPE
- ExternalPaymentStatus:
	- CREATED
	- PENDING
	- SUCCEEDED
	- FAILED
	- CANCELED
	- EXPIRED

### AC-12: Build and runtime validation

- npm run build MUST finalizar correctamente.
- PORT=3001 npm run start:dev MUST iniciar correctamente.
- src/schema.gql MUST reflejar solo los cambios GraphQL definidos en este change.

## Validation scenarios

### Scenario 1: create generic payment session for PLATFORM method

- Given una remesa en PENDING_PAYMENT
- And payment method de tipo PLATFORM habilitado
- When se ejecuta mutation createExternalPaymentSession
- Then se crea registro ExternalPayment o se reutiliza la sesion activa existente de forma idempotente
- And se retorna checkoutUrl generico

### Scenario 2: webhook success confirms business payment acceptance

- Given un ExternalPayment pendiente
- When llega webhook valido de pago exitoso
- Then se ejecuta ruta interna dedicada de pago externo aceptado
- And esa ruta confirma pago por la ruta consolidada de empresa
- And se preservan side effects actuales

### Scenario 3: duplicate webhook is idempotent

- Given el mismo evento webhook reenviado
- When se procesa nuevamente
- Then no se duplican cambios de estado ni incrementos acumulados

### Scenario 4: manual and external flows coexist

- Given flujo manual existente
- When cliente usa markRemittancePaid
- Then flujo manual mantiene comportamiento actual
- And no depende de provider externo

### Scenario 5: GraphQL remains provider-agnostic

- Given schema generado
- When se inspecciona contrato
- Then no hay campos Stripe-only en mutation/output genericos
- And provider y status usan enums genericos definidos por contrato
