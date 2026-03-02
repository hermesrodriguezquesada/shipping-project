# Specs: replace-user-roles-array-with-single-role-field

## Contract change summary

Se reemplaza el campo de roles en salidas de usuario:

- **Removed**: `roles: [String!]!`
- **Added**: `role: String!`

> Nota: si el contrato actual usa enum (`[Role!]!`), la sustitución de salida sigue siendo directa a `role: String!` según este cambio.

## Exact new GraphQL field definitions

## UserType (updated)

```graphql
type UserType {
  id: String!
  email: String!
  role: String!
  isActive: Boolean!
  isDeleted: Boolean!
  firstName: String
  lastName: String
  phone: String
  birthDate: DateTime
  addressLine1: String
  addressLine2: String
  city: String
  country: String
  postalCode: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

## AuthPayload (applicability)

`AuthPayload` mantiene su shape estructural y queda actualizado indirectamente al referenciar `UserType`:

```graphql
type AuthPayload {
  accessToken: String!
  refreshToken: String!
  sessionId: String!
  user: UserType!
}
```

## Explicit removal

- Se elimina explícitamente `roles` de `UserType` y de cualquier output que lo exponga.
- No se agrega campo alternativo adicional ni deprecación; reemplazo directo por `role`.

## API examples

## Before

```graphql
query Me {
  me {
    id
    email
    roles
  }
}
```

```json
{
  "data": {
    "me": {
      "id": "u_123",
      "email": "user@example.com",
      "roles": ["CLIENT"]
    }
  }
}
```

## After

```graphql
query Me {
  me {
    id
    email
    role
  }
}
```

```json
{
  "data": {
    "me": {
      "id": "u_123",
      "email": "user@example.com",
      "role": "CLIENT"
    }
  }
}
```

## Query/update scope

Este cambio impacta respuestas de:

- `login` / `register` (vía `AuthPayload.user`)
- `me`
- `adminUsers`
- cualquier query/mutation que retorne `UserType`

Sin cambios en inputs de administración o persistencia interna, salvo ajustes estrictamente necesarios para compilar el nuevo shape de salida.
