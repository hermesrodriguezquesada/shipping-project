Why
Se identificó una desalineación entre el contrato GraphQL vigente y las restricciones reales definidas en el modelo Prisma Beneficiary.
Esta inconsistencia puede generar errores en runtime, validaciones contradictorias y comportamientos inesperados entre la capa API y la capa de persistencia.
Este change busca restablecer la coherencia contractual del sistema.

What Changes
Este change introduce exclusivamente correcciones de alineación entre:
Tipos GraphQL de Beneficiary
Inputs GraphQL relacionados
Restricciones reales del modelo Prisma Beneficiary
No se agregan nuevas capacidades ni reglas de negocio.

Capabilities
New Capabilities
Ninguna.

Impact
Impacto técnico correctivo.
Este change:
No introduce nuevas funcionalidades
No altera reglas de negocio
Reduce riesgo de errores runtime
Restablece coherencia entre API y persistencia

NO agregues capacidades nuevas.
NO propongas mejoras adicionales.