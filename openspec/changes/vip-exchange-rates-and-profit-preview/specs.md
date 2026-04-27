# Specs: vip-exchange-rates-and-profit-preview

## VIP exchange rates by currency pair

### AC-1: admin o employee puede crear tasa VIP por par

Existe una operación administrativa `adminCreateVipExchangeRate` que permite crear una tasa VIP para un par `fromCurrencyCode -> toCurrencyCode`.

### AC-2: la configuración es global por par y no usa userId

La persistencia de la tasa VIP usa un modelo `VipExchangeRate` global por par de moneda, sin `userId`, sin variantes por usuario y sin segmentación por remittance.

### AC-3: no se puede duplicar el mismo par

Si ya existe una tasa VIP para el mismo par `fromCurrencyCode + toCurrencyCode`, la creación falla explícitamente.

### AC-4: admin o employee puede actualizar tasa existente

Existe una operación `adminUpdateVipExchangeRate` para actualizar `rate` y/o `enabled` de una tasa VIP existente. Si `rate` viene informado, debe ser `> 0`.

### AC-5: admin o employee puede habilitar o deshabilitar una tasa

Existe una operación `adminSetVipExchangeRateEnabled(id, enabled)` que cambia solo el estado enabled de una tasa existente.

### AC-6: la configuración no modifica ExchangeRate

La operación administrativa no crea, actualiza ni elimina registros del modelo `ExchangeRate`, ni altera contratos de módulos existentes relacionados con tasas.

## VIP profit preview

### AC-7: VIP puede consultar preview de ganancia

Existe una operación de lectura para usuarios con acceso VIP que retorna un preview de ganancia usando la tasa VIP global configurada.

### AC-8: el preview recibe paymentAmount y par de moneda

La operación de preview recibe `paymentAmount`, `fromCurrencyCode` y `toCurrencyCode` como input.

### AC-9: el preview lee la tasa general enabled en ExchangeRate

La operación de preview consulta la tasa general enabled de `ExchangeRate` para el mismo par `fromCurrencyCode -> toCurrencyCode`. Si no existe, falla explícitamente.

### AC-10: el preview lee la tasa VIP enabled en VipExchangeRate

La operación de preview consulta la tasa VIP enabled de `VipExchangeRate` para el mismo par `fromCurrencyCode -> toCurrencyCode`. Si no existe, falla explícitamente.

### AC-11: el preview usa la fórmula exacta requerida

El cálculo usa exactamente:

```txt
rateDifference = vipRate - baseRate
vipProfitAmount = paymentAmount * rateDifference
```

### AC-12: el preview no devuelve ganancia negativa

Si `rateDifference <= 0`, entonces `vipProfitAmount = 0`.

### AC-13: el preview expone los valores usados en el cálculo

La respuesta del preview incluye `paymentAmount`, `fromCurrencyCode`, `toCurrencyCode`, `baseRate`, `vipRate`, `rateDifference`, `vipProfitAmount` y `profitCurrencyCode`.

## No persistence and no side-effects

### AC-14: el preview no persiste resultados

Ejecutar el preview no crea ni actualiza registros de ganancias, previews, remittances, pricing ni auditorías derivadas del cálculo.

### AC-15: el preview no introduce side-effects

Ejecutar el preview no dispara eventos, colas, jobs, pagos, reporting ni mutaciones sobre otros bounded contexts.

## Isolation from existing system

### AC-16: no integra con remittances

El módulo `vip-pricing` no depende del flujo de remesas, no requiere `Remittance` y no altera contratos o estados de ese dominio.

### AC-17: no integra con pricingPreview

El preview VIP no reutiliza ni delega en `pricingPreview`; su cálculo ocurre dentro del módulo aislado `vip-pricing`.

### AC-18: no modifica módulos existentes

La solución se implementa como un módulo nuevo con sus propios contratos y componentes, sin cambios de comportamiento en módulos existentes.

### AC-19: no crea myVipExchangeRates

El contrato GraphQL no expone ninguna query `myVipExchangeRates`.

### AC-20: no introduce pricing real

El resultado del preview es informativo. No equivale a una cotización operativa, no bloquea fondos, no genera pagos y no reemplaza el pricing oficial del sistema.