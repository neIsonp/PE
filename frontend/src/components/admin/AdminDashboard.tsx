"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getCurrentUser,
  listContactMessages,
  listNewsletterSubscriptions,
  listUsers,
  updateContactMessageStatus,
  updateUserRole,
  type ContactMessage,
  type ContactMessageStatus,
  type NewsletterSubscription,
  type PaginationMeta
} from "@/lib/api-client";
import { clearSession, updateStoredUser } from "@/lib/storage";
import type { PublicUser } from "@/types/auth";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const PAGE_SIZE = 6;

const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false
};

const statusLabels: Record<ContactMessageStatus, string> = {
  PENDING: "Pendente",
  READ: "Lida",
  ARCHIVED: "Arquivada"
};

function getStatusClass(status: ContactMessageStatus) {
  return `status-badge status-badge--${status.toLowerCase()}`;
}

export function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [roleActionId, setRoleActionId] = useState<string | null>(null);
  const [messageActionId, setMessageActionId] = useState<string | null>(null);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);
  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [messagesStatus, setMessagesStatus] = useState<ContactMessageStatus | "ALL">("ALL");
  const [usersMeta, setUsersMeta] = useState<PaginationMeta>(emptyMeta);
  const [messagesMeta, setMessagesMeta] = useState<PaginationMeta>(emptyMeta);
  const [subscriptionsMeta, setSubscriptionsMeta] = useState<PaginationMeta>(emptyMeta);

  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    getCurrentUser()
      .then(({ user }) => {
        setCurrentUser(user);
        updateStoredUser(user);
      })
      .catch((error) => {
        clearSession();
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Não foi possível carregar o painel."
        });
      })
      .finally(() => setIsLoadingSession(false));
  }, []);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setIsLoadingUsers(true);
    try {
      const response = await listUsers({
        page: usersPage,
        limit: PAGE_SIZE,
        search: usersSearch.trim() || undefined
      });
      setUsers(response.users);
      setUsersMeta(response.meta);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível carregar utilizadores."
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAdmin, usersPage, usersSearch]);

  const loadMessages = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setIsLoadingMessages(true);
    try {
      const response = await listContactMessages({
        page: messagesPage,
        limit: PAGE_SIZE,
        status: messagesStatus === "ALL" ? undefined : messagesStatus
      });
      setMessages(response.messages);
      setMessagesMeta(response.meta);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível carregar mensagens."
      });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isAdmin, messagesPage, messagesStatus]);

  const loadSubscriptions = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setIsLoadingSubscriptions(true);
    try {
      const response = await listNewsletterSubscriptions({
        page: subscriptionsPage,
        limit: PAGE_SIZE
      });
      setSubscriptions(response.subscriptions);
      setSubscriptionsMeta(response.meta);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível carregar subscrições."
      });
    } finally {
      setIsLoadingSubscriptions(false);
    }
  }, [isAdmin, subscriptionsPage]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  async function handleRoleChange(userId: string, role: PublicUser["role"]) {
    setFeedback(null);
    setRoleActionId(userId);

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
    } finally {
      setRoleActionId(null);
    }
  }

  async function handleMessageStatus(messageId: string, status: ContactMessageStatus) {
    setFeedback(null);
    setMessageActionId(messageId);

    try {
      await updateContactMessageStatus(messageId, status);
      await loadMessages();
      setFeedback({ type: "success", message: "Estado da mensagem atualizado." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível atualizar a mensagem."
      });
    } finally {
      setMessageActionId(null);
    }
  }

  function handleLogout() {
    clearSession();
    window.location.href = "/login";
  }

  if (isLoadingSession) {
    return (
      <div className="admin-shell">
        <p className="profile-card__eyebrow">Administração</p>
        <LoadingState title="A carregar painel" message="Estamos a validar a sessão de administrador." />
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="admin-shell">
        <p className="profile-card__eyebrow">Acesso restrito</p>
        <h1 className="profile-card__title">Painel de administração</h1>
        <p className="profile-card__subtitle">Esta área é exclusiva para administradores.</p>
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
        <div className="admin-panel__header">
          <h2 id="admin-users-title" className="admin-panel__title">
            Utilizadores
          </h2>
          <span className="status-badge">{usersMeta.total} resultados</span>
        </div>
        <div className="admin-toolbar">
          <label className="sr-only" htmlFor="users-search">
            Pesquisar utilizadores por nome ou email
          </label>
          <input
            id="users-search"
            className="c-form__input c-form__input--no-icon"
            type="search"
            placeholder="Pesquisar por nome ou email"
            value={usersSearch}
            onChange={(event) => {
              setUsersSearch(event.target.value);
              setUsersPage(1);
            }}
          />
        </div>
        {isLoadingUsers ? (
          <LoadingState title="A carregar utilizadores" />
        ) : users.length > 0 ? (
          <>
            <div className="admin-table" role="region" aria-label="Tabela de utilizadores">
              {users.map((user) => (
                <article className="admin-row" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="admin-row__actions">
                    <label className="admin-row__label" htmlFor={`role-${user.id}`}>
                      Permissão
                    </label>
                    <select
                      id={`role-${user.id}`}
                      className="c-form__input c-form__input--no-icon"
                      value={user.role}
                      onChange={(event) => handleRoleChange(user.id, event.target.value as PublicUser["role"])}
                      disabled={user.id === currentUser.id || roleActionId === user.id}
                      title={user.id === currentUser.id ? "Não é possível alterar a própria permissão." : undefined}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </article>
              ))}
            </div>
            <Pagination
              meta={usersMeta}
              onPageChange={setUsersPage}
              isDisabled={isLoadingUsers}
              label="Paginação de utilizadores"
            />
          </>
        ) : (
          <EmptyState title="Sem utilizadores encontrados" message="Experimente ajustar a pesquisa." />
        )}
      </section>

      <section className="admin-panel" aria-labelledby="admin-messages-title">
        <div className="admin-panel__header">
          <h2 id="admin-messages-title" className="admin-panel__title">
            Mensagens de contacto
          </h2>
          <span className="status-badge">{messagesMeta.total} resultados</span>
        </div>
        <div className="admin-toolbar">
          <label className="sr-only" htmlFor="messages-status">
            Filtrar mensagens por estado
          </label>
          <select
            id="messages-status"
            className="c-form__input c-form__input--no-icon"
            value={messagesStatus}
            onChange={(event) => {
              setMessagesStatus(event.target.value as ContactMessageStatus | "ALL");
              setMessagesPage(1);
            }}
          >
            <option value="ALL">Todos os estados</option>
            <option value="PENDING">Pendentes</option>
            <option value="READ">Lidas</option>
            <option value="ARCHIVED">Arquivadas</option>
          </select>
        </div>
        {isLoadingMessages ? (
          <LoadingState title="A carregar mensagens" />
        ) : messages.length > 0 ? (
          <>
            <div className="admin-grid">
              {messages.map((message) => (
                <article className="admin-card" key={message.id}>
                  <div className="admin-card__header">
                    <div>
                      <strong>
                        {message.firstName} {message.lastName}
                      </strong>
                      <span>{message.email}</span>
                    </div>
                    <span className={getStatusClass(message.status)}>{statusLabels[message.status]}</span>
                  </div>
                  <span>{message.phone}</span>
                  <span>{new Date(message.createdAt).toLocaleDateString("pt-PT")}</span>
                  <p>{message.message}</p>
                  <div className="admin-card__actions" aria-label={`Ações para mensagem de ${message.firstName}`}>
                    <button
                      type="button"
                      className="btn btn--outline"
                      disabled={messageActionId === message.id || message.status === "READ"}
                      onClick={() => handleMessageStatus(message.id, "READ")}
                    >
                      Marcar lida
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline"
                      disabled={messageActionId === message.id || message.status === "ARCHIVED"}
                      onClick={() => handleMessageStatus(message.id, "ARCHIVED")}
                    >
                      Arquivar
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <Pagination
              meta={messagesMeta}
              onPageChange={setMessagesPage}
              isDisabled={isLoadingMessages}
              label="Paginação de mensagens"
            />
          </>
        ) : (
          <EmptyState title="Sem mensagens" message="Não existem mensagens para o filtro selecionado." />
        )}
      </section>

      <section className="admin-panel" aria-labelledby="admin-newsletter-title">
        <div className="admin-panel__header">
          <h2 id="admin-newsletter-title" className="admin-panel__title">
            Subscrições da newsletter
          </h2>
          <span className="status-badge">{subscriptionsMeta.total} resultados</span>
        </div>
        {isLoadingSubscriptions ? (
          <LoadingState title="A carregar subscrições" />
        ) : subscriptions.length > 0 ? (
          <>
            <div className="admin-grid">
              {subscriptions.map((subscription) => (
                <article className="admin-card" key={subscription.id}>
                  <strong>{subscription.email}</strong>
                  <span>{new Date(subscription.createdAt).toLocaleDateString("pt-PT")}</span>
                </article>
              ))}
            </div>
            <Pagination
              meta={subscriptionsMeta}
              onPageChange={setSubscriptionsPage}
              isDisabled={isLoadingSubscriptions}
              label="Paginação de subscrições"
            />
          </>
        ) : (
          <EmptyState title="Sem subscrições" message="Ainda não existem subscrições registadas." />
        )}

        {feedback?.type === "error" ? (
          <ErrorState message={feedback.message} actionLabel="Recarregar dados" onAction={loadSubscriptions} />
        ) : null}
      </section>
    </div>
  );
}
