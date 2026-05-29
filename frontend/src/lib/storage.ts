import type { AuthResponse, PublicUser } from "@/types/auth";

const tokenKey = "caca_auth_token";
const userKey = "caca_auth_user";

function canUseStorage() {
  return typeof globalThis.localStorage !== "undefined";
}


function decodeJwtPayload(token: string) {
  const payload = token.split(".")[1];

  if (!payload || typeof atob === "undefined") {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");

    return JSON.parse(atob(paddedPayload)) as { exp?: number };
  } catch {
    return null;
  }
}

export function saveSession(session: AuthResponse) {
  if (!canUseStorage()) {
    return;
  }

  // Armazenar o token em cookie (válido para toda a aplicação) para permitir SSR
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${tokenKey}=${session.token}; expires=${expires}; path=/; SameSite=Lax`;
  
  localStorage.setItem(userKey, JSON.stringify(session.user));
}

export function getToken() {
  if (!canUseStorage()) {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(^| )${tokenKey}=([^;]+)`));
  return match ? match[2] : null;
}

export function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

export function getValidToken() {
  const token = getToken();

  if (token && isTokenExpired(token)) {
    clearSession();
    return null;
  }

  return token;
}

export function getStoredUser(): PublicUser | null {
  if (!canUseStorage()) {
    return null;
  }

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
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(userKey, JSON.stringify(user));
}

export function clearSession() {
  if (!canUseStorage()) {
    return;
  }

  document.cookie = `${tokenKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  localStorage.removeItem(userKey);
}
