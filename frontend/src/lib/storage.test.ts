import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, getStoredUser, getToken, saveSession, updateStoredUser } from "./storage";
import type { AuthResponse, PublicUser } from "@/types/auth";

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    })
  };
}

const user: PublicUser = {
  id: "user-1",
  name: "Nelson Ponte",
  email: "nelson@example.com",
  role: "USER",
  bio: null,
  institution: "Universidade dos Açores",
  avatarUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  it("guarda, lê, atualiza e limpa a sessão local", () => {
    const session: AuthResponse = {
      token: "token",
      user
    };

    saveSession(session);

    expect(getToken()).toBe("token");
    expect(getStoredUser()).toEqual(user);

    updateStoredUser({ ...user, name: "Nelson Pacheco Ponte" });
    expect(getStoredUser()?.name).toBe("Nelson Pacheco Ponte");

    clearSession();
    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});
