## Why

El frontend requiere que el flujo de recuperación de contraseña utilice una URL con formato específico:
https://<FRONTEND_URL>/reset_password?hash=<...>

Actualmente el sistema genera la URL con path y query distintos (/reset-password?token=...).
Se requiere alinear el contrato de enlace enviado por email y el parámetro esperado por el frontend.

## What Changes

Se ajusta exclusivamente el formato del enlace enviado por email en requestPasswordReset para:

- Usar path /reset_password
- Usar query param hash (en lugar de token)

La mutación resetPassword seguirá validando el valor recibido contra el registro persistido (token hash + TTL + uso único).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- Forgot Password Link Contract: alineación del formato de enlace/param enviado al frontend.

## Impact

Impacto funcional controlado:

- Cambia el formato del enlace enviado por email.
- No cambia el mecanismo de validación/expiración/uso único existente.