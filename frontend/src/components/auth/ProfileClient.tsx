"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { EventsManager } from "@/components/events/EventsManager";
import { getCurrentUser, updateCurrentUser } from "@/lib/api-client";
import { clearSession, getStoredUser, updateStoredUser } from "@/lib/storage";
import type { PublicUser } from "@/types/auth";

type DashboardView = "profile" | "events";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

function getFirstName(name: string) {
  return name.trim().split(" ")[0] || name;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getViewFromHash(): DashboardView {
  if (typeof window === "undefined") {
    return "profile";
  }

  return window.location.hash === "#meus-eventos" || window.location.hash === "#event-form" ? "events" : "profile";
}

export function ProfileClient() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>("profile");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    function syncViewWithHash() {
      setActiveView(getViewFromHash());
    }

    syncViewWithHash();
    window.addEventListener("hashchange", syncViewWithHash);

    return () => window.removeEventListener("hashchange", syncViewWithHash);
  }, []);

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

  function showView(view: DashboardView, targetId?: string) {
    setActiveView(view);
    window.history.replaceState(null, "", view === "events" ? "/perfil#meus-eventos" : "/perfil");

    if (targetId) {
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

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
    return null;
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

  const firstName = getFirstName(user.name);
  const initials = getInitials(user.name);
  const isProfileView = activeView === "profile";

  return (
    <div className="profile-dashboard-shell">
      <aside className="profile-sidebar" aria-label="Navegação da área pessoal">
        <div className="profile-sidebar__top">
          <Link href="/" className="profile-sidebar__back" aria-label="Voltar ao website" title="Voltar ao website">
            <span aria-hidden="true">←</span>
            Voltar
          </Link>
        </div>

        <div className="profile-sidebar__user">
          {avatarPreview ? (
            <img src={avatarPreview} alt={`Avatar de ${user.name}`} className="profile-sidebar__avatar" />
          ) : (
            <div className="profile-sidebar__avatar profile-sidebar__avatar--placeholder" aria-hidden="true">
              {initials}
            </div>
          )}
          <div>
            <strong>{user.name}</strong>
            <span>{user.role === "ADMIN" ? "Administrador" : "Utilizador"}</span>
          </div>
        </div>

        <nav className="profile-sidebar__nav">
          <button
            type="button"
            className="profile-sidebar__link"
            aria-current={isProfileView ? "page" : undefined}
            onClick={() => showView("profile")}
          >
            <span aria-hidden="true">01</span>
            Perfil
          </button>
          <button
            type="button"
            className="profile-sidebar__link"
            aria-current={!isProfileView ? "page" : undefined}
            onClick={() => showView("events")}
          >
            <span aria-hidden="true">02</span>
            Meus eventos
          </button>
        </nav>

        <div className="profile-sidebar__footer">
          <button
            type="button"
            className="btn btn--primary profile-sidebar__cta"
            onClick={() => showView("events", "event-form")}
          >
            Registar novo evento
          </button>
          <button type="button" className="profile-sidebar__logout" onClick={handleLogout}>
            <span aria-hidden="true">←</span>
            Sair
          </button>
        </div>
      </aside>

      <main className="profile-workspace">
        <header className="profile-workspace__header">
          <div>
            <p className="profile-workspace__eyebrow">Área pessoal CACA</p>
            <h1>{isProfileView ? `Bem-vindo, ${firstName}` : "Meus eventos"}</h1>
            <p>
              {isProfileView
                ? "Gerencie os seus dados de utilizador nesta área privada."
                : "Crie, edite e acompanhe apenas os eventos associados à sua conta."}
            </p>
          </div>
          <div className="profile-workspace__actions">

            {!isProfileView ? (
            <Link href="/eventos" className="btn btn--outline">
              Ver agenda pública
            </Link>
            ) : null}
          </div>
        </header>

        <div className={`profile-dashboard-grid profile-dashboard-grid--${activeView}`}>
          {isProfileView ? (
            <section id="profile-settings" className="profile-account-card" aria-labelledby="settings-title">
              <div className="profile-account-card__identity">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={`Avatar de ${user.name}`} className="profile-account-card__avatar" />
                ) : (
                  <div className="profile-account-card__avatar profile-account-card__avatar--placeholder" aria-hidden="true">
                    {initials}
                  </div>
                )}
                <div>
                  <h2 id="settings-title">{user.name}</h2>
                  <span className="status-badge">{user.role === "ADMIN" ? "Administrador" : "Utilizador"}</span>
                </div>
              </div>

              <form className="profile-form profile-form--dashboard" onSubmit={handleSubmit}>
                <div className="c-form__group profile-form__full">
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
                  <small className="profile-form__hint">PNG, JPEG ou WebP até 150 KB.</small>
                </div>

                <div className="c-form__group">
                  <label htmlFor="name" className="form-group__label">
                    Nome completo
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
                    placeholder="Adicione a sua instituição"
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
                    placeholder="Resumo curto sobre função, área de interesse ou ligação ao CACA."
                  />
                </div>

                <div className="c-form__group">
                  <label htmlFor="email" className="form-group__label">
                    Email
                  </label>
                  <input
                    id="email"
                    value={user.email}
                    className="c-form__input c-form__input--no-icon"
                    readOnly
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn--primary profile-form__submit"
                  disabled={isSaving}
                  aria-busy={isSaving}
                >
                  {isSaving ? "A atualizar..." : "Atualizar perfil"}
                </button>

                {feedback ? (
                  <p className={`form-feedback form-feedback--${feedback.type}`} role="status" aria-live="polite">
                    {feedback.message}
                  </p>
                ) : null}
              </form>
            </section>
          ) : (
            <EventsManager />
          )}
        </div>
      </main>
    </div>
  );
}
