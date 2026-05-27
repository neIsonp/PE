export const userRoles = ["ADMIN", "USER"] as const;

export type UserRole = (typeof userRoles)[number];

export function isUserRole(role: string): role is UserRole {
  return userRoles.includes(role as UserRole);
}
