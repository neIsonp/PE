"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { ReactNode } from "react";
import type { PublicUser } from "@/types/auth";

type AuthGateProps = {
  children: ReactNode;
  requiredRole?: PublicUser["role"];
  redirectTo?: string;
};

export function AuthGate({ children, requiredRole, redirectTo = "/login" }: AuthGateProps) {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace(redirectTo);
    }
  }, [isInitialized, user, redirectTo, router]);

  if (!isInitialized) {
    return (
      <div className="profile-card">
        <p className="profile-card__eyebrow">Sessão</p>
        <h1 className="profile-card__title">A validar acesso...</h1>
        <p className="profile-card__subtitle">Estamos a confirmar a sessão antes de mostrar esta área.</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="profile-card">
        <p className="profile-card__eyebrow">Acesso restrito</p>
        <h1 className="profile-card__title">Não tem acesso a esta área</h1>
        <p className="profile-card__subtitle">Esta área é exclusiva para administradores.</p>
        <Link href="/perfil" className="btn btn--primary">
          Voltar ao perfil
        </Link>
      </div>
    );
  }

  return children;
}
