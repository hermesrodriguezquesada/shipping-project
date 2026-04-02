# Diseño Técnico: Fix submitRemittanceV2 - Remover validación obligatoria de metadata

## Cambios Implementados

### 1. submit-remittance-v2.usecase.ts

**Tipos removidos** (lineas ~30-80):
```typescript
// ELIMINADO:
type OriginAccountFieldType = 'string' | 'number' | 'boolean' | 'email' | 'phone'
type OriginAccountFieldFormat = 'email' | 'phone' | ...
interface OriginAccountFieldDefinition { name, type, format, required, ... }
interface OriginAccountMetadata { schemaVersion, allowedFields, ... }
```

**Métodos removidos**:
- `parseOriginAccountMetadata()` (~97 líneas): Validación strict contra schema definido
- `resolveAndValidateOriginAccountData()` (~163 líneas): Validación de campos contra metadata

**Método agregado** (4 líneas):
```typescript
private resolveOriginAccountData(data: any): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) {
    throw new BadRequestException('Origin account data must be a valid JSON object')
  }
  return data as Record<string, unknown>
}
```

**Cambio en handler** (línea 184):
```typescript
// ANTES:
const originAccountMetadata = this.parseOriginAccountMetadata(paymentMethod)
const originAccountData = this.resolveAndValidateOriginAccountData(data, metadata, method, reception)

// DESPUÉS:
const originAccountData = this.resolveOriginAccountData(data)
```

---

### 2. seed.ts

**ZELLE upsert** (antes):
```typescript
{
  where: { code: PaymentMethodKind.ZELLE },
  update: { enabled, name },
  create: {
    code: PaymentMethodKind.ZELLE,
    name: 'Zelle',
    enabled: true,
    additionalData: JSON.stringify({
      schemaVersion: 1,
      allowedFields: ['zelleEmail'],
      fields: { zelleEmail: { ... } }
    })
  }
}
```

**ZELLE upsert** (después):
```typescript
{
  where: { code: PaymentMethodKind.ZELLE },
  update: { enabled, name },
  create: {
    code: PaymentMethodKind.ZELLE,
    name: 'Zelle',
    enabled: true
  }
}
```

Mismo cambio aplica a IBAN y STRIPE upserts: remover bloque `additionalData: JSON.stringify(...)`.

---

### 3. submit-remittance-v2.usecase.spec.ts

**Constantes removidas**:
```typescript
// ELIMINADO:
const zelleMetadata = { schemaVersion: 1, allowedFields: [...] }
const ibanMetadata = { ... }
const stripeMetadata = { ... }
```

**setupCommonSuccessMocks()** actualizado:
```typescript
// ANTES:
metadata: getPaymentMethodMock({ additionalData: JSON.stringify(zelleMetadata) })

// DESPUÉS:
additionalData: null
```

**Tests removidos** (3):
- `"fails with explicit error when metadata is missing or invalid"`
- `"fails when data contains fields not allowed by metadata"`
- `"fails when required field is missing"`

**Tests renombrados**:
- Describe block: `"originAccount data pass-through"`

**Tests mantenidos y refactorizados**:
- "succeeds with ZELLE and required field [zelleEmail]"
- "succeeds with IBAN and required fields [accountNumber, bankCode]"
- "succeeds with STRIPE and required fields [cardToken, last4]"
- "succeeds with admin-created ACH (no metadata, custom fields)"

---

## Validación de Cambios

### Build
```
npm run build
→ ✅ nest build: 0 errores nuevos
```

### Static Analysis
```
grep -r "parseOriginAccountMetadata" → NO MATCHES
grep -r "resolveAndValidateOriginAccountData" → NO MATCHES
grep -r "payment method metadata is invalid" → NO MATCHES en router/usecase
git status src/schema.gql → SIN CAMBIOS (contrato intacto)
```

### GraphQL Contract
- ✅ PaymentMethodType.additionalData: nullable String (sin cambios)
- ✅ SubmitRemittanceV2Input: sin cambios
- ✅ RemittanceOriginAccountType: sin cambios

---

## Impacto en Otros Módulos

**Análisis de dependencias** completado:
- ❌ No hay otros consumidores de `parseOriginAccountMetadata()`
- ❌ No hay otros consumidores de `resolveAndValidateOriginAccountData()`
- ✅ Otras validaciones intactas: method enabled, reception method válido, currency match

---

## Datos Persistidos

El cambio NO afecta persistencia:
- `originAccount` sigue siendo persistido sin cambios
- Payload arbitrario aceptado y guardado en BD
- No hay migración necesaria (campo adicional en Remittance ya existed)
