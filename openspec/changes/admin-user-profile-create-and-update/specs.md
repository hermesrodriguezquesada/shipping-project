---

## Specifications Context

Este change amplía capacidades administrativas relacionadas con datos de perfil de usuario.

No modifica reglas de autenticación ni operaciones administrativas existentes fuera del alcance indicado.

---

## Modified Specifications

### Admin Create User With Optional Profile

**Descripción**

La mutación adminCreateUser debe permitir opcionalmente la recepción de datos de perfil del usuario al momento de su creación.

---

**Requisitos**

- AdminCreateUserInput podrá incluir campos opcionales de perfil ya existentes en el dominio.
- Si los campos de perfil son provistos, deben persistirse junto con la creación del usuario.
- Si no son provistos, el comportamiento actual permanece sin cambios.
- No se modifican reglas de creación de email/password/roles.

---

**Comportamiento**

La creación de usuario mantiene su comportamiento actual, ampliando únicamente la capacidad de incluir perfil opcional.

---

### Admin Update User Profile

**Descripción**

Debe existir una mutación GraphQL administrativa para actualización parcial de datos de perfil de un usuario existente.

---

**Requisitos**

- Operación protegida por Role.ADMIN y guards existentes.
- Input obligatorio:
  - userId
  - Campos opcionales de perfil
- Actualización parcial:
  - undefined → no altera campo
- No incluye modificación de roles ni estado del usuario.

---

**Retorno**

- Retorno consistente con patrones administrativos existentes (UserType o equivalente), sin alterar operaciones previas.

---

## Impact on Existing Behavior

No se modifica comportamiento de login, roles, estado, ni perfil propio del usuario.

---

NO agregar especificaciones no relacionadas.
NO redefinir reglas de negocio adicionales.
NO introducir refactors.