---

## Tasks

### 1. Centralize DI Token Definition

- Identificar token DI duplicado/conflictivo
- Mantener una única definición
- Actualizar imports para usar el token centralizado
- No modificar lógica de negocio

**Definition of Done**

✔ No existen tokens DI duplicados
✔ Compila el proyecto
✔ No se modifica comportamiento funcional

---

### 2. Align Provider Wiring

- Verificar providers relacionados con RequestPasswordResetUseCase
- Alinear uso del token único
- No introducir dependencias nuevas

**Definition of Done**

✔ Providers resuelven correctamente
✔ Compila
✔ Sin cambios funcionales

---

Restricciones:

NO agregar refactors
NO modificar reglas de negocio
NO agregar capacidades nuevas