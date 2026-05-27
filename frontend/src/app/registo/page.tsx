import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Registo | CACA",
  description: "Registo de novos utilizadores do CACA."
};

export default function RegistoPage() {
  return (
    <>
      <Header active="login" />
      <main id="conteudo-principal" className="auth-page">
        <AuthForm mode="register" />
      </main>
    </>
  );
}
