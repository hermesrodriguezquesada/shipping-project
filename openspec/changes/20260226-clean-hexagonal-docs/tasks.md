## Tasks

### A) DIP fino remittances
- [x] Crear puertos pequeños de disponibilidad/snapshot en `remittances/domain/ports`.
- [x] Crear adapters bridge en `remittances/infrastructure/adapters` delegando a puertos grandes por token.
- [x] Reescribir use-cases:
  - [x] set-remittance-origin-account
  - [x] set-remittance-reception-method
  - [x] set-remittance-receiving-currency
  - [x] submit-remittance
- [x] Registrar providers/tokens internos en `RemittancesModule`.

### B) Contrato GraphQL
- [x] Verificar operaciones Query requeridas intactas.
- [x] Verificar operaciones Mutation requeridas intactas.
- [x] Verificar unicidad de types: PaymentMethodType/ReceptionMethodType/CurrencyType/ExchangeRateType.
- [x] Verificar `RemittanceType` con `amount: String` y relaciones por objeto.

### C) Documentación QA/Frontend
- [x] Crear artifacts `proposal/design/specs/tasks` para el nuevo change.
- [x] Documentar para cada operación: Precondición/Header/Descripción/Ejemplo/Errores esperados.
- [x] Incluir operaciones admin pendientes de descripción.
- [x] Incluir bloques por etapa: Wizard → Submit → Paid → Confirm → Delivered.
- [x] Incluir variantes CUP_TRANSFER y no CUP_TRANSFER.

### D) Validación obligatoria
- [ ] `npx prisma generate`
- [ ] `npm run build`
- [ ] `PORT=3001 npm run start:dev`
- [ ] Evidencia en `schema.gql` y reporte final audit-ready
