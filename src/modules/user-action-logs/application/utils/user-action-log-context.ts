import { Role } from '@prisma/client';
import { Request } from 'express';

export function getPrimaryRole(roles?: readonly Role[] | readonly string[] | null): string | null {
  const role = roles?.[0];
  return role ? String(role) : null;
}

export function getRequestAuditContext(req?: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwardedFor = req?.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : null;

  const userAgentHeader = req?.headers['user-agent'];
  const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader ?? null;

  return {
    ipAddress: forwardedIp || req?.ip || req?.socket?.remoteAddress || null,
    userAgent: userAgent?.trim() || null,
  };
}