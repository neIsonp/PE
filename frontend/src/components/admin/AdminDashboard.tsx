"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  listContactMessages,
  listNewsletterSubscriptions,
  listUsers,
  updateUserRole
} from "@/lib/api-client";
import { clearSession, updateStoredUser } from "@/lib/storage";
import type { PublicUser } from "@/types/auth";

type ContactMessage = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
};

type NewsletterSubscription = {
  id: string;
  email: string;
  createdAt: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(async ({ user }) => {
        setCurrentUser(user);
        updateStoredUser(user);

        if (user.role !== "ADMIN") {
          return;
        }

        const [usersResponse, messagesResponse, subscriptionsResponse] = await Promise.all([
          listUsers(),
          listContactMessages(),
          listNewsletterSubscriptions()
        ]);

        setUsers(usersResponse.users);
        setMessages(messagesResponse.messages);
        setSubscriptions(subscriptionsResponse.subscriptions);
      })
      .catch((error) => {
        clearSession();
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Não foi possível carregar o painel."
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleRoleChange(userId: string, role: PublicUser["role"]) {
    setFeedback(null);

    try {
      const response = await updateUserRole(userId, role);
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === response.user.id ? response.user : user))
      );
      setFeedback({ type: "success", message: "Permissão atualizada com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível atualizar a permissão."
      });
    }
  }

  function handleLogout() {
    clearSession();
    window.location.href = "/login";
  }

  if (isLoading) {
    return (
      <div className="admin-shell">
        <p className="profile-card__eyebrow">Administração</p>
        <h1 className="profile-card__title">A carregar painel...</h1>
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="admin-shell">
        <p className="profile-card__eyebrow">Acesso restrito</p>
        <h1 className="profile-card__title">Painel de administração</h1>
        <p className="profile-card__subtitle">
          Esta área é exclusiva para administradores.
        </p>
        <div className="admin-actions">
          <Link href="/login" className="btn btn--primary">
            Entrar como administrador
          </Link>
          <button type="button" className="btn btn--outline" onClick={handleLogout}>
            Terminar sessão atual
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <p className="profile-card__eyebrow">Administração</p>
      <h1 className="profile-card__title">Painel CACA</h1>
      <p className="profile-card__subtitle">
        Gestão de utilizadores, mensagens de contacto e subscrições da newsletter.
      </p>

      {feedback ? (
        <p className={`form-feedback form-feedback--${feedback.type}`} role="status" aria-live="polite">
          {feedback.message}
        </p>
      ) : null}

      <section className="admin-panel" aria-labelledby="admin-users-title">
        <h2 id="admin-users-title" className="admin-panel__title">
          Utilizadores
        </h2>
        <div className="admin-table" role="region" aria-label="Tabela de utilizadores">
          {users.map((user) => (
            <article className="admin-row" key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <select
                className="c-form__input c-form__input--no-icon"
                value={user.role}
                onChange={(event) => handleRoleChange(user.id, event.target.value as PublicUser["role"])}
                aria-label={`Permissão de ${user.name}`}
                disabled={user.id === currentUser.id}
                title={user.id === currentUser.id ? "Não é possível alterar a própria permissão." : undefined}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel" aria-labelledby="admin-messages-title">
        <h2 id="admin-messages-title" className="admin-panel__title">
          Mensagens de contacto
        </h2>
        <div className="admin-grid">
          {messages.length > 0 ? (
            messages.map((message) => (
              <article className="admin-card" key={message.id}>
                <strong>
                  {message.firstName} {message.lastName}
                </strong>
                <span>{message.email}</span>
                <span>{message.phone}</span>
                <p>{message.message}</p>
              </article>
            ))
          ) : (
            <p className="section__description">Ainda não existem mensagens.</p>
          )}
        </div>
      </section>

      <section className="admin-panel" aria-labelledby="admin-newsletter-title">
        <h2 id="admin-newsletter-title" className="admin-panel__title">
          Subscrições da newsletter
        </h2>
        <div className="admin-grid">
          {subscriptions.length > 0 ? (
            subscriptions.map((subscription) => (
              <article className="admin-card" key={subscription.id}>
                <strong>{subscription.email}</strong>
                <span>{new Date(subscription.createdAt).toLocaleDateString("pt-PT")}</span>
              </article>
            ))
          ) : (
            <p className="section__description">Ainda não existem subscrições.</p>
          )}
        </div>
      </section>
    </div>
  );
}
