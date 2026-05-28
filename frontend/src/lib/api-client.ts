import { apiBaseUrl } from "./config";
import { clearSession, getValidToken } from "./storage";
import type { AuthResponse, PublicUser } from "@/types/auth";
import type { CacaEvent } from "@/types/events";

type ApiErrorBody = {
  message?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ContactMessageStatus = "PENDING" | "READ" | "ARCHIVED";

export type ContactMessage = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
};

export type NewsletterSubscription = {
  id: string;
  email: string;
  createdAt: string;
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

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();

  return queryString ? `${path}?${queryString}` : path;
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

export function listUsers(params: { page?: number; limit?: number; search?: string } = {}) {
  return requestJson<{ users: PublicUser[]; meta: PaginationMeta }>(withQuery("/users", params), {
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

export function fetchEvents(params: { period?: "upcoming" | "past" } = {}) {
  return requestJson<{ events: CacaEvent[] }>(withQuery("/events", params));
}

export function fetchMyEvents(params: { period?: "upcoming" | "past" } = {}) {
  return requestJson<{ events: CacaEvent[] }>(withQuery("/events/mine", params), {
    headers: getAuthHeaders("Inicie sessão para gerir os seus eventos.")
  });
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

export function listContactMessages(
  params: { page?: number; limit?: number; status?: ContactMessageStatus } = {}
) {
  return requestJson<{
    messages: ContactMessage[];
    meta: PaginationMeta;
  }>(withQuery("/contact", params), {
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente.")
  });
}

export function updateContactMessageStatus(id: string, status: ContactMessageStatus) {
  return requestJson<{ message: ContactMessage }>(`/contact/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente."),
    body: JSON.stringify({ status })
  });
}

export function listNewsletterSubscriptions(params: { page?: number; limit?: number } = {}) {
  return requestJson<{
    subscriptions: NewsletterSubscription[];
    meta: PaginationMeta;
  }>(withQuery("/newsletter", params), {
    headers: getAuthHeaders("Sessão não encontrada. Inicie sessão novamente.")
  });
}
