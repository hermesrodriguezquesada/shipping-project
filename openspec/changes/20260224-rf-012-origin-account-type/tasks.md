## Tasks

### 1) Extend Prisma for origin account type

- Agregar enum `OriginAccountType` con valores `ZELLE`, `IBAN`, `STRIPE`.
- Extender modelo `Remittance` con:
  - `originAccountType`
  - `originZelleEmail`
  - `originIban`
  - `originStripePaymentMethodId`
- Crear migración Prisma correspondiente.

Definition of Done:

- `prisma/schema.prisma` actualizado.
- migración generada y versionada.
- sin cambios en modelos no relacionados.

---

### 2) Add GraphQL contract (code-first)

- Agregar enum GraphQL `OriginAccountType`.
- Crear input `SetRemittanceOriginAccountInput`.
- Exponer mutación:
  - `setRemittanceOriginAccount(input: SetRemittanceOriginAccountInput!): Boolean!`

Definition of Done:

- `npm run build` exitoso.
- `PORT=3001 npm run start:dev` exitoso.
- `src/schema.gql` refleja enum, input y mutación nuevos.

---

### 3) Implement use-case validations (RF-012)

- Validar por tipo:
  - ZELLE requiere `zelleEmail`.
  - IBAN requiere `iban`.
  - STRIPE requiere `stripePaymentMethodId`.
- Rechazar mezcla de campos de tipos incompatibles.
- Mantener patrón de excepciones de validación ya existente.

Definition of Done:

- errores de validación coherentes con patrón del módulo.
- sin refactors ni cambios fuera de RF-012.

---

### 4) Persist with invariant-safe patching

- Persistir solo campos definidos (`undefined` no persiste).
- Al cambiar tipo, limpiar campos de otros tipos (`null`) para evitar mezcla persistida.
- Reusar adapter Prisma del agregado correspondiente sin crear capas innecesarias.

Definition of Done:

- persistencia alineada GraphQL ↔ Prisma.
- invariantes de un tipo activo por remesa preservadas.

---

### 5) Final verification

- Ejecutar validación obligatoria:
  1. `npm run build`
  2. `PORT=3001 npm run start:dev`
  3. verificar `src/schema.gql`
- Confirmar que no se alteraron flujos irrelevantes (auth/roles/tokens/sesiones).

Definition of Done:

- checklist de verificación completo.
- sin drift de contrato.
- cambio mínimo y contract-safe.
