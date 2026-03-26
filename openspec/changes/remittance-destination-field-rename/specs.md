# Specs: remittance-destination-field-rename

## Status: ✅ ALL ACCEPTANCE CRITERIA MET

**Verification date**: 25/03/2026  
**Evidence**: Code inspection, build validation, unit tests, integration scenarios, GraphQL schema inspection.

---

## Acceptance criteria

### Naming / submit

- ✅ AC-1: `submitRemittanceV2` usa `destinationAccountNumber` como nombre canónico.
  - **Evidence**: Código de resolver, use case y tests confirman uso del nuevo nombre en toda la cadena.
  
- ✅ AC-2: la validación de campo requerido para métodos `TRANSFER` sigue funcionando con `destinationAccountNumber`.
  - **Evidence**: Test unitario "fails for CUP_TRANSFER without destinationAccountNumber because method is TRANSFER" pasó.
  - **Evidence**: Error message: `destinationAccountNumber is required for TRANSFER reception methods`
  
- ✅ AC-3: `destinationCupCardNumber` no queda activo en contrato/input/dominio.
  - **Evidence**: Grep search en `src/` devolvió 0 referencias activas del nombre legacy.
  - **Evidence**: GraphQL input rechaza explícitamente el campo con error de validación.
  
- ✅ AC-4: la remesa se crea correctamente con el nuevo nombre de campo.
  - **Evidence**: Test exitoso "creates remittance for TRANSFER when destinationAccountNumber is provided".
  - **Evidence**: Remesa creada con status `PENDING_PAYMENT`, beneficiary y recipient resueltos.

### Persistencia / contrato

- ✅ AC-5: Prisma/schema usa `destinationAccountNumber`.
  - **Evidence**: `src/prisma/schema.prisma` L356 confirmado: `destinationAccountNumber String?`
  
- ✅ AC-6: la migración de BD renombra correctamente la columna y preserva datos.
  - **Evidence**: Migración aplicada con `prisma migrate deploy`.
  - **Evidence**: Output: "All migrations have been successfully applied."
  
- ✅ AC-6.1: datos históricos existentes se preservan tras el rename.
  - **Evidence**: Estrategia `ALTER TABLE RENAME COLUMN` usada (no copy-drop).
  - **Evidence**: Valores en columna legacy se preservan automáticamente al renombrar.
  
- ✅ AC-7: `RemittanceType.destinationAccountNumber` se mantiene estable.
  - **Evidence**: Output schema no modificado; campo existente se mantiene sin cambios.
  
- ✅ AC-8: build y validación code-first GraphQL resultan correctos tras el rename.
  - **Evidence**: `npm run build`: 0 errores.
  - **Evidence**: `PORT=3001 npm run start:dev`: App started successfully.
  - **Evidence**: `schema.gql` regenerado; input contiene `destinationAccountNumber`, output contiene `destinationAccountNumber`.

## Test scenarios

### Scenario 1: submit TRANSFER with canonical field ✅

- Given un submit con método de recepción `TRANSFER`
- When se envía `destinationAccountNumber`
- Then la solicitud pasa la validación del campo y continúa el flujo de creación
- **Evidence**: Test "creates remittance for TRANSFER when destinationAccountNumber is provided" → PASS

### Scenario 2: submit TRANSFER missing canonical field ✅

- Given un submit con método de recepción `TRANSFER`
- When no se envía `destinationAccountNumber`
- Then falla con el error esperado de campo requerido
- **Evidence**: Test "fails for CUP_TRANSFER without destinationAccountNumber because method is TRANSFER" → PASS

### Scenario 3: remittance read after creation ✅

- Given una remesa creada con `destinationAccountNumber`
- When se consulta posteriormente la remesa
- Then el valor se obtiene de forma consistente en los modelos de lectura y output GraphQL
- **Evidence**: Remesa consultada; `destinationAccountNumber` resuelto correctamente en output.

### Scenario 4: input/output consistency ✅

- Given la mutación de submit y la consulta de remesa
- When se inspecciona el contrato de entrada y salida
- Then ambos quedan alineados al naming canónico `destinationAccountNumber`
- **Evidence**: `schema.gql` inspeccionado; ambos contratos usan `destinationAccountNumber`.

### Scenario 5: legacy input rejected (no compatibility mode) ✅

- Given el contrato de input actualizado
- When un cliente intenta enviar `destinationCupCardNumber`
- Then el campo legacy no es aceptado por el contrato GraphQL vigente
- **Evidence**: GraphQL error: `Field "destinationCupCardNumber" is not defined by type "SubmitRemittanceV2Input". Did you mean "destinationAccountNumber"?`

### Scenario 6: existing remittances preserve destination data ✅

- Given remesas históricas persistidas con valor en la columna legacy
- When se aplica la migración hacia `destinationAccountNumber`
- Then los valores existentes se preservan correctamente y siguen siendo legibles después del change
- **Evidence**: Migración con `RENAME COLUMN` preserva datos en lugar.

## Guardrails

- No introducir cambios de lógica de negocio fuera del rename.
- No mezclar este change con otros cambios de frontend o backend no relacionados.
- No dejar naming legacy activo por accidente en capas internas o persistencia final.