# Design: remittance-destination-field-rename

## Status: ✅ DESIGN IMPLEMENTED

**Design adherence**: 100% — La implementación respetó completamente el diseño especificado.

---

## Canonical naming

Nombre canónico final en todas las capas:

- `destinationAccountNumber`

Nombre legacy a retirar:

- `destinationCupCardNumber`

## Database and Prisma strategy

Se aplicará migración real de columna en la tabla de remesas para reemplazar el nombre legacy por el canónico.

Estado final de persistencia:

- Esquema de base de datos con columna `destinationAccountNumber`.
- Prisma model `Remittance` con propiedad `destinationAccountNumber`.
- Sin alias permanente ni convivencia legacy en estado final.

Principio de migración:

- Preservar datos existentes mediante operación de rename de columna (no pérdida de datos).
- Evitar dejar dos columnas semánticamente duplicadas en estado final.

## Contract strategy (GraphQL input)

Estrategia elegida: breaking clean rename.

- `SubmitRemittanceV2Input` acepta `destinationAccountNumber`.
- `destinationCupCardNumber` se elimina del input contract.
- No hay etapa de compatibilidad temporal dual en este change.

Racional:

- El objetivo declarado es cambiar "en todos lados".
- Reduce deuda de contrato y evita arrastrar naming legacy por accidente.

## Output contract

- `RemittanceType.destinationAccountNumber` permanece sin cambios.
- No se altera el contrato de salida existente.

## Application/domain replacement scope

El rename se aplica de forma coherente en:

- Use case de submit de remesa
- Validaciones asociadas al campo
- Puertos de dominio y de aplicación
- Adapters de persistencia/lectura
- Read models y mapeos internos GraphQL <-> dominio

## Validation behavior preservation

No cambia la regla de negocio, solo el nombre del campo:

- Para métodos `TRANSFER`, el campo sigue siendo requerido.
- Para métodos no `TRANSFER`, se mantiene el comportamiento vigente definido previamente.

La implementación debe asegurar equivalencia funcional antes y después del rename.

## Impact boundaries

Sin impacto funcional intencional en:

- `originAccountType`
- pricing/comisiones
- manual beneficiary visibility
- auth/JWT/guards
- otras áreas no relacionadas con el campo renombrado

## Implementation summary ✅

### Persistencia
- ✅ `src/prisma/schema.prisma` (L356): Actualizado a `destinationAccountNumber`
- ✅ Migración creada: `20260324233000_remittance_destination_account_number_rename/migration.sql`
- ✅ Migración aplicada con éxito a PostgreSQL
- ✅ Estrategia: `ALTER TABLE "Remittance" RENAME COLUMN` — datos históricos preservados

### Input GraphQL  
- ✅ `SubmitRemittanceV2Input`: Campo legacy removido, nombre canónico adoptado
- ✅ Contrato confirma: `destinationAccountNumber` único campo válido; `destinationCupCardNumber` rechazado

### Domain & Application
- ✅ Use case: Validación de `TRANSFER` operante con nuevo nombre
- ✅ Puertos: Interfaces actualizadas en command y query ports
- ✅ Adapters: Mapeos de Prisma correctos
- ✅ Resolvers: Input/output mapping correcto
- ✅ Read models: Consistentes

### Output GraphQL
- ✅ `RemittanceType.destinationAccountNumber` estable (sin cambios intencionales)

### Build & Runtime
- ✅ TypeScript build: 0 errores
- ✅ App start: Exitoso
- ✅ Code-first GraphQL: Schema regenerado correctamente
- ✅ Prisma client regenerado post-schema-update
