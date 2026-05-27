import { UserRole as PrismaUserRole } from "@prisma/client";

export const userRoles = [PrismaUserRole.ADMIN, PrismaUserRole.USER] as const;

export type UserRole = (typeof userRoles)[number];

export function isUserRole(role: string): role is UserRole {
  return userRoles.includes(role as UserRole);
}
