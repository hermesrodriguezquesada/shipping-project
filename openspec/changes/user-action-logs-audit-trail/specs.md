# Specs: user-action-logs-audit-trail

## Specs status

PROPOSED

## Requirement

Implementar un módulo transversal de auditoría funcional para registrar acciones relevantes de usuarios y administradores, con persistencia y consultas GraphQL seguras, sin romper contratos existentes y sin bloquear flujos de negocio si falla el registro.

## Acceptance criteria

### AC-1: Acciones de auth y user management de fase 1 están cubiertas

- Dado el alcance de fase 1 aprobado.
- Cuando se instrumentan `register`, `login`, `logout`, `updateMyProfile`, `adminUpdateUserProfile` y `adminSetUserVip`.
- Entonces cada flujo debe mapear a una acción válida de `UserActionLogAction`.
- Y el diseño no debe requerir acciones adicionales fuera del enum propuesto para cubrir esos casos.

### AC-2: Usuario registra login

- Dado un usuario que autentica correctamente.
- Cuando el flujo `login` finaliza con éxito.
- Entonces se debe intentar registrar un `UserActionLog` con acción `LOGIN`.
- Y si el log falla, el login principal debe seguir siendo exitoso.

### AC-3: Usuario consulta sus logs

- Dado un usuario autenticado con logs propios registrados.
- Cuando consulta `myUserActionLogs`.
- Entonces solo debe recibir logs cuyo `actorUserId` corresponda a su identidad.
- Y la query debe soportar filtros por acción y rango de fechas, además de `limit` y `offset`.

### AC-4: Usuario no puede ver logs de otro usuario

- Dado un usuario autenticado que intenta obtener visibilidad sobre logs de otro actor.
- Cuando usa `myUserActionLogs`.
- Entonces la respuesta no debe incluir registros de otro usuario.
- Y no debe existir un mecanismo para inyectar `actorUserId` arbitrario en esa query.

### AC-5: Admin consulta logs globales

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta `adminUserActionLogs`.
- Entonces debe poder obtener logs globales de auditoría.
- Y actores sin esos roles no deben tener acceso a esta query.

### AC-6: Admin filtra por actor, acción y recurso

- Dado un actor autorizado para `adminUserActionLogs`.
- Cuando envía filtros por `actorUserId`, `action`, `resourceType` o `resourceId`.
- Entonces la consulta debe devolver resultados filtrados consistentemente.
- Y también debe soportar filtros por rango de fechas, `limit` y `offset`.

### AC-7: Fallo al guardar log no rompe acción principal

- Dado cualquier flujo instrumentado de fase 1.
- Cuando la persistencia del `UserActionLog` falla después de la acción principal exitosa.
- Entonces el flujo principal no debe fallar ni revertirse por ese error.
- Y el sistema debe degradar el fallo a observabilidad no bloqueante.

### AC-8: No se guardan datos sensibles

- Dado un flujo que genera metadata de auditoría.
- Cuando se persiste `metadataJson`.
- Entonces no debe contener passwords, access tokens, refresh tokens, payment proof base64, payment proof S3 key, imágenes base64, imágenes, documentos ni datos bancarios completos.

### AC-9: Acciones de remittance generan logs

- Dado que se ejecutan exitosamente `submitRemittanceV2`, `markRemittancePaid`, `adminConfirmRemittancePayment`, `adminMarkRemittanceDelivered`, `cancelMyRemittance` o `adminCancelRemittance`.
- Cuando el flujo termina con éxito.
- Entonces se debe intentar registrar el `UserActionLog` correspondiente con recurso de remesa y metadata mínima segura.
- Y `cancelMyRemittance` y `adminCancelRemittance` deben compartir la acción `CANCEL_REMITTANCE`, distinguiendo origen y actor mediante metadata segura.

### AC-10: Acciones de VIP payment proof generan logs

- Dado que se ejecutan exitosamente `createVipPaymentProof`, `adminConfirmVipPaymentProof` o `adminCancelVipPaymentProof`.
- Cuando el flujo termina con éxito.
- Entonces se debe intentar registrar el `UserActionLog` correspondiente sin persistir base64, S3 keys ni contenido binario.

### AC-11: Acciones de soporte generan logs

- Dado que se ejecutan exitosamente `createSupportMessage` o `answerSupportMessage`.
- Cuando el flujo termina con éxito.
- Entonces se debe intentar registrar el `UserActionLog` correspondiente con metadata mínima segura y útil para auditoría.

## Non-functional constraints

- Sin breaking changes sobre contratos existentes.
- Sin side effects blocking en flujos principales.
- Sin interceptor global en esta fase.
- Sin export/reporting en esta fase.
- Sin logging técnico como sustituto de auditoría funcional.
- Con cambios mínimos y alineados a arquitectura hexagonal.
