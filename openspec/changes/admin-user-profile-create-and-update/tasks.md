---

## Tasks

### 1. Inventory Existing User Profile Fields

- Identificar qué campos de perfil existen actualmente en el dominio/capa GraphQL (UserType/profile, inputs de updateMyProfile, Prisma schema).
- Definir el subconjunto exacto que se permitirá en operaciones admin (sin inventar campos nuevos).

Definition of Done:

✔ Lista de campos existentes con archivos/rutas
✔ Sin modificaciones de código funcional

---

### 2. Extend AdminCreateUserInput With Optional Profile Fields

- Extender AdminCreateUserInput para incluir opcionalmente los campos de perfil inventariados.
- Propagar esos campos por resolver → use-case → persistencia solo si vienen informados.
- Mantener email/password/roles y comportamiento actual intacto.

Definition of Done:

✔ npm run build exitoso
✔ PORT=3001 npm run start:dev exitoso
✔ schema.gql refleja el input extendido
✔ Sin cambios funcionales fuera de adminCreateUser

---

### 3. Implement Admin Update User Profile Mutation

- Crear input admin para actualización parcial de perfil:
  - userId obligatorio
  - campos de perfil opcionales
- Crear mutación admin protegida por Role.ADMIN + guards existentes.
- Aplicar actualización parcial (undefined = no cambia).
- No incluir roles/estado en esta mutación.

Definition of Done:

✔ npm run build exitoso
✔ PORT=3001 npm run start:dev exitoso
✔ schema.gql incluye la nueva mutación y su input/output

---

### 4. Verify Contract and Admin Guards

- Confirmar que:
  - adminCreateUser sigue protegido como antes
  - la nueva mutación admin está protegida por Role.ADMIN
  - no se expusieron operaciones adicionales fuera del alcance

Definition of Done:

✔ Checklist con evidencias (archivos/líneas + schema.gql)

---

Restricciones:

NO agregar campos que no existan actualmente
NO refactors
NO modificar reglas de negocio fuera del alcance
NO alterar operaciones administrativas existentes no relacionadas