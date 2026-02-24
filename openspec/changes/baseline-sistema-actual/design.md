Overview
Este change no introduce un diseño técnico nuevo.
Su propósito es consolidar y congelar documentalmente la arquitectura, estructuras, contratos y reglas actualmente existentes en el sistema.
El diseño reflejado corresponde estrictamente al estado real vigente observado durante la auditoría técnica.

Architectural Context
El sistema mantiene la arquitectura actualmente implementada:
NestJS como framework de aplicación
Prisma como capa de persistencia
GraphQL como contrato API
Separación modular por dominios funcionales
Validaciones mediante pipes y guards
No se definen alteraciones arquitectónicas ni cambios de patrones.

Design Decisions
No se introducen decisiones de diseño nuevas.
Este change únicamente documenta decisiones ya materializadas en el código existente.

Technical Scope
Este change cubre exclusivamente:
Documentación del dominio vigente
Formalización de invariantes observadas
Registro del contrato GraphQL actual
Consolidación de reglas de negocio existentes
Registro de validaciones efectivas
Identificación explícita de deuda técnica
Identificación de riesgos arquitectónicos
No se modifica comportamiento del sistema.

NO agregues decisiones nuevas.
NO propongas mejoras arquitectónicas.
NO describas refactors.