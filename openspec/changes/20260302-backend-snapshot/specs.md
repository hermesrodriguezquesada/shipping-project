# Specs: backend snapshot

## 0) Cómo usar este snapshot

Este change documenta el backend real (GraphQL + Prisma + wiring).

Regla: **toda afirmación importante debe ser verificable** con:
- extracto literal de `src/schema.gql`,
- o referencias a archivos de código (resolver/use-case/module/adapters),
- o evidencia de Prisma (`src/prisma/schema.prisma`).

---

## 1) Contrato GraphQL actual (`src/schema.gql`) — extracto literal

### 1.1 Bloques obligatorios (literal)

Copiar y pegar **literalmente** desde `src/schema.gql` (sin editar) los siguientes bloques:

- `type Query { ... }`
- `type Mutation { ... }`
- `enum RemittanceStatus { ... }`
- `type RemittanceType { ... }`

> IMPORTANTE: este snapshot NO debe “reconstruir” a mano estos bloques. Deben ser literales del schema generado.

#### Pegado literal (rellenar por Copilot)

```graphql
# PASTE LITERAL FROM src/schema.gql:
# type Query { ... }