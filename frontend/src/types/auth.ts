export type UserRole = "ADMIN" | "USER";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bio: string | null;
  institution: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: PublicUser;
};
