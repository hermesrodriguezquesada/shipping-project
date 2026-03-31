# Tasks: external-payments-generic-provider-stripe-first

## 1. Domain and seam (minimal changes)

- [ ] Extender PaymentMethodRef para incluir type y propagarlo en PaymentMethodAvailabilityBridgeAdapter.
- [ ] Crear ExternalPaymentProviderPort con dos operaciones: createPaymentSession y parseAndVerifyWebhook.
- [ ] Agregar token DI para ExternalPaymentProviderPort en shared tokens.

## 2. Prisma model and migration

- [ ] Crear modelo ExternalPayment con relacion 1:N hacia Remittance (remittanceId FK).
- [ ] Agregar enum ExternalPaymentProvider con valor inicial STRIPE.
- [ ] Agregar enum ExternalPaymentStatus con valores: CREATED, PENDING, SUCCEEDED, FAILED, CANCELED, EXPIRED.
- [ ] Definir constraints: unique(idempotencyKey), unique(provider, providerPaymentId), index(remittanceId), index(provider, status).
- [ ] Implementar regla de una sesion activa por remesa en capa de aplicacion.
- [ ] Generar migracion SQL sin cambios innecesarios en submitRemittanceV2 ni originAccount.

## 3. Application flow: create external session

- [ ] Crear use case CreateExternalPaymentSessionUseCase.
- [ ] Validar remesa existente y estado PENDING_PAYMENT.
- [ ] Resolver provider/metodo desde remesa (sin pedir paymentMethodCode en input).
- [ ] Validar que el payment method resuelto sea PLATFORM y enabled.
- [ ] Implementar idempotencia de creacion: reutilizar sesion activa existente para la misma remesa/provider.
- [ ] Si no existe sesion activa, crear ExternalPayment en estado CREATED y llamar ExternalPaymentProviderPort.createPaymentSession.
- [ ] Persistir providerPaymentId/providerSessionId/checkoutUrl/estado PENDING y devolver output generico.

## 4. GraphQL contract (provider-agnostic)

- [ ] Agregar input minimo CreateExternalPaymentSessionInput con solo remittanceId.
- [ ] Agregar output CreateExternalPaymentSessionPayload con provider enum generico, status enum generico, checkoutUrl y expiresAt.
- [ ] Agregar mutation createExternalPaymentSession en resolver correspondiente.
- [ ] Regenerar schema y verificar ausencia de campos Stripe-specific.

## 5. HTTP webhook endpoint

- [ ] Crear controller HTTP con ruta de controller payments/webhooks y handler POST :provider.
- [ ] Mantener compatibilidad con prefijo global api del backend.
- [ ] Implementar parseo y verificacion de autenticidad via ExternalPaymentProviderPort.parseAndVerifyWebhook.

## 6. Idempotencia de webhook

- [ ] Implementar deduplicacion por providerEventId cuando exista.
- [ ] Implementar fallback por providerPaymentId + estado ya terminal.
- [ ] Reintentos duplicados deben terminar en no-op y responder exito tecnico.

## 7. Lifecycle mapping (decision cerrada)

- [ ] Crear ExternalPaymentAcceptanceUseCase como ruta interna dedicada para exito externo.
- [ ] Esa ruta NO debe llamar markRemittancePaid.
- [ ] Esa ruta debe mover internamente la remesa a PENDING_PAYMENT_CONFIRMATION y confirmar en la misma ejecucion.
- [ ] Confirmar preservacion de side effects actuales de adminConfirmRemittancePayment:
- [ ] status final PAID_SENDING_TO_RECEIVER.
- [ ] incremento idempotente de totalGeneratedAmount.
- [ ] notificacion PAYMENT_CONFIRMED.

## 8. Stripe adapter (first provider)

- [ ] Implementar StripeExternalPaymentProviderAdapter en infraestructura.
- [ ] Implementar createPaymentSession mapeando a contrato generico.
- [ ] Implementar parseAndVerifyWebhook y canonicalizacion de evento.
- [ ] Mantener aislamiento de detalles Stripe fuera de GraphQL/domain contract.

## 9. Config and environment

- [ ] Agregar STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET en validacion de entorno.
- [ ] Agregar getters en config service.
- [ ] Confirmar que no quedan secretos hardcodeados.

## 10. Validation and smoke

- [ ] Ejecutar npm run build.
- [ ] Ejecutar PORT=3001 npm run start:dev.
- [ ] Revisar src/schema.gql y validar nuevos tipos/mutation/enums.
- [ ] Smoke: crear sesion externa para remesa elegible.
- [ ] Smoke: webhook success confirma pago por ruta interna dedicada.
- [ ] Smoke: webhook duplicado no duplica side effects.
- [ ] Smoke: flujo manual markRemittancePaid sigue intacto.

## 11. Scope final checks

- [ ] Sin cambios en submitRemittanceV2 mas alla de compatibilidad estricta.
- [ ] Sin cambios en originAccount canonico.
- [ ] Sin refactors transversales no pedidos.
