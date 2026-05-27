import type { AuthResponse, PublicUser } from "@/types/auth";

const tokenKey = "caca_auth_token";
const userKey = "caca_auth_user";
export const sessionChangedEvent = "caca:session-changed";

function canUseStorage() {
  return typeof globalThis.localStorage !== "undefined";
}

function emitSessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(sessionChangedEvent));
  }
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

  localStorage.setItem(tokenKey, session.token);
  localStorage.setItem(userKey, JSON.stringify(session.user));
  emitSessionChange();
}

export function getToken() {
  if (!canUseStorage()) {
    return null;
  }

  return localStorage.getItem(tokenKey);
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
  emitSessionChange();
}

export function clearSession() {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  emitSessionChange();
}
