import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Entrar | CACA",
  description: "Autenticação de utilizadores do CACA."
};

export default function LoginPage() {
  return (
    <>
      <Header active="login" />
      <main className="auth-page">
        <AuthForm mode="login" />
      </main>
    </>
  );
}
