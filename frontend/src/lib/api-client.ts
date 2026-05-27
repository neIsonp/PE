import { apiBaseUrl } from "./config";
import { getToken } from "./storage";
import type { AuthResponse, PublicUser } from "@/types/auth";
import type { CacaEvent } from "@/types/events";

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

  if (!token) {
    throw new Error("Sessão não encontrada. Inicie sessão novamente.");
  }

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
  avatarUrl?: string | null;
}) {
  const token = getToken();

  if (!token) {
    throw new Error("Sessão não encontrada. Inicie sessão novamente.");
  }

  return requestJson<{ user: PublicUser }>("/users/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
}

export function listUsers() {
  const token = getToken();

  if (!token) {
    throw new Error("Sessão não encontrada. Inicie sessão novamente.");
  }

  return requestJson<{ users: PublicUser[] }>("/users", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function updateUserRole(id: string, role: PublicUser["role"]) {
  const token = getToken();

  if (!token) {
    throw new Error("Sessão não encontrada. Inicie sessão novamente.");
  }

  return requestJson<{ user: PublicUser }>(`/users/${id}/role`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role })
  });
}

export function fetchEvents() {
  return requestJson<{ events: CacaEvent[] }>("/events");
}

export function createEvent(input: Omit<CacaEvent, "id" | "createdAt" | "updatedAt" | "createdById">) {
  const token = getToken();

  if (!token) {
    throw new Error("Inicie sessão para guardar eventos.");
  }

  return requestJson<{ event: CacaEvent }>("/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
}

export function updateEvent(id: string, input: Omit<CacaEvent, "id" | "createdAt" | "updatedAt" | "createdById">) {
  const token = getToken();

  if (!token) {
    throw new Error("Inicie sessão para atualizar eventos.");
  }

  return requestJson<{ event: CacaEvent }>(`/events/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
}

export function deleteEvent(id: string) {
  const token = getToken();

  if (!token) {
    throw new Error("Inicie sessão para eliminar eventos.");
  }

  return fetch(`${apiBaseUrl}/events/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then(async (response) => {
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      throw new Error(body.message ?? "Não foi possível eliminar o evento.");
    }
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
  const token = getToken();

  if (!token) {
    throw new Error("Sessão não encontrada. Inicie sessão novamente.");
  }

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
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function listNewsletterSubscriptions() {
  const token = getToken();

  if (!token) {
    throw new Error("Sessão não encontrada. Inicie sessão novamente.");
  }

  return requestJson<{
    subscriptions: Array<{ id: string; email: string; createdAt: string }>;
  }>("/newsletter", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
