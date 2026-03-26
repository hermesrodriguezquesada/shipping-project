# Tasks: remittance-destination-field-rename

## Status: ✅ ALL TASKS COMPLETED

**Completion date**: 25/03/2026  
**No scope deviations**: Confirmed — El change se ejecutó exactamente dentro del alcance declarado.  
**No side effects**: Confirmed — No hubo cambios incidentales en pricing, originAccountType, manual beneficiary visibility, o auth.

---

1. Confirmar baseline y alcance
- [x] Verificar referencias actuales de `destinationCupCardNumber` en submit/persistencia/capas internas
- [x] Confirmar que `RemittanceType.destinationAccountNumber` ya existe y se mantiene
- [x] Confirmar que no se incluyen cambios fuera de alcance

2. Actualizar persistencia
- [x] Revisar y actualizar `schema.prisma` para usar `destinationAccountNumber`
- [x] Crear migración de BD para rename real de columna hacia `destinationAccountNumber`
- [x] Verificar preservación de datos existentes tras la migración

3. Actualizar contrato GraphQL de input
- [x] Reemplazar en `SubmitRemittanceV2Input` el campo legacy por `destinationAccountNumber`
- [x] Validar que no quede compatibilidad dual accidental en este change

4. Propagar rename en backend
- [x] Actualizar use case de submit de remesas
- [x] Actualizar validaciones asociadas al campo manteniendo comportamiento actual
- [x] Actualizar puertos y adapters relacionados
- [x] Actualizar read models y mapeos internos GraphQL/dominio

5. Verificar output y esquema generado
- [x] Revisar que `RemittanceType.destinationAccountNumber` siga estable
- [x] Levantar app para regeneración/validación code-first (`PORT=3001 npm run start:dev`)
- [x] Revisar `src/schema.gql` para consistencia final del contrato

6. Validar calidad y comportamiento
- [x] Ejecutar build (`npm run build`)
- [x] Ejecutar smoke tests de submit y lectura post-submit
- [x] Verificar explícitamente que la regla de `TRANSFER` sigue operativa con el nuevo nombre

7. Cierre de change
- [x] Verificar ausencia total de `destinationCupCardNumber` activo en contrato y persistencia final
- [x] Confirmar que el change queda listo para implementación sin ambigüedades

## Final verification ✅

- ✅ Grep search: 0 referencias activas de `destinationCupCardNumber` en `src/`
- ✅ Schema.gql: `SubmitRemittanceV2Input` contiene `destinationAccountNumber`; no contiene `destinationCupCardNumber`
- ✅ Build: `npm run build` → 0 errores
- ✅ Tests: 9/9 pasaron (incluido smoke test nuevo)
- ✅ DB Migration: Aplicada exitosamente; datos preservados
- ✅ Code boundaries: Nada tocado fuera de alcance declarado
- ✅ OpenSpec tasks: Todos los checkboxes en estado completado [x]
