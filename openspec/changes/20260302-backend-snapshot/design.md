# Design: backend snapshot

## Arquitectura actual (alto nivel)

Backend NestJS modular con GraphQL y Prisma. Organización por dominio con estilo hexagonal:

- `presentation`: GraphQL resolvers/types/inputs
- `application`: use-cases/services
- `domain`: puertos/entidades/VO
- `infrastructure`: adapters (principalmente Prisma)

## Diagrama textual de módulos

`AppModule`
→ `AuthModule`, `UsersModule`, `IdentityModule`, `BeneficiariesModule`
→ `CatalogsModule`, `ExchangeRatesModule`, `CommissionRulesModule`, `DeliveryFeesModule`
→ `PricingModule` (depende de CommissionRules + DeliveryFees + ExchangeRates)
→ `RemittancesModule` (depende de Catalogs + ExchangeRates + Pricing)

## Mapa hexagonal (resolver → use-case → port → adapter → Prisma)

### Remittances

- `RemittancesResolver.submitRemittanceV2`
  → `SubmitRemittanceV2UseCase`
  → `RemittanceCommandPort`, `RemittanceQueryPort` + puertos de availability (catálogos)
  → `PrismaRemittanceCommandAdapter`, `PrismaRemittanceQueryAdapter` + `*AvailabilityBridgeAdapter`
  → tablas `Remittance`, `Beneficiary` + lecturas de catálogos/reglas/tasas vía Prisma.

- `RemittancesResolver.markRemittancePaid/cancelMyRemittance/admin*`
  → `RemittanceLifecycleUseCase`
  → `RemittanceCommandPort`, `RemittanceQueryPort`
  → adapters Prisma de remesas
  → updates de `Remittance.status`.

### ExchangeRates

- Público:
  - `ExchangeRatesResolver.exchangeRate(from,to)`
    → `GetLatestExchangeRateUseCase`
    → `ExchangeRatesQueryPort`
    → `PrismaExchangeRatesQueryAdapter`
    → tabla `ExchangeRate` + join `CurrencyCatalog`.

  - `ExchangeRatesResolver.exchangeRates(...)` (lista)
    → `ListExchangeRatesPublicUseCase`
    → `ExchangeRatesQueryPort`
    → `PrismaExchangeRatesQueryAdapter`
    → tabla `ExchangeRate` + join `CurrencyCatalog`.

- Admin:
  - `ExchangeRatesResolver.adminExchangeRates(...)`
    → `AdminListExchangeRatesUseCase`
    → `ExchangeRatesQueryPort`
    → `PrismaExchangeRatesQueryAdapter`

  - `ExchangeRatesResolver.adminCreate/update/deleteExchangeRate`
    → use-cases admin correspondientes
    → `ExchangeRatesCommandPort` (+ `CatalogsQueryPort` para create si aplica)
    → `PrismaExchangeRatesCommandAdapter`
    → CRUD en `ExchangeRate`.

### Pricing

- `PricingResolver.pricingPreview`
  → `PricingPreviewUseCase`
  → `PricingCalculatorService`
  → `CommissionRulesQueryPort`, `DeliveryFeesQueryPort`, `ExchangeRatesQueryPort`
  → adapters Prisma de cada dominio
  → cálculo en memoria + lectura de reglas/tasa.

### CommissionRules

- `CommissionRulesResolver.admin*`
  → use-cases admin de create/update/setEnabled/list
  → `CommissionRulesCommandPort`, `CommissionRulesQueryPort`
  → `PrismaCommissionRulesCommandAdapter`, `PrismaCommissionRulesQueryAdapter`
  → tabla `CommissionRule` + `CurrencyCatalog`.

### DeliveryFees

- `DeliveryFeesResolver.admin*`
  → use-cases admin de create/update/setEnabled/list
  → `DeliveryFeesCommandPort`, `DeliveryFeesQueryPort`
  → `PrismaDeliveryFeesCommandAdapter`, `PrismaDeliveryFeesQueryAdapter`
  → tabla `DeliveryFeeRule` + `CurrencyCatalog`.

## Modelo de autenticación (público vs protegido)

### Requisito clave (frontend)
- `exchangeRates` debe ser **público (sin Authorization)** para Home y creación de remesa.
- `exchangeRate(from,to)` se mantiene (también se usa), y puede ser público.
- `adminExchangeRates` y mutations `admin*` requieren token ADMIN.

### Qué debe documentar este snapshot (sin asumir)
- Si existe un guard global, documentar cómo el resolver permite acceso público en `exchangeRates`.
- Si no hay guard global, documentar que la protección es por resolver/método.

> Nota: este snapshot debe basarse en evidencia del código real (resolvers/guards) y del schema generado.

## Verificación de integridad arquitectónica

### Hallazgo: candidato a código huérfano

Se detecta artefacto potencialmente huérfano en remesas:

- `ExchangeRateSnapshotPort` + `ExchangeRateSnapshotBridgeAdapter` + token `EXCHANGE_RATE_SNAPSHOT_PORT` existen,
  pero podrían no estar cableados ni consumidos por use-cases activos.

Acción recomendada (documental):
- Confirmar wiring real en `RemittancesModule`.
- Si no está usado: proponer change futuro para eliminarlo o re-integrarlo.

Conclusión: el snapshot no debe afirmar “cero huérfanos” si no hay evidencia absoluta.