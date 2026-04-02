# Propuesta: Fix submitRemittanceV2 - Remover validación obligatoria de metadata

## Problema

La mutación `submitRemittanceV2` fallaba con error `"payment method metadata is invalid"` cuando:
- Un PaymentMethod era creado desde admin sin incluir `additionalData`
- Un PaymentMethod era editado manualmente con `additionalData` distinto al schema esperado
- Un PaymentMethod no provenía exactamente del seed (que sembraba metadata schema-driven)

El error ocurría en `submit-remittance-v2.usecase.ts` en el método `parseOriginAccountMetadata()` que validaba el blob de `PaymentMethod.additionalData` contra un schema JSON strict definido en la clase.

## Raíz del Problema

1. **Validación sobre-restrictiva**: El sistema esperaba que cada PaymentMethod tuviera un `additionalData` con estructura específica (ZELLE, IBAN, STRIPE con campos predeterminados)
2. **Inconsistencia de datos**: El seed sembraba metadata, pero cuando métodos eran creados manualmente desde admin o editados sin respetar el schema, fallaban
3. **Acoplamiento innecesario**: La validación de metadata no era consumida por ningún otro módulo; era lógica local del usecase

## Solución Propuesta

Reemplazar la validación strict de metadata por validación minimal:
- Remover tipos `OriginAccountFieldType`, `OriginAccountFieldFormat`, `OriginAccountFieldDefinition`, `OriginAccountMetadata`
- Reemplazar `parseOriginAccountMetadata() + resolveAndValidateOriginAccountData()` con un método simple `resolveOriginAccountData()` que solo valide que `data` sea objeto JSON válido
- Limpiar seed.ts: remover bloques `additionalData: JSON.stringify({...})` de ZELLE, IBAN, STRIPE upserts
- Actualizar tests: eliminar 3 tests que validaban metadata schema, mantener tests que validen datos de ejemplo sin schema

## Beneficios

✅ **Flexibilidad**: Payment methods pueden tener cualquier estructura de `additionalData` o ninguna  
✅ **Simplificación**: ~260 líneas de validación innecesaria removidas  
✅ **Robustez**: submitRemittanceV2 ya no falla por inconsistencias en metadata  
✅ **Sin impacto**: Contrato GraphQL intacto, ningún otro módulo afectado  

## No-Goals

- ❌ Modificar el contrato GraphQL de PaymentMethodType
- ❌ Cambiar cómo otros módulos consumen PaymentMethod
- ❌ Reescribir seed completamente (solo remover metadata innecesaria)
- ❌ Agregar nuevas validaciones o constraints
