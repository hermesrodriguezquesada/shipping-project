# Tasks: vip-payment-proof-confirmation-flow

## Implementation checklist

- [x] **1. Discovery / read-only**
  - localizar el flujo actual de comprobante en remesas para reutilizar solo utilidades horizontales
  - identificar helper existente para parseo base64/data URL, validación MIME y límite de tamaño
  - identificar adapter o servicio actual para S3 upload y signed view URL
  - identificar patrón actual de guards `GqlAuthGuard`, `RolesGuard` y roles permitidos para admin backoffice
  - confirmar tipo GraphQL y mapper actual para montos decimales y paginación por `offset` y `limit`

- [x] **2. Prisma schema + migration**
  - agregar `VipPaymentProof` y `VipPaymentProofStatus` al schema Prisma
  - definir relaciones explícitas con `User` para owner y reviewer
  - agregar en `User` las relaciones inversas `vipPaymentProofs` y `reviewedVipPaymentProofs` con los mismos nombres de relación
  - agregar índices por `userId`, `status`, `currencyId`, `createdAt` y opcionalmente `reviewedById`
  - generar migración additive sin tocar tablas o columnas del lifecycle de remesas

- [x] **3. Domain ports / entity**
  - crear entidad o modelo de dominio `VipPaymentProof`
  - crear `vip-payment-proof-command.port.ts`
  - crear `vip-payment-proof-query.port.ts`
  - crear `vip-payment-proof-storage.port.ts`
  - definir DTOs de entrada y salida del dominio sin acoplarlos a GraphQL

- [x] **4. Use-cases**
  - implementar `create-vip-payment-proof.usecase.ts`
  - implementar `list-my-vip-payment-proofs.usecase.ts`
  - implementar `admin-list-vip-payment-proofs.usecase.ts`
  - implementar `admin-confirm-vip-payment-proof.usecase.ts`
  - implementar `admin-cancel-vip-payment-proof.usecase.ts`
  - implementar `get-vip-payment-proof-view-url.usecase.ts`
  - validar invariantes de estado y permisos en cada caso de uso

- [x] **5. Storage adapter**
  - crear `s3-vip-payment-proof-storage.adapter.ts`
  - reutilizar parser o validator existente para imágenes base64/data URL
  - reutilizar criterio actual de tamaño máximo
  - generar keys con prefijo dedicado para `vip-payment-proofs`
  - soportar signed URL de lectura sin exponer la key interna

- [x] **6. Prisma adapters**
  - crear `prisma-vip-payment-proof-command.adapter.ts`
  - crear `prisma-vip-payment-proof-query.adapter.ts`
  - implementar create, confirm, cancel y listados con filtros mínimos
  - asegurar que confirm y cancel solo operen sobre `PENDING_CONFIRMATION`
  - mapear relaciones `user`, `currency` y `reviewedBy` según el patrón vigente

- [x] **7. GraphQL types / inputs / resolver**
  - crear types code-first para `VipPaymentProof`, `VipPaymentProofStatus` y `VipPaymentProofViewPayload`
  - crear `CreateVipPaymentProofInput`
  - crear `VipPaymentProofListInput`
  - crear `AdminVipPaymentProofListInput`
  - usar `offset` y `limit` en los inputs de listado, siguiendo el patrón actual del repo
  - crear mapper GraphQL del módulo
  - crear `vip-payment-proofs.resolver.ts` con queries y mutations requeridas
  - no exponer `paymentProofKey` en ningún type de salida
  - hacer que `VipPaymentProofViewPayload` exponga `viewUrl` y `expiresAt`

- [x] **8. DI tokens and module wiring**
  - agregar tokens nuevos en `src/shared/constants/tokens.ts`
  - crear `VipPaymentProofsModule`
  - registrar puertos, adapters y use-cases en providers
  - seguir el patrón de inyección por tokens existente del repositorio

- [x] **9. Register AppModule**
  - registrar `VipPaymentProofsModule` en `app.module.ts`
  - verificar que el wiring sea aditivo y no altere imports de remittances

- [x] **10. Guards / roles / authorization**
  - proteger creación y consultas propias con autenticación
  - proteger listados y acciones admin con `ADMIN` o `EMPLOYEE` según patrón vigente
  - validar ownership en `vipPaymentProofViewUrl`
  - validar explícitamente `user.isVip` para `createVipPaymentProof`

- [x] **11. Schema regeneration**
  - levantar la app para regenerar `src/schema.gql`
  - verificar presencia de:
    - `createVipPaymentProof`
    - `adminConfirmVipPaymentProof`
    - `adminCancelVipPaymentProof`
    - `myVipPaymentProofs`
    - `adminVipPaymentProofs`
    - `vipPaymentProofViewUrl`
    - `VipPaymentProof`
    - `VipPaymentProofStatus`
    - `viewUrl` y `expiresAt` dentro de `VipPaymentProofViewPayload`

- [x] **12. Tests / smoke tests**
  - agregar pruebas unitarias o de integración de use-cases críticos si el módulo sigue ese patrón
  - cubrir creación exitosa por usuario VIP
  - cubrir rechazo a usuario no VIP
  - cubrir confirmación y cancelación solo desde `PENDING_CONFIRMATION`
  - cubrir rechazo de acceso a URL de comprobante ajeno
  - ejecutar smoke test o validación manual equivalente para schema GraphQL y flujo principal

- [x] **13. Manual validation**
  - ejecutar `npm run build`
  - ejecutar `PORT=3001 npm run start:dev`
  - revisar `src/schema.gql` y confirmar que el contrato nuevo es aditivo
  - validar que `submitRemittanceV2` y `markRemittancePaid` no fueron modificados
  - dejar evidencia mínima de validación para aprobación del change e inicio de implementación

## Notes

- Mantener el change con cambios mínimos y additive.
- No reutilizar `Remittance` como entidad principal.
- No modificar `markRemittancePaid` ni `submitRemittanceV2`.
- Notificaciones y reporting quedan documentados para una fase posterior.