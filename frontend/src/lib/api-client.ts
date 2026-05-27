import { apiBaseUrl } from "./config";
import { getToken } from "./storage";
import type { AuthResponse, PublicUser } from "@/types/auth";

type ApiErrorBody = {
  message?: string;
};

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.message ?? "Não foi possível comunicar com a API.");
  }

  return response.json() as Promise<T>;
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  institution?: string;
}) {
  return requestJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function loginUser(input: { email: string; password: string }) {
  return requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getCurrentUser() {
  const token = getToken();

  return requestJson<{ user: PublicUser }>("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function updateCurrentUser(input: {
  name: string;
  bio?: string | null;
  institution?: string | null;
}) {
  const token = getToken();

  return requestJson<{ user: PublicUser }>("/users/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
}
