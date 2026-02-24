---

## Tasks

### 1. Update Forgot Password Link Format

- Modificar exclusivamente la construcción del enlace generado en requestPasswordReset
- Ajustar:
  - Path → /reset_password
  - Query param → hash=<token>

Restricciones:
- No modificar algoritmo de token
- No modificar persistencia
- No modificar TTL / expiresAt / usedAt
- No refactors

Definition of Done:

✔ npm run build exitoso
✔ npm run start:dev exitoso
✔ Enlace generado utiliza reset_password?hash=

---

### 2. Verify Reset Flow Stability

- Confirmar que resetPassword continúa funcionando con el valor recibido
- Confirmar que no se alteró la validación de expiración/uso único

Definition of Done:

✔ Flujo de reset sin cambios funcionales
✔ Sin errores runtime

---

NO agregar mejoras adicionales
NO refactors
NO cambios funcionales fuera del link