# Tasks: pricing-commission-delivery-fees

- [x] Extender `schema.prisma` con `CommissionRule` y `DeliveryFeeRule`.
- [x] Extender `Remittance` con campos snapshot de pricing.
- [x] Crear y aplicar migración Prisma de pricing.
- [x] Implementar módulo `commission-rules` (hexagonal + GraphQL admin).
- [x] Implementar módulo `delivery-fees` (hexagonal + GraphQL admin).
- [x] Implementar módulo `pricing` con `pricingPreview` read-only.
- [x] Integrar cálculo/snapshot de pricing en `submit-remittance.usecase.ts`.
- [x] Actualizar seed inicial con reglas de comisión USD/EUR PERSON.
- [x] Validar `npx prisma migrate dev`.
- [x] Validar `npx prisma generate`.
- [x] Validar `npm run build`.
- [x] Validar arranque `PORT=3001 npm run start:dev`.
- [x] Confirmar `schema.gql` contiene `pricingPreview` y mantiene contratos existentes.
