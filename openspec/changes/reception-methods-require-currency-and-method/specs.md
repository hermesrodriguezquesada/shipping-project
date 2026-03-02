# Specs: reception-methods-require-currency-and-method

## GraphQL contract changes (code-first generated)

### New enum

```graphql
enum ReceptionPayoutMethod {
  CASH
  TRANSFER
}
```

### Updated output type

`ReceptionMethodCatalogType` (o tipo equivalente generado para reception methods) debe incluir campos no nulos:

```graphql
type ReceptionMethodType {
  id: ID!
  code: String!
  name: String!
  description: String
  enabled: Boolean!
  imgUrl: String
  currency: CurrencyType!
  method: ReceptionPayoutMethod!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Nullability requirements

- `currency` es obligatorio (`!`).
- `method` es obligatorio (`!`).

No se aceptan métodos de recepción sin estas dos propiedades en respuestas.

## Example response: listReceptionMethods

```graphql
query {
  receptionMethods(enabledOnly: true) {
    code
    name
    currency { code name }
    method
  }
}
```

Respuesta esperada (ejemplo):

```json
{
  "data": {
    "receptionMethods": [
      {
        "code": "USD_CLASSIC",
        "name": "USD Classic",
        "currency": { "code": "USD", "name": "US Dollar" },
        "method": "TRANSFER"
      },
      {
        "code": "CUP_CASH",
        "name": "CUP Cash",
        "currency": { "code": "CUP", "name": "Peso Cubano" },
        "method": "CASH"
      }
    ]
  }
}
```

## submitRemittanceV2 behavior spec

### Rule source of truth

`receivingCurrency` de la remesa queda determinada por `receptionMethod.currency`.

### Case A: receivingCurrency omitted

- Input omite `receivingCurrency...`.
- Backend infiere automáticamente desde `receptionMethod.currency`.
- Resultado: remesa creada sin requerir selección manual de receiving currency.

### Case B: receivingCurrency provided and matches

- Input incluye `receivingCurrency...` y coincide con `receptionMethod.currency`.
- Backend acepta la solicitud y continúa flujo normal.

### Case C: receivingCurrency provided and mismatched

- Input incluye `receivingCurrency...` distinto a `receptionMethod.currency`.
- Backend rechaza con error de validación explícito.

Error esperado (semántica):

- tipo: validación de dominio,
- mensaje: mismatch entre moneda recibida y moneda fija del método de recepción.

## Persistence contract

### Prisma enum

```prisma
enum ReceptionPayoutMethod {
  CASH
  TRANSFER
}
```

### Prisma model fragment

```prisma
model ReceptionMethodCatalog {
  id          String                @id @default(uuid())
  code        String                @unique
  name        String
  description String?
  enabled     Boolean               @default(true)
  imgUrl      String?
  currencyId  String
  method      ReceptionPayoutMethod
  currency    CurrencyCatalog       @relation(fields: [currencyId], references: [id], onDelete: Restrict)
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
}
```

Backfill de filas existentes es obligatorio antes de imponer `NOT NULL`.
