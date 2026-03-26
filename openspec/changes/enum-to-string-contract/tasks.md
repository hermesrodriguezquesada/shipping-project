# Tasks: enum-to-string-contract (CLOSED)

## Completion Checklist

- [x] 1. Actualizar contrato GraphQL del input a `originAccountType: String!`.
- [x] 2. Mantener nombre de campo `originAccountType` (sin rename).
- [x] 3. Propagar tipado interno a `originAccountType: string` en flujo submit.
- [x] 4. Remover dependencia del enum Prisma en use case, puertos y adapter del scope.
- [x] 5. Eliminar enum huérfano `OriginAccountType` de Prisma schema.
- [x] 6. Crear/aplicar migración de cleanup sin migración de datos de remesas.
- [x] 7. Corregir branching para códigos no soportados con error explícito.
- [x] 8. Preservar reglas hardcodeadas para `ZELLE`, `IBAN`, `STRIPE`.
- [x] 9. Ejecutar `npm run build` con resultado OK.
- [x] 10. Ejecutar `PORT=3001 npm run start:dev` con resultado OK.
- [x] 11. Verificar `schema.gql` regenerado con `originAccountType: String!`.
- [x] 12. Ejecutar smoke tests submit: ZELLE, IBAN, STRIPE, unknown y faltantes requeridos.

## Scope Deviation Check

Sin desviaciones de alcance.

## Out-of-Scope Non-Impact Confirmation

- [x] no refactor data-driven
- [x] no uso de `PaymentMethod.additionalData`
- [x] no rename a `paymentMethodCode`
- [x] sin cambios en pricing/comisión
- [x] sin cambios en manual beneficiary visibility
- [x] sin cambios en destination field rename
- [x] sin cambios en auth/JWT/guards
- [x] sin cambios en módulos no relacionados

## Final State

Change cerrado documentalmente como:

- implementado
- validado
- acotado
- listo para merge
- separado de la fase futura data-driven