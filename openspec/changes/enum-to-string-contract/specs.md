# Specs: enum-to-string-contract (CLOSED)

## Acceptance Criteria Status

- [x] **AC-1**: `SubmitRemittanceV2OriginAccountInput.originAccountType` usa `String!`.
- [x] **AC-2**: flujo submit interno tipa `originAccountType` como `string` sin dependencia del enum Prisma.
- [x] **AC-3**: enum huérfano `OriginAccountType` removido de Prisma schema.
- [x] **AC-4**: `ZELLE` requiere `zelleEmail`.
- [x] **AC-5**: `IBAN` requiere `iban`.
- [x] **AC-6**: `STRIPE` requiere `stripePaymentMethodId`.
- [x] **AC-7**: código no soportado falla explícitamente y no cae en STRIPE.
- [x] **AC-7.1**: no se amplió el set funcional soportado (`ZELLE`, `IBAN`, `STRIPE`).
- [x] **AC-8**: persistencia real de remesas sin cambios estructurales.
- [x] **AC-9**: `npm run build` correcto.
- [x] **AC-10**: `PORT=3001 npm run start:dev` correcto y `schema.gql` alineado.

## Evidence Summary

- ZELLE con string válido: PASS.
- IBAN con string válido: PASS.
- STRIPE con string válido: PASS.
- Código desconocido (`ACH`): error explícito `originAccountType is not supported`.
- Faltante de campo requerido por tipo: FAIL esperado por validación.
- GraphQL input desacoplado del enum: `originAccountType: String!` en schema generado.
- Enum `OriginAccountType` ya no presente en schema GraphQL final.

## Technical Validation Summary

- Build exitoso.
- Runtime `start:dev` exitoso.
- Schema code-first regenerado correctamente.
- Smoke tests automatizados del use case: PASS.

## Final Conclusion

Todos los acceptance criteria del change están cumplidos.

Estado final del change:

- implementado
- validado
- acotado
- listo para merge
- separado explícitamente de la fase futura de validación data-driven