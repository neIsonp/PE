import type { Metadata } from "next";
import { ProfileClient } from "@/components/auth/ProfileClient";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Perfil | CACA",
  description: "Perfil de utilizador integrado com a API do CACA."
};

export default function PerfilPage() {
  return (
    <>
      <Header active="profile" />
      <main id="conteudo-principal" className="auth-page">
        <ProfileClient />
      </main>
    </>
  );
}
