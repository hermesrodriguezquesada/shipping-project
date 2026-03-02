# Design: reception-methods-require-currency-and-method

## Prisma model changes

Se extiende `ReceptionMethodCatalog` con:

- `currencyId String` (NOT NULL)
- `method ReceptionPayoutMethod` (NOT NULL)

Nuevo enum Prisma:

- `ReceptionPayoutMethod { CASH, TRANSFER }`

Relación nueva:

- `ReceptionMethodCatalog.currency -> CurrencyCatalog` via `currencyId` (FK, `onDelete: Restrict` recomendado para integridad referencial del catálogo).

## Relationship to CurrencyCatalog

Cada reception method queda asociado a exactamente una moneda de recepción.

Implicaciones:

- `listReceptionMethods` expone moneda explícita por método.
- `submitRemittanceV2` deja de depender de moneda enviada por cliente como fuente primaria para receiving currency.

## Backfill strategy (deterministic)

La migración SQL debe incluir mapeo explícito por `ReceptionMethodCatalog.code` hacia `{currencyCode, method}`.

Tabla de decisión a declarar en la migración (ejemplo con códigos actuales esperados):

- `USD_CASH` -> `{ USD, CASH }`
- `USD_CLASSIC` -> `{ USD, TRANSFER }`
- `CUP_CASH` -> `{ CUP, CASH }`
- `CUP_TRANSFER` -> `{ CUP, TRANSFER }`
- `MLC` -> `{ MLC, TRANSFER }` (o valor contractualmente definido)

Regla obligatoria:

- Si existe cualquier `code` no contemplado, la migración debe fallar explícitamente (abort transaction) con mensaje claro para corrección previa/posterior.

Secuencia de migración:

1. Crear enum `ReceptionPayoutMethod`.
2. Agregar columnas temporales nullable (`currencyId`, `method`).
3. Backfill vía `UPDATE ... FROM`/`CASE` contra `code` y lookup de `CurrencyCatalog.code`.
4. Validar que no queden nulls (`ASSERT`/`RAISE EXCEPTION`).
5. Alterar columnas a `NOT NULL`.
6. Crear FK e índice de `currencyId`.

## Application logic change in submitRemittanceV2

En `SubmitRemittanceV2UseCase`:

1. Resolver reception method habilitado.
2. Obtener su `currency` asociada.
3. Comportamiento sobre moneda de recepción:
   - si cliente omite `receivingCurrency...`, usar automáticamente `receptionMethod.currency`.
   - si cliente envía moneda y difiere de `receptionMethod.currency`, lanzar `ValidationDomainException`.
   - si coincide, continuar flujo normal.

Nota: se mantiene el resto de validaciones de negocio existentes.

## Impacted ports, adapters, read models, GraphQL types

### Catalogs domain

- Query port/read model de reception methods debe incluir:
  - `currency` (objeto catálogo)
  - `method` (`ReceptionPayoutMethod`)

- Adapter Prisma de catálogos:
  - incluir join a `CurrencyCatalog` para reception methods,
  - mapear enum `method`.

### GraphQL

- Output type de reception methods agrega:
  - `currency: CurrencyCatalogType!`
  - `method: ReceptionPayoutMethod!`

- Registrar enum GraphQL `ReceptionPayoutMethod`.
- Actualizar mapper de presentación correspondiente.

### Remittances submit flow

- Input de `submitRemittanceV2` puede mantenerse por compatibilidad si ya existe `receivingCurrencyCode`; la lógica ahora lo trata como opcional o validable contra inferencia (según contrato final del cambio).

## Out of scope

- Cambios en auth, guards o validación de roles.
- Refactors estructurales fuera de catálogos y submit de remesas.
- Cambios de versionado/deprecación de GraphQL.
- Reescritura de pricing o lifecycle más allá de inferencia/validación de receiving currency en submit.
