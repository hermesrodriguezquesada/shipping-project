# Tasks: Unify Payment Method Admin Mutations (Closed)

## 1. New GraphQL input

- [x] Crear `AdminUpdatePaymentMethodInput` en `src/modules/catalogs/presentation/graphql/inputs/admin-update-payment-method.input.ts`
- [x] Incluir:
  - `code` requerido
  - `description` opcional
  - `additionalData` opcional
- [x] Agregar validaciones apropiadas

## 2. New use case

- [x] Crear `AdminUpdatePaymentMethodUseCase` en `src/modules/catalogs/application/use-cases/admin-update-payment-method.usecase.ts`
- [x] Implementar validación:
  - al menos uno entre `description` y `additionalData` debe venir informado
- [x] Manejar error de not found
- [x] Resolver actualización del recurso de forma mínima y consistente

## 3. Resolver and module wiring

- [x] Agregar nueva mutación `adminUpdatePaymentMethod` en `CatalogsResolver`
- [x] Registrar el nuevo use case en `CatalogsModule`
- [x] Inyectar el use case en el resolver

## 4. Backward compatibility

- [x] Mantener sin cambios:
  - `adminUpdatePaymentMethodDescription`
  - `adminUpdatePaymentMethodAdditionalData`
- [x] Confirmar que siguen funcionando

## 5. Validation and schema

- [x] Ejecutar `npm run build`
- [x] Ejecutar `PORT=3001 npm run start:dev`
- [x] Verificar en `src/schema.gql`:
  - `adminUpdatePaymentMethod(input: AdminUpdatePaymentMethodInput!): PaymentMethodType!`
  - `input AdminUpdatePaymentMethodInput`

## 6. Smoke tests

- [x] Probar actualización solo de `description`
- [x] Probar actualización solo de `additionalData`
- [x] Probar actualización de ambos campos
- [x] Probar error cuando no llega ningún campo actualizable
- [x] Probar error con `code` inexistente
- [x] Verificar que las mutaciones existentes siguen funcionando

## 7. Final scope guardrails

- [x] Confirmar que no hubo cambios en Prisma schema
- [x] Confirmar que no hubo migraciones
- [x] Confirmar que no se eliminaron mutaciones existentes
- [x] Confirmar que no se tocaron otros módulos fuera de alcance

## Cierre de alcance

No hubo desviaciones del diseño ni expansión de alcance.

Estado final del change:

- Implementado
- Validado
- Backward compatible
- Listo para merge