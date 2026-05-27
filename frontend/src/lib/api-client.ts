import { apiBaseUrl } from "./config";
import { clearSession, getValidToken } from "./storage";
import type { AuthResponse, PublicUser } from "@/types/auth";
import type { CacaEvent } from "@/types/events";

type ApiErrorBody = {
  message?: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function getAuthHeaders(message: string) {
  const token = getValidToken();

  if (!token) {
    throw new ApiClientError(message, 401);
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

async function parseError(response: Response, fallbackMessage: string) {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;

  if (response.status === 401) {
    clearSession();
  }

  return new ApiClientError(body.message ?? fallbackMessage, response.status);
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw await parseError(response, "Não foi possível comunicar com a API.");
  }

  return response.json() as Promise<T>;
}

async function requestVoid(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw await parseError(response, "Não foi possível comunicar com a API.");
  }
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
  return requestJson<{ user: PublicUser }>("/users/me", {
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente.")
  });
}

export function updateCurrentUser(input: {
  name: string;
  bio?: string | null;
  institution?: string | null;
  avatarUrl?: string | null;
}) {
  return requestJson<{ user: PublicUser }>("/users/me", {
    method: "PUT",
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente."),
    body: JSON.stringify(input)
  });
}

export function listUsers() {
  return requestJson<{ users: PublicUser[] }>("/users", {
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente.")
  });
}

export function updateUserRole(id: string, role: PublicUser["role"]) {
  return requestJson<{ user: PublicUser }>(`/users/${id}/role`, {
    method: "PATCH",
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente."),
    body: JSON.stringify({ role })
  });
}

export function fetchEvents() {
  return requestJson<{ events: CacaEvent[] }>("/events");
}

export function createEvent(input: Omit<CacaEvent, "id" | "createdAt" | "updatedAt" | "createdById">) {
  return requestJson<{ event: CacaEvent }>("/events", {
    method: "POST",
    headers: getAuthHeaders("Inicie sessão para guardar eventos."),
    body: JSON.stringify(input)
  });
}

export function updateEvent(id: string, input: Omit<CacaEvent, "id" | "createdAt" | "updatedAt" | "createdById">) {
  return requestJson<{ event: CacaEvent }>(`/events/${id}`, {
    method: "PUT",
    headers: getAuthHeaders("Inicie sessão para atualizar eventos."),
    body: JSON.stringify(input)
  });
}

export function deleteEvent(id: string) {
  return requestVoid(`/events/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders("Inicie sessão para eliminar eventos.")
  });
}

export function submitContactMessage(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}) {
  return requestJson<{ message: { id: string } }>("/contact", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function subscribeNewsletter(email: string) {
  return requestJson<{ subscription: { id: string; email: string; createdAt: string } }>("/newsletter", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export function listContactMessages() {
  return requestJson<{
    messages: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      message: string;
      createdAt: string;
    }>;
  }>("/contact", {
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente.")
  });
}

export function listNewsletterSubscriptions() {
  return requestJson<{
    subscriptions: Array<{ id: string; email: string; createdAt: string }>;
  }>("/newsletter", {
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente.")
  });
}
