---

## Tasks

### 1. Locate Existing Session Resolvers and GraphQL Decorators

- Ubicar en el código las operaciones:
  - mySessions
  - revokeMySession
  - revokeOtherMySessions
- Identificar el resolver, los decorators (@Query/@Mutation) y tipos/inputs/outputs usados
- Identificar por qué actualmente no aparecen en schema.gql (falta decorator, falta @Resolver, módulo no registrado, etc.)

**Definition of Done**

✔ Rutas/archivos exactos identificados
✔ Causa raíz documentada (por qué no aparece en schema)

---

### 2. Expose Session Operations in Schema (Minimal Wiring)

- Aplicar el cambio mínimo necesario para que las 3 operaciones aparezcan en el schema code-first
- No modificar lógica funcional

**Definition of Done**

✔ npm run build exitoso
✔ npm run start:dev exitoso
✔ schema.gql incluye mySessions, revokeMySession, revokeOtherMySessions

---

### 3. Verify Guards and Contract Stability

- Confirmar que las operaciones expuestas mantienen guards/roles según implementación existente
- Confirmar que no se alteran firmas ni tipos existentes más allá de exponerlos

**Definition of Done**

✔ Operaciones expuestas y protegidas correctamente
✔ Sin breaking changes adicionales

---

Restricciones:

NO agregar nuevas operaciones
NO modificar lógica de negocio
NO agregar capacidades nuevas fuera de las 3 operaciones indicadas
NO refactors