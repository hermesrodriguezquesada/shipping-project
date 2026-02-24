Tasks
1. Align Beneficiary GraphQL Type
Revisar BeneficiaryType
Corregir tipos incompatibles con Prisma
Corregir nullability inconsistente
No agregar campos nuevos
Definition of Done
✔ BeneficiaryType consistente con modelo Prisma
✔ Compila schema GraphQL

2. Align CreateBeneficiaryInput
Revisar nullability
Alinear con constraints Prisma
No modificar lógica de negocio
Definition of Done
✔ Mutación createBeneficiary no genera errores Prisma por nullability

3. Align UpdateBeneficiaryInput
Revisar campos opcionales vs requeridos
Alinear tipos
No agregar validaciones funcionales nuevas
Definition of Done
✔ updateBeneficiary consistente con Prisma

4. Validate Runtime Consistency
Verificar queries/mutations existentes
Confirmar ausencia de breaking changes
Definition of Done
✔ Mutaciones existentes funcionan sin errores runtime

NO agregar refactors.
NO modificar reglas de negocio.
NO agregar capacidades nuevas.