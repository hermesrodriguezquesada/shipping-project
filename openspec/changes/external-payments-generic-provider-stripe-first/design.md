# Design: external-payments-generic-provider-stripe-first

## Design status

PROPOSED

## Design goal

Habilitar pagos externos reales preservando el lifecycle actual de remittances y su semantica de negocio.

El objetivo central es desacoplar la integracion de provider con un puerto generico y mapear la confirmacion externa al mismo significado de pago aceptado por la empresa.

## Current truth used as baseline

- submitRemittanceV2 crea PENDING_PAYMENT y no invoca providers externos.
- PaymentMethodAvailabilityBridgeAdapter solo consulta catalogo y no expone type.
- markRemittancePaid representa reporte manual del cliente.
- adminConfirmRemittancePayment representa aceptacion de pago por la empresa.
- totalGeneratedAmount se incrementa solo en confirmPayment (idempotente por precondicion de estado).

## Proposed architecture

### 1. Minimal port changes

Se propone extender el seam de pagos con cambios minimos:

- Ampliar PaymentMethodRef para incluir type.
- Mantener PaymentMethodAvailabilityBridgeAdapter como puente de catalogo.
- Agregar nuevo puerto ExternalPaymentProviderPort para abstraccion de providers externos.

Contrato conceptual minimo:

- createPaymentSession(input)
- parseAndVerifyWebhook(input)

Sin detalles Stripe en el contrato del dominio.

### 2. New provider adapters

- StripeExternalPaymentProviderAdapter implementa ExternalPaymentProviderPort.
- Adapter aislado en infraestructura, sin filtrar detalles Stripe a application contract.
- Wiring por token DI dedicado.

### 3. Persistence model (minimal)

Agregar un modelo Prisma dedicado para tracking de pagos externos por remesa.

Modelo propuesto: ExternalPayment

Relacion propuesta con remittance: 1:N

- Una remesa puede tener multiples intentos/sesiones externas historicas.
- Regla de aplicacion: solo una sesion activa por remesa a la vez.
- Reintentos crean nuevas filas de ExternalPayment y preservan trazabilidad.

Campos minimos:

- id (uuid)
- remittanceId (FK)
- provider (enum/string)
- providerPaymentId (string)
- providerSessionId (string nullable)
- providerCustomerId (string nullable)
- status (enum de pago externo)
- amount (Decimal)
- currencyCode (string)
- idempotencyKey (string)
- metadataJson (Json nullable)
- confirmedAt (DateTime nullable)
- createdAt, updatedAt

Restricciones minimas:

- unique(provider, providerPaymentId)
- unique(idempotencyKey)
- index(remittanceId)
- index(provider, status)

Reglas de aplicacion:

- Solo una fila activa por remesa en estados CREATED o PENDING.
- Una nueva sesion para la misma remesa requiere cerrar la anterior (EXPIRED o FAILED) o reutilizarla por idempotencia.

No se modifica el shape canónico de originAccount.

### 4. GraphQL contract (generic)

Nueva mutation de remittances para crear sesion externa sobre remesa existente.

Input propuesto minimo (generico):

- remittanceId: ID!

Datos deducidos de la remesa y configuracion:

- provider y paymentMethodCode: desde payment method ya ligado a la remesa.
- amount y currency: desde snapshot de remesa.
- successUrl/cancelUrl: desde configuracion de backend.

Output propuesto (generico):

- paymentId: ID!
- provider: ExternalPaymentProvider!
- checkoutUrl: String!
- expiresAt: DateTime (nullable)
- status: ExternalPaymentStatus!

Enums del contrato:

- ExternalPaymentProvider:
	- STRIPE
- ExternalPaymentStatus:
	- CREATED
	- PENDING
	- SUCCEEDED
	- FAILED
	- CANCELED
	- EXPIRED

Regla: sin campos Stripe-specific en GraphQL.

### 5. Webhook HTTP endpoint

Nuevo endpoint HTTP para callbacks asincronos de provider:

- Controller path: POST /payments/webhooks/:provider
- Effective runtime path en este backend: POST /api/payments/webhooks/:provider (por global prefix api)

Responsabilidad:

- verificar firma/autenticidad via ExternalPaymentProviderPort
- resolver evento canonicalizado
- aplicar idempotencia
- ejecutar transicion de dominio cuando corresponda

### 6. Lifecycle mapping rule

Pago externo exitoso NO usa markRemittancePaid.

Decision cerrada:

1. El webhook exitoso actualiza ExternalPayment a SUCCEEDED.
2. Luego ejecuta una ruta interna dedicada de pago externo aceptado (ExternalPaymentAcceptanceUseCase).
3. Esa ruta interna llama el mismo comando consolidado de confirmacion de pago (confirmPayment) sobre la remesa elegible.
4. El use case dispara el mismo evento PAYMENT_CONFIRMED via notifier.

Pago externo exitoso mapea al significado de pago aceptado por la empresa y preserva side effects actuales:

- remittance status a PAID_SENDING_TO_RECEIVER
- incremento de totalGeneratedAmount
- notificacion PAYMENT_CONFIRMED

Regla de compatibilidad de estado:

- La ruta interna no usa markRemittancePaid.
- Para no romper invariantes actuales, la ruta interna mueve primero la remesa a PENDING_PAYMENT_CONFIRMATION y confirma de inmediato en la misma transaccion de aplicacion.
- Resultado neto: se preserva la semantica de confirmacion empresarial y sus side effects, sin exponer paso manual.

### 7. Idempotency design

Idempotencia separada por flujo:

Idempotencia de creacion de sesion

- Entrada: remittanceId + provider + estado activo existente.
- Si ya existe sesion activa para esa remesa y provider, se retorna la misma sesion (no crea nueva fila).
- Si no existe sesion activa, crea nueva fila con idempotencyKey unico.
- Constraint de soporte: unique(idempotencyKey).

Idempotencia de procesamiento de webhook

- Deduplicacion por provider + providerEventId cuando exista.
- Fallback por provider + providerPaymentId + status terminal ya aplicado.
- Reprocesar evento repetido retorna no-op.
- Confirmacion de remesa mantiene seguridad extra por precondiciones de estado y confirmPayment idempotente.

Capas involucradas:

1. Provider event de webhook:
- deduplicar por provider + providerEventId o providerPaymentId segun disponibilidad.

2. ExternalPayment row:
- unique(provider, providerPaymentId)
- unique(idempotencyKey)

3. Remittance transition:
- aprovechar idempotencia actual de confirmPayment (precondicion PENDING_PAYMENT_CONFIRMATION) o equivalente seguro segun ajuste minimo acordado.

## Environment variables

Variables nuevas minimas:

- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_API_BASE_URL (opcional)
- EXTERNAL_PAYMENT_DEFAULT_PROVIDER (opcional)

Validacion en env.validation.ts y getters en config.service.ts.

## Risks and pending decisions

1. Estado previo a confirmar pago externo.

Decision tomada en este change: mover internamente a PENDING_PAYMENT_CONFIRMATION y confirmar en la misma ruta interna.

2. Concurrencia entre webhook y operaciones manuales.

Mitigar con locks transaccionales + idempotencia por unique constraints.

3. Reenvio de webhooks fuera de orden.

Mitigar con matriz de eventos permitidos por estado externo + no-op en estados terminales.

4. Dependencia de side effects actuales.

No duplicar incremento de totalGeneratedAmount ni eventos de email fuera de la ruta de confirmacion consolidada.

## Scope guardrails

- Sin cambios estructurales en submitRemittanceV2.
- Sin cambio de contrato canónico originAccount.
- Sin limpieza de enums legacy.
- Sin refactors transversales.
- Sin acoplar GraphQL a Stripe.
