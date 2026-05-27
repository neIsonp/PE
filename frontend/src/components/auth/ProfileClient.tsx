"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getCurrentUser, updateCurrentUser } from "@/lib/api-client";
import { clearSession, getStoredUser, updateStoredUser } from "@/lib/storage";
import type { PublicUser } from "@/types/auth";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export function ProfileClient() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      setUser(storedUser);
    }

    getCurrentUser()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        setAvatarPreview(currentUser.avatarUrl);
        updateStoredUser(currentUser);
      })
      .catch(() => {
        clearSession();
        setUser(null);
        router.replace("/login");
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await updateCurrentUser({
        name: String(form.get("name") ?? ""),
        bio: String(form.get("bio") ?? "") || null,
        institution: String(form.get("institution") ?? "") || null,
        avatarUrl: avatarPreview
      });

      setUser(response.user);
      updateStoredUser(response.user);
      setFeedback({ type: "success", message: "Perfil atualizado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível atualizar o perfil."
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    router.replace("/login");
  }

  function handleAvatarChange(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setFeedback({ type: "error", message: "Escolha uma imagem PNG, JPEG ou WebP." });
      return;
    }

    if (file.size > 150_000) {
      setFeedback({ type: "error", message: "A imagem deve ter no máximo 150 KB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  if (isLoading) {
    return (
      <div className="profile-card">
        <p className="profile-card__eyebrow">Perfil</p>
        <h1 className="profile-card__title">A carregar...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-card">
        <p className="profile-card__eyebrow">Sessão necessária</p>
        <h1 className="profile-card__title">Entre para ver o perfil</h1>
        <p className="profile-card__subtitle">
          A área pessoal comunica com a API Fastify através de JWT.
        </p>
        <Link href="/login" className="btn btn--primary">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <p className="profile-card__eyebrow">Perfil</p>
      {avatarPreview ? (
        <img src={avatarPreview} alt={`Avatar de ${user.name}`} className="profile-card__avatar" />
      ) : (
        <div className="profile-card__avatar profile-card__avatar--placeholder" aria-hidden="true">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <h1 className="profile-card__title">{user.name}</h1>
      <span className="status-badge">{user.role === "ADMIN" ? "Administrador" : "Utilizador"}</span>

      <div className="profile-card__meta">
        <div className="profile-card__meta-item">
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
        <div className="profile-card__meta-item">
          <span>Instituição</span>
          <strong>{user.institution ?? "Não indicada"}</strong>
        </div>
      </div>

      <form className="c-form" onSubmit={handleSubmit}>
        <div className="c-form__group">
          <label htmlFor="avatar" className="form-group__label">
            Avatar
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="c-form__input c-form__input--no-icon"
            onChange={(event) => handleAvatarChange(event.target.files?.[0])}
          />
        </div>
        <div className="c-form__group">
          <label htmlFor="name" className="form-group__label">
            Nome
          </label>
          <input
            id="name"
            name="name"
            defaultValue={user.name}
            className="c-form__input c-form__input--no-icon"
            required
          />
        </div>
        <div className="c-form__group">
          <label htmlFor="institution" className="form-group__label">
            Instituição
          </label>
          <input
            id="institution"
            name="institution"
            defaultValue={user.institution ?? ""}
            className="c-form__input c-form__input--no-icon"
          />
        </div>
        <div className="c-form__group">
          <label htmlFor="bio" className="form-group__label">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={user.bio ?? ""}
            className="c-form__input c-form__textarea"
            maxLength={500}
          />
        </div>
        <button type="submit" className="c-form__submit" disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? "A guardar..." : "Guardar perfil"}
        </button>
        {feedback ? (
          <p className={`form-feedback form-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        ) : null}
      </form>

      <button type="button" className="btn btn--outline" style={{ marginTop: 20 }} onClick={handleLogout}>
        Terminar sessão
      </button>
    </div>
  );
}
