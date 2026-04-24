# Proposal: vip-payment-proof-confirmation-flow

## Problem

El backend actual solo soporta comprobantes de pago asociados a una remesa ya existente.

Hoy `markRemittancePaid` significa:

- el cliente reporta el pago de una `Remittance` previamente creada
- el comprobante se procesa dentro del lifecycle actual de remesas
- el estado resultante afecta el flujo operativo de `Remittance`

El nuevo requerimiento es distinto:

- un cliente VIP debe poder reportar un pago o comprobante antes de crear cualquier remesa
- el área operativa debe revisar ese comprobante por separado
- la revisión no debe mezclar estados, reglas ni invariantes con `Remittance`

Si se intentara reutilizar `Remittance` como entidad principal, el sistema introduciría ambiguedad semántica entre:

- una remesa real en proceso
- una notificación previa de pago sin remesa

Eso aumentaría el riesgo de romper `submitRemittanceV2`, `markRemittancePaid`, `adminConfirmRemittancePayment` y el lifecycle existente.

## Motivation

Se necesita un flujo específico para clientes VIP que permita:

- recibir comprobantes de pago anticipados
- revisarlos administrativamente antes de cualquier remesa
- conservar trazabilidad operativa y de auditoría
- mantener intacto el flujo actual de remesas no VIP y VIP ya existente

Además, el modelo debe ser extensible para fases posteriores como:

- notificaciones dedicadas
- vinculación futura con remesas derivadas
- reporting o exportaciones específicas

## Proposed Solution

Crear un nuevo bounded context funcional dentro del backend llamado `VipPaymentProof`, independiente de `Remittance`.

El change propone:

1. Un nuevo modelo Prisma `VipPaymentProof` con lifecycle propio.
2. Un enum `VipPaymentProofStatus` con estados:
   - `PENDING_CONFIRMATION`
   - `CONFIRMED`
   - `CANCELED`
3. Un nuevo módulo hexagonal en `src/modules/vip-payment-proofs/`.
4. Nuevos puertos, casos de uso, adapters Prisma y adapter de storage S3 dedicados.
5. Nuevas queries y mutations GraphQL code-first para creación, listado, revisión y obtención de URL firmada.
6. Reutilización solo de utilidades horizontales ya existentes:
   - parseo de imagen base64/data URL
   - validación MIME y tamaño
   - storage S3
   - signed URLs
   - auth guards y role guards
   - consulta de monedas habilitadas si ya existe un adapter reutilizable

El cambio es estrictamente aditivo y no modifica el lifecycle ni la semántica de `Remittance`.

## Scope

Incluido en esta primera fase:

- creación de `VipPaymentProof` por cliente autenticado con `isVip = true`
- almacenamiento del comprobante en S3 usando patrón actual del proyecto
- persistencia del registro con estado inicial `PENDING_CONFIRMATION`
- listado paginado por `offset` y `limit` de comprobantes propios del cliente
- listado administrativo con filtros mínimos:
  - `status`
  - `userId`
  - `currencyId`
  - `dateFrom`
  - `dateTo`
- confirmación administrativa de comprobantes pendientes
- cancelación administrativa de comprobantes pendientes con motivo obligatorio
- generación de signed view URL para visualizar la imagen
- enforcement de permisos por rol y ownership
- actualización aditiva del contrato GraphQL y del schema generado code-first

## Out Of Scope

Fuera de alcance para este change:

- crear remesas automáticamente desde `VipPaymentProof`
- reutilizar `VipPaymentProof` dentro de `submitRemittanceV2`
- modificar `markRemittancePaid`
- modificar `adminConfirmRemittancePayment`
- modificar `adminMarkRemittanceDelivered`
- modificar estados o transición de `Remittance`
- integrar `VipPaymentProof` con reporting o exportaciones administrativas existentes
- introducir notificaciones obligatorias en esta primera fase
- backfill, migraciones de datos históricos o vínculos retroactivos
- flujos de pagos externos o `ExternalPayment`

## Risks

Riesgos principales y mitigación:

- Duplicar lógica de upload y validación de imágenes.
  - Mitigación: reutilizar helpers horizontales existentes, sin reutilizar casos de uso de remittances.
- Confusión conceptual entre comprobante VIP y comprobante de remesa.
  - Mitigación: entidad, módulo, enum y resolvers separados.
- Exposición accidental de la key interna de S3.
  - Mitigación: no exponer `paymentProofKey` en GraphQL; usar `vipPaymentProofViewUrl`.
- Errores de autorización al visualizar comprobantes.
  - Mitigación: validar ownership para cliente y bypass controlado para `ADMIN`/`EMPLOYEE`.
- Crecimiento de alcance por notificaciones o reporting.
  - Mitigación: dejar ambos temas explícitamente como fase posterior.

## Compatibility With Current Frontend And Backend

Compatibilidad esperada:

- El backend actual mantiene sin cambios el significado de `markRemittancePaid`.
- `submitRemittanceV2` no cambia contrato ni comportamiento.
- El schema GraphQL cambia de forma aditiva con nuevas queries, mutations, inputs y types.
- Los clientes actuales que no consuman estas nuevas operaciones no deben verse afectados.
- El frontend podrá implementar nuevas vistas de tabla para cliente VIP y admin sin depender del módulo de remesas.

## Decision Summary

Se elige una entidad separada `VipPaymentProof` porque el problema a resolver no es una variante del lifecycle de remesas, sino un flujo previo e independiente que solo comparte infraestructura transversal.

El resultado esperado es un flujo nuevo, aislado y additive, que habilita comprobantes VIP sin introducir acoplamiento indebido con `Remittance`.