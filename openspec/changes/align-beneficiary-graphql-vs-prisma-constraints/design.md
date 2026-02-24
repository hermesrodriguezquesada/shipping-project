Overview
Este change introduce una corrección técnica de alineación contractual entre la capa GraphQL y la capa de persistencia Prisma para la entidad Beneficiary.
El objetivo es eliminar inconsistencias estructurales sin modificar comportamiento funcional ni reglas de negocio.
Problem Statement
Se detectaron divergencias entre:
Definiciones GraphQL de BeneficiaryType
Inputs GraphQL relacionados
Restricciones reales del modelo Prisma Beneficiary
Estas divergencias pueden provocar errores de validación, fallos en runtime y comportamientos inconsistentes entre API y base de datos.
Architectural Context
El sistema mantiene la arquitectura vigente:
GraphQL como contrato API
Prisma como capa de persistencia
NestJS como framework de aplicación
Este change no altera patrones arquitectónicos ni introduce nuevos componentes.
Design Decisions
Se aplicarán exclusivamente ajustes de alineación estructural:
Corrección de nullability inconsistente
Corrección de tipos incompatibles
Eliminación de discrepancias entre contrato API y constraints Prisma
No se agregan propiedades nuevas ni se modifican invariantes de dominio.
Technical Scope
Este change impacta únicamente:
Tipos GraphQL relacionados con Beneficiary
Inputs GraphQL de Beneficiary
Validaciones estrictamente necesarias para coherencia contractual
No se modifica lógica de negocio ni flujos funcionales.
NO propongas mejoras adicionales.
NO describas refactors.
NO redefinas reglas.