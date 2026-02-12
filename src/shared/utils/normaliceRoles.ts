import { Role } from "@prisma/client";

export function normalizeRoles(roles: Role[] | undefined, fallback: Role[] = [Role.CLIENT]): Role[] {
  const r = (roles?.length ? roles : fallback);
  return Array.from(new Set(r));
}
