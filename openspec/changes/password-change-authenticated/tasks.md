---

## Tasks

### 1. Create ChangePassword InputType

- Crear InputType GraphQL para changePassword
- Campos:
  - oldPassword (String)
  - newPassword (String)

Restricciones:
- No agregar campos adicionales
- No refactors

Definition of Done:

✔ Compila schema GraphQL
✔ InputType disponible para resolver

---

### 2. Implement ChangePassword Mutation

- Exponer mutación GraphQL protegida por GqlAuthGuard
- Usuario objetivo: usuario autenticado (context user)
- Validar oldPassword contra passwordHash actual
- Hashear newPassword
- Actualizar passwordHash en persistencia

Restricciones:
- No modificar forgot password
- No refactors
- Reusar servicios de hash/verificación existentes

Definition of Done:

✔ npm run build exitoso
✔ npm run start:dev exitoso
✔ Mutación aparece en schema.gql

---

### 3. Verify Validation Consistency

- Confirmar validación mínima de contraseña (mínimo 6) consistente con resetPassword
- Confirmar errores coherentes con patrón existente

Definition of Done:

✔ Sin cambios funcionales colaterales
✔ Validaciones coherentes

---

NO agregar mejoras adicionales
NO refactors
NO cambios fuera del alcance de ChangePassword