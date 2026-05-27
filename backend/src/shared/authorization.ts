import { AppError } from "./app-error.js";
import type { UserRole } from "./roles.js";

export function assertRole(currentRole: UserRole, allowedRoles: UserRole[], message: string) {
  if (!allowedRoles.includes(currentRole)) {
    throw new AppError(403, message);
  }
}
