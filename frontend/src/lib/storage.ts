import type { AuthResponse, PublicUser } from "@/types/auth";

const tokenKey = "caca_auth_token";
const userKey = "caca_auth_user";

export function saveSession(session: AuthResponse) {
  localStorage.setItem(tokenKey, session.token);
  localStorage.setItem(userKey, JSON.stringify(session.user));
}

export function getToken() {
  return localStorage.getItem(tokenKey);
}

export function getStoredUser(): PublicUser | null {
  const rawUser = localStorage.getItem(userKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as PublicUser;
  } catch {
    clearSession();
    return null;
  }
}

export function updateStoredUser(user: PublicUser) {
  localStorage.setItem(userKey, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}
