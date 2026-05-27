import { describe, expect, it } from "vitest";
import { registerBodySchema } from "../src/modules/auth/auth.schemas.js";

describe("registerBodySchema", () => {
  it("normaliza email e aceita palavra-passe forte", () => {
    const result = registerBodySchema.parse({
      name: "Maria Silva",
      email: " MARIA@EXEMPLO.PT ",
      password: "Senha2026",
      institution: "Universidade dos Açores"
    });

    expect(result.email).toBe("maria@exemplo.pt");
  });

  it("rejeita palavra-passe fraca", () => {
    expect(() =>
      registerBodySchema.parse({
        name: "Maria Silva",
        email: "maria@exemplo.pt",
        password: "senha"
      })
    ).toThrow();
  });
});
