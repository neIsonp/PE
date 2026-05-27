import type { User } from "@prisma/client";
import { isUserRole } from "../../shared/roles.js";
import type { PublicUser } from "./user.schemas.js";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: isUserRole(user.role) ? user.role : "USER",
    bio: user.bio,
    institution: user.institution,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}
