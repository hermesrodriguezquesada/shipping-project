# Proposal: vip-exchange-rates-and-profit-preview

## Problem statement

El sistema actual ya tiene flujos de remesas, pricing y tasas de cambio operativas, pero este change necesita cubrir un caso separado: configurar tasas VIP globales por par de moneda y calcular un preview de ganancia VIP sin acoplarse a esos módulos.

El problema a resolver es doble:

- No existe un módulo aislado para administrar tasas VIP globales por par de moneda.
- No existe una superficie aislada para calcular una ganancia VIP con la fórmula `paymentAmount * (vipRate - baseRate)` sin reutilizar lógica de remittances ni de `pricingPreview`.

## Proposed change

Crear un módulo nuevo e independiente llamado `vip-pricing` con dos capacidades:

1. Configuración administrativa de tasas VIP globales por par de moneda persistidas en un modelo propio `VipExchangeRate`.
2. Cálculo puro de preview de ganancia VIP usando la tasa general activa de `ExchangeRate` y la tasa VIP global habilitada para el mismo par de moneda.

## Expected outcome

- Un administrador puede crear, actualizar y habilitar o deshabilitar tasas VIP globales por par de moneda sin tocar `ExchangeRate` ni otros módulos existentes.
- Un usuario VIP puede consultar un preview de ganancia VIP sin generar remesas, sin invocar `pricingPreview` y sin persistir resultados del cálculo.
- El módulo `vip-pricing` queda autocontenido en sus contratos, modelo, casos de uso y reglas de negocio.

## Module boundary

Este change define un slice nuevo, aislado y explícitamente separado del sistema actual:

- No depende de `remittances`.
- No depende de `pricingPreview`.
- No modifica `ExchangeRate`.
- No modifica contratos, entidades ni comportamiento de módulos existentes.
- No persiste resultados de preview.
- No introduce side-effects derivados del cálculo.

## Access

- `admin` configura tasas VIP globales por par de moneda.
- `VIP` consulta el preview de ganancia.

La forma exacta en que el caller acredita condición VIP fuera del módulo se considera preexistente o de composición externa; este change no introduce ni modifica clasificación de usuarios.

## Out of scope

- Remittances.
- Pricing real o cotización final.
- Reporting.
- Pagos.
- Persistencia de ganancias calculadas.
- Cambios sobre `ExchangeRate`.
- Cualquier acoplamiento con `pricingPreview`.
- Cualquier cambio sobre módulos existentes.
- Cualquier endpoint tipo `myVipExchangeRates`.