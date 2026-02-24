---

## Tasks

### 1. Inventory Runtime Environment Variables

- Identificar variables de entorno efectivamente consumidas en runtime
- Incluir variables usadas en módulos de configuración, JWT, password reset, SMTP y frontend si ya existen en runtime
- No agregar variables que no estén siendo usadas

**Definition of Done**

✔ Lista de variables runtime identificadas (con ubicación en código)
✔ No se modifica código funcional

---

### 2. Align Validation Schema With Runtime Usage

- Actualizar el esquema de validación de entorno para incluir las variables identificadas
- Alinear tipos/formato con el consumo real
- No cambiar valores por defecto ni lógica de lectura

**Definition of Done**

✔ Esquema de validación incluye variables runtime
✔ Compila

---

### 3. Verify Application Startup With Validation Enabled

- Verificar que la aplicación arranca correctamente con la validación activa
- Confirmar que no se introduce comportamiento funcional nuevo

**Definition of Done**

✔ npm run build exitoso
✔ npm run start:dev exitoso (Nest application successfully started)

---

Restricciones:

NO agregar refactors
NO modificar reglas de negocio
NO agregar capacidades nuevas
NO introducir cambios funcionales