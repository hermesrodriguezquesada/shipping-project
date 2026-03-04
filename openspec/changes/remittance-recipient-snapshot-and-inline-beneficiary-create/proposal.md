# Proposal: remittance recipient snapshot and inline beneficiary create

## Problem statement

Hoy `submitRemittanceV2` exige `beneficiaryId` y la visualización de remesas históricas depende de join vivo contra `Beneficiary`.

Consecuencia: cuando un beneficiario se edita, los datos mostrados en remesas pasadas cambian, lo cual rompe la expectativa de historial inmutable.

## UX goal

En creación de remesa, el cliente debe poder:

- seleccionar un beneficiario existente, o
- ingresar datos manuales del beneficiario.

Si el usuario ingresa datos manuales, backend crea el `Beneficiary` automáticamente (owned by sender) y lo vincula a la remesa.

## Product decision

- Beneficiary registration es opcional para UX, no para persistencia interna.
- Cada remesa debe guardar snapshot de recipient/beneficiary como fuente histórica inmutable.
- `Remittance.beneficiaryId` debe quedar siempre persistido (seleccionado o creado).

## Proposed change

1. Añadir columnas snapshot de recipient en `Remittance` (requeridas + opcionales).
2. Exponer `RemittanceType.recipient: RemittanceRecipientType!` en GraphQL, alimentado solo desde snapshot.
3. Cambiar `submitRemittanceV2` para aceptar exactamente uno entre:
   - `beneficiaryId`, o
   - `manualBeneficiary`.
4. Mantener `RemittanceType.beneficiary` sin romper compatibilidad, pero documentar que UI histórica debe usar `recipient`.

## Breaking-change analysis

### API

- Cambio aditivo de salida: nuevo campo `recipient`.
- Cambio de input: `beneficiaryId` deja de ser obligatorio y se añade `manualBeneficiary`.
- Nueva regla de validación de negocio: exactamente uno entre `beneficiaryId` y `manualBeneficiary`.

### DB

- Cambio de esquema en `Remittance` con columnas snapshot nuevas y backfill obligatorio.
- Requiere migración cuidadosa para no romper datos existentes.

## Risks

- Backfill incompleto si existen remesas con beneficiario faltante o datos incompletos.
- Divergencia temporal entre `beneficiary` (live join) y `recipient` (snapshot) si el frontend no migra su lectura.
- Errores de validación en submit si cliente envía ambos/ninguno (`beneficiaryId` + `manualBeneficiary`).

## Mitigations

- Migración en fases: columnas nullable -> backfill -> assert -> NOT NULL en campos requeridos.
- Validación explícita en use-case para regla XOR (`exactly one`).
- Smoke tests de inmutabilidad histórica (before/after update beneficiary).
- Documentar explícitamente en contrato que historial debe consumir `recipient`.
