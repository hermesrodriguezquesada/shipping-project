# Specs: Unify Payment Method Admin Mutations (Closed)

## Acceptance Criteria Status

- [x] **AC-1: nueva mutación unificada disponible**
	- Evidencia: `src/schema.gql` contiene `adminUpdatePaymentMethod(input: AdminUpdatePaymentMethodInput!): PaymentMethodType!` e `input AdminUpdatePaymentMethodInput`.

- [x] **AC-2: permite actualizar solo description**
	- Evidencia: validado funcionalmente.

- [x] **AC-3: permite actualizar solo additionalData**
	- Evidencia: validado funcionalmente.

- [x] **AC-4: permite actualizar ambos campos**
	- Evidencia: validación funcional real con `code: "ZELLE"`, `description: "Descripcion combinada"`, `additionalData: "Additional combinado"` y respuesta correcta.

- [x] **AC-5: falla si no se envía ningún campo actualizable**
	- Evidencia: error de validación con mensaje `At least one of description or additionalData must be provided`.

- [x] **AC-6: falla si el payment method no existe**
	- Evidencia: validado funcionalmente (error not found).

- [x] **AC-7: compatibilidad hacia atrás preservada**
	- Evidencia: `adminUpdatePaymentMethodDescription` y `adminUpdatePaymentMethodAdditionalData` continúan disponibles y sin cambios.

- [x] **AC-8: sin cambios en Prisma**
	- Evidencia: sin cambios en Prisma schema y sin migraciones.

- [x] **AC-9: validación code-first correcta**
	- Evidencia: `npm run build` OK, `PORT=3001 npm run start:dev` OK y `src/schema.gql` actualizado correctamente.

## Final Conclusion

Todos los acceptance criteria del change están cumplidos. El resultado final es implementado, validado y backward compatible.