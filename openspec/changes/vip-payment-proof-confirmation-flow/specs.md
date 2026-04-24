# Specs: vip-payment-proof-confirmation-flow

## Scenario 1: Cliente VIP crea comprobante correctamente

Given un usuario autenticado con `isVip = true`
And una moneda existente y habilitada
And un `paymentProofImg` válido en formato base64 o data URL
When ejecuta `createVipPaymentProof`
Then el sistema crea un `VipPaymentProof`
And persiste `accountHolderName`, `amount`, `currencyId` y `paymentProofKey`
And el estado inicial es `PENDING_CONFIRMATION`
And el contrato GraphQL retorna el comprobante creado sin exponer `paymentProofKey`

## Scenario 2: Cliente no VIP no puede crear comprobante

Given un usuario autenticado con `isVip = false`
When ejecuta `createVipPaymentProof`
Then el sistema rechaza la operación con error de autorización o regla de negocio
And no crea ningún `VipPaymentProof`
And no sube ninguna imagen persistente al storage final

## Scenario 3: Cliente VIP debe enviar datos válidos para crear el comprobante

Given un usuario autenticado con `isVip = true`
When ejecuta `createVipPaymentProof` con alguno de estos casos inválidos:
And `accountHolderName` vacío
And `amount <= 0`
And `currencyId` inexistente o deshabilitado
And `paymentProofImg` inválido o de tamaño no permitido
Then el sistema rechaza la operación
And no crea ningún registro

## Scenario 4: Cliente VIP lista solo sus comprobantes

Given un usuario VIP autenticado con comprobantes propios
And existen comprobantes de otros usuarios en el sistema
When ejecuta `myVipPaymentProofs`
Then la respuesta contiene solo comprobantes cuyo `userId` coincide con el usuario autenticado
And no incluye comprobantes de terceros

## Scenario 5: Admin lista todos los comprobantes VIP

Given un usuario con rol `ADMIN` o `EMPLOYEE`
And existen múltiples comprobantes VIP en distintos estados y monedas
When ejecuta `adminVipPaymentProofs`
Then la respuesta incluye comprobantes de todos los usuarios
And permite filtrar por:
And `status`
And `userId`
And `currencyId`
And `dateFrom`
And `dateTo`

## Scenario 6: Admin confirma comprobante pendiente

Given un comprobante VIP en estado `PENDING_CONFIRMATION`
And un usuario autenticado con rol `ADMIN` o `EMPLOYEE`
When ejecuta `adminConfirmVipPaymentProof`
Then el sistema cambia el estado a `CONFIRMED`
And registra `reviewedById`
And registra `reviewedAt`
And mantiene `cancelReason` en null

## Scenario 7: Admin cancela comprobante pendiente con motivo

Given un comprobante VIP en estado `PENDING_CONFIRMATION`
And un usuario autenticado con rol `ADMIN` o `EMPLOYEE`
When ejecuta `adminCancelVipPaymentProof` con un `reason` no vacío
Then el sistema cambia el estado a `CANCELED`
And persiste `cancelReason`
And registra `reviewedById`
And registra `reviewedAt`

## Scenario 8: No se puede confirmar ni cancelar un comprobante ya revisado

Given un comprobante VIP en estado `CONFIRMED` o `CANCELED`
When un `ADMIN` o `EMPLOYEE` intenta confirmarlo o cancelarlo nuevamente
Then el sistema rechaza la transición
And no altera `status`
And no sobrescribe la auditoría de revisión existente

## Scenario 9: Admin no puede cancelar sin motivo

Given un comprobante VIP en estado `PENDING_CONFIRMATION`
When un `ADMIN` o `EMPLOYEE` ejecuta `adminCancelVipPaymentProof` con `reason` vacío o solo espacios
Then el sistema rechaza la operación
And el comprobante permanece en `PENDING_CONFIRMATION`

## Scenario 10: Cliente no puede ver URL de comprobante de otro usuario

Given un usuario VIP autenticado
And existe un comprobante VIP perteneciente a otro usuario
When ejecuta `vipPaymentProofViewUrl` con el id de ese comprobante
Then el sistema rechaza la operación
And no retorna ninguna signed URL

## Scenario 11: Admin sí puede ver URL de cualquier comprobante

Given un usuario autenticado con rol `ADMIN` o `EMPLOYEE`
And existe un comprobante VIP de cualquier usuario
When ejecuta `vipPaymentProofViewUrl`
Then el sistema retorna una URL firmada temporal de lectura
And no expone `paymentProofKey`

## Scenario 12: El flujo actual de remesas no se rompe

Given el backend ya soporta:
And `submitRemittanceV2`
And `markRemittancePaid`
And `adminConfirmRemittancePayment`
And `adminMarkRemittanceDelivered`
And `cancelMyRemittance`
And `adminCancelRemittance`
When se agrega el módulo `VipPaymentProof`
Then el significado de `markRemittancePaid` permanece intacto
And no se requiere crear `Remittance` para crear un comprobante VIP
And no se modifican estados ni lifecycle de `Remittance`
And el schema GraphQL existente solo cambia de forma aditiva

## Scenario 13: El flujo usa storage seguro y no expone la key interna

Given un comprobante VIP creado correctamente
When el sistema persiste la imagen del comprobante
Then el archivo se almacena en S3 usando el patrón de storage existente
And la base de datos guarda solo una key interna
And GraphQL no expone esa key directamente

## Scenario 14: El módulo queda fuera de reporting en esta fase

Given el backend tiene reporting y exportaciones administrativas en evolución
When se implementa `VipPaymentProof`
Then el nuevo agregado no entra automáticamente en reporting ni export existente
And cualquier integración analítica futura requiere un change separado