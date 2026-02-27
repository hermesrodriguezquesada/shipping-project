## Why

RF-012 requiere capturar el tipo de cuenta origen (ZELLE, IBAN, STRIPE) en la operación de fondos.
Actualmente el contrato GraphQL no expone operaciones de remittance/transfer/payment y el modelo Prisma `Remittance` tampoco guarda este dato de origen, por lo que hoy no existe forma contract-safe de seleccionar/validar ese origen.

## Scope

- Introducir soporte de **tipo de cuenta origen** para remesa usando el modelo existente `Remittance`.
- Extender el contrato GraphQL con **una mutación mínima nueva** para registrar/actualizar cuenta origen de una remesa existente.
- Alinear GraphQL ↔ Prisma con enum reutilizable y campos específicos por tipo.
- Definir validaciones mínimas condicionales por tipo (ZELLE / IBAN / STRIPE).

## Out of Scope

- No se agregan refactors ni mejoras no pedidas.
- No se cambian flujos de Auth, roles, sesiones, TTL ni tokens.
- No se introducen nuevas capacidades de pago externas (ejecución real de Stripe/Zelle/IBAN).
- No se rediseñan modelos existentes fuera de `Remittance`.
- No se crean APIs administrativas adicionales.

## Risks

- **Drift de contrato** si no se actualiza code-first y `schema.gql` de forma consistente.
- **Inconsistencia de datos** si se permite mezclar campos de tipos distintos.
- **Compatibilidad** con registros históricos de remittance sin origen (campos nuevos deben ser opcionales inicialmente).

## Minimal Contract-Safe Strategy

Se elige estrategia **A** (extender `Remittance` con enum + campos específicos) porque:

- ya existe `Remittance` en Prisma;
- no existe modelo de payment method reutilizable en el código actual;
- evita introducir un agregado nuevo (`OriginAccount`) con mayor superficie de cambio;
- mantiene cambio mínimo y acotado al requisito RF-012.
