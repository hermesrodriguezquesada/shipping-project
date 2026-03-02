# Design: replace-user-roles-array-with-single-role-field

## Affected GraphQL types

El cambio aplica a todos los tipos de salida que exponen el array de roles de usuario.

### Confirmados por contrato actual

- `UserType` (`roles` -> `role`)
- `AuthPayload.user` (impactado indirectamente porque referencia `UserType`)
- Respuestas de `me`, `myProfile`, `user`, `adminUsers`, y cualquier resolver que devuelva `UserType`

### Revisión adicional en alcance

- Cualquier otro output type que repita `roles: [...]` debe migrarse a `role: String!`.

## Mapping strategy

### Regla de mapeo

- Fuente interna: `user.roles` (array persistido/actual)
- Salida GraphQL: `user.role`
- Transformación: `role = user.roles[0]`

### Invariantes

- Se mantiene el comportamiento actual esperado: existe exactamente un rol por usuario.
- No se introduce fallback funcional nuevo ni lógica de negocio adicional.

## DB and authorization unchanged

Se confirma explícitamente que **no cambian**:

- Esquema Prisma / persistencia de roles.
- Guards de autorización (`GqlAuthGuard`, `RolesGuard`) y validación de roles.
- Reglas de negocio de autenticación/autorización.

## Impact surface

- Tipos GraphQL de salida (`UserType` y dependencias).
- Mappers de presentación que actualmente exponen `roles`.
- Posibles DTOs/view models en capa GraphQL si modelan `roles` explícitamente.
- Regeneración del schema (`src/schema.gql`).

## Migration risk notes

- Riesgo de ruptura en clientes GraphQL por eliminación de `roles`.
- Riesgo bajo en backend si el cambio se limita al contrato de salida y mapping.
- No se espera regresión en auth runtime al no tocar guards ni modelo interno.
