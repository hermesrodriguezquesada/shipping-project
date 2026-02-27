## Why

Se requiere consolidar la separación arquitectónica `remittances` / `catalogs` / `exchange-rates` con DIP fino dentro de `remittances` para cumplir SOLID y reducir acoplamiento.

Además, QA/Frontend necesitan documentación operativa uniforme para ejecutar pruebas end-to-end sin ambigüedades.

## Scope

1. Introducir puertos pequeños en `remittances` para validación de disponibilidad y snapshot FX.
2. Implementar adapters bridge en `remittances` que delegan a `CATALOGS_QUERY_PORT` y `EXCHANGE_RATES_QUERY_PORT`.
3. Actualizar use-cases de remittances para depender solo de puertos internos pequeños.
4. Mantener contrato GraphQL intacto (sin renames/remociones de operaciones).
5. Publicar documentación OpenSpec con formato QA/Frontend estándar y bloques por etapa.

## Non-Goals

- No cambios en `schema.prisma` ni migraciones.
- No cambios de naming o firmas GraphQL.
- No mover negocio a resolvers.

## Acceptance

- `npx prisma generate`, `npm run build`, `PORT=3001 npm run start:dev` exitosos.
- `schema.gql` conserva las mismas operaciones y tipos esperados sin duplicados.
- QA dispone de bloques ejecutables Wizard → Submit → Paid → Confirm → Delivered.
