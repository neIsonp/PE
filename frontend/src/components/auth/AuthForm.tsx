"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { z, ZodError } from "zod";
import { loginUser, registerUser } from "@/lib/api-client";
import { saveSession } from "@/lib/storage";

type AuthFormProps = {
  mode: "login" | "register";
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const loginSchema = z.object({
  email: z.string().trim().email("Indique um email válido."),
  password: z.string().min(1, "Indique a palavra-passe.")
});

const strongPasswordSchema = z
  .string()
  .min(8, "A palavra-passe deve ter pelo menos 8 caracteres.")
  .regex(/[A-Z]/, "A palavra-passe deve incluir uma maiúscula.")
  .regex(/[a-z]/, "A palavra-passe deve incluir uma minúscula.")
  .regex(/[0-9]/, "A palavra-passe deve incluir um número.");

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Indique o seu nome."),
  password: strongPasswordSchema,
  institution: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
});

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const session = isRegister
        ? await registerUser(registerSchema.parse(data))
        : await loginUser(loginSchema.parse(data));

      saveSession(session);
      setFeedback({
        type: "success",
        message: isRegister ? "Conta criada com sucesso." : "Sessão iniciada com sucesso."
      });
      router.push("/perfil");
    } catch (error) {
      const message =
        error instanceof ZodError
          ? (error.issues[0]?.message ?? "Verifique os dados introduzidos.")
          : error instanceof Error
            ? error.message
            : "Não foi possível autenticar.";

      setFeedback({
        type: "error",
        message
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="auth-card__eyebrow">Área de utilizador</p>
      <h1 className="auth-card__title">{isRegister ? "Criar conta" : "Entrar"}</h1>
      <p className="auth-card__subtitle">
        {isRegister
          ? "Registe-se para gerir o seu perfil e acompanhar iniciativas do CACA."
          : "Aceda à sua área pessoal com as credenciais registadas na API."}
      </p>

      <form className="c-form" onSubmit={handleSubmit}>
        {isRegister ? (
          <>
            <div className="c-form__group">
              <label htmlFor="name" className="form-group__label">
                Nome completo
              </label>
              <input id="name" name="name" className="c-form__input c-form__input--no-icon" required />
            </div>
            <div className="c-form__group">
              <label htmlFor="institution" className="form-group__label">
                Instituição
              </label>
              <input
                id="institution"
                name="institution"
                className="c-form__input c-form__input--no-icon"
                placeholder="Universidade, hospital ou centro de investigação"
              />
            </div>
          </>
        ) : null}

        <div className="c-form__group">
          <label htmlFor="email" className="form-group__label">
            Email
          </label>
          <input id="email" name="email" type="email" className="c-form__input c-form__input--no-icon" required />
        </div>

        <div className="c-form__group">
          <label htmlFor="password" className="form-group__label">
            Palavra-passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="c-form__input c-form__input--no-icon"
            minLength={isRegister ? 8 : 1}
            required
          />
          {isRegister ? (
            <small className="auth-card__hint">
              Mínimo 8 caracteres, com maiúscula, minúscula e número.
            </small>
          ) : null}
        </div>

        <button type="submit" className="c-form__submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "A processar..." : isRegister ? "Criar conta" : "Entrar"}
        </button>

        {feedback ? (
          <p className={`form-feedback form-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        ) : null}
      </form>

      <p className="auth-card__footer">
        {isRegister ? (
          <>
            Já tem conta? <Link href="/login">Entrar</Link>
          </>
        ) : (
          <>
            Ainda não tem conta? <Link href="/registo">Criar conta</Link>
          </>
        )}
      </p>
    </div>
  );
}
