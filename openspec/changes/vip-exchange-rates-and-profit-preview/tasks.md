# Tasks: vip-exchange-rates-and-profit-preview

## Implementation checklist

- [x] **1. Crear modelo aislado `VipExchangeRate`**
  - Definir persistencia propia para tasas VIP globales por par de moneda.
  - Garantizar que el modelo no tenga `userId` ni relación con remittances.
  - Mantener intacto `ExchangeRate`.

  Definition of Done:
  - Existe un modelo aislado para tasa VIP global.
  - No se modificó `ExchangeRate`.

---

- [x] **2. Crear el módulo nuevo `vip-pricing`**
  - Crear un slice autónomo con sus propios puertos, adapters, casos de uso, DTOs y mapper.
  - Evitar extender o modificar módulos existentes.

  Definition of Done:
  - El módulo compila de forma aislada.
  - No hay cambios funcionales en otros módulos.

---

- [x] **3. Implementar caso de uso admin para tasa VIP global**
  - Crear operaciones para crear, actualizar y habilitar/deshabilitar tasas VIP por par.
  - Restringir acceso a `ADMIN/EMPLOYEE`.

  Definition of Done:
  - Admin o employee puede administrar tasas VIP por par.
  - No se permiten duplicados para el mismo par.

---

- [x] **4. Implementar caso de uso de preview VIP**
  - Recibir `paymentAmount`, `fromCurrencyCode` y `toCurrencyCode` como input.
  - Leer `baseRate` desde `ExchangeRate` en modo read-only.
  - Leer `vipRate` desde `VipExchangeRate`.
  - Calcular `rateDifference` y `vipProfitAmount` sin permitir ganancia negativa.

  Definition of Done:
  - El cálculo usa exactamente la fórmula requerida.
  - `ExchangeRate` solo se lee; no se modifica.

---

- [x] **5. Definir contratos GraphQL del módulo**
  - Agregar operaciones admin para crear, actualizar, habilitar/deshabilitar y listar tasas VIP.
  - Agregar una operación de lectura para preview VIP.
  - Definir tipos de entrada y salida propios del módulo.

  Definition of Done:
  - El contrato expone configuración global y preview.
  - No se reutilizan DTOs de `pricingPreview` ni de remittances.

---

- [x] **6. Asegurar ausencia de persistencia del preview**
  - Verificar que la operación de preview no escriba resultados.
  - No crear tablas, colecciones ni logs de ganancia calculada como parte del preview.

  Definition of Done:
  - No se persisten previews ni ganancias.
  - Solo se persiste `VipExchangeRate`.

---

- [x] **7. Asegurar ausencia de side-effects**
  - Verificar que preview no emita eventos ni dispare procesos externos.
  - Verificar que no haya integraciones con pagos, reporting ni pricing real.

  Definition of Done:
  - Preview completamente puro.
  - Sin side-effects ni integraciones cruzadas.

---

- [x] **8. Validar aislamiento del módulo**
  - Confirmar que no se importan casos de uso o adapters de `remittances`.
  - Confirmar que no se usa `pricingPreview`.
  - Confirmar que no se toca `ExchangeRate`.

  Definition of Done:
  - El módulo `vip-pricing` queda aislado del sistema actual.
  - Todas las restricciones críticas del change quedan satisfechas.