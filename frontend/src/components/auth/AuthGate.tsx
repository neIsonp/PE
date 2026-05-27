"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api-client";
import { clearSession, getStoredUser, updateStoredUser } from "@/lib/storage";
import type { ReactNode } from "react";
import type { PublicUser } from "@/types/auth";

type GateState =
  | { status: "checking"; user: PublicUser | null }
  | { status: "allowed"; user: PublicUser }
  | { status: "denied"; user: PublicUser | null; message: string };

type AuthGateProps = {
  children: ReactNode;
  requiredRole?: PublicUser["role"];
  redirectTo?: string;
};

export function AuthGate({ children, requiredRole, redirectTo = "/login" }: AuthGateProps) {
  const router = useRouter();
  const [gateState, setGateState] = useState<GateState>({
    status: "checking",
    user: getStoredUser()
  });

  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then(({ user }) => {
        if (!isActive) {
          return;
        }

        updateStoredUser(user);

        if (requiredRole && user.role !== requiredRole) {
          setGateState({
            status: "denied",
            user,
            message: "Esta área é exclusiva para administradores."
          });
          return;
        }

        setGateState({ status: "allowed", user });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        clearSession();
        setGateState({
          status: "denied",
          user: null,
          message: "Inicie sessão para continuar."
        });
        router.replace(redirectTo);
      });

    return () => {
      isActive = false;
    };
  }, [redirectTo, requiredRole, router]);

  if (gateState.status === "checking") {
    return (
      <div className="profile-card">
        <p className="profile-card__eyebrow">Sessão</p>
        <h1 className="profile-card__title">A validar acesso...</h1>
        <p className="profile-card__subtitle">Estamos a confirmar a sessão antes de mostrar esta área.</p>
      </div>
    );
  }

  if (gateState.status === "denied") {
    return (
      <div className="profile-card">
        <p className="profile-card__eyebrow">Acesso restrito</p>
        <h1 className="profile-card__title">Não tem acesso a esta área</h1>
        <p className="profile-card__subtitle">{gateState.message}</p>
        <Link href={gateState.user ? "/perfil" : redirectTo} className="btn btn--primary">
          {gateState.user ? "Voltar ao perfil" : "Entrar"}
        </Link>
      </div>
    );
  }

  return children;
}
